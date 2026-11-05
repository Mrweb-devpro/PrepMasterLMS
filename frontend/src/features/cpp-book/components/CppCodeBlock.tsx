import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tokenPattern = /(\/\/.*|#include|\b(?:int|double|char|bool|void|class|struct|public|private|const|return|new|delete|explicit)\b|\b(?:std|cout|cin|vector|sort|find|string)\b|"(?:[^"\\]|\\.)*"|\b\d+(?:\.\d+)?\b)/g;

function HighlightedLine({ line }: { line: string }) {
  const parts = line.split(tokenPattern);
  return <>{parts.map((part, index) => {
    if (!part) return null;
    const className = part.startsWith("//")
      ? "text-text-muted"
      : part.startsWith("#") || /^(int|double|char|bool|void|class|struct|public|private|const|return|new|delete|explicit)$/.test(part)
        ? "text-primary"
        : /^(std|cout|cin|vector|sort|find|string)$/.test(part)
          ? "text-text-secondary"
          : part.startsWith('"') || /^\d/.test(part)
            ? "text-success"
            : "text-foreground";
    return <span className={className} key={`${part}-${index}`}>{part}</span>;
  })}</>;
}

export function CppCodeBlock({ fileName, source, output }: { fileName: string; source: string; output?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(source);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface-subtle">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 sm:px-4">
        <span className="font-mono text-xs text-text-secondary"><span className="text-primary">C++</span> · {fileName}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => void copy()}>
          {copied ? <Check className="text-success" /> : <Copy />}
          {copied ? "Copied" : "Copy code"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-[13px] leading-6 sm:p-4 sm:text-sm"><code>{source.split("\n").map((line, index) => (
        <span className="flex min-w-max" key={`${line}-${index}`}>
          <span className="mr-4 w-5 select-none text-right text-text-muted">{index + 1}</span>
          <span className="font-mono"><HighlightedLine line={line || " "} /></span>
        </span>
      ))}</code></pre>
      {output && <div className="border-t border-border bg-card px-3 py-3 sm:px-4">
        <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-text-muted">Output</p>
        <pre className="overflow-x-auto font-mono text-xs leading-5 text-text-secondary">{output}</pre>
      </div>}
    </div>
  );
}
