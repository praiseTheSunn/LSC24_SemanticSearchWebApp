import { useEffect, useMemo, useRef, useState } from "react";
import type { ImagesPayload, ChatMessage, ClientEvent, AgentEvent, Decision } from "../types/agent"; // or keep your local types

function newId(): string {
  return (globalThis.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(16).slice(2)}`) as string;
}

export function useAgentSocket(opts: {
  onImages?: (payload: ImagesPayload) => void;
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
    const url = wsUrl ?? `/ws/agent?session_id=${encodeURIComponent(sessionId)}`;

    console.log("[WS] connecting to:", url);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] open:", ws.url, "readyState=", ws.readyState);
      setConnected(true);
    };

    ws.onclose = (ev) => {
      console.log("[WS] close:", ws.url, "code=", ev.code, "reason=", ev.reason);
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.log("[WS] error:", err);
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
          onImagesRef.current?.(evt.payload);

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

  return { sessionId, connected, messages, sendUser, sendDecision };
}
