"use client";

import type { UIActionResult, UIResourceContent } from "@shared";
import { useTheme } from "next-themes";
import { DynamicReactRenderer, renderComponentTree } from "./DynamicReactRenderer";
import { McpUIResourceRenderer } from "./mcp-ui-resource-renderer";

interface UIResourceDisplayProps {
  resource: UIResourceContent;
  toolName?: string;
  label?: string;
  onToolCall?: (toolName: string, params: Record<string, unknown>) => void;
  onPromptSubmit?: (prompt: string) => void;
  onIntent?: (intent: string, params: Record<string, unknown>) => void;
  className?: string;
  onUIAction?: (action: UIActionResult) => Promise<unknown>;
}

export function UIResourceDisplay({
  resource,
  toolName,
  label,
  onToolCall,
  onPromptSubmit,
  onIntent,
  className,
  onUIAction,
}: UIResourceDisplayProps) {
  const { resolvedTheme } = useTheme();

  const isReactComponent = resource.mimeType === "application/vnd.mcp-ui.remote-dom+javascript; framework=react";

  return (
    <div className={className}>
      {toolName && (
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
          <span className="font-medium">{toolName}</span>
          {isReactComponent ? (
            <span className="text-blue-600 dark:text-blue-400">
              ✓ Dynamic React UI
            </span>
          ) : (
            <span className="text-green-600 dark:text-green-400">
              ✓ Interactive UI
            </span>
          )}
        </div>
      )}
      {isReactComponent && resource.text ? (
        <div className="rounded-lg overflow-hidden border border-border bg-background p-4">
          {renderComponentTree(resource.text)}
        </div>
      ) : (
        <McpUIResourceRenderer
          resource={resource}
          onToolCall={onToolCall}
          onPromptSubmit={onPromptSubmit}
          onIntent={onIntent}
          className="rounded-lg overflow-hidden border border-border bg-background"
          iframeRenderData={{ theme: resolvedTheme }}
        />
      )}
    </div>
  );
}
