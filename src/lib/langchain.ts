import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder 
} from "@langchain/core/prompts";
import { 
  RunnableWithMessageHistory 
} from "@langchain/core/runnables";
import { 
  InMemoryChatMessageHistory 
} from "@langchain/core/chat_history";

// Initialize the model
const model = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  maxOutputTokens: 2048,
  apiKey: process.env.GEMINI_API_KEY,
});

// Define the prompt template
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful and intelligent AI assistant named Gemini Agent. You have access to the conversation history and can remember previous interactions. Provide clear, concise, and accurate responses."],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

// Chain setup
const chain = prompt.pipe(model);

// In-memory storage for session histories
const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

export const getChainWithHistory = () => {
  return new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: async (sessionId: string) => {
      if (messageHistories[sessionId] === undefined) {
        messageHistories[sessionId] = new InMemoryChatMessageHistory();
      }
      return messageHistories[sessionId];
    },
    inputMessagesKey: "input",
    historyMessagesKey: "history",
  });
};

/**
 * Long-term memory simulation:
 * We can persist the messageHistories to localStorage on the client side.
 */
export const saveHistoryToLocalStorage = (sessionId: string) => {
  const history = messageHistories[sessionId];
  if (history) {
    history.getMessages().then(messages => {
      // Convert messages to a serializable format
      const serializable = messages.map(m => ({
        type: m._getType(),
        content: m.content
      }));
      localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(serializable));
    });
  }
};

export const loadHistoryFromLocalStorage = async (sessionId: string) => {
  const saved = localStorage.getItem(`chat_history_${sessionId}`);
  if (saved) {
    const messages = JSON.parse(saved);
    const history = new InMemoryChatMessageHistory();
    for (const msg of messages) {
      if (msg.type === "human") {
        await history.addUserMessage(msg.content);
      } else if (msg.type === "ai") {
        await history.addAIMessage(msg.content);
      }
    }
    messageHistories[sessionId] = history;
    return history;
  }
  return null;
};

