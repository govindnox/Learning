import React from "react";
import { motion } from "motion/react";
import { User, Bot } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 p-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-2 text-sm shadow-sm",
          isUser
            ? "bg-blue-600 text-white rounded-tr-none"
            : "bg-white text-gray-800 border rounded-tl-none"
        )}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
      </div>
    </motion.div>
  );
};
