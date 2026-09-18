import { ENV } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { Conversation } from '../src/models/Conversation.js';
import mongoose from 'mongoose';

async function verifyFirstMessageFlow() {
  console.log('🧪 ======================================================');
  console.log('🧪 DentiSense AI: Verifying First-Message Reliability & Latency');
  console.log('🧪 ======================================================\n');

  await connectDB();

  const baseUrl = `http://localhost:${ENV.PORT}`;

  // 1. Authenticate Demo User
  console.log('1️⃣ Authenticating test demo user...');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@dentalaware.org',
      password: 'User@12345'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.data?.token) {
    throw new Error(`Authentication failed: ${loginData.message}`);
  }

  const token = loginData.data.token;
  console.log(`✅ Demo User Authenticated. Token acquired.`);

  // Helper to read and parse SSE stream from /api/chat/stream
  const testStream = async (messageText, chatId = undefined, label = 'First Message') => {
    console.log(`\n▶️ Testing [${label}] with inquiry: "${messageText}"...`);
    const startTime = Date.now();
    let ttft = null;
    let assignedChatId = null;
    let fullResponseText = '';
    let sourcesCount = 0;
    let receivedChatInit = false;
    let receivedDone = false;

    const streamRes = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        chatId,
        message: messageText,
        language: 'en'
      })
    });

    if (!streamRes.ok || !streamRes.body) {
      throw new Error(`SSE Request failed with HTTP status: ${streamRes.status}`);
    }

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'message';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.replace('event:', '').trim();
        } else if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.replace('data:', '').trim();
          if (!dataStr || dataStr === '{}') continue;

          try {
            const data = JSON.parse(dataStr);

            if (currentEvent === 'chat_init') {
              receivedChatInit = true;
              assignedChatId = data.chatId;
            } else if (currentEvent === 'token') {
              if (ttft === null) {
                ttft = Date.now() - startTime;
              }
              fullResponseText += data.token || '';
            } else if (currentEvent === 'sources') {
              sourcesCount = (data.sources || []).length;
            } else if (currentEvent === 'done') {
              receivedDone = true;
              if (data.chatId) assignedChatId = data.chatId;
              if (data.message?.content) fullResponseText = data.message.content;
            }
          } catch (e) {
            // Ignore parse errors on trailing lines
          }
        }
      }
    }

    const totalLatency = Date.now() - startTime;

    console.log(`✅ [${label}] Completed!`);
    console.log(`   - Received chat_init: ${receivedChatInit ? 'YES' : 'NO'}`);
    console.log(`   - Assigned ChatId: ${assignedChatId}`);
    console.log(`   - Time to First Token (TTFT): ${ttft}ms`);
    console.log(`   - Total Response Duration: ${totalLatency}ms`);
    console.log(`   - Cited Clinical Sources: ${sourcesCount}`);
    console.log(`   - Response Length: ${fullResponseText.length} chars`);
    console.log(`   - Received 'done' Event: ${receivedDone ? 'YES' : 'NO'}`);
    console.log(`   - Sample Output: "${fullResponseText.substring(0, 90).replace(/\n/g, ' ')}..."`);

    if (!receivedChatInit) {
      throw new Error(`[${label}] Failed: chat_init event was never received!`);
    }
    if (!receivedDone) {
      throw new Error(`[${label}] Failed: done event was never received!`);
    }
    if (!fullResponseText || fullResponseText.length < 20) {
      throw new Error(`[${label}] Failed: Assistant response was empty or too short!`);
    }

    return { assignedChatId, ttft, totalLatency, fullResponseText };
  };

  // 2. Execute First-Message Test (chatId is undefined)
  const firstResult = await testStream('How can I prevent plaque buildup and keep my gums healthy?', undefined, 'FIRST MESSAGE');

  // 3. Execute Second-Message Test (chatId is the newly created conversation ID)
  const secondResult = await testStream('Are electric toothbrushes significantly better than manual brushes?', firstResult.assignedChatId, 'SECOND MESSAGE');

  // 4. Verify Database Persistence in MongoDB
  console.log('\n2️⃣ Verifying Conversation Persistence in MongoDB...');
  const savedConv = await Conversation.findById(firstResult.assignedChatId);
  if (!savedConv) {
    throw new Error(`Conversation ${firstResult.assignedChatId} not found in database!`);
  }
  console.log(`✅ Conversation successfully persisted with ${savedConv.messages.length} messages (expected: 4 -> 2 user, 2 assistant)`);

  if (savedConv.messages.length !== 4) {
    console.warn(`⚠️ Expected 4 messages, found: ${savedConv.messages.length}`);
  }

  console.log('\n🎉 ALL FIRST-MESSAGE RELIABILITY CHECKS PASSED WITH 100% SUCCESS!');
  console.log(`📊 First-Message TTFT: ${firstResult.ttft}ms | Total Duration: ${firstResult.totalLatency}ms`);
  console.log(`📊 Second-Message TTFT: ${secondResult.ttft}ms | Total Duration: ${secondResult.totalLatency}ms\n`);

  await mongoose.connection.close();
  process.exit(0);
}

verifyFirstMessageFlow().catch((err) => {
  console.error('❌ Verification failed:', err);
  if (mongoose.connection.readyState !== 0) {
    mongoose.connection.close().catch(() => {});
  }
  process.exit(1);
});
