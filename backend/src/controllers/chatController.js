import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { retrieveRelevantDentalKnowledge } from '../services/ragService.js';
import { generateDentalAIResponse, generateDentalAIStream } from '../services/geminiService.js';
import { classifyUserInquiry } from '../utils/safetyClassifier.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';

export const sendMessage = async (req, res) => {
  const { conversationId, chatId, message, language = 'en', useVoice = false } = req.body;
  const targetId = chatId || conversationId;
  const userId = req.user._id;

  console.log(`[CHAT] Request received from user ${userId} | Target ID: ${targetId || 'new'} | Message: "${message.substring(0, 45)}..."`);

  let conversation;

  if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
    conversation = await Conversation.findOne({ _id: targetId, userId });
  }

  if (!conversation) {
    const shortTitle = message.length > 40 ? `${message.substring(0, 37)}...` : message;
    conversation = await Conversation.create({
      userId,
      title: shortTitle,
      language,
      primaryTopic: 'General Oral Hygiene',
      messages: []
    });
  }

  // 1. Add user message
  conversation.messages.push({
    role: 'user',
    content: message,
    language,
    timestamp: new Date()
  });

  // Classify user inquiry to direct RAG, safety, and response formatting
  const classification = classifyUserInquiry(message, conversation.messages);
  console.log(`[CHAT] Classification category: ${classification.category} | SkipRAG: ${classification.skipRAG}`);

  // 2. Perform RAG retrieval with strict vector embedding handling
  console.log(`[RAG] Retrieval started for query: "${message.substring(0, 40)}..."`);
  const {
    contextText,
    sources,
    latencyMs: retrievalLatency,
    isLowConfidence,
    failureType,
    embeddingError,
    searchMethod
  } = await retrieveRelevantDentalKnowledge(message, {
    topK: 3,
    language,
    skipRAG: classification.skipRAG,
    category: classification.preferredCategory
  });
  console.log(`[RAG] Retrieval finished in ${retrievalLatency}ms | Docs found: ${(sources || []).length} | Method: ${searchMethod}`);

  // Log failure events if needed
  if (failureType === 'ai_embedding_failure' || failureType === 'ai_embedding_failure_with_keyword_fallback') {
    AnalyticsEvent.create({
      eventType: 'ai_embedding_failure',
      userId,
      topic: conversation.primaryTopic,
      language,
      metadata: {
        error: embeddingError,
        searchMethod,
        queryLength: message.length
      }
    }).catch(err => console.error('Analytics embedding failure logging error:', err.message));
  } else if (failureType === 'retrieval_no_match') {
    AnalyticsEvent.create({
      eventType: 'retrieval_failure',
      userId,
      topic: conversation.primaryTopic,
      language,
      metadata: {
        reason: 'no_relevant_documents_found',
        searchMethod
      }
    }).catch(err => console.error('Analytics retrieval failure logging error:', err.message));
  }

  // 3. Generate AI response with guardrails, structured JSON, and disclaimer
  const aiResult = await generateDentalAIResponse(message, {
    language,
    retrievedContext: contextText,
    sources,
    isLowConfidence,
    classification
  });

  // Log AI Generation failure event if LLM failed
  if (aiResult.isAiFailure) {
    AnalyticsEvent.create({
      eventType: 'ai_generation_failure',
      userId,
      topic: conversation.primaryTopic,
      language,
      metadata: {
        error: aiResult.aiError || 'LLM generation failed, switched to fallback engine'
      }
    }).catch(err => console.error('Analytics generation failure logging error:', err.message));
  }

  // 4. Add assistant message with citations and warning flags
  const assistantMessage = {
    role: 'assistant',
    content: aiResult.content,
    language,
    sources: aiResult.sources || [],
    category: aiResult.category || classification.category,
    safetyAlert: aiResult.safetyAlert || null,
    warningLevel: aiResult.warningLevel || 'none',
    isPrescriptionRefused: aiResult.isPrescriptionRefused || false,
    disclaimerShown: true,
    timestamp: new Date()
  };

  conversation.messages.push(assistantMessage);
  conversation.language = language;
  if (sources.length > 0 && sources[0].category) {
    conversation.primaryTopic = sources[0].category;
  }
  await conversation.save();

  // 5. Track standard chat analytics event asynchronously
  AnalyticsEvent.create({
    eventType: 'chat_message',
    userId,
    topic: conversation.primaryTopic,
    language,
    metadata: {
      useVoice,
      sourcesCitedCount: (sources || []).length,
      warningLevel: aiResult.warningLevel,
      retrievalLatencyMs: retrievalLatency,
      aiLatencyMs: aiResult.latencyMs,
      totalLatencyMs: (retrievalLatency || 0) + (aiResult.latencyMs || 0),
      isLowConfidence,
      searchMethod,
      embeddingFailed: Boolean(embeddingError)
    }
  }).catch(err => console.error('Analytics event error:', err.message));

  console.log(`[CHAT] Completed in ${(retrievalLatency || 0) + (aiResult.latencyMs || 0)}ms`);

  return sendSuccess(res, 'Message processed successfully', {
    chatId: conversation._id,
    conversationId: conversation._id,
    message: assistantMessage,
    category: aiResult.category || classification.category,
    safetyAlert: aiResult.safetyAlert || null,
    structured: aiResult.structured,
    redFlags: aiResult.redFlags || [],
    isPrescriptionRefused: aiResult.isPrescriptionRefused || false,
    showDisclaimer: aiResult.showDisclaimer !== false,
    modelUsed: aiResult.modelUsed,
    sources: aiResult.sources || [],
    embeddingError: embeddingError || null,
    searchMethod
  });
};

/**
 * Server-Sent Events (SSE) Streaming endpoint for real-time progressive response rendering
 */
export const streamMessage = async (req, res) => {
  const { conversationId, chatId, message, language = 'en', useVoice = false } = req.body;
  const targetId = chatId || conversationId;
  const userId = req.user._id;

  console.log(`[CHAT] Stream request received from user ${userId} | Target ID: ${targetId || 'new'} | Message: "${message.substring(0, 45)}..."`);

  // Set robust SSE response headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let isAborted = false;
  const canWrite = () => !isAborted && !res.writableEnded && !res.destroyed;

  // Immediate keepalive comment to establish the stream through proxies (Vite, Nginx, Cloudflare)
  if (canWrite()) {
    res.write(': keepalive\n\n');
  }

  // Periodic heartbeat timer (every 3s) during RAG retrieval or between slow AI chunks
  const keepAliveInterval = setInterval(() => {
    if (canWrite()) {
      res.write(': keepalive\n\n');
    }
  }, 3000);

  const cleanup = () => {
    clearInterval(keepAliveInterval);
  };

  const handleAbort = () => {
    if (!isAborted) {
      isAborted = true;
      console.log(`[CHAT] Client disconnected from stream (user: ${userId})`);
      cleanup();
    }
  };

  req.on('close', handleAbort);
  res.on('close', handleAbort);
  req.on('error', (err) => {
    console.warn('[CHAT] Request stream warning/abort:', err.message);
    handleAbort();
  });
  res.on('error', (err) => {
    console.warn('[CHAT] Response stream warning/abort:', err.message);
    handleAbort();
  });

  const sendEvent = (event, data) => {
    if (canWrite()) {
      try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch (writeErr) {
        console.warn('[CHAT] Socket write error:', writeErr.message);
        handleAbort();
      }
    }
  };

  try {
    let conversation;
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      conversation = await Conversation.findOne({ _id: targetId, userId });
    }

    if (!conversation) {
      const shortTitle = message.length > 40 ? `${message.substring(0, 37)}...` : message;
      conversation = await Conversation.create({
        userId,
        title: shortTitle,
        language,
        primaryTopic: 'General Oral Hygiene',
        messages: []
      });
    }

    conversation.messages.push({
      role: 'user',
      content: message,
      language,
      timestamp: new Date()
    });
    await conversation.save();

    // Classify user inquiry to direct RAG, safety, and response formatting
    const classification = classifyUserInquiry(message, conversation.messages);
    console.log(`[CHAT] Stream classification: ${classification.category} | SkipRAG: ${classification.skipRAG}`);

    sendEvent('chat_init', {
      chatId: conversation._id,
      conversationId: conversation._id
    });

    // Send meta event upfront so frontend knows if it's a safety refusal or alert immediately
    sendEvent('meta', {
      category: classification.category,
      isPrescriptionRefused: classification.isMedicationRequest,
      safetyAlert: classification.safetyAlert,
      warningLevel: classification.isEmergency ? 'urgent_medical_attention' : 'none'
    });

    // 1. RAG Vector Retrieval
    const {
      contextText,
      sources,
      latencyMs: retrievalLatency,
      isLowConfidence,
      searchMethod,
      embeddingError
    } = await retrieveRelevantDentalKnowledge(message, {
      topK: 3,
      language,
      skipRAG: classification.skipRAG,
      category: classification.preferredCategory
    });

    if (!canWrite()) {
      cleanup();
      return;
    }

    sendEvent('sources', {
      sources: sources || [],
      searchMethod: searchMethod || 'cosine_vector_search',
      retrievalLatencyMs: retrievalLatency
    });

    // 2. Stream generation
    let finalPayload = null;
    for await (const chunk of generateDentalAIStream(message, {
      language,
      retrievedContext: contextText,
      sources,
      isLowConfidence,
      classification
    })) {
      if (!canWrite()) break;

      if (chunk.type === 'token') {
        sendEvent('token', { token: chunk.token });
      } else if (chunk.type === 'done') {
        finalPayload = chunk;
      }
    }

    if (canWrite() && finalPayload) {
      const assistantMessage = {
        role: 'assistant',
        content: finalPayload.fullText,
        language,
        sources: finalPayload.sources || [],
        category: finalPayload.category || classification.category,
        safetyAlert: finalPayload.safetyAlert || null,
        warningLevel: finalPayload.warningLevel || 'none',
        isPrescriptionRefused: finalPayload.isPrescriptionRefused || false,
        disclaimerShown: true,
        timestamp: new Date()
      };

      conversation.messages.push(assistantMessage);
      conversation.language = language;
      if (sources.length > 0 && sources[0].category) {
        conversation.primaryTopic = sources[0].category;
      }
      await conversation.save();

      // Track analytics safely in the background
      AnalyticsEvent.create({
        eventType: 'chat_message',
        userId,
        topic: conversation.primaryTopic,
        language,
        metadata: {
          useVoice,
          sourcesCitedCount: (sources || []).length,
          warningLevel: finalPayload.warningLevel,
          retrievalLatencyMs: retrievalLatency,
          isLowConfidence,
          searchMethod
        }
      }).catch(err => console.error('Analytics stream event error:', err.message));

      sendEvent('done', {
        chatId: conversation._id,
        conversationId: conversation._id,
        message: assistantMessage,
        category: finalPayload.category || classification.category,
        safetyAlert: finalPayload.safetyAlert || null,
        structured: finalPayload.structured,
        warningLevel: finalPayload.warningLevel,
        redFlags: finalPayload.redFlags || [],
        isPrescriptionRefused: finalPayload.isPrescriptionRefused || false,
        showDisclaimer: finalPayload.showDisclaimer !== false,
        sources: finalPayload.sources || []
      });
    }

    if (canWrite()) {
      res.write('event: end\ndata: {}\n\n');
      res.end();
    }
  } catch (err) {
    console.error('SSE Stream Controller Error:', err);
    if (canWrite()) {
      sendEvent('error', { message: err.message || 'Stream processing failure' });
      res.end();
    }
  } finally {
    cleanup();
  }
};

export const getConversations = async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    Conversation.find({ userId: req.user._id, isArchived: false })
      .select('title primaryTopic language rating createdAt updatedAt messages')
      .slice('messages', -1)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Conversation.countDocuments({ userId: req.user._id, isArchived: false })
  ]);

  const formatted = conversations.map(c => ({
    id: c._id,
    _id: c._id,
    title: c.title,
    primaryTopic: c.primaryTopic,
    language: c.language,
    rating: c.rating,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    lastMessage: c.messages && c.messages.length > 0 ? c.messages[0].content : ''
  }));

  return sendPaginated(res, 'Conversations retrieved', formatted, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
};

export const getConversationById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid conversation ID', null, 400);
  }

  const conversation = await Conversation.findOne({ _id: id, userId: req.user._id });
  if (!conversation) {
    return sendError(res, 'Conversation not found', null, 404);
  }

  return sendSuccess(res, 'Conversation details retrieved', {
    chat: conversation,
    conversation,
    messages: conversation.messages
  });
};

export const deleteConversation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid conversation ID', null, 400);
  }

  const conversation = await Conversation.findOneAndDelete({ _id: id, userId: req.user._id });
  if (!conversation) {
    return sendError(res, 'Conversation not found', null, 404);
  }

  return sendSuccess(res, 'Conversation deleted successfully');
};

export const rateConversation = async (req, res) => {
  const { id } = req.params;
  const { rating, feedbackComment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid conversation ID', null, 400);
  }

  const conversation = await Conversation.findOne({ _id: id, userId: req.user._id });
  if (!conversation) {
    return sendError(res, 'Conversation not found', null, 404);
  }

  conversation.rating = rating;
  if (feedbackComment) {
    conversation.feedbackComment = feedbackComment;
  }
  await conversation.save();

  return sendSuccess(res, 'Rating submitted successfully', {
    rating: conversation.rating,
    feedbackComment: conversation.feedbackComment
  });
};
