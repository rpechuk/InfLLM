"use client";
import { useRef, useEffect } from "react";
import { streamChatResponse, createNewChat, pollModelReady, readTextFiles, formatInputWithFiles, simulateModelReply, Message, UploadedFile } from "@/api/chat";
import { FaPlus, FaSpinner, FaFileAlt } from "react-icons/fa";
import FilePill from "./FilePill";
import { useReducer } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

// ChatPane state and actions
interface ChatPaneState {
  messages: Message[];
  input: string;
  isLoading: boolean;
  isModelReady: boolean;
  error: string | null;
  isDragActive: boolean;
  uploadedFiles: UploadedFile[];
  debugMode: boolean;
  isCheckingModel?: boolean;
  isCreatingChat?: boolean;
  isReadingFiles?: boolean;
}

type ChatPaneAction =
  | { type: "SET_INPUT"; input: string }
  | { type: "SET_MESSAGES"; messages: Message[] }
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "UPDATE_LAST_MODEL_MESSAGE"; content: string }
  | { type: "SET_IS_LOADING"; value: boolean }
  | { type: "SET_IS_MODEL_READY"; value: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_IS_DRAG_ACTIVE"; value: boolean }
  | { type: "SET_UPLOADED_FILES"; files: UploadedFile[] }
  | { type: "SET_DEBUG_MODE"; value: boolean }
  | { type: "SET_IS_CHECKING_MODEL"; value: boolean }
  | { type: "SET_IS_CREATING_CHAT"; value: boolean }
  | { type: "SET_IS_READING_FILES"; value: boolean };

function chatPaneReducer(state: ChatPaneState, action: ChatPaneAction): ChatPaneState {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, input: action.input };
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "UPDATE_LAST_MODEL_MESSAGE": {
      const idx = [...state.messages].map((m) => m.role).lastIndexOf("model");
      if (idx === -1) return state;
      const updated = [...state.messages];
      updated[idx] = { ...updated[idx], content: action.content };
      return { ...state, messages: updated };
    }
    case "SET_IS_LOADING":
      return { ...state, isLoading: action.value };
    case "SET_IS_MODEL_READY":
      return { ...state, isModelReady: action.value };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_IS_DRAG_ACTIVE":
      return { ...state, isDragActive: action.value };
    case "SET_UPLOADED_FILES":
      return { ...state, uploadedFiles: action.files };
    case "SET_DEBUG_MODE":
      return { ...state, debugMode: action.value };
    case "SET_IS_CHECKING_MODEL":
      return { ...state, isCheckingModel: action.value };
    case "SET_IS_CREATING_CHAT":
      return { ...state, isCreatingChat: action.value };
    case "SET_IS_READING_FILES":
      return { ...state, isReadingFiles: action.value };
    default:
      return state;
  }
}

function useChatPane() {
  const [state, dispatch] = useReducer(chatPaneReducer, {
    messages: [],
    input: "",
    isLoading: false,
    isModelReady: false,
    error: null,
    isDragActive: false,
    uploadedFiles: [],
    debugMode: false,
    isCheckingModel: false,
    isCreatingChat: false,
    isReadingFiles: false,
  });

  // Helper to set loading state
  function setLoading(value: boolean) {
    dispatch({ type: "SET_IS_LOADING", value });
  }

  // Poll model ready
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    dispatch({ type: "SET_IS_CHECKING_MODEL", value: true });
    setLoading(true);
    cleanup = pollModelReady({
      onReady: () => {
        dispatch({ type: "SET_IS_MODEL_READY", value: true });
        dispatch({ type: "SET_IS_CHECKING_MODEL", value: false });
        setLoading(false);
        dispatch({ type: "SET_ERROR", error: null });
      },
      onError: (err) => {
        dispatch({ type: "SET_IS_MODEL_READY", value: false });
        dispatch({ type: "SET_ERROR", error: "Model is not ready. Please wait..." });
        dispatch({ type: "SET_IS_CHECKING_MODEL", value: true });
        setLoading(true);
      },
      onChecking: () => {
        dispatch({ type: "SET_IS_CHECKING_MODEL", value: true });
        setLoading(true);
      },
      debugMode: state.debugMode,
    });
    return cleanup;
  }, [state.debugMode]);

  // Message sending
  async function sendMessage() {
    if (!state.input.trim() || state.isLoading || state.isCheckingModel || state.isCreatingChat || !state.isModelReady) return;
    dispatch({ type: "SET_ERROR", error: null });
    const filesToSend = [...state.uploadedFiles];
    dispatch({ type: "ADD_MESSAGE", message: { role: "user", content: state.input, files: filesToSend.map(f => ({ name: f.name })) } });
    dispatch({ type: "SET_INPUT", input: "" });
    dispatch({ type: "SET_UPLOADED_FILES", files: [] });
    dispatch({ type: "ADD_MESSAGE", message: { role: "model", content: "" } });
    setLoading(true);
    if (state.debugMode) {
      simulateModelReply(state.input, (reply) => {
        dispatch({ type: "UPDATE_LAST_MODEL_MESSAGE", content: reply });
        setLoading(false);
      });
      return;
    }
    let modelReply = "";
    try {
      await streamChatResponse(formatInputWithFiles(state.input, filesToSend), (token) => {
        modelReply += token;
        dispatch({ type: "UPDATE_LAST_MODEL_MESSAGE", content: modelReply });
      });
    } catch (err) {
      dispatch({ type: "ADD_MESSAGE", message: { role: "model", content: `[Error: ${err}]` } });
    } finally {
      setLoading(false);
    }
  }

  // New chat
  async function handleNewChat() {
    dispatch({ type: "SET_IS_CREATING_CHAT", value: true });
    setLoading(true);
    dispatch({ type: "SET_ERROR", error: null });
    try {
      await createNewChat();
      dispatch({ type: "SET_MESSAGES", messages: [] });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: "Failed to create new chat. Please try again." });
    } finally {
      dispatch({ type: "SET_IS_CREATING_CHAT", value: false });
      setLoading(false);
    }
  }

  // Drag and drop handlers
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "SET_IS_DRAG_ACTIVE", value: true });
  }
  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "SET_IS_DRAG_ACTIVE", value: false });
  }
  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "SET_IS_DRAG_ACTIVE", value: false });
    dispatch({ type: "SET_IS_READING_FILES", value: true });
    setLoading(true);
    try {
      const files = Array.from(e.dataTransfer.files);
      const results = await readTextFiles(files);
      dispatch({ type: "SET_UPLOADED_FILES", files: [...state.uploadedFiles, ...results] });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: "Failed to read one or more files." });
    } finally {
      dispatch({ type: "SET_IS_READING_FILES", value: false });
      setLoading(false);
    }
  }

  return {
    state,
    dispatch,
    sendMessage,
    handleNewChat,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}

export default function ChatPane({ onChatFinished }: { onChatFinished?: () => void } = {}) {
  const {
    state,
    dispatch,
    sendMessage: origSendMessage,
    handleNewChat: origHandleNewChat,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useChatPane();
  const handleNewChat = async () => {
    await origHandleNewChat();
    if (onChatFinished) onChatFinished();
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Wrap sendMessage to call onChatFinished after model reply is done
  const sendMessage = async () => {
    if (!state.input.trim() || state.isLoading || state.isCheckingModel || state.isCreatingChat || !state.isModelReady) return;
    await origSendMessage();
    if (onChatFinished) onChatFinished();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isLoading]);

  return (
    <div
      className="flex h-full w-full flex-1 flex-col bg-gray-950 rounded-lg shadow-lg border border-gray-800 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {state.isDragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg pointer-events-none select-none">
          <FaFileAlt className="text-5xl text-blue-300 mb-4 drop-shadow-lg" />
          <span className="text-2xl font-bold text-white">Drop your file here to add it as context</span>
          {state.isReadingFiles && (
            <span className="mt-4 flex items-center text-lg text-blue-200"><FaSpinner className="mr-2 animate-spin" /> Reading file(s)...</span>
          )}
        </div>
      )}
      {/* File pills above prompt */}
      {state.uploadedFiles.length > 0 && (
        <div className="absolute left-0 right-0 bottom-28 flex flex-wrap items-center px-8 z-30 pointer-events-none select-none">
          {state.uploadedFiles.map((file, idx) => (
            <span key={file.name + idx} className="pointer-events-auto select-auto">
              <FilePill
                name={file.name}
                onRemove={() => dispatch({ type: "SET_UPLOADED_FILES", files: state.uploadedFiles.filter((_, i) => i !== idx) })}
                inline={false}
              />
            </span>
          ))}
        </div>
      )}
      {/* New Chat button and Debug toggle */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-8 py-4 rounded-t-lg">
        <button
          className={`flex items-center gap-2 rounded bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors${(state.isLoading || state.isCheckingModel || state.isCreatingChat || !state.isModelReady) ? ' cursor-not-allowed' : ' cursor-pointer'}`}
          onClick={handleNewChat}
          disabled={state.isLoading || state.isCheckingModel || state.isCreatingChat || !state.isModelReady}
        >
          {state.isCreatingChat ? (
            <span className="flex items-center">
              <FaSpinner className="mr-2 animate-spin" />
              Creating...
            </span>
          ) : (
            <span className="flex items-center"><FaPlus className="mr-2" /> New Chat</span>
          )}
        </button>
        <div className="flex items-center ml-4">
          <label className="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={state.debugMode}
              onChange={() => dispatch({ type: "SET_DEBUG_MODE", value: !state.debugMode })}
              className="form-checkbox h-4 w-4 text-blue-600 rounded mr-2"
            />
            <span className="text-sm text-blue-300 font-mono">Debug Mode</span>
          </label>
        </div>
      </div>
      {state.debugMode && (
        <div className="bg-blue-900 text-blue-200 px-8 py-2 text-sm text-center font-mono">
          Debug mode is <b>ON</b>. Messages will not be sent to a real model.
        </div>
      )}
      {/* Error message */}
      {state.error && (
        <div className="bg-red-800 text-red-200 px-8 py-2 text-sm">
          {state.error}
        </div>
      )}
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-gray-900 shadow-inner px-8 py-6">
        {state.messages.map((msg, i) => (
          <div key={i} className="mb-6">
            <span
              className={`mb-1 block font-mono font-bold ${msg.role === "user" ? "text-blue-400" : "text-green-400"}`}
            >
              {msg.role === "user" ? (
                <span className="flex items-center">
                  You:
                  {msg.files && msg.files.length > 0 && (
                    <span className="flex flex-wrap ml-2">
                      {msg.files.map((file, idx) => (
                        <FilePill key={file.name + idx} name={file.name} inline />
                      ))}
                    </span>
                  )}
                </span>
              ) : (
                "Model:"
              )}
            </span>
            {msg.role === "model" ? (
              <MarkdownRenderer>{msg.content}</MarkdownRenderer>
            ) : (
              <span className="block font-mono text-base whitespace-pre-line text-blue-200">
                {msg.content}
              </span>
            )}
          </div>
        ))}
        {!state.debugMode && state.isCheckingModel && (
          <span className="ml-4 flex items-center justify-center text-2xl text-gray-400 w-full h-full">
            <FaSpinner className="mr-2 animate-spin" />
            Waiting for model to load...
          </span>
        )}
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
          className={`h-full flex-1 resize-none rounded border border-gray-800 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none${(state.isLoading || state.isCheckingModel || state.isCreatingChat || !state.isModelReady) ? ' cursor-not-allowed' : ' cursor-text'}`}
          placeholder="Prompt..."
          value={state.input}
          onChange={(e) => dispatch({ type: "SET_INPUT", input: e.target.value })}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={state.isLoading || state.isCheckingModel || state.isCreatingChat || !state.isModelReady}
        />
        <button
          type="submit"
          className={`flex h-full min-w-[100px] items-center justify-center rounded bg-blue-500 px-4 py-2 font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-50${(state.isLoading || state.isCheckingModel || state.isCreatingChat || !state.isModelReady) ? ' cursor-not-allowed' : ' cursor-pointer'}`}
          disabled={state.isLoading || state.isCheckingModel || state.isCreatingChat || !state.isModelReady}
        >
          <span className="flex items-center justify-center w-full">
            {state.isLoading && <FaSpinner className="mr-2 animate-spin" />}
            Send
          </span>
        </button>
      </form>
    </div>
  );
}
