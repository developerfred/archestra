"use client";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Custom dark theme with high contrast
const customDarkTheme = {
  'code[class*="language-"]': {
    color: "#f3f4f6", // Even lighter gray for maximum contrast
    background: "#111827", // Very dark background for best readability
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
    fontSize: "0.875rem",
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal" as const,
    wordWrap: "normal" as const,
    lineHeight: "1.5",
    tabSize: 4,
    hyphens: "none" as const,
  },
  'pre[class*="language-"]': {
    color: "#f3f4f6",
    background: "#111827",
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
    fontSize: "0.875rem",
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal" as const,
    wordWrap: "normal" as const,
    lineHeight: "1.5",
    tabSize: 4,
    hyphens: "none" as const,
    padding: "1rem",
    margin: "0",
    overflow: "auto",
  },
  'comment': { color: "#9ca3af", fontStyle: "italic" },
  'prolog': { color: "#9ca3af" },
  'doctype': { color: "#9ca3af" },
  'cdata': { color: "#9ca3af" },
  'punctuation': { color: "#d1d5db" },
  'property': { color: "#10b981" },
  'tag': { color: "#10b981" },
  'boolean': { color: "#60a5fa" },
  'number': { color: "#93c5fd" },
  'constant': { color: "#93c5fd" },
  'symbol': { color: "#93c5fd" },
  'deleted': { color: "#f87171" },
  'selector': { color: "#a78bfa" },
  'attr-name': { color: "#fbbf24" },
  'string': { color: "#fbbf24" },
  'char': { color: "#fbbf24" },
  'builtin': { color: "#06b6d4" },
  'inserted': { color: "#10b981" },
  'operator': { color: "#f59e0b" },
  'entity': { color: "#fbbf24" },
  'url': { color: "#06b6d4" },
  'variable': { color: "#8b5cf6" },
  'atrule': { color: "#f59e0b" },
  'attr-value': { color: "#fbbf24" },
  'function': { color: "#60a5fa" },
  'class-name': { color: "#f59e0b" },
  'keyword': { color: "#ec4899" },
  'regex': { color: "#fbbf24" },
  'important': { color: "#f87171", fontWeight: "bold" },
};

// Custom light theme with high contrast
const customLightTheme = {
  'code[class*="language-"]': {
    color: "#1f2937", // Very dark gray for maximum contrast
    background: "#ffffff", // Pure white background for best readability
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
    fontSize: "0.875rem",
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal" as const,
    wordWrap: "normal" as const,
    lineHeight: "1.5",
    tabSize: 4,
    hyphens: "none" as const,
  },
  'pre[class*="language-"]': {
    color: "#1f2937",
    background: "#ffffff",
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
    fontSize: "0.875rem",
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal" as const,
    wordWrap: "normal" as const,
    lineHeight: "1.5",
    tabSize: 4,
    hyphens: "none" as const,
    padding: "1rem",
    margin: "0",
    overflow: "auto",
  },
  'comment': { color: "#6b7280", fontStyle: "italic" },
  'prolog': { color: "#6b7280" },
  'doctype': { color: "#6b7280" },
  'cdata': { color: "#6b7280" },
  'punctuation': { color: "#4b5563" },
  'property': { color: "#065f46" },
  'tag': { color: "#065f46" },
  'boolean': { color: "#1e40af" },
  'number': { color: "#1d4ed8" },
  'constant': { color: "#1d4ed8" },
  'symbol': { color: "#1d4ed8" },
  'deleted': { color: "#b91c1c" },
  'selector': { color: "#5b21b6" },
  'attr-name': { color: "#b45309" },
  'string': { color: "#a16207" },
  'char': { color: "#a16207" },
  'builtin': { color: "#0e7490" },
  'inserted': { color: "#065f46" },
  'operator': { color: "#c2410c" },
  'entity': { color: "#a16207" },
  'url': { color: "#0e7490" },
  'variable': { color: "#5b21b6" },
  'atrule': { color: "#c2410c" },
  'attr-value': { color: "#a16207" },
  'function': { color: "#1e40af" },
  'class-name': { color: "#c2410c" },
  'keyword': { color: "#be185d" },
  'regex': { color: "#a16207" },
  'important': { color: "#b91c1c", fontWeight: "bold" },
};

/**
 * Formats HTML, XML or similar code with proper indentation
 */
export function formatCode(code: string, language: string): string {
  code = code.trim();

  if (['html', 'xml', 'jsx', 'tsx', 'vue', 'svelte'].includes(language.toLowerCase())) {
    return formatMarkup(code);
  }

  if (language.toLowerCase() === 'json') {
    try {
      return JSON.stringify(JSON.parse(code), null, 2);
    } catch {
      return code;
    }
  }

  return code;
}

function formatMarkup(code: string): string {
  code = code.replace(/>\s+</g, '><');
  
  let formatted = '';
  let indent = 0;
  const indentSize = 2;
  
  const inlineTags = new Set(['strong', 'em', 'span', 'a', 'code', 'b', 'i', 'u']);
  const selfClosingTags = new Set(['img', 'br', 'hr', 'input', 'meta', 'link']);
  
  const parts = code.split(/(<[^>]+>)/g).filter(Boolean);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (!part.startsWith('<')) {
      const content = part.trim();
      if (content) {
        formatted += content;
      }
      continue;
    }
    
    const isClosing = part.startsWith('</');
    const isSelfClosing = part.endsWith('/>') || selfClosingTags.has(getTagName(part));
    const isOpening = !isClosing && !isSelfClosing;
    const tagName = getTagName(part);
    const isInline = inlineTags.has(tagName);
    
    if (isClosing && !isInline) {
      indent = Math.max(0, indent - 1);
    }
    
    if (!isInline) {
      formatted += '\n' + ' '.repeat(indent * indentSize);
    }
    
    formatted += part;
    
    if (isOpening && !isInline) {
      indent++;
    }
  }
  
  return formatted.trim();
}

function getTagName(tag: string): string {
  const match = tag.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/);
  return match ? match[1].toLowerCase() : '';
}

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50",
          className,
        )}
        {...props}
      >
        <div className="relative">
          <SyntaxHighlighter
            className="overflow-hidden !bg-transparent"
            codeTagProps={{
              className: "font-mono text-sm",
            }}
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.875rem",
              background: "transparent",
              color: "inherit",
            }}
            language={language}
            lineNumberStyle={{
              color: "#6b7280", // Better contrast for line numbers
              paddingRight: "1rem",
              minWidth: "2.5rem",
              userSelect: "none",
            }}
            showLineNumbers={showLineNumbers}
            style={isDark ? customDarkTheme : customLightTheme}
          >
            {code}
          </SyntaxHighlighter>
          {children && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn("h-8 w-8 shrink-0", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon className="h-4 w-4" />}
    </Button>
  );
};

// Helper component that automatically formats code
export function FormattedCodeBlock({
  code,
  language,
  ...props
}: CodeBlockProps) {
  const formattedCode = formatCode(code, language);
  
  return (
    <CodeBlock code={formattedCode} language={language} {...props}>
      <CodeBlockCopyButton />
    </CodeBlock>
  );
}