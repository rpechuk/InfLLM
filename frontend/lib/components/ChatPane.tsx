"use client";
import { useRef, useEffect, useState } from "react";
import { streamChatResponse, createNewChat, pollModelReady, readTextFiles, formatInputWithFiles, extractBlockIds, simulateModelReply, getUsedBlocks, Message, UploadedFile } from "@/api/chat";
import { FaPlus, FaSpinner, FaFileAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FaFloppyDisk } from "react-icons/fa6";
import FilePill from "./FilePill";
import { useReducer } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

// File content storage utilities
const FILE_CONTENT_STORAGE_KEY = "chatFileContents";

function storeFileContent(fileName: string, content: string): void {
  try {
    const stored = localStorage.getItem(FILE_CONTENT_STORAGE_KEY);
    const fileContents = stored ? JSON.parse(stored) : {};
    fileContents[fileName] = content;
    localStorage.setItem(FILE_CONTENT_STORAGE_KEY, JSON.stringify(fileContents));
  } catch (error) {
    console.warn("Failed to store file content:", error);
  }
}

function getFileContent(fileName: string): string | undefined {
  try {
    const stored = localStorage.getItem(FILE_CONTENT_STORAGE_KEY);
    if (!stored) return undefined;
    const fileContents = JSON.parse(stored);
    return fileContents[fileName];
  } catch (error) {
    console.warn("Failed to retrieve file content:", error);
    return undefined;
  }
}

function clearOldFileContents(): void {
  try {
    // Clear file contents older than 24 hours to prevent localStorage bloat
    const stored = localStorage.getItem(FILE_CONTENT_STORAGE_KEY);
    if (stored) {
      // For now, just clear all - in production you might want timestamp-based cleanup
      localStorage.removeItem(FILE_CONTENT_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Failed to clear old file contents:", error);
  }
}

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
  | { type: "UPDATE_LAST_MODEL_USED_BLOCKS"; usedBlocks: Array<[number, number]> }
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
    case "UPDATE_LAST_MODEL_USED_BLOCKS": {
      console.log("UPDATE_LAST_MODEL_USED_BLOCKS action received with:", action.usedBlocks);
      const idx = [...state.messages].map((m) => m.role).lastIndexOf("model");
      console.log("Last model message index:", idx);
      if (idx === -1) {
        console.log("No model message found to update");
        return state;
      }
      const updated = [...state.messages];
      updated[idx] = { ...updated[idx], usedBlocks: action.usedBlocks };
      console.log("Updated message:", updated[idx]);
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
    
    // Store file contents in localStorage for later retrieval by inline pills
    filesToSend.forEach(file => {
      storeFileContent(file.name, file.content);
      if (file.isBlock) {
        // Store block flag and ID separately
        localStorage.setItem(`${file.name}_isBlock`, 'true');
        if (file.blockId) {
          localStorage.setItem(`${file.name}_blockId`, JSON.stringify(file.blockId));
        }
      }
    });
    
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
      // Extract block IDs and send them as forced blocks
      const forcedBlocks = extractBlockIds(filesToSend);
      await streamChatResponse(formatInputWithFiles(state.input, filesToSend), forcedBlocks, (token) => {
        modelReply += token;
        dispatch({ type: "UPDATE_LAST_MODEL_MESSAGE", content: modelReply });
      });
      
      setTimeout(async () => {
        try {
          console.log("Fetching used blocks...");
          const usedBlocks = await getUsedBlocks();
          console.log("Fetched used blocks:", usedBlocks);
          console.log("Type of usedBlocks:", typeof usedBlocks);
          console.log("Is array:", Array.isArray(usedBlocks));
          
          if (usedBlocks && Array.isArray(usedBlocks) && usedBlocks.length > 0) {
            console.log("Updating message with used blocks");
            // Update the last model message with used blocks
            dispatch({ type: "UPDATE_LAST_MODEL_USED_BLOCKS", usedBlocks });
          } else {
            console.log("No used blocks returned from server or invalid format");
          }
        } catch (err) {
          console.error("Failed to fetch used blocks:", err);
        }
      }, 10);
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
      // Clear old file contents when starting new chat
      clearOldFileContents();
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
    
    // Check if this is block data from the context manager
    const dragData = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text") || e.dataTransfer.getData("Text");
    
    if (dragData && dragData.startsWith("BLOCK:")) {
      try {
        // Parse the simple string format: "BLOCK:layer:block"
        const parts = dragData.split(":");
        if (parts.length === 3) {
          const layer = parseInt(parts[1]);
          const block = parseInt(parts[2]);
          
          // This is a block drop - fetch the content and create a "file"
          dispatch({ type: "SET_IS_READING_FILES", value: true });
          setLoading(true);
          
          try {
            // Import the getBlockContent function
            const { getBlockContent } = await import("@/api/context");
            const blockContentResponse = await getBlockContent(layer, block);
            
            const blockFile: UploadedFile = {
              name: `Block ${block + 1}`,
              content: blockContentResponse.content,
              isBlock: true,
              blockId: { layer, block }
            };
            dispatch({ type: "SET_UPLOADED_FILES", files: [...state.uploadedFiles, blockFile] });
          } catch (error) {
            console.error("Failed to fetch block content:", error);
            // Fallback with basic info
            const blockFile: UploadedFile = {
              name: `Block ${block + 1}`,
              content: `Block ${block + 1} from Layer ${layer + 1}`,
              isBlock: true,
              blockId: { layer, block }
            };
            dispatch({ type: "SET_UPLOADED_FILES", files: [...state.uploadedFiles, blockFile] });
          } finally {
            dispatch({ type: "SET_IS_READING_FILES", value: false });
            setLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn("Failed to parse block data:", err);
      }
    }
    
    // Handle regular file drops
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

// Component for displaying used blocks with layer selection
function UsedBlocksDisplay({ usedBlocks }: { usedBlocks: Array<[number, number]> }) {
  const [selectedLayer, setSelectedLayer] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Group blocks by layer
  const blocksByLayer = usedBlocks.reduce((acc, [layer, block]) => {
    if (!acc[layer]) acc[layer] = [];
    acc[layer].push(block + 1);
    return acc;
  }, {} as Record<number, number[]>);

  // sort all of the blocks in each layer by block id
  for (const layer in blocksByLayer) {
    blocksByLayer[layer].sort((a, b) => a - b);
  }
  
  const layers = Object.keys(blocksByLayer).map(Number).sort((a, b) => a - b);
  const totalBlocks = usedBlocks.length;
  
  return (
    <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <FaFloppyDisk className="mr-2 text-green-400" />
          <span className="text-sm font-semibold text-gray-300">
            Memory Blocks Used ({totalBlocks} blocks across {layers.length} layers)
          </span>
        </div>
        {isExpanded ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
      </div>
      
      {isExpanded && (
        <div className="mt-3">
          {/* Layer selector */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {layers.map(layer => (
                <button
                  key={layer}
                  onClick={() => setSelectedLayer(layer)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedLayer === layer 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Layer {layer + 1} ({blocksByLayer[layer].length})
                </button>
              ))}
            </div>
          </div>
          
          {/* Blocks display */}
          <div className="space-y-2">
            <div className="border-l-2 border-green-500 pl-3">
              <div className="text-xs text-green-300 font-medium mb-1">
                Layer {selectedLayer + 1}:
              </div>
              <div className="flex flex-wrap gap-1">
                {blocksByLayer[selectedLayer].map(block => (
                  <FilePill
                    key={`${selectedLayer}-${block}`}
                    name={`B${block}`}
                    inline={true}
                    iconType="floppy"
                    fileContent={async () => {
                      try {
                        const { getBlockContent } = await import("@/api/context");
                        const blockContentResponse = await getBlockContent(selectedLayer, block - 1);
                        return blockContentResponse.content;
                      } catch (error) {
                        console.error('Error fetching block content:', error);
                        return `Block ${block} from Layer ${selectedLayer}`;
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
          <span className="text-2xl font-bold text-white">Drop your file or block here to add it as context</span>
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
                fileContent={file.content}
                iconType={file.isBlock ? 'floppy' : 'file'}
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
                        <FilePill 
                          key={file.name + idx} 
                          name={file.name} 
                          inline 
                          fileContent={getFileContent(file.name)}
                          iconType={localStorage.getItem(`${file.name}_isBlock`) === 'true' ? 'floppy' : 'file'}
                        />
                      ))}
                    </span>
                  )}
                </span>
              ) : (
                "Model:"
              )}
            </span>
            {msg.role === "model" ? (
              <>
                <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                {msg.usedBlocks && msg.usedBlocks.length > 0 && (
                  <UsedBlocksDisplay usedBlocks={msg.usedBlocks} />
                )}
              </>
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
