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
