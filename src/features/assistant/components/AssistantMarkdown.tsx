import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

export function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ className, ...props }) => <h3 className={cn("mt-3 font-semibold first:mt-0", className)} {...props} />,
        h2: ({ className, ...props }) => <h3 className={cn("mt-3 font-semibold first:mt-0", className)} {...props} />,
        h3: ({ className, ...props }) => <h3 className={cn("mt-3 font-semibold first:mt-0", className)} {...props} />,
        p: ({ className, ...props }) => <p className={cn("mb-2 last:mb-0", className)} {...props} />,
        ul: ({ className, ...props }) => <ul className={cn("my-2 list-disc space-y-1 pl-4", className)} {...props} />,
        ol: ({ className, ...props }) => <ol className={cn("my-2 list-decimal space-y-1 pl-4", className)} {...props} />,
        code: ({ className, ...props }) => <code className={cn("rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.92em]", className)} {...props} />,
        a: ({ href, className, ...props }) => {
          const external = Boolean(href?.startsWith("http"));
          return <a href={href?.startsWith("javascript:") ? "#" : href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={cn("font-medium underline decoration-black/25 underline-offset-4", className)} {...props} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
