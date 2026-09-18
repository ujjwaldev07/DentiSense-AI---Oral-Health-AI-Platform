import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from 'lucide-react';

/**
 * Premium semantic markdown renderer for AI healthcare assistant messages.
 * Formats headings, dividers, lists, links, quotes, and code blocks with clinical polish.
 */
export const MarkdownRenderer = memo(({ content }) => {
  if (!content) return null;

  // Protect against trailing dangling heading hashes during active token streaming
  const sanitized = typeof content === 'string' ? content.replace(/\n#{1,6}\s*$/g, '\n') : content;

  return (
    <div className="ai-markdown-content max-w-prose space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-100 font-normal select-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        children={sanitized}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1
              className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200/80 dark:border-white/[0.08] tracking-tight font-display"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-3.5 mb-1.5 flex items-center gap-2 font-display"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-teal-200 mt-3 mb-1 flex items-center gap-1.5 font-display"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="text-xs sm:text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5 mb-1"
              {...props}
            />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="leading-relaxed text-slate-700 dark:text-slate-200 my-2" {...props} />
          ),

          // Horizontal divider
          hr: ({ node, ...props }) => (
            <hr
              className="my-3.5 border-t border-slate-200/80 dark:border-white/[0.08]"
              {...props}
            />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="space-y-1.5 my-2.5 pl-1 list-none" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="space-y-1.5 my-2.5 pl-4 list-decimal list-outside text-slate-700 dark:text-slate-200 marker:font-bold marker:text-teal-600 dark:marker:text-teal-400" {...props} />
          ),
          li: ({ node, children, ...props }) => (
            <li className="flex items-start gap-2 text-slate-700 dark:text-slate-200" {...props}>
              <span className="text-teal-500 font-bold shrink-0 select-none mt-0.5">•</span>
              <div className="flex-1">{children}</div>
            </li>
          ),

          // Strong & Emphasis
          strong: ({ node, ...props }) => (
            <strong className="font-extrabold text-slate-950 dark:text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-slate-800 dark:text-slate-300" {...props} />
          ),

          // Blockquote (Disclaimers, clinical callouts)
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-3 p-3 sm:p-3.5 rounded-2xl glass-subtle border-l-4 border-l-teal-500 border-y border-r border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 italic text-xs leading-relaxed"
              {...props}
            />
          ),

          // Inline Code & Code Blocks
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-teal-500/10 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-md text-[11px] font-mono border border-teal-500/20 select-all"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-2.5 overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-slate-100 border border-slate-700">
                <code {...props}>{children}</code>
              </div>
            );
          },

          // Links
          a: ({ node, href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-bold text-teal-600 dark:text-teal-400 hover:underline"
              {...props}
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 inline-block ml-0.5 shrink-0" />
            </a>
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-left text-xs border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="bg-slate-100 dark:bg-slate-800/80 p-2.5 font-extrabold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-2.5 border-b border-slate-200/60 dark:border-white/[0.05] text-slate-700 dark:text-slate-300" {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
