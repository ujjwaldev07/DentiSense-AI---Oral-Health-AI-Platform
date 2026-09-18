import React from 'react';
import { MessageSquare, ArrowRight, Trash2, Clock } from 'lucide-react';
import { EmptyState } from '../common/EmptyState.jsx';
import { SkeletonLoader } from '../common/SkeletonLoader.jsx';
import { GlassCard } from '../common/GlassCard.jsx';

import { formatFriendlyDate } from '../../utils/analyticsTransforms.js';

export const RecentChatsCard = ({
  chats = [],
  loading = false,
  onSelectChat,
  onDeleteChat,
  onStartNew
}) => {
  return (
    <GlassCard level={2} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Recent Consultations</span>
        </h3>
        <button
          onClick={onStartNew}
          className="text-xs font-extrabold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
        >
          <span>New Chat</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={3} className="h-14" />
      ) : chats.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No previous conversations"
          description="Start your first AI dental consultation to explore symptoms and hygiene habits."
          actionLabel="Start Consultation"
          onAction={onStartNew}
        />
      ) : (
        <div className="space-y-2">
          {chats.slice(0, 5).map((chat) => (
            <div
              key={chat.id || chat._id}
              onClick={() => onSelectChat(chat.id || chat._id)}
              className="p-3.5 rounded-2xl glass-subtle hover:border-teal-500/40 border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 cursor-pointer transition-all group"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                  {chat.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="truncate">{chat.primaryTopic || 'Oral Health'}</span>
                  <span>•</span>
                  <span>{formatFriendlyDate(chat.createdAt)}</span>
                </div>
              </div>

              {onDeleteChat && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat._id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  title="Delete Chat"
                  aria-label="Delete Chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
