'use client';
import { useState, useRef, useEffect } from "react";
import { streamChatResponse } from "@/api/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // API stub for sending a message
  async function sendMessage() {
    if (!input.trim() || isGenerating) return;
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    const userInput = input;
    setInput("");
    let modelReply = "";
    setMessages((msgs) => [
      ...msgs,
      { role: "model", content: "" },
    ]);
    setIsGenerating(true);
    try {
      await streamChatResponse(userInput, (token) => {
        modelReply += token;
        console.debug("[ChatPane] modelReply so far:", JSON.stringify(modelReply));
        setMessages((msgs) => {
          const updated = [...msgs];
          // Find the last model message (should be the last one)
          const idx = updated.map(m => m.role).lastIndexOf("model");
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
    code({inline, className, children, ...props}: React.ComponentProps<'code'> & {inline?: boolean}) {
      return inline ? (
        <code className="bg-gray-800 rounded px-1 py-0.5" {...props}>{children}</code>
      ) : (
        <pre className="bg-gray-800 rounded p-2 overflow-x-auto my-2"><code className={className}>{children}</code></pre>
      );
    },
    p({children, ...props}: any) {
      if (
        Array.isArray(children) &&
        children.length === 1 &&
        (children[0] as any)?.type === 'pre'
      ) {
        return <>{children}</>;
      }
      return <p className="mb-2" {...props}>{children}</p>;
    },
    a({...props}: any) {
      return <a className="text-blue-400 underline" target="_blank" rel="noopener noreferrer" {...props} />;
    },
    table({...props}: any) {
      return <table className="border border-gray-700 my-2" {...props} />;
    },
    th({...props}: any) {
      return <th className="border border-gray-700 px-2 py-1 bg-gray-700" {...props} />;
    },
    td({...props}: any) {
      return <td className="border border-gray-700 px-2 py-1" {...props} />;
    },
    li({...props}: any) {
      return <li className="ml-4 list-disc" {...props} />;
    },
    ul({...props}: any) {
      return <ul className="list-disc ml-6 mb-2" {...props} />;
    },
    ol({...props}: any) {
      return <ol className="list-decimal ml-6 mb-2" {...props} />;
    },
    hr() {
      return <hr className="border-t border-gray-700 my-4" />;
    },
  };

  return (
    <div className="h-full w-full flex flex-col flex-1">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-gray-900 border border-gray-700 rounded-t-lg shadow-inner">
        <div className="p-6">
          {messages.map((msg, i) => (
            <div key={i} className="mb-4">
              <span className={`block font-bold mb-1 font-mono ${msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}`}>{msg.role === 'user' ? 'You:' : 'Model:'}</span>
              {msg.role === "model" ? (
                <div className="font-mono text-base text-green-200 whitespace-pre-wrap">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <span className="block whitespace-pre-line font-mono text-base text-blue-200">{msg.content}</span>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Prompt input */}
      <form
        className="flex items-end gap-2 border-t border-gray-700 bg-gray-900 px-4 py-3 h-24"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <textarea
          ref={textareaRef}
          className="flex-1 rounded border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-full"
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
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-bold h-full flex items-center justify-center min-w-[100px]"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Generating...
            </>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
} 