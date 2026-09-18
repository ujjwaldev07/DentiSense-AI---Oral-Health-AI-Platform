import React from 'react';
import { Plus, MessageSquare, Trash2, Globe, Clock, ChevronRight } from 'lucide-react';
import { SkeletonLoader } from '../common/SkeletonLoader.jsx';
import { GlassCard } from '../common/GlassCard.jsx';
import { Button } from '../forms/Button.jsx';

export const ChatSidebar = ({
  chats = [],
  activeChatId,
  loading = false,
  onSelectChat,
  onNewChat,
  onDeleteChat
}) => {
  return (
    <div className="w-full sm:w-76 glass-elevated rounded-3xl p-4 flex flex-col justify-between h-[680px] shadow-lg border border-slate-200/90 dark:border-white/[0.08]">
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <Button
          onClick={onNewChat}
          variant="primary"
          icon={Plus}
          className="w-full py-3 text-xs shadow-md shadow-teal-500/20 shrink-0"
        >
          New Consultation
        </Button>

        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 shrink-0">
          <span>History & Sessions</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px]">
            {chats.length}
          </span>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {loading ? (
            <SkeletonLoader count={4} className="h-14" />
          ) : chats.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="font-semibold">No past consultations</p>
              <p className="text-[11px] text-slate-500">Your chat history will appear here.</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chat._id === activeChatId;
              return (
                <div
                  key={chat._id}
                  onClick={() => onSelectChat(chat._id)}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-2 text-xs group ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-900 dark:text-teal-200 font-extrabold border border-teal-500/30 shadow-xs'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="truncate text-xs">{chat.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                      <span className="truncate max-w-[120px]">{chat.primaryTopic || 'General Dental'}</span>
                      <span>•</span>
                      <span className="uppercase font-bold">{chat.language || 'en'}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat._id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Delete Consultation"
                    aria-label="Delete Consultation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
