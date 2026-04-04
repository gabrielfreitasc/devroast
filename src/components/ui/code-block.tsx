import { type ComponentProps } from "react";
import { codeToHtml, type BundledLanguage } from "shiki";
import { tv } from "tailwind-variants";
import { unstable_cacheLife as cacheLife } from "next/cache";

const codeBlockRoot = tv({
  base: "rounded-lg border border-border-primary bg-bg-input overflow-hidden",
});

export function CodeBlockRoot({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={codeBlockRoot({ className })} {...props}>
      {children}
    </div>
  );
}

type CodeBlockHeaderProps = {
  filename?: string;
  className?: string;
};

export function CodeBlockHeader({ filename, className }: CodeBlockHeaderProps) {
  return (
    <div className={tv({ base: "flex items-center gap-3 h-10 px-4 border-b border-border-primary" })({ className })}>
      <div className="flex items-center gap-2">
        <span className="size-[10px] rounded-full bg-accent-red" />
        <span className="size-[10px] rounded-full bg-accent-amber" />
        <span className="size-[10px] rounded-full bg-accent-green" />
      </div>
      <div className="flex-1" />
      {filename && (
        <span className="text-text-tertiary text-xs">{filename}</span>
      )}
    </div>
  );
}

type CodeBlockCodeProps = {
  code: string;
  lang?: BundledLanguage;
  className?: string;
};

export async function CodeBlockCode({ code, lang = "javascript", className }: CodeBlockCodeProps) {
  "use cache";
  cacheLife("hours");
  const html = await codeToHtml(code, {
    lang,
    theme: "vesper",
  });

  return (
    <div
      className={tv({ base: "overflow-x-auto text-sm [&_pre]:p-4 [&_pre]:bg-transparent! [&_code]:text-sm" })({ className })}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
