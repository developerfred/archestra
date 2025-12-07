export type UIResourceMimeType =
  | "text/html"
  | "text/uri-list"
  | "application/vnd.mcp-ui.remote-dom"
  | `application/vnd.mcp-ui.remote-dom+javascript; framework=${"react" | "webcomponents"}`;

export interface UIResourceContent {
  uri: string;
  mimeType: UIResourceMimeType;
  text?: string;
  blob?: string;
}

export interface UIResource {
  type: "resource";
  resource: UIResourceContent;
}

export type UIActionType = "tool" | "intent" | "prompt" | "notify" | "link";

export interface UIActionTool {
  type: "tool";
  payload: { toolName: string; params: Record<string, unknown> };
  messageId?: string;
}

export interface UIActionIntent {
  type: "intent";
  payload: { intent: string; params: Record<string, unknown> };
  messageId?: string;
}

export interface UIActionPrompt {
  type: "prompt";
  payload: { prompt: string };
  messageId?: string;
}

export interface UIActionNotify {
  type: "notify";
  payload: { message: string };
  messageId?: string;
}

export interface UIActionLink {
  type: "link";
  payload: { url: string };
  messageId?: string;
}

export type UIActionResult =
  | UIActionTool
  | UIActionIntent
  | UIActionPrompt
  | UIActionNotify
  | UIActionLink;

/**
 * Check if content is a UIResource
 */
export function isUIResource(content: unknown): content is UIResource {
  if (!content || typeof content !== "object") return false;
  const obj = content as Record<string, unknown>;
  if (obj.type !== "resource") return false;
  if (!obj.resource || typeof obj.resource !== "object") return false;
  const resource = obj.resource as Record<string, unknown>;
  return (
    typeof resource.uri === "string" &&
    resource.uri.startsWith("ui://") &&
    typeof resource.mimeType === "string"
  );
}

/**
 * Extract UIResource from tool output (handles various formats)
 */
export function extractUIResourceFromOutput(
  output: unknown,
): UIResource | null {
  if (!output) return null;

  if (isUIResource(output)) return output;

  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output);
      if (isUIResource(parsed)) return parsed;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (isUIResource(item)) return item;
        }
      }
      if (parsed.content && Array.isArray(parsed.content)) {
        for (const item of parsed.content) {
          if (isUIResource(item)) return item;
        }
      }
    } catch {
      return null;
    }
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      if (isUIResource(item)) return item;
    }
  }

  if (typeof output === "object" && output !== null) {
    const obj = output as Record<string, unknown>;
    if (Array.isArray(obj.content)) {
      for (const item of obj.content) {
        if (isUIResource(item)) return item;
      }
    }
  }

  return null;
}
