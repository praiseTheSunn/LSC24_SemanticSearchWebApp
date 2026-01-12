// src/types/agent.ts

/** ---------- Client -> Server ---------- */

export type Decision = "approve" | "reject";

export type AssistAction =
  | "run_step"
  | "apply_preview"
  | "discard_preview"
  | "skip_step"
  | "refine_step";

export type ClientEvent =
  | { type: "user_message"; payload: { text: string } }
  | { type: "plan_decision"; payload: { decision: Decision } }
  | {
      type: "assist_action";
      payload: { action: AssistAction; step_id: number; text?: string };
    };

/** ---------- Plan / Tools ---------- */

export type ToolCall = {
  step_id?: number;
  tool: string;
  operation?: string;
  query?: string;
  params?: Record<string, unknown>;
};

export type Plan = {
  goal?: string;
  calls?: ToolCall[];
  top_k_display?: number;
  rationale?: string;
  budget?: unknown;
  fusion?: Record<string, unknown>;
  // allow extra fields from backend
  [k: string]: unknown;
};

/** ---------- Images payload ---------- */

export type ImageItem = {
  record_id: number | string;
  score?: number | null;
  img_link?: string;
  date?: string;
  time?: string;
  ocr?: string;
  caption?: string;
  location?: string;
  activity?: string;
  new_lat?: number;
  new_lng?: number;
  activity_id?: number;
  event_id?: number;
  location_id?: number;
  object_tags?: string;
  day_of_week?: string;
  location_displayed?: string;
  video_url?: string;
  timestamp?: number;
  video_id?: string;
  frame_id?: string;
  context_id_coarse?: string;
  image_id?: string;
  neighbors?: ImageItem[];
  // Legacy support for 'id' field
  id?: number | string;
  // allow other extra fields if needed
  [k: string]: unknown;
};

export type ImagesPayload = {
  items: ImageItem[];
  top_k_display?: number;
  [k: string]: unknown;
};

/** ---------- Server -> Client ---------- */

// Base envelope from backend
export type AgentEventBase<TType extends string, TPayload> = {
  type: TType;
  payload: TPayload;
  // optional fields (backend may include these; frontend doesn't need them)
  session_id?: string;
  message_id?: string;
};

export type MetaEvent = AgentEventBase<"meta", { ok: boolean }>;

export type RoutingIntentEvent = AgentEventBase<
  "routing_intent",
  { has_plan: boolean; status: string; text: string }
>;

export type PlanDraftEvent = AgentEventBase<"plan_draft", { plan: Plan }>;

export type PlanStatusEvent = AgentEventBase<
  "plan_status",
  { status: string; [k: string]: unknown }
>;

export type ToolStartEvent = AgentEventBase<
  "tool_start",
  { tool: string; step_id?: number; [k: string]: unknown }
>;

export type ToolEndEvent = AgentEventBase<
  "tool_end",
  { tool: string; step_id?: number; ok?: boolean; [k: string]: unknown }
>;

export type ImagesEvent = AgentEventBase<"images", ImagesPayload>;

export type ImagesPreviewEvent = AgentEventBase<
  "images_preview",
  ImagesPayload & { step_id?: number }
>;

export type AssistStepEvent = AgentEventBase<
  "assist_step",
  { step_id: number; call: ToolCall }
>;

export type AssistStepResultEvent = AgentEventBase<
  "assist_step_result",
  { step_id: number; ok: boolean; requires_apply?: boolean; summary?: string; [k: string]: unknown }
>;

export type AssistantTokenEvent = AgentEventBase<
  "assistant_token",
  { text: string }
>;

export type AssistantMessageEvent = AgentEventBase<
  "assistant_message",
  { text: string }
>;

export type ErrorEvent = AgentEventBase<
  "error",
  { message: string }
>;

/** All server event types (10 total) */
export type AgentEvent =
  | MetaEvent
  | RoutingIntentEvent
  | PlanDraftEvent
  | PlanStatusEvent
  | ToolStartEvent
  | ToolEndEvent
  | ImagesEvent
  | ImagesPreviewEvent
  | AssistStepEvent
  | AssistStepResultEvent
  | AssistantTokenEvent
  | AssistantMessageEvent
  | ErrorEvent;

/** ---------- UI Chat message model (local state) ---------- */

export type Role = "user" | "assistant" | "system";

export type ChatMessage =
  | { role: Role; kind: "text"; content: string }
  | { role: Role; kind: "text_stream"; content: string }
  | { role: Role; kind: "debug"; content: string }
  | { role: Role; kind: "error"; content: string }
  | { role: "assistant"; kind: "plan_draft"; content: Plan }
  | { role: "assistant"; kind: "assist_step"; content: { step_id: number; call: ToolCall } }
  | {
      role: "assistant";
      kind: "assist_step_result";
      content: { step_id: number; ok: boolean; requires_apply?: boolean; summary?: string };
    };
