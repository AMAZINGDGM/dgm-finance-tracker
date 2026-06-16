import "server-only";

export const serverConfig = {
  openAiApiKey: process.env.OPENAI_API_KEY,
  aiProvider: process.env.AI_PROVIDER ?? "openai",
  aiModel: process.env.AI_MODEL ?? "gpt-4.1-mini"
};

export function isAiConfigured() {
  return Boolean(serverConfig.openAiApiKey);
}
