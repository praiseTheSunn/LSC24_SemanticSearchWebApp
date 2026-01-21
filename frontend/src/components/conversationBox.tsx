import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, LinearProgress, TextField, Typography } from "@mui/material";
import { useAgentSocket } from "./useAgentSocket";
import { transformResponse_LSC } from "../config/transformResponse";
import type { ApiResponse } from "../types/api";
import { useAppSelector } from "../AppState";

function isProbablyJsonString(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (!(t.startsWith("{") || t.startsWith("["))) return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

type InlineToken =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "code"; text: string };

function tokenizeMarkdownLite(line: string): InlineToken[] {
  // Minimal inline markdown:
  // - `code`
  // - **bold**
  // - *italic*
  // No nesting, no links, no HTML.
  const tokens: InlineToken[] = [];
  let i = 0;

  const pushText = (text: string) => {
    if (!text) return;
    tokens.push({ kind: "text", text });
  };

  while (i < line.length) {
    // code
    if (line[i] === "`") {
      const j = line.indexOf("`", i + 1);
      if (j !== -1) {
        const content = line.slice(i + 1, j);
        tokens.push({ kind: "code", text: content });
        i = j + 1;
        continue;
      }
    }

    // bold
    if (line.startsWith("**", i)) {
      const j = line.indexOf("**", i + 2);
      if (j !== -1) {
        const content = line.slice(i + 2, j);
        tokens.push({ kind: "bold", text: content });
        i = j + 2;
        continue;
      }
    }

    // italic
    if (line[i] === "*") {
      const j = line.indexOf("*", i + 1);
      if (j !== -1) {
        const content = line.slice(i + 1, j);
        tokens.push({ kind: "italic", text: content });
        i = j + 1;
        continue;
      }
    }

    // plain text run until next special marker
    const nextCandidates = [
      line.indexOf("`", i),
      line.indexOf("**", i),
      line.indexOf("*", i),
    ].filter((x) => x !== -1) as number[];

    const next = nextCandidates.length ? Math.min(...nextCandidates) : -1;
    if (next === -1) {
      pushText(line.slice(i));
      break;
    }
    pushText(line.slice(i, next));
    i = next;
  }

  return tokens;
}

function renderMarkdownLite(text: string): React.ReactNode {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, lineIdx) => {
        const parts = tokenizeMarkdownLite(line);
        return (
          <React.Fragment key={lineIdx}>
            {parts.map((tok, tokIdx) => {
              const key = `${lineIdx}-${tokIdx}`;
              if (tok.kind === "bold") return <strong key={key}>{tok.text}</strong>;
              if (tok.kind === "italic") return <em key={key}>{tok.text}</em>;
              if (tok.kind === "code") {
                return (
                  <Box
                    key={key}
                    component="code"
                    sx={{
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      fontSize: "0.9em",
                      px: 0.5,
                      py: 0.15,
                      borderRadius: 1,
                      bgcolor: "rgba(0,0,0,0.06)",
                      border: "1px solid rgba(0,0,0,0.10)",
                    }}
                  >
                    {tok.text}
                  </Box>
                );
              }
              return <React.Fragment key={key}>{tok.text}</React.Fragment>;
            })}
            {lineIdx < lines.length - 1 ? <br /> : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

interface ConversationBoxProps<TItem = unknown> {
  setResult?: React.Dispatch<React.SetStateAction<TItem[]>>;
  wsUrl?: string;
  className?: string;
}

function ConversationBox<TItem = unknown>({
  setResult,
  wsUrl,
  className,
}: ConversationBoxProps<TItem>) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const committedRef = useRef<TItem[] | null>(null);
  const previewRef = useRef<TItem[] | null>(null);
  const [pendingPreviewStepId, setPendingPreviewStepId] = useState<number | null>(null);
  const [runningPreviewStepId, setRunningPreviewStepId] = useState<number | null>(null);
  const [refineDraftByStepId, setRefineDraftByStepId] = useState<Record<number, string>>({});
  const [view, setView] = useState<"applied" | "preview">("applied");
  const lastPlanIdRef = useRef<string | null>(null);

  const dataset = useAppSelector((state) => state.app.queryPayload.dataset);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendUser(trimmed);
    setInput("");
  };

  const socketParams = useMemo(() => ({ dataset }), [dataset]);

  const { connected, messages, sendUser, sendDecision, sendAssistAction, isLoading, loadingText } = useAgentSocket({
    wsUrl,
    params: socketParams,
    onImages: (payload, meta) => {
      if (!setResult) return;

      // The agent returns ImageItem[] (similar to ObjPosResponse/ImageRecord).
      // For LSC UI we run the same normalization used for API results.
      const safeItems = (payload.items ?? []).filter(
        (img) => typeof (img as any)?.img_link === "string",
      );      
      const resp = {
        data: safeItems as any,
        status: 200,
      } satisfies ApiResponse;

      const transformed = transformResponse_LSC(resp);
      const next = transformed as unknown as TItem[];
      setResult(next);

      if (!meta?.preview) {
        committedRef.current = next;
        previewRef.current = null;
        setView("applied");
        setPendingPreviewStepId(null);
        setRunningPreviewStepId(null);
      } else {
        setPendingPreviewStepId(meta.step_id ?? null);
        previewRef.current = next;
        setView("preview");
        setRunningPreviewStepId(null);
      }
    },
  });

  // Latest plan_id (used to disable old plan actions).
  const activePlanId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m: any = messages[i];
      if (m?.kind === "plan_draft") {
        const pid = m?.content?.id;
        return typeof pid === "string" ? pid : null;
      }
    }
    return null;
  }, [messages]);

  // Auto-scroll to the latest message (also when a message is updated in-place).
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [messages]);

  // When a NEW plan draft arrives (plan id changes), reset per-plan UI state.
  // Important: don't reset on every message update, otherwise Apply/Discard gets disabled.
  useEffect(() => {
    let latestPlanId: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.kind === "plan_draft") {
        const pid = (m.content as any)?.id;
        latestPlanId = typeof pid === "string" ? pid : null;
        break;
      }
    }

    if (!latestPlanId) return;
    if (lastPlanIdRef.current === latestPlanId) return;

    lastPlanIdRef.current = latestPlanId;
    setRunningPreviewStepId(null);
    setPendingPreviewStepId(null);
    setRefineDraftByStepId({});
  }, [messages]);

  // If a step finishes (success or failure), ensure we clear the "Running…" busy state.
  // Some failures don't emit images_preview/images, so relying on onImages() isn't enough.
  useEffect(() => {
    if (runningPreviewStepId == null) return;

    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.kind !== "assist_step_result") continue;
      const finishedStepId = (m as any)?.content?.step_id;
      if (finishedStepId === runningPreviewStepId) {
        setRunningPreviewStepId(null);
      }
      break;
    }
  }, [messages, runningPreviewStepId]);

  const isAssist = useMemo(() => {
    if (!wsUrl) return false;
    try {
      const u = new URL(wsUrl);
      return (u.searchParams.get("mode") || "").toLowerCase() === "assist";
    } catch {
      // if wsUrl is relative or invalid for URL(), fallback to substring
      return /[?&]mode=assist(\b|&|$)/i.test(wsUrl);
    }
  }, [wsUrl]);

  // Ctrl+` toggles between the latest preview list and the last applied list.
  // Preview is shown instantly on arrival; this just lets users switch views later.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;

      // Avoid hijacking typing in inputs/textareas.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      // Backquote ( ` ) is 'Backquote' key on most keyboards.
      if (e.key !== "`") return;
      e.preventDefault();

      if (!setResult) return;

      setView((cur) => {
        const nextView = cur === "preview" ? "applied" : "preview";
        if (nextView === "preview") {
          const p = previewRef.current;
          if (p && p.length) {
            setResult(p);
            return "preview";
          }
          // No preview available; keep current view.
          return cur;
        }
        const a = committedRef.current;
        if (a && a.length) {
          setResult(a);
          return "applied";
        }
        return cur;
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setResult]);

  const statusText = connected ? "connectedddddddd" : "disconnected";
  const statusColor = connected ? "success.main" : "error.main";

  const containerSx = useMemo(
    () => ({
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      minHeight: 0,
      borderRadius: 2,
      border: "1px solid rgba(0,0,0,0.12)",
      backgroundColor: "#fff",
      overflow: "hidden",
    }),
    [],
  );

  const headerSx = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      px: 1.5,
      py: 1,
      borderBottom: "1px solid rgba(0,0,0,0.12)",
      flexShrink: 0,
    }),
    [],
  );

  const listSx = useMemo(
    () => ({
      flex: 1,
      minHeight: 0,
      overflow: "auto",
      px: 1.5,
      py: 1.25,
      backgroundColor: "rgba(0,0,0,0.02)",
    }),
    [],
  );

  const footerSx = useMemo(
    () => ({
      px: 1.5,
      py: 1.25,
      borderTop: "1px solid rgba(0,0,0,0.12)",
      flexShrink: 0,
      backgroundColor: "#fff",
    }),
    [],
  );

  return (
    <Box className={className} sx={containerSx}>
      <Box sx={headerSx}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: statusColor,
            }}
          />
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            {statusText}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" sx={{ opacity: 0.65 }}>
            {isAssist ? `view: ${view} (Ctrl+\` )` : ""}
          </Typography>
          {isLoading ? (
            <Typography variant="caption" sx={{ opacity: 0.65 }}>
              {loadingText || "Working..."}
            </Typography>
          ) : null}
          <Typography variant="caption" sx={{ opacity: 0.65 }}>
            {messages.length} msg
          </Typography>
        </Box>
      </Box>

      {isLoading ? <LinearProgress sx={{ height: 2 }} /> : null}

      <Box sx={listSx}>
        {messages.map((m, i) => {
          if (m.kind === "plan_draft") {
            const planId = (m.content as any)?.id as string | undefined;
            const isOldPlan = Boolean(activePlanId && planId && planId !== activePlanId);
            return (
              <Box
                key={i}
                mb={1.5}
                p={1.25}
                border="1px solid rgba(0,0,0,0.16)"
                borderRadius={2}
                bgcolor="#fff"
              >
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  assistant • plan draft
                </Typography>

                <Box
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    fontSize: 12,
                    m: 0,
                    mt: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(m.content, null, 2)}
                </Box>

                <Box display="flex" gap={1} mt={1}>
                  {!isAssist ? (
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={isOldPlan}
                      onClick={() => sendDecision("approve")}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={isOldPlan}
                      onClick={() => sendAssistAction("run_step", 1)}
                    >
                      Start Preview (Step 1)
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isOldPlan}
                    onClick={() => sendDecision("reject")}
                  >
                    Reject
                  </Button>
                </Box>
              </Box>
            );
          }

          if (m.kind === "assist_step") {
            const isBusy = runningPreviewStepId !== null;
            const isThisStepBusy = runningPreviewStepId === m.content.step_id;
            const stepId = m.content.step_id;
            const refineText = refineDraftByStepId[stepId] ?? "";
            const msgPlanId = (m.content as any)?.plan_id as string | undefined;
            const isOldPlan = Boolean(activePlanId && msgPlanId && msgPlanId !== activePlanId);
            return (
              <Box
                key={i}
                mb={1.5}
                p={1.25}
                border="1px solid rgba(0,0,0,0.16)"
                borderRadius={2}
                bgcolor="#fff"
              >
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  assistant • step {stepId}
                </Typography>

                <Box
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    fontSize: 12,
                    m: 0,
                    mt: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(m.content.call, null, 2)}
                </Box>

                <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isOldPlan || (isBusy && !isThisStepBusy)}
                    onClick={() => {
                      setRunningPreviewStepId(stepId);
                      sendAssistAction("run_step", stepId);
                    }}
                  >
                    {isThisStepBusy ? "Running…" : "Run Preview"}
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isOldPlan || isBusy}
                    onClick={() => {
                      // user chooses to not run preview and also not change the grid
                      setRunningPreviewStepId(null);
                      setPendingPreviewStepId(null);
                      sendAssistAction("skip_step", stepId);
                    }}
                  >
                    Skip Step
                  </Button>
                </Box>

                <Box mt={1} display="flex" gap={1} alignItems="center">
                  <TextField
                    size="small"
                    fullWidth
                    value={refineText}
                    disabled={isOldPlan || isBusy}
                    placeholder="Refine this step (e.g. less trees)"
                    onChange={(e) => {
                      const v = e.target.value;
                      setRefineDraftByStepId((prev) => ({ ...prev, [stepId]: v }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const t = refineText.trim();
                        if (!t) return;
                        setRunningPreviewStepId(null);
                        setPendingPreviewStepId(null);
                        sendAssistAction("refine_step", stepId, t);
                      }
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isOldPlan || isBusy || !refineText.trim()}
                    onClick={() => {
                      const t = refineText.trim();
                      if (!t) return;
                      setRunningPreviewStepId(null);
                      setPendingPreviewStepId(null);
                      sendAssistAction("refine_step", stepId, t);
                    }}
                  >
                    Refine
                  </Button>
                </Box>

                <Box display="flex" gap={1} mt={1}>
                  {/* buttons moved above */}
                </Box>
              </Box>
            );
          }

          if (m.kind === "assist_step_result") {
            const stepId = m.content.step_id;
            const canApply = pendingPreviewStepId === stepId;
            const msgPlanId = (m.content as any)?.plan_id as string | undefined;
            const isOldPlan = Boolean(activePlanId && msgPlanId && msgPlanId !== activePlanId);
            return (
              <Box
                key={i}
                mb={1.5}
                p={1.25}
                border="1px solid rgba(0,0,0,0.16)"
                borderRadius={2}
                bgcolor="#fff"
              >
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  assistant • step {stepId} result
                </Typography>

                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                  {m.content.summary || (m.content.ok ? "Preview ready." : "Step failed.")}
                </Typography>

                <Box display="flex" gap={1} mt={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isOldPlan || !canApply}
                    onClick={() => sendAssistAction("apply_preview", stepId)}
                  >
                    Apply to Grid
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isOldPlan || !canApply}
                    onClick={() => {
                      // revert local grid immediately
                      if (setResult && committedRef.current) {
                        setResult(committedRef.current);
                      }
                      previewRef.current = null;
                      setView("applied");
                      setPendingPreviewStepId(null);
                      sendAssistAction("discard_preview", stepId);
                    }}
                  >
                    Discard
                  </Button>
                </Box>
              </Box>
            );
          }

          const isUser = m.role === "user";
          const tone =
            m.kind === "error"
              ? "error"
              : m.kind === "debug"
                ? "info"
                : "default";

          const bubbleBg =
            isUser
              ? "rgba(67, 139, 255, 0.14)"
              : tone === "error"
                ? "rgba(255, 84, 62, 0.10)"
                : tone === "info"
                  ? "rgba(74, 202, 234, 0.12)"
                  : "#fff";

          const bubbleBorder =
            tone === "error"
              ? "1px solid rgba(255, 84, 62, 0.35)"
              : tone === "info"
                ? "1px solid rgba(74, 202, 234, 0.35)"
                : "1px solid rgba(0,0,0,0.10)";

          return (
            <Box key={i} mb={1} display="flex" justifyContent={isUser ? "flex-end" : "flex-start"}>
              <Box sx={{ maxWidth: "85%" }}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {m.role}
                  {m.kind === "debug" ? " • debug" : ""}
                  {m.kind === "error" ? " • error" : ""}
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    px: 1.25,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: bubbleBg,
                    border: bubbleBorder,
                    maxWidth: "100%",
                    overflowX: "auto",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {m.kind === "debug" && isProbablyJsonString(m.content) ? (
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        fontSize: 12,
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      }}
                    >
                      {m.content}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {m.kind === "text" || m.kind === "text_stream" ? renderMarkdownLite(m.content) : m.content}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
        <Box ref={messagesEndRef} />
      </Box>

      <Box sx={footerSx}>
        <Box display="flex" gap={1}>
          <TextField
            size="small"
            fullWidth
            value={input}
            disabled={!connected}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={connected ? "Type and press Enter" : "Connecting…"}
          />
          <Button
            variant="outlined"
            disabled={!connected || !input.trim()}
            onClick={handleSend}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default ConversationBox;
