"use client";
import { useState, useRef, useEffect } from "react";
import { streamChatResponse, createNewChat, checkModelReady } from "@/api/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaPlus, FaSpinner } from "react-icons/fa";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function ChatPane() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [isCheckingModel, setIsCheckingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let stopped = false;
    const poll = async () => {
      setIsCheckingModel(true);
      try {
        await checkModelReady();
        setIsModelReady(true);
        setError(null);
        setIsCheckingModel(false);
        stopped = true;
        if (interval) clearInterval(interval);
      } catch (err) {
        setIsModelReady(false);
        setError("Model is not ready. Please wait...");
        setIsCheckingModel(true);
      }
    };
    poll();
    interval = setInterval(() => {
      if (!stopped) poll();
    }, 2000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  async function handleNewChat() {
    setIsCreatingChat(true);
    setError(null);
    try {
      await createNewChat();
      setMessages([]);
    } catch (err) {
      setError("Failed to create new chat. Please try again.");
    } finally {
      setIsCreatingChat(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || isGenerating || isCreatingChat || !isModelReady) return;
    setError(null);
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    const userInput = input;
    setInput("");
    let modelReply = "";
    setMessages((msgs) => [...msgs, { role: "model", content: "" }]);
    setIsGenerating(true);
    try {
      await streamChatResponse(userInput, (token) => {
        modelReply += token;
        setMessages((msgs) => {
          const updated = [...msgs];
          // Find the last model message (should be the last one)
          const idx = updated.map((m) => m.role).lastIndexOf("model");
          if (idx !== -1) updated[idx] = { role: "model", content: modelReply };
          return updated;
        });
      });
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: "model", content: `[Error: ${err}]` },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }

  const markdownComponents = {
    code({
      inline,
      className,
      children,
      ...props
    }: React.ComponentProps<"code"> & { inline?: boolean }) {
      return inline ? (
        <code className="rounded bg-gray-800 px-1 py-0.5" {...props}>
          {children}
        </code>
      ) : (
        <pre className="my-2 overflow-x-auto rounded bg-gray-800 p-2">
          <code className={className}>{children}</code>
        </pre>
      );
    },
    p({ children, ...props }: any) {
      if (
        Array.isArray(children) &&
        children.length === 1 &&
        (children[0] as any)?.type === "pre"
      ) {
        return <>{children}</>;
      }
      return (
        <p className="mb-2" {...props}>
          {children}
        </p>
      );
    },
    a({ ...props }: any) {
      return (
        <a
          className="text-blue-400 underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      );
    },
    table({ ...props }: any) {
      return <table className="my-2 border border-gray-700" {...props} />;
    },
    th({ ...props }: any) {
      return (
        <th
          className="border border-gray-700 bg-gray-700 px-2 py-1"
          {...props}
        />
      );
    },
    td({ ...props }: any) {
      return <td className="border border-gray-700 px-2 py-1" {...props} />;
    },
    li({ ...props }: any) {
      return <li className="ml-4 list-disc" {...props} />;
    },
    ul({ ...props }: any) {
      return <ul className="mb-2 ml-6 list-disc" {...props} />;
    },
    ol({ ...props }: any) {
      return <ol className="mb-2 ml-6 list-decimal" {...props} />;
    },
    hr() {
      return <hr className="my-4 border-t border-gray-700" />;
    },
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col bg-gray-950 rounded-lg shadow-lg border border-gray-800">
      {/* New Chat button */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-8 py-4 rounded-t-lg">
        <button
          className={`flex items-center gap-2 rounded bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors${(isGenerating || isCheckingModel || isCreatingChat || !isModelReady) ? ' cursor-not-allowed' : ' cursor-pointer'}`}
          onClick={handleNewChat}
          disabled={isGenerating || isCheckingModel || isCreatingChat || !isModelReady}
        >
          {isCreatingChat ? (
            <span className="flex items-center">
              <FaSpinner className="mr-2 animate-spin" />
              Creating...
            </span>
          ) : (
            <span className="flex items-center"><FaPlus className="mr-2" /> New Chat</span>
          )}
        </button>
        {isCheckingModel && (
          <span className="ml-4 flex items-center text-sm text-gray-400">
            <FaSpinner className="mr-2 animate-spin" />
            Checking model...
          </span>
        )}
      </div>
      {/* Error message */}
      {error && (
        <div className="bg-red-800 text-red-200 px-8 py-2 text-sm rounded-b-none rounded-t-none">
          {error}
        </div>
      )}
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto border-x border-gray-800 bg-gray-900 shadow-inner px-8 py-6 rounded-b-lg">
        {messages.map((msg, i) => (
          <div key={i} className="mb-6">
            <span
              className={`mb-1 block font-mono font-bold ${msg.role === "user" ? "text-blue-400" : "text-green-400"}`}
            >
              {msg.role === "user" ? "You:" : "Model:"}
            </span>
            {msg.role === "model" ? (
              <div className="font-mono text-base whitespace-pre-wrap text-green-200">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            ) : (
              <span className="block font-mono text-base whitespace-pre-line text-blue-200">
                {msg.content}
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Prompt input */}
      <form
        className="flex h-24 items-end gap-3 border-t border-gray-800 bg-gray-900 px-8 py-4 rounded-b-lg"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <textarea
          ref={textareaRef}
          className={`h-full flex-1 resize-none rounded border border-gray-800 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none${(isGenerating || isCheckingModel || isCreatingChat || !isModelReady) ? ' cursor-not-allowed' : ' cursor-text'}`}
          placeholder="Prompt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={isGenerating || isCheckingModel || isCreatingChat || !isModelReady}
        />
        <button
          type="submit"
          className={`flex h-full min-w-[100px] items-center justify-center rounded bg-blue-500 px-4 py-2 font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-50${(isGenerating || isCheckingModel || isCreatingChat || !isModelReady) ? ' cursor-not-allowed' : ' cursor-pointer'}`}
          disabled={isGenerating || isCheckingModel || isCreatingChat || !isModelReady}
        >
          <span className="flex items-center justify-center w-full">
            {isGenerating && <FaSpinner className="mr-2 animate-spin" />}
            Send
          </span>
        </button>
      </form>
    </div>
  );
}
