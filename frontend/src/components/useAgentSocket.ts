import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ImagesPayload,
  ChatMessage,
  ClientEvent,
  AgentEvent,
  Decision,
  AssistAction,
} from "../types/agent"; // or keep your local types

function newId(): string {
  return (globalThis.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(16).slice(2)}`) as string;
}

export function useAgentSocket(opts: {
  onImages?: (payload: ImagesPayload, meta?: { preview?: boolean; step_id?: number }) => void;
  wsUrl?: string;
  params?: Record<string, string | undefined | null>;
}) {
  const { wsUrl, params } = opts;

  const sessionId = useMemo(() => newId(), []);
  const wsRef = useRef<WebSocket | null>(null);
  const currentPlanIdRef = useRef<string | undefined>(undefined);

  // ✅ keep latest onImages without re-connecting
  const onImagesRef = useRef<typeof opts.onImages>(opts.onImages);
  onImagesRef.current = opts.onImages;

  const [connected, setConnected] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [inFlightTools, setInFlightTools] = useState(0);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", kind: "text", content: "Chatbot ready. Type 'help'." },
  ]);

  const upsertStepMessage = (nextMsg: ChatMessage, stepId: number, planId?: string) => {
    setMessages((prev) => {
      // Replace the last message of the same kind+stepId, else append.
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        const m = copy[i];
        if (m.kind === nextMsg.kind) {
          if (
            m.kind === "assist_step" &&
            (m as any).content?.step_id === stepId &&
            ((m as any).content?.plan_id ?? undefined) === (planId ?? undefined)
          ) {
            copy[i] = nextMsg;
            return copy;
          }
          if (
            m.kind === "assist_step_result" &&
            (m as any).content?.step_id === stepId &&
            ((m as any).content?.plan_id ?? undefined) === (planId ?? undefined)
          ) {
            copy[i] = nextMsg;
            return copy;
          }
        }
      }
      copy.push(nextMsg);
      return copy;
    });
  };

  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);

  useEffect(() => {
    const toWsOrigin = (origin: string) => {
      if (origin.startsWith("https://")) return origin.replace("https://", "wss://");
      if (origin.startsWith("http://")) return origin.replace("http://", "ws://");
      return origin;
    };

    const buildUrl = () => {
      const base = wsUrl ?? "/ws/agent";

      // Prefer URL() for correctness. For relative URLs, provide a ws/wss base.
      try {
        const baseForRelative =
          typeof window !== "undefined" && window.location?.origin
            ? toWsOrigin(window.location.origin)
            : "ws://localhost";

        const u = new URL(base, baseForRelative);

        // Always include a stable session_id.
        u.searchParams.set("session_id", sessionId);

        // Add caller-provided params (e.g., dataset). Ignore null/undefined/empty.
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            if (!k) continue;
            if (v == null) continue;
            const vv = String(v);
            if (!vv) continue;
            if (k === "session_id") continue;
            u.searchParams.set(k, vv);
          }
        }

        return u.toString();
      } catch {
        // Fallback: string append (best-effort)
        let url = base;
        const add = (k: string, v: string) => {
          const re = new RegExp(`[?&]${k}=`);
          if (re.test(url)) return;
          url += (url.includes("?") ? "&" : "?") + `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
        };

        add("session_id", sessionId);
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            if (!k) continue;
            if (v == null) continue;
            const vv = String(v);
            if (!vv) continue;
            if (k === "session_id") continue;
            add(k, vv);
          }
        }
        return url;
      }
    };

    const url = buildUrl();

    console.log("[WS] connecting to:", url);
    setMessages((prev) => [
      ...prev,
      { role: "system", kind: "debug", content: `ws: connecting to ${url}` },
    ]);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] open:", ws.url, "readyState=", ws.readyState);
      setConnected(true);
      setMessages((prev) => [
        ...prev,
        { role: "system", kind: "debug", content: `ws: open (${ws.url})` },
      ]);
    };

    ws.onclose = (ev) => {
      console.log("[WS] close:", ws.url, "code=", ev.code, "reason=", ev.reason);
      setConnected(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          kind: "debug",
          content: `ws: close code=${ev.code} reason=${ev.reason || "(none)"}`,
        },
      ]);
    };

    ws.onerror = (err) => {
      console.log("[WS] error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "system", kind: "error", content: "ws: error (see DevTools console)" },
      ]);
    };

    ws.onmessage = (e: MessageEvent<string>) => {
      console.log("[WS] message raw:", e.data);

      let evt: AgentEvent;
      try {
        evt = JSON.parse(e.data) as AgentEvent;
      } catch {
        // show non-json messages as system text
        setMessages((prev) => [
          ...prev,
          { role: "system", kind: "debug", content: `Non-JSON message: ${e.data}` },
        ]);
        return;
      }

      switch (evt.type) {
        case "meta":
          setMessages((prev) => [
            ...prev,
            { role: "system", kind: "debug", content: `meta: ${JSON.stringify(evt.payload)}` },
          ]);
          return;

        case "routing_intent":
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              kind: "debug",
              content: `routing_intent: ${JSON.stringify(evt.payload)}`,
            },
          ]);
          return;

        case "plan_status":
          setMessages((prev) => [
            ...prev,
            { role: "system", kind: "debug", content: `plan_status: ${JSON.stringify(evt.payload)}` },
          ]);
          return;

        case "tool_start":
          setInFlightTools((n) => n + 1);
          setLoadingText(
            `Running ${String((evt.payload as any)?.tool ?? "tool")}...`
          );
          setMessages((prev) => [
            ...prev,
            { role: "system", kind: "debug", content: `tool_start: ${JSON.stringify(evt.payload)}` },
          ]);
          return;

        case "tool_end":
          setInFlightTools((n) => Math.max(0, n - 1));
          setMessages((prev) => [
            ...prev,
            { role: "system", kind: "debug", content: `tool_end: ${JSON.stringify(evt.payload)}` },
          ]);
          return;

        case "plan_draft":
          setPendingRequest(false);
          setLoadingText(null);
          currentPlanIdRef.current = (evt.payload?.plan as any)?.id as string | undefined;
          // render as special plan card (your ConversationBox already does this)
          setMessages((prev) => [
            ...prev,
            { role: "assistant", kind: "plan_draft", content: evt.payload.plan },
          ]);
          return;

        case "images":
          setPendingRequest(false);
          setLoadingText(null);
          // route to image grid
          try {
            onImagesRef.current?.(evt.payload, { preview: false });
          } catch (err) {
            console.error("[onImages] handler threw:", err);
            setMessages((prev) => [
              ...prev,
              {
                role: "system",
                kind: "error",
                content: `images: onImages handler error: ${String(err)}`,
              },
            ]);
          }

          // also add a short chat line so user knows something happened
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              kind: "debug",
              content: `images: received ${evt.payload.items?.length ?? 0} items`,
            },
          ]);
          return;

        case "images_preview":
          setPendingRequest(false);
          setLoadingText(null);
          try {
            onImagesRef.current?.(evt.payload, {
              preview: true,
              step_id: (evt.payload as any)?.step_id,
            });
          } catch (err) {
            console.error("[onImages] handler threw (preview):", err);
            setMessages((prev) => [
              ...prev,
              {
                role: "system",
                kind: "error",
                content: `images_preview: onImages handler error: ${String(err)}`,
              },
            ]);
          }

          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              kind: "debug",
              content: `images_preview: received ${(evt.payload as any)?.items?.length ?? 0} items (step ${(evt.payload as any)?.step_id ?? "?"})`,
            },
          ]);
          return;

        case "assist_step":
          setPendingRequest(false);
          setLoadingText(null);
          {
            const planId = currentPlanIdRef.current;
          upsertStepMessage(
            {
              role: "assistant",
              kind: "assist_step",
              content: {
                plan_id: planId,
                step_id: (evt.payload as any).step_id,
                call: (evt.payload as any).call,
              },
            },
            Number((evt.payload as any).step_id),
            planId,
          );
          return;
          }

        case "assist_step_result":
          setPendingRequest(false);
          setLoadingText(null);
          {
            const planId = currentPlanIdRef.current;
          upsertStepMessage(
            {
              role: "assistant",
              kind: "assist_step_result",
              content: {
                plan_id: planId,
                step_id: (evt.payload as any).step_id,
                ok: Boolean((evt.payload as any).ok),
                requires_apply: Boolean((evt.payload as any).requires_apply),
                summary: (evt.payload as any).summary,
              },
            },
            Number((evt.payload as any).step_id),
            planId,
          );
          return;
          }

        case "assistant_token": {
          const delta = evt.payload.text || "";
          if (!delta) return;

          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];

            if (last?.role === "assistant" && last.kind === "text_stream") {
              copy[copy.length - 1] = { ...last, content: last.content + delta };
            } else {
              copy.push({ role: "assistant", kind: "text_stream", content: delta });
            }
            return copy;
          });
          return;
        }

        case "assistant_message":
          setPendingRequest(false);
          setLoadingText(null);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", kind: "text", content: evt.payload.text },
          ]);
          return;

        case "error":
          setPendingRequest(false);
          setLoadingText(null);
          setMessages((prev) => [
            ...prev,
            { role: "system", kind: "error", content: evt.payload.message },
          ]);
          return;

        default:
          // if your AgentEvent union is incomplete, you'll land here
          setMessages((prev) => [
            ...prev,
            { role: "system", kind: "debug", content: `unknown: ${JSON.stringify(evt)}` },
          ]);
          return;
      }
    };

    return () => {
      console.log("[WS] cleanup/closing:", ws.url);
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId, wsUrl, paramsKey]);


  const send = (msg: ClientEvent) => {
    const ws = wsRef.current;

    if (!ws) {
      console.warn("[WS] send blocked: wsRef is null", msg);
      return;
    }

    if (ws.readyState !== WebSocket.OPEN) {
      console.warn(
        "[WS] send blocked: socket not OPEN",
        "readyState=",
        ws.readyState,
        "url=",
        ws.url,
        "msg=",
        msg
      );
      return;
    }

    console.log("[WS] send:", msg);
    ws.send(JSON.stringify(msg));
  };

  const sendUser = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setPendingRequest(true);
    setLoadingText("Thinking...");
    setMessages((prev) => [...prev, { role: "user", kind: "text", content: t }]);
    send({ type: "user_message", payload: { text: t } });
  };

  const sendDecision = (decision: Decision) => {
    setPendingRequest(true);
    setLoadingText(decision === "approve" ? "Executing plan..." : "Updating..." );
    send({ type: "plan_decision", payload: { decision } });
  };

  const sendAssistAction = (action: AssistAction, step_id: number, text?: string) => {
    setPendingRequest(true);
    if (action === "run_step") setLoadingText(`Running step ${step_id}...`);
    else if (action === "apply_preview") setLoadingText(`Applying step ${step_id}...`);
    else if (action === "discard_preview") setLoadingText(`Discarding step ${step_id}...`);
    else if (action === "skip_step") setLoadingText(`Skipping step ${step_id}...`);
    else if (action === "refine_step") setLoadingText(`Refining step ${step_id}...`);
    send({ type: "assist_action", payload: { action, step_id, text } });
  };

  const isLoading = pendingRequest || inFlightTools > 0;
  return {
    sessionId,
    connected,
    messages,
    sendUser,
    sendDecision,
    sendAssistAction,
    isLoading,
    loadingText: loadingText ?? (inFlightTools > 0 ? "Working..." : null),
  };
}
