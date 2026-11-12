import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

export default function AIAssistant() {
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const bottomRef = useRef(null);

  const welcomeMessage = {
    role: "assistant",
    content:
      "Hey! 👋 I'm your TripSync travel assistant. Where would you like to travel? I can help you plan destinations, budgets and itineraries!"
  };

  // Load previous messages from Firebase
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoadingHistory(false);
      return;
    }

    const messagesRef = collection(
      db,
      "users",
      currentUser.uid,
      "aiMessages"
    );

    const messagesQuery = query(
      messagesRef,
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const savedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setMessages(
          savedMessages.length > 0
            ? savedMessages
            : [welcomeMessage]
        );

        setLoadingHistory(false);
      },
      (error) => {
        console.error("Firebase history error:", error);
        setLoadingHistory(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, loading]);

  // Send message to AI
  async function handleSend(e) {
    let currentStep = "Starting AI request";
    e.preventDefault();

    const text = input.trim();

    if (!text || loading || !currentUser?.uid) return;

    const userMessage = {
      role: "user",
      content: text
    };

    const previousMessages = messages
  .filter(
    (message) =>
      message.role === "user" ||
      message.role === "assistant"
  )
  .slice(-6);
    console.log("Previous messages:", previousMessages.length);

    setInput("");
    setLoading(true);

    try {
        let currentStep = "Starting AI request";
      const messagesRef = collection(
        db,
        "users",
        currentUser.uid,
        "aiMessages"
      );

// Save user message
currentStep = "Saving user message";

await addDoc(messagesRef, {
        ...userMessage,
        createdAt: serverTimestamp()
      });

      currentStep = "Getting AI response from backend";
      // Send conversation to Groq through backend
    console.log(
  "Messages being sent:",
  [...previousMessages, userMessage].slice(-7).length
);
      const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
         body: JSON.stringify({
  messages: [
    ...previousMessages,
    userMessage
  ].slice(-20)
})
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to get AI response."
        );
      }

      // Save AI response
currentStep = "Saving AI response";

await addDoc(messagesRef, {
        role: "assistant",
        content: data.reply,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error("AI chat failed at:", currentStep);
console.error("Full error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (loadingHistory) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Loading your previous conversations...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

        {messages.map((message, index) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id || index}
              className={`flex gap-3 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  ✨
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-slate-800 rounded-bl-sm"
                }`}
              >
                <div className="text-sm break-words leading-7">
  <ReactMarkdown
    components={{
      h1: ({ children }) => (
        <h1 className="text-xl font-bold mt-4 mb-3">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-lg font-bold mt-4 mb-2">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="font-bold mt-3 mb-2">
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className="mb-3">{children}</p>
      ),
      ul: ({ children }) => (
        <ul className="list-disc pl-5 mb-3 space-y-1">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal pl-5 mb-3 space-y-1">
          {children}
        </ol>
      ),
      strong: ({ children }) => (
        <strong className="font-bold">
          {children}
        </strong>
      ),
      hr: () => <hr className="my-4 border-slate-200" />
    }}
  >
    {message.content}
  </ReactMarkdown>
</div>
              </div>

              {isUser && (
                <div className="w-9 h-9 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center shrink-0">
                  You
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">
              ✨
            </div>

            <div className="bg-white rounded-2xl px-4 py-3 text-sm text-slate-500 shadow-sm">
              TripSync is thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSend}
        className="border-t bg-white p-4 sm:p-5"
      >
        <div className="max-w-4xl mx-auto flex items-end gap-3">

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Ask anything about your trip..."
            rows={1}
            maxLength={4000}
            className="flex-1 resize-none border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading || !currentUser?.uid}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>

        </div>

        <p className="text-xs text-center text-slate-400 mt-2">
          TripSync AI can make mistakes. Verify important travel details.
        </p>
      </form>
    </div>
  );
}
