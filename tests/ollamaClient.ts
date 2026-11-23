export type OllamaRequest = {
  systemPrompt: string;
  userPrompt: string;
};

export async function callOllama(request: OllamaRequest): Promise<string> {
  const baseUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "llama3.2";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      options: { temperature: 0 },
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status}): ${await response.text()}`);
  }

  const result = await response.json() as { message?: { content?: string } };
  if (!result.message?.content) {
    throw new Error("Ollama returned an empty response");
  }

  return result.message.content;
}
