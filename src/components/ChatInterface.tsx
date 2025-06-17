import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import { VoiceInput } from "./VoiceInput";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  audio?: string;
}

// Module-level variable to track the currently playing audio
let currentAudio: HTMLAudioElement | null = null;

export const ChatInterface = () => {
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem("biology-chat-messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      } catch (e) {}
    }
    return [
      {
        id: "1",
        text: "Hello! I'm your Biology Research Assistant. I can help you with questions about molecular biology, genetics, ecology, anatomy, and more. What would you like to know?",
        sender: "bot",
        timestamp: new Date(),
      },
    ];
  });

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState("http://localhost:8000");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem("biology-chat-messages", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          conversation_id: "biology-chat",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from API");
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || "I'm sorry, I couldn't process your request at the moment.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm currently unable to connect to the backend service. Please ensure your FastAPI server is running on the configured URL. In the meantime, I'd be happy to help you with biology questions once the connection is restored!",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast("Connection Error", {
        description: "Unable to connect to the biology assistant backend. Please check if your FastAPI server is running.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Voice handler: add user question and bot answer (with audio) to chat
  const handleVoiceResponse = (question: string, answer: string, audio: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + "-user",
        text: question,
        sender: "user",
        timestamp: new Date(),
      },
      {
        id: Date.now() + "-bot",
        text: answer,
        sender: "bot",
        timestamp: new Date(),
        audio,
      }
    ]);
    // Optionally auto-play the audio, using the single-audio logic
    if (audio) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      currentAudio = new Audio(`data:audio/mp3;base64,${audio}`);
      currentAudio.play();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
      {/* Chat Messages */}
      <div className="max-h-[70vh] min-h-[24rem] overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            } animate-fade-in`}
          >
            <div
              className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === "user"
                    ? "bg-blue-600"
                    : "bg-gradient-to-r from-green-500 to-blue-500"
                }`}
              >
                {message.sender === "user" ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white text-right"
                    : "bg-gray-100 text-gray-900 text-left"
                }`}
              >
                {message.sender === "bot" ? (
                  <div className="text-sm text-left">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                    {/* Audio playback button for bot responses with audio */}
                    {message.audio && (
                      <button
                        className="mt-2 text-xs text-blue-600 hover:underline"
                        onClick={() => {
                          if (currentAudio) {
                            currentAudio.pause();
                            currentAudio.currentTime = 0;
                          }
                          currentAudio = new Audio(`data:audio/mp3;base64,${message.audio}`);
                          currentAudio.play();
                        }}
                      >
                        ▶️ Play Response
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-left">{message.text}</p>
                )}
                <p className="text-xs mt-1 opacity-70 text-left">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <VoiceInput onVoiceResponse={handleVoiceResponse} />
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about biology..."
            className="font-montserrat flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 text-left"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
