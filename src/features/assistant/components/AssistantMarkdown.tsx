import Markdown from "markdown-to-jsx";

export function AssistantMarkdown({ content }: { content: string }) {
  return (
    <Markdown
      className="
        leading-snug

        [&_h1]:my-3
        [&_h1]:font-semibold
        [&_h2]:my-3
        [&_h2]:font-semibold
        [&_h3]:my-2
        [&_h3]:font-semibold

        [&_p]:my-2

        [&_ul]:my-2
        [&_ul]:list-disc
        [&_ul]:pl-4

        [&_ol]:my-2
        [&_ol]:list-decimal
        [&_ol]:pl-4

        [&_li]:m-0
        [&_li>p]:m-0

        [&_a]:font-medium
        [&_a]:underline
      "
    >
      {content}
    </Markdown>
  );
}
