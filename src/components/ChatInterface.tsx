import React, { useState, useRef, useEffect } from "react";
import { Send, Trash2, Bot } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ChatMessage } from "./ChatMessage";
import { getChainWithHistory, saveHistoryToLocalStorage, loadHistoryFromLocalStorage } from "@/src/lib/langchain";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem("current_session_id");
    if (saved) return saved;
    const newId = uuidv4();
    localStorage.setItem("current_session_id", newId);
    return newId;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    const init = async () => {
      const history = await loadHistoryFromLocalStorage(sessionId);
      if (history) {
        const msgs = await history.getMessages();
        setMessages(
          msgs.map((m, i) => ({
            id: `msg-${i}`,
            role: m.type === "human" ? "user" : "assistant",
            content: m.content as string,
          }))
        );
      }
    };
    init();
  }, [sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chain = getChainWithHistory();
      const response = await chain.invoke(
        { input: userMessage.content },
        { configurable: { sessionId } }
      );

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: response.content as string,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      saveHistoryToLocalStorage(sessionId);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    localStorage.removeItem(`chat_history_${sessionId}`);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-bottom shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="text-white" size={20} />
          </div>
          <h1 className="font-semibold text-gray-800">Gemini Agent</h1>
        </div>
        <button
          onClick={clearChat}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Clear Chat"
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-full">
                <Bot size={48} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-800">Welcome to Gemini Agent</h2>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">
                  I'm your AI assistant powered by LangChain and Gemini. How can I help you today?
                </p>
              </div>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                <Bot size={18} />
              </div>
              <div className="flex items-center gap-1 px-4 py-2 bg-white border rounded-2xl rounded-tl-none shadow-sm">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <form 
          onSubmit={handleSend}
          className="max-w-3xl mx-auto relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-md"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Powered by Gemini 3 Flash & LangChain
        </p>
      </div>
    </div>
  );
};
