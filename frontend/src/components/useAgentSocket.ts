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
}) {
  const { wsUrl } = opts;

  const sessionId = useMemo(() => newId(), []);
  const wsRef = useRef<WebSocket | null>(null);

  // ✅ keep latest onImages without re-connecting
  const onImagesRef = useRef<typeof opts.onImages>(opts.onImages);
  onImagesRef.current = opts.onImages;

  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", kind: "text", content: "Chatbot ready. Type 'help'." },
  ]);

  useEffect(() => {
    const url = (() => {
      if (!wsUrl) {
        return `/ws/agent?session_id=${encodeURIComponent(sessionId)}`;
      }

      // If a wsUrl is provided, keep it but ensure we pass a stable session_id.
      // This makes backend logs and thread state consistent.
      if (/[?&]session_id=/.test(wsUrl)) {
        return wsUrl;
      }

      const sep = wsUrl.includes("?") ? "&" : "?";
      return `${wsUrl}${sep}session_id=${encodeURIComponent(sessionId)}`;
    })();

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
          setMessages((prev) => [
            ...prev,
            { role: "system", kind: "debug", content: `tool_start: ${JSON.stringify(evt.payload)}` },
          ]);
          return;

        case "tool_end":
          setMessages((prev) => [
            ...prev,
            { role: "system", kind: "debug", content: `tool_end: ${JSON.stringify(evt.payload)}` },
          ]);
          return;

        case "plan_draft":
          // render as special plan card (your ConversationBox already does this)
          setMessages((prev) => [
            ...prev,
            { role: "assistant", kind: "plan_draft", content: evt.payload.plan },
          ]);
          return;

        case "images":
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
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              kind: "assist_step",
              content: { step_id: (evt.payload as any).step_id, call: (evt.payload as any).call },
            },
          ]);
          return;

        case "assist_step_result":
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              kind: "assist_step_result",
              content: {
                step_id: (evt.payload as any).step_id,
                ok: Boolean((evt.payload as any).ok),
                requires_apply: Boolean((evt.payload as any).requires_apply),
                summary: (evt.payload as any).summary,
              },
            },
          ]);
          return;

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
          setMessages((prev) => [
            ...prev,
            { role: "assistant", kind: "text", content: evt.payload.text },
          ]);
          return;

        case "error":
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
  }, [sessionId, wsUrl]);


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
    setMessages((prev) => [...prev, { role: "user", kind: "text", content: t }]);
    send({ type: "user_message", payload: { text: t } });
  };

  const sendDecision = (decision: Decision) => {
    send({ type: "plan_decision", payload: { decision } });
  };

  const sendAssistAction = (action: AssistAction, step_id: number, text?: string) => {
    send({ type: "assist_action", payload: { action, step_id, text } });
  };

  return { sessionId, connected, messages, sendUser, sendDecision, sendAssistAction };
}
