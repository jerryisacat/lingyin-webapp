"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";

function extractAlt(text: string): string {
  const match = text.match(/^!\[(.*?)\]/);
  return match ? match[1] : "图片";
}

interface MarkdownViewerProps {
  markdown: string;
}

export default function MarkdownViewer({ markdown }: MarkdownViewerProps) {
  return (
    <article className="prose prose-sm max-w-none prose-headings:text-ink prose-headings:font-medium prose-p:text-ink prose-p:leading-relaxed prose-li:text-ink prose-strong:text-ink prose-a:text-sakura prose-a:underline prose-blockquote:border-l-sakura prose-blockquote:text-ink-light prose-code:text-ink prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-surface prose-pre:border prose-pre:border-surface-border prose-img:rounded-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img({ src, alt }: ComponentPropsWithoutRef<"img">) {
            if (!src) return null;
            return (
              <Image
                src={src}
                alt={alt ?? extractAlt(markdown)}
                width={720}
                height={480}
                className="rounded-lg my-4 max-w-full h-auto"
                style={{ objectFit: "contain" }}
                loading="lazy"
              />
            );
          },
          h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
            <h1 className="text-xl font-medium text-ink mt-6 mb-3" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
            <h2 className="text-lg font-medium text-ink mt-5 mb-2" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
            <h3 className="text-base font-medium text-ink mt-4 mb-2" {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
            <p className="leading-relaxed text-ink my-2" {...props}>
              {children}
            </p>
          ),
          blockquote: ({
            children,
            ...props
          }: ComponentPropsWithoutRef<"blockquote">) => (
            <blockquote
              className="border-l-4 border-sakura pl-4 my-3 text-ink-light italic"
              {...props}
            >
              {children}
            </blockquote>
          ),
          code({
            className,
            children,
            ...props
          }: ComponentPropsWithoutRef<"code">) {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-surface text-ink px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-surface border border-surface-border rounded-lg p-4 my-3 overflow-x-auto">
                <code className="text-sm text-ink font-mono" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-ink" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
            <ol
              className="list-decimal pl-5 my-2 space-y-1 text-ink"
              {...props}
            >
              {children}
            </ol>
          ),
          hr: (props: ComponentPropsWithoutRef<"hr">) => (
            <hr className="border-surface-border my-6" {...props} />
          ),
          table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
            <div className="overflow-x-auto my-4">
              <table
                className="min-w-full border-collapse border border-surface-border text-sm"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
            <th
              className="border border-surface-border bg-surface px-3 py-2 text-left font-medium text-ink"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
            <td
              className="border border-surface-border px-3 py-2 text-ink"
              {...props}
            >
              {children}
            </td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
