"use client";

import type { UIResourceContent } from "@shared";
import { useTheme } from "next-themes";
import { McpUIResourceRenderer } from "./mcp-ui-resource-renderer";

interface UIResourceDisplayProps {
  resource: UIResourceContent;
  toolName?: string;
  label?: string;
  onToolCall?: (toolName: string, params: Record<string, unknown>) => void;
  onPromptSubmit?: (prompt: string) => void;
  onIntent?: (intent: string, params: Record<string, unknown>) => void;
  className?: string;
}

export function UIResourceDisplay({
  resource,
  toolName,
  label,
  onToolCall,
  onPromptSubmit,
  onIntent,
  className,
}: UIResourceDisplayProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className={className}>
      {toolName && (
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
          <span className="font-medium">{toolName}</span>
          <span className="text-green-600 dark:text-green-400">
            ✓ Interactive UI
          </span>
        </div>
      )}
      <McpUIResourceRenderer
        resource={resource}
        onToolCall={onToolCall}
        onPromptSubmit={onPromptSubmit}
        onIntent={onIntent}
        className="rounded-lg overflow-hidden border border-border bg-background"
        iframeRenderData={{ theme: resolvedTheme }}
      />
    </div>
  );
}
