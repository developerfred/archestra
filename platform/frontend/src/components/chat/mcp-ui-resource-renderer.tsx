"use client";

import type { UIActionResult, UIResourceContent } from "@shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/ai-elements/code-block";

interface UIResourceRendererComponentProps {
  resource: UIResourceContent;
  onUIAction?: (action: UIActionResult) => Promise<unknown>;
  htmlProps?: {
    style?: React.CSSProperties;
    autoResizeIframe?: boolean | { width?: boolean; height?: boolean };
    iframeRenderData?: Record<string, unknown>;
  };
}

// Supported resource types
enum ResourceType {
  REACT_COMPONENT = "react-component",
  HTML_CONTENT = "html-content",
  JSON_DATA = "json-data",
  MARKDOWN = "markdown",
  CODE_SNIPPET = "code-snippet",
  IFRAME = "iframe",
}

interface McpUIResourceRendererProps {
  resource: UIResourceContent;
  onToolCall?: (toolName: string, params: Record<string, unknown>) => void;
  onPromptSubmit?: (prompt: string) => void;
  onIntent?: (intent: string, params: Record<string, unknown>) => void;
  className?: string;
  iframeRenderData?: Record<string, unknown>;
  maxRetries?: number;
  renderMode?: "auto" | "fallback" | "iframe";
}

let LazyUIResourceRenderer: React.ComponentType<UIResourceRendererComponentProps> | null =
  null;

// Fallback component for safe rendering
function SafeFallbackRenderer({ resource }: { resource: UIResourceContent }) {
  const getResourceType = (res: UIResourceContent): ResourceType => {
    if (typeof res === "string") {
      if (res.includes("<html") || res.includes("<div")) {
        return ResourceType.HTML_CONTENT;
      }
      if (res.trim().startsWith("{") || res.trim().startsWith("[")) {
        try {
          JSON.parse(res);
          return ResourceType.JSON_DATA;
        } catch {
          return ResourceType.CODE_SNIPPET;
        }
      }
      return ResourceType.CODE_SNIPPET;
    }
    return ResourceType.JSON_DATA;
  };

  const getFormattedResource = (res: UIResourceContent, resType: ResourceType): string => {
    if (typeof res === "string") {
      if (resType === ResourceType.JSON_DATA) {
        try {
          return JSON.stringify(JSON.parse(res), null, 2);
        } catch {
          return res;
        }
      }
      return res;
    }
    return JSON.stringify(res, null, 2);
  };

  const getLanguage = (resType: ResourceType): string => {
    switch (resType) {
      case ResourceType.HTML_CONTENT:
        return "html";
      case ResourceType.JSON_DATA:
        return "json";
      case ResourceType.MARKDOWN:
        return "markdown";
      default:
        return "text";
    }
  };

  const resourceType = getResourceType(resource);
  const formatResource = getFormattedResource(resource, resourceType);
  const language = getLanguage(resourceType);

  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {resourceType.replace("-", " ")}
        </span>
        <span className="text-xs text-muted-foreground">
          Fallback Renderer
        </span>
      </div>
      <CodeBlock
        code={formatResource}
        language={language}
        showLineNumbers={formatResource.split("\n").length > 5}
      />
    </div>
  );
}

function SafeHTMLRenderer({ content }: { content: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border">
        <div className="animate-pulse h-32 bg-muted-foreground/20 rounded" />
      </div>
    );
  }

  const sanitizedContent = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+=\s*["'][^"']*["']/gi, "");

  return (
    <div className="p-4 bg-background rounded-lg border border-border">
      <CodeBlock code={sanitizedContent} language="html" />
    </div>
  );
}

export function McpUIResourceRenderer({
  resource,
  onToolCall,
  onPromptSubmit,
  onIntent,
  className,
  iframeRenderData,
  maxRetries = 3,
  renderMode = "auto",
}: McpUIResourceRendererProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

    const resourceType = useMemo(() => {
    if (renderMode === "iframe") return ResourceType.IFRAME;
    
    if (typeof resource === "string") {
      if (resource.includes("<html") || resource.includes("<div")) {
        return ResourceType.HTML_CONTENT;
      }
      if (resource.includes("React") || resource.includes("useState") || resource.includes("useEffect")) {
        return ResourceType.REACT_COMPONENT;
      }
      if (resource.trim().startsWith("{") || resource.trim().startsWith("[")) {
        try {
          JSON.parse(resource);
          return ResourceType.JSON_DATA;
        } catch {
          return ResourceType.CODE_SNIPPET;
        }
      }
      return ResourceType.CODE_SNIPPET;
    }
    return ResourceType.JSON_DATA;
  }, [resource, renderMode]);

  useEffect(() => {
    if (!isMounted || LazyUIResourceRenderer || (loadError && retryCount === 0)) return;

    const loadComponent = async () => {
      try {
        const mod = await import("@mcp-ui/client");
        LazyUIResourceRenderer = mod.UIResourceRenderer;
        setIsLoaded(true);
        setLoadError(null);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load component");
      }
    };

    loadComponent();
  }, [isMounted, retryCount, loadError]);

  const handleUIAction = useCallback(
    async (action: UIActionResult): Promise<{ status: string }> => {
      try {
        switch (action.type) {
          case "tool":
            onToolCall?.(action.payload.toolName, action.payload.params);
            return { status: "handled" };

          case "prompt":
            onPromptSubmit?.(action.payload.prompt);
            return { status: "handled" };

          case "link":
            window.open(action.payload.url, "_blank", "noopener,noreferrer");
            return { status: "handled" };

          case "notify":
            toast.info(action.payload.message);
            return { status: "handled" };

          case "intent":
            onIntent?.(action.payload.intent, action.payload.params);
            return { status: "handled" };

          default:
            return { status: "unhandled" };
        }
      } catch (error) {
        console.error("Error handling UI action:", error);
        return { status: "error" };
      }
    },
    [onToolCall, onPromptSubmit, onIntent],
  );

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const renderFallbackContent = () => {
    switch (resourceType) {
      case ResourceType.HTML_CONTENT:
        return <SafeHTMLRenderer content={resource as string} />;
      
      case ResourceType.REACT_COMPONENT:
      case ResourceType.CODE_SNIPPET:
      case ResourceType.JSON_DATA:
      default:
        return <SafeFallbackRenderer resource={resource} />;
    }
  };

  if (loadError) {
    return (
      <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-destructive font-medium">
              Failed to load UI component
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {loadError}
            </p>
          </div>
          {retryCount < maxRetries && (
            <button
              type="button"
              onClick={handleRetry}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
            >
              Retry ({maxRetries - retryCount} left)
            </button>
          )}
        </div>
        <div className="mt-3">
          {renderFallbackContent()}
        </div>
      </div>
    );
  }

  if (!isLoaded || !LazyUIResourceRenderer) {
    return (
      <div
        className="p-4 border rounded-md animate-pulse bg-muted"
        data-testid="loading-skeleton"
      >
        <div className="h-32 bg-muted-foreground/20 rounded" />
      </div>
    );
  }

  return (
    <div className={`${className || ""} relative`}>
      <LazyUIResourceRenderer
        resource={resource}
        onUIAction={handleUIAction}
        htmlProps={{
          style: {
            width: "100%",
            minHeight: "200px",
            border: "none",
            borderRadius: "8px",
            boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1) inset",
            backgroundColor: "#ffffff",
            color: "#000000",
          },
          autoResizeIframe: { height: true },
          iframeRenderData,
        }}
      />
      
      <div className="absolute top-2 right-2">
        <span className="text-xs bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border text-muted-foreground">
          {resourceType.replace("-", " ")}
        </span>
      </div>
    </div>
  );
}
