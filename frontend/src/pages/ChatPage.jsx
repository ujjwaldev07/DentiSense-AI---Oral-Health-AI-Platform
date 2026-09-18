import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Plus,
  Trash2,
  BookOpen,
  RotateCcw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Square,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { MessageBubble } from '../components/chat/MessageBubble.jsx';
import { VoiceInput } from '../components/chat/VoiceInput.jsx';
import { SuggestedPrompts } from '../components/chat/SuggestedPrompts.jsx';
import { RatingModal } from '../components/chat/RatingModal.jsx';
import { SourceDrawer } from '../components/chat/SourceDrawer.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { chatAPI, feedbackAPI } from '../api/endpoints.js';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/forms/Button.jsx';

const getInitialGreeting = (lang = 'en') => ({
  id: 'initial-greeting',
  role: 'assistant',
  content: `### 🦷 Welcome to DentiSense AI Assistant\n\nI am your educational oral health partner. You can ask me anything about:\n\n- **Preventive care & daily hygiene routines**\n- **Gum health & tooth sensitivity causes**\n- **Cavity prevention & enamel remineralization**\n- **Dental emergency signs & urgent care indicators**\n\n> *Educational Disclaimer: This platform provides evidence-grounded educational awareness and does not replace an in-person clinical dental diagnosis.*`,
  language: lang,
  timestamp: new Date()
});

export const ChatPage = ({ initialChatId, initialPrompt }) => {
  const { language, changeLanguage, t } = useLanguage();
  const { isAuthenticated, loginDemo } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(initialChatId || null);
  const [messages, setMessages] = useState([getInitialGreeting(language)]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false);
  const [activeSources, setActiveSources] = useState([]);
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const scrollContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const abortControllerRef = useRef(null);
  const textareaRef = useRef(null);

  // In-flight streaming guards to prevent state overwrite race condition on initial chat creation
  const inFlightStreamChatIdRef = useRef(null);
  const isStreamingRef = useRef(false);

  // Monitor scroll position to avoid fighting manual user scrolling
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 140;
  };

  const scrollToBottom = (force = false) => {
    if (scrollContainerRef.current && (force || isNearBottomRef.current)) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isStreaming]);

  // Load user conversations list for the sidebar
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatAPI.getHistory();
      const list = Array.isArray(res.data) ? res.data : (res.data?.chats || []);
      setConversations(list);
    } catch (err) {
      console.warn('Failed to load conversations:', err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load active conversation details from DB
  // CRITICAL GUARD: Never overwrite messages if this conversation is actively streaming in-flight!
  useEffect(() => {
    const loadConversationDetail = async () => {
      if (!activeConversationId || !isAuthenticated) return;

      // If this conversation was just initiated or is currently streaming, local state is authoritative
      if (inFlightStreamChatIdRef.current === activeConversationId || isStreamingRef.current) {
        return;
      }

      try {
        const res = await chatAPI.getChatById(activeConversationId);
        if (res.data && res.data.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages.map((m, idx) => ({
            ...m,
            id: m._id || m.id || `msg-${idx}-${m.role}`
          })));
        }
      } catch (err) {
        console.warn('Error fetching conversation:', err.message);
      }
    };

    if (activeConversationId) {
      loadConversationDetail();
    } else {
      // Clean greeting when on new consultation
      if (!isStreamingRef.current) {
        setMessages([getInitialGreeting(language)]);
      }
    }
  }, [activeConversationId, isAuthenticated, language]);

  // Auto-resize input composer textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  const handleSendMessage = async (textToSend = null) => {
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt || isLoading || isStreaming) return;

    // Clear any previous error banner
    setErrorMessage(null);

    // 1. Synchronous auth validation & Demo user rehydration
    let token = localStorage.getItem('denta_token') || localStorage.getItem('auth_token');
    if (!token) {
      try {
        await loginDemo('user');
        token = localStorage.getItem('denta_token') || localStorage.getItem('auth_token');
      } catch (authErr) {
        console.warn('Auto-login attempt failed:', authErr.message);
      }
    }

    setLastUserPrompt(prompt);

    const userMsgId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const assistantMsgId = `ast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: prompt,
      language,
      timestamp: new Date()
    };

    const assistantPlaceholder = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      language,
      sources: [],
      timestamp: new Date()
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);
    setIsStreaming(true);

    // Mark in-flight streaming state to lock out background database reloads
    inFlightStreamChatIdRef.current = activeConversationId || 'pending';
    isStreamingRef.current = true;

    // Force scroll to bottom on submission
    isNearBottomRef.current = true;
    setTimeout(() => scrollToBottom(true), 40);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          chatId: activeConversationId || undefined,
          conversationId: activeConversationId || undefined,
          message: prompt,
          language
        }),
        signal: abortController.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Streaming request returned HTTP status: ${response.status}`);
      }

      setIsLoading(false); // First byte arrived, stream is active

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedText = '';
      let currentEvent = 'message';
      let buffer = '';

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

              // 1. Handle Chat Initialization (ID assigned)
              if (currentEvent === 'chat_init' && data.chatId) {
                // Lock this ID in the guard ref BEFORE calling state setter
                inFlightStreamChatIdRef.current = data.chatId;
                if (!activeConversationId || activeConversationId !== data.chatId) {
                  setActiveConversationId(data.chatId);
                  // Do not invoke loadConversations() mid-stream to avoid network contention;
                  // conversations list updates cleanly upon 'done' event.
                }
              }
              // 2. Progressive Token Streaming
              else if (currentEvent === 'token' && data.token) {
                streamedText += data.token;
                setMessages((prev) => {
                  const updated = [...prev];
                  const targetIdx = updated.findIndex((m) => m.id === assistantMsgId);
                  if (targetIdx !== -1) {
                    updated[targetIdx] = {
                      ...updated[targetIdx],
                      content: streamedText
                    };
                  } else {
                    // Fallback to last assistant bubble or append
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                      updated[lastIdx] = {
                        ...updated[lastIdx],
                        id: assistantMsgId,
                        content: streamedText
                      };
                    } else {
                      updated.push({
                        id: assistantMsgId,
                        role: 'assistant',
                        content: streamedText,
                        language,
                        sources: [],
                        timestamp: new Date()
                      });
                    }
                  }
                  return updated;
                });
              }
              // 3. Category & Safety Meta Event
              else if (currentEvent === 'meta') {
                setMessages((prev) => {
                  const updated = [...prev];
                  const targetIdx = updated.findIndex((m) => m.id === assistantMsgId);
                  if (targetIdx !== -1) {
                    updated[targetIdx] = {
                      ...updated[targetIdx],
                      category: data.category,
                      isPrescriptionRefused: data.isPrescriptionRefused,
                      safetyAlert: data.safetyAlert,
                      warningLevel: data.warningLevel || 'none'
                    };
                  }
                  return updated;
                });
              }
              // 4. Clinical Sources Arrived
              else if (currentEvent === 'sources' && data.sources) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const targetIdx = updated.findIndex((m) => m.id === assistantMsgId);
                  if (targetIdx !== -1) {
                    updated[targetIdx] = {
                      ...updated[targetIdx],
                      sources: data.sources
                    };
                  }
                  return updated;
                });
              }
              // 5. Stream Completed
              else if (currentEvent === 'done') {
                const finalContent = data.message?.content || streamedText;
                setMessages((prev) => {
                  const updated = [...prev];
                  const targetIdx = updated.findIndex((m) => m.id === assistantMsgId);
                  const finalMsg = {
                    id: assistantMsgId,
                    role: 'assistant',
                    content: finalContent,
                    sources: data.sources || (targetIdx !== -1 ? updated[targetIdx].sources : []) || [],
                    category: data.category || (targetIdx !== -1 ? updated[targetIdx].category : null),
                    safetyAlert: data.safetyAlert || (targetIdx !== -1 ? updated[targetIdx].safetyAlert : null),
                    warningLevel: data.warningLevel || 'none',
                    isPrescriptionRefused: data.isPrescriptionRefused || false,
                    language,
                    timestamp: new Date()
                  };
                  if (targetIdx !== -1) {
                    updated[targetIdx] = finalMsg;
                  } else {
                    updated.push(finalMsg);
                  }
                  return updated;
                });

                if (data.chatId) {
                  inFlightStreamChatIdRef.current = data.chatId;
                  if (!activeConversationId || activeConversationId !== data.chatId) {
                    setActiveConversationId(data.chatId);
                    loadConversations();
                  }
                }
              }
              // 6. Server Sent Error Event
              else if (currentEvent === 'error') {
                throw new Error(data.message || 'Stream generation failed');
              }
            } catch (jsonErr) {
              console.warn('SSE JSON parse warning:', jsonErr.message);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        toast.info('Response generation stopped');
      } else {
        console.warn('Streaming encountered an error, activating resilient REST fallback:', err.message);
        try {
          // Resilient fallback to single-call REST endpoint
          const res = await chatAPI.sendMessage({
            chatId: activeConversationId || undefined,
            conversationId: activeConversationId || undefined,
            message: prompt,
            language
          });

          const assistantMsg = res.data?.message || res.data;
          setMessages((prev) => {
            const updated = [...prev];
            const targetIdx = updated.findIndex((m) => m.id === assistantMsgId);
            const committedMsg = {
              id: assistantMsgId,
              role: 'assistant',
              content: assistantMsg?.content || assistantMsg || 'Response generated successfully.',
              sources: assistantMsg?.sources || res.data?.sources || [],
              category: assistantMsg?.category || res.data?.category,
              safetyAlert: assistantMsg?.safetyAlert || res.data?.safetyAlert,
              warningLevel: assistantMsg?.warningLevel || res.data?.warningLevel || 'none',
              isPrescriptionRefused: assistantMsg?.isPrescriptionRefused || res.data?.isPrescriptionRefused || false,
              language,
              timestamp: new Date()
            };

            if (targetIdx !== -1) {
              updated[targetIdx] = committedMsg;
            } else {
              updated.push(committedMsg);
            }
            return updated;
          });

          const returnChatId = res.data?.chatId || res.data?.conversationId;
          if (returnChatId) {
            inFlightStreamChatIdRef.current = returnChatId;
            if (!activeConversationId || activeConversationId !== returnChatId) {
              setActiveConversationId(returnChatId);
              loadConversations();
            }
          }
        } catch (restErr) {
          console.error('REST Chat Error:', restErr);
          let errorHelp = 'Unable to connect to the chatbot server. Please try again.';
          if (restErr.message && restErr.message.includes('401')) {
            errorHelp = 'Your session may have expired. Please sign in to continue your consultation.';
          } else if (restErr.message && restErr.message.includes('429')) {
            errorHelp = 'The AI consultation service is experiencing high request volume. Please wait a moment and try again.';
          } else if (err.message && (err.message.includes('interrupted') || err.message.includes('ECONNRESET') || err.message.includes('stream'))) {
            errorHelp = 'Your response was interrupted. Please try again.';
          }
          toast.error(errorHelp);
          setErrorMessage(errorHelp);

          // Update assistant bubble with explicit retry action
          setMessages((prev) => {
            const updated = [...prev];
            const targetIdx = updated.findIndex((m) => m.id === assistantMsgId);
            const errorBubble = {
              id: assistantMsgId,
              role: 'assistant',
              content: `> ⚠️ **AI Consultation Notice**\n\n${errorHelp}\n\n*If you are experiencing severe toothache, rapidly spreading facial swelling, or difficulty swallowing, please consult an emergency dental clinic immediately.*`,
              isError: true,
              retryPrompt: prompt,
              language,
              timestamp: new Date()
            };
            if (targetIdx !== -1) {
              updated[targetIdx] = errorBubble;
            } else {
              updated.push(errorBubble);
            }
            return updated;
          });
        }
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      isStreamingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  // Clean up in-flight abort controller when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle Initial Prompt passed from other pages (e.g. Assessment page)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRegenerate = () => {
    if (lastUserPrompt) {
      handleSendMessage(lastUserPrompt);
    }
  };

  const handleRetry = (promptToRetry) => {
    handleSendMessage(promptToRetry || lastUserPrompt);
  };

  const handleNewChat = () => {
    if (isStreaming) {
      handleStopGeneration();
    }
    inFlightStreamChatIdRef.current = null;
    isStreamingRef.current = false;
    setActiveConversationId(null);
    setErrorMessage(null);
    setMessages([getInitialGreeting(language)]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteChat(convId);
      setConversations((prev) => prev.filter((c) => (c.id || c._id) !== convId));
      toast.success('Consultation session deleted');
      if (activeConversationId === convId) {
        handleNewChat();
      }
    } catch {
      toast.error('Failed to delete consultation session');
    }
  };

  const handleQuickRate = async (ratingVal) => {
    try {
      await feedbackAPI.submitFeedback({
        chatId: activeConversationId || undefined,
        rating: ratingVal,
        category: 'chat_accuracy',
        comment: ratingVal === 5 ? 'Marked helpful' : 'Marked not helpful'
      });
      toast.success(
        ratingVal === 5
          ? 'Thank you! Marked as helpful.'
          : 'Thank you for your feedback. We will refine our educational content.'
      );
    } catch (err) {
      console.error('Quick rating error:', err);
    }
  };

  const openSourceDrawer = (sources) => {
    setActiveSources(sources);
    setSourceDrawerOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] min-h-[600px] flex rounded-3xl glass-elevated border border-slate-200/90 dark:border-white/[0.08] shadow-2xl overflow-hidden my-4 relative z-10 transition-all duration-300">
      {/* Chat History Sidebar */}
      <aside
        aria-label="Consultation History"
        className={`${
          isSidebarOpen ? 'w-72 sm:w-76' : 'w-0'
        } transition-all duration-300 border-r border-slate-200/80 dark:border-white/[0.07] bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-md flex flex-col shrink-0 overflow-hidden select-none`}
      >
        <div className="p-3.5 border-b border-slate-200/80 dark:border-white/[0.07]">
          <Button
            onClick={handleNewChat}
            variant="primary"
            icon={Plus}
            className="w-full py-2.5 text-xs shadow-md shadow-teal-500/20 font-bold"
          >
            {t('chat.newChat') || 'New Consultation'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>{t('chat.historyTitle') || 'Recent Sessions'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono">
              {conversations.length}
            </span>
          </div>

          {conversations.length === 0 ? (
            <p className="px-2 py-8 text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
              No previous consultations
            </p>
          ) : (
            conversations.map((c) => {
              const id = c.id || c._id;
              const isActive = activeConversationId === id;
              return (
                <div
                  key={id}
                  onClick={() => {
                    if (isStreaming) handleStopGeneration();
                    setActiveConversationId(id);
                  }}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-900 dark:text-teal-200 font-extrabold border border-teal-500/35 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                    <span className="truncate">{c.title || 'Oral Health Inquiry'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                    title="Delete session"
                    aria-label="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Interface */}
      <section className="flex-1 flex flex-col h-full bg-transparent overflow-hidden" aria-label="Active Consultation">
        {/* Chat Header */}
        <header className="px-4 py-3 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors interactive-scale"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center text-sm font-bold shadow-xs border border-teal-400/30">
              🦷
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-display">
                  {t('chat.title') || 'DentiSense AI'}
                </h2>
                <Badge variant="teal" dot dotPulse size="sm">
                  Active RAG
                </Badge>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                {t('chat.subtitle') || 'Evidence-grounded dental awareness assistant'}
              </p>
            </div>
          </div>

          {/* Controls: Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
            {['en', 'hi', 'mr'].map((langCode) => (
              <button
                key={langCode}
                type="button"
                onClick={() => changeLanguage(langCode)}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                  language === langCode
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {langCode === 'en' ? 'EN' : langCode === 'hi' ? 'हिंदी' : 'मराठी'}
              </button>
            ))}
          </div>
        </header>

        {/* Global Error Notice if active */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 animate-slide-up">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleRetry()}
              className="text-xs font-bold underline hover:text-rose-800 dark:hover:text-rose-100 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Message Feed with Non-Intrusive Scroll */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 custom-scrollbar"
        >
          {messages.map((msg, index) => {
            const isLastMessage = index === messages.length - 1;
            return (
              <div key={msg.id || index} className="space-y-1.5">
                <MessageBubble
                  message={msg}
                  isStreaming={isLastMessage && isStreaming}
                  onRate={() => setRatingModalOpen(true)}
                  onViewSource={() => openSourceDrawer(msg.sources)}
                  onRetry={handleRetry}
                />

                {/* Micro Action Buttons under Assistant Response */}
                {msg.role === 'assistant' && isLastMessage && !isLoading && !isStreaming && !msg.isError && (
                  <div className="flex flex-wrap items-center gap-2.5 pl-12 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className="inline-flex items-center gap-1 font-semibold hover:text-teal-600 dark:hover:text-teal-300 transition-colors interactive-scale"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Regenerate</span>
                    </button>

                    <span>•</span>

                    <button
                      type="button"
                      onClick={() => handleQuickRate(5)}
                      className="inline-flex items-center gap-1 font-semibold hover:text-emerald-500 transition-colors interactive-scale"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Helpful</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickRate(1)}
                      className="inline-flex items-center gap-1 font-semibold hover:text-rose-500 transition-colors interactive-scale"
                      title="Not Helpful"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>Not helpful</span>
                    </button>

                    {msg.sources && msg.sources.length > 0 && (
                      <>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => openSourceDrawer(msg.sources)}
                          className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-extrabold hover:underline interactive-scale"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{msg.sources.length} Cited Sources</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Clinical Thinking Indicator */}
          {isLoading && !isStreaming && (
            <div className="flex items-start gap-3 sm:gap-4 my-3 animate-slide-up">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center text-sm shadow-xs border border-teal-400/30 shrink-0">
                🦷
              </div>
              <div className="p-4 rounded-3xl glass-elevated border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Retrieving verified clinical guidelines & formulating answer...
                </span>
              </div>
            </div>
          )}

          {/* Suggested Prompts on clean empty conversation */}
          {messages.length <= 1 && !isLoading && !isStreaming && (
            <SuggestedPrompts onSelectPrompt={(p) => handleSendMessage(p)} />
          )}
        </div>

        {/* Multi-line Responsive Input Composer */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-xl shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative flex items-center rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/[0.08] focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 shadow-sm transition-all">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={t('chat.placeholder') || 'Ask any question about teeth, gums, or oral health... (Press Enter to send)'}
                disabled={isLoading}
                className="w-full pl-4 pr-12 py-3 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none max-h-32 min-h-[44px] leading-relaxed"
                aria-label="Dental health inquiry"
              />

              <div className="absolute right-2.5 bottom-2.5">
                <VoiceInput
                  language={language}
                  disabled={isLoading || isStreaming}
                  onTranscript={(transcriptText) => {
                    setInputMessage((prev) => (prev ? `${prev} ${transcriptText}` : transcriptText));
                  }}
                />
              </div>
            </div>

            {/* Send / Stop Generation Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-md shadow-rose-500/25 transition-all flex items-center justify-center interactive-scale shrink-0"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 active:scale-95 text-white shadow-md shadow-teal-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all interactive-scale shrink-0"
                title="Send inquiry"
                aria-label="Send inquiry"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            )}
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-1 font-medium">
            <span>💡 Educational Platform: AI answers do not substitute in-person dental care.</span>
            <span className="hidden sm:inline-block">Enter to send • Shift + Enter for new line</span>
          </div>
        </div>
      </section>

      {/* Sources Drawer */}
      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sources={activeSources}
      />

      {/* Star Rating & Full Review Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        conversationId={activeConversationId}
        onFeedbackSubmitted={() => loadConversations()}
      />
    </div>
  );
};
