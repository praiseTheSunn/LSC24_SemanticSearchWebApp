import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useAgentSocket } from "./useAgentSocket";
import type { ImageItem } from "../types/agent";

interface ConversationBoxProps {
  setResult?: (items: ImageItem[]) => void;
  wsUrl?: string;
  className?: string;
}

const ConversationBox: React.FC<ConversationBoxProps> = ({
  setResult,
  wsUrl,
  className,
}) => {
  const [input, setInput] = useState("");

  const { connected, messages, sendUser, sendDecision } = useAgentSocket({
    wsUrl,
    onImages: (payload) => setResult?.(payload.items),
  });

  return (
    <Box className={className} display="flex" flexDirection="column" width="100%" height="100%">
      <Typography variant="caption" sx={{ opacity: 0.7, mb: 1 }}>
        {connected ? "connected" : "disconnected"}
      </Typography>

      <Box flex={1} overflow="auto" border="1px solid rgba(0,0,0,0.2)" borderRadius="8px" p={1.5}>
        {messages.map((m, i) => {
          if (m.kind === "plan_draft") {
            return (
              <Box key={i} mb={1.5} p={1.25} border="1px solid rgba(0,0,0,0.2)" borderRadius="8px">
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  assistant • plan draft
                </Typography>

                <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: 12, m: 0, mt: 1 }}>
                  {JSON.stringify(m.content, null, 2)}
                </Box>

                <Box display="flex" gap={1} mt={1}>
                  <Button size="small" variant="outlined" onClick={() => sendDecision("approve")}>
                    Approve
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => sendDecision("reject")}>
                    Reject
                  </Button>
                </Box>
              </Box>
            );
          }

          return (
            <Box key={i} mb={1}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {m.role}
                {m.kind === "debug" ? " • debug" : ""}
                {m.kind === "error" ? " • error" : ""}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {m.content}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box mt={1.5} display="flex" gap={1}>
        <TextField
          size="small"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendUser(input);
              setInput("");
            }
          }}
          placeholder="Type and press Enter"
        />
        <Button
          variant="outlined"
          onClick={() => {
            sendUser(input);
            setInput("");
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ConversationBox;
