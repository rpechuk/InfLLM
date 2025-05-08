const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000/chat";
const MODEL_API_URL = process.env.NEXT_PUBLIC_MODEL_API_URL || "http://localhost:8000/model";
const NEW_CHAT_API_URL = process.env.NEXT_PUBLIC_NEW_CHAT_API_URL || "http://localhost:8000/new_chat";

export async function streamChatResponse(
  message: string,
  onToken: (token: string) => void,
): Promise<void> {
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!response.body) throw new Error("No response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onToken(chunk);
  }
}

export async function createNewChat(): Promise<void> {
  const response = await fetch(NEW_CHAT_API_URL, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to create new chat");
  }
}

export async function checkModelReady(): Promise<any> {
  const response = await fetch(MODEL_API_URL);
  if (!response.ok) {
    throw new Error("Model not ready");
  }
  return response.json();
}

// Types
export interface Message {
  role: "user" | "model";
  content: string;
  files?: { name: string }[];
}

export interface UploadedFile {
  name: string;
  content: string;
}

// Polling for model readiness
export function pollModelReady({
  onReady,
  onError,
  onChecking,
  debugMode,
  intervalMs = 2000,
}: {
  onReady: () => void;
  onError: (err: any) => void;
  onChecking: () => void;
  debugMode: boolean;
  intervalMs?: number;
}): () => void {
  if (debugMode) {
    onReady();
    return () => { };
  }
  let stopped = false;
  let interval: NodeJS.Timeout | null = null;
  const poll = async () => {
    onChecking();
    try {
      await checkModelReady();
      onReady();
      stopped = true;
      if (interval) clearInterval(interval);
    } catch (err) {
      onError(err);
    }
  };
  poll();
  interval = setInterval(() => {
    if (!stopped) poll();
  }, intervalMs);
  return () => {
    if (interval) clearInterval(interval);
  };
}

// File reading logic
export async function readTextFiles(files: File[]): Promise<UploadedFile[]> {
  const textFiles = files.filter(
    (file) =>
      file.type.startsWith("text") ||
      file.type === "" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".py") ||
      file.name.endsWith(".js") ||
      file.name.endsWith(".ts") ||
      file.name.endsWith(".json")
  );
  const readPromises = textFiles.map(
    (file) =>
      new Promise<UploadedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, content: reader.result as string });
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      })
  );
  return Promise.all(readPromises);
}

// Message formatting
export function formatInputWithFiles(input: string, files: UploadedFile[]): string {
  if (files.length === 0) return input;
  return (
    `# File Context:\n` +
    files
      .map((f) => `${f.name}\n\u0060\u0060\u0060\n${f.content}\n\u0060\u0060\u0060`)
      .join("\n") +
    `\n---\n# User Message:\n${input}`
  );
}

// Simulate model reply for debug mode
export function simulateModelReply(input: string, cb: (reply: string) => void) {
  setTimeout(() => {
    cb(`[Debug Mode] Echo:\n${input}`);
  }, 600);
}
