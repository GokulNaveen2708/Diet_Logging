"use client";

// Reusable chat interface shared by user and trainer views.

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { getMessages, sendMessage } from "@/lib/apiClient";

type ChatWindowProps = {
  userId: string;
  trainerId: string;
  senderType: "user" | "trainer";
};

export default function ChatWindow({
  userId,
  trainerId,
  senderType,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getMessages(userId, trainerId);
        console.log("messages from backend:", res);
        setMessages(res.messages || []);

      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, trainerId]);

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;

    const msg = input.trim();
    setInput("");

    await sendMessage({
  userId,
  trainerId,
  senderRole: senderType,  
  message: msg,
});


    // refresh messages
    const res = await getMessages(userId, trainerId);
    setMessages(res.messages || []);
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        height: "75vh",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "#111827",
      }}
    >
      {/* Messages Area */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
        }}
      >
        {messages.map((msg, idx) => {
  // Backend fields
  const senderRole = msg.senderRole ?? msg.sender;
  const text = msg.content ?? msg.message ?? "";
  const ts =
    msg.timestamp ?? msg.createdAt ?? msg.sentAt ?? new Date().toISOString();

  const isMe = senderRole === senderType;

  return (
    <Box
      key={idx}
      sx={{
        display: "flex",
        flexDirection: isMe ? "row-reverse" : "row",
        alignItems: "flex-start",
        mb: 2,
      }}
    >
      <Avatar
        sx={{
          bgcolor: isMe ? "emerald.main" : "grey.700",
          width: 32,
          height: 32,
          fontSize: "0.8rem",
        }}
      >
        {isMe ? "Me" : senderRole === "user" ? "U" : "T"}
      </Avatar>

      <Box
        sx={{
          maxWidth: "70%",
          bgcolor: isMe ? "#10b981" : "#1f2937",
          color: isMe ? "black" : "white",
          px: 2,
          py: 1,
          borderRadius: 2,
          mx: 1,
        }}
      >
        <Typography variant="body2">{text}</Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", opacity: 0.7, mt: 0.5 }}
        >
          {new Date(ts).toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
})}

      </Box>

      {/* Input Area */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          borderTop: "1px solid #334155",
          bgcolor: "#0f172a",
        }}
      >
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          sx={{
            mr: 1,
            input: { color: "white" },
          }}
        />

        <IconButton onClick={handleSend} color="primary">
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
