'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

export default function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("markdown-content prose prose-slate max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-2xl font-black mb-4 mt-6 tracking-tight text-inherit" {...props} />,
          h2: ({ ...props }) => <h2 className="text-xl font-black mb-3 mt-5 tracking-tight text-inherit" {...props} />,
          h3: ({ ...props }) => <h3 className="text-lg font-extrabold mb-2 mt-4 tracking-tight text-inherit" {...props} />,
          p: ({ ...props }) => <p className="mb-4 last:mb-0 leading-relaxed opacity-90" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
          li: ({ ...props }) => <li className="mb-1" {...props} />,
          strong: ({ ...props }) => <strong className="font-black text-inherit" {...props} />,
          code: ({ ...props }) => (
            <code className="bg-black/10 px-1.5 py-0.5 rounded-md font-mono text-sm" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-blue-500/50 pl-4 italic my-4 opacity-80" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
