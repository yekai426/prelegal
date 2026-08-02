import { parseRichText } from "@/lib/richText";

export function RichText({ text }: { text: string }) {
  const segments = parseRichText(text);
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === "bold") {
          return <strong key={index}>{segment.value}</strong>;
        }
        if (segment.type === "link") {
          return (
            <a
              key={index}
              href={segment.href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-zinc-950 dark:hover:text-white"
            >
              {segment.text}
            </a>
          );
        }
        return <span key={index}>{segment.value}</span>;
      })}
    </>
  );
}
