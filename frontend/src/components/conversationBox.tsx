import React, { useMemo, useRef, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useAgentSocket } from "./useAgentSocket";

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

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendUser(trimmed);
    setInput("");
  };

  const { connected, messages, sendUser, sendDecision } = useAgentSocket({
    wsUrl,
    onImages: (payload) => setResult?.(payload.items as TItem[]),
  });

  const statusText = connected ? "connected" : "disconnected";
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
        <Typography variant="caption" sx={{ opacity: 0.65 }}>
          {messages.length} msg
        </Typography>
      </Box>

      <Box sx={listSx}>
        {messages.map((m, i) => {
          if (m.kind === "plan_draft") {
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
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => sendDecision("approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => sendDecision("reject")}
                  >
                    Reject
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
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {m.content}
                  </Typography>
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
