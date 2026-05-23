import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const defaultModel = "qwen/qwen3-vl-8b-instruct";
export const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

const parseEnvLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) return null;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
  return key ? [key, value] : null;
};

export const loadLocalEnv = () => {
  const candidates = [
    path.join(projectRoot, ".env"),
    path.resolve(projectRoot, "..", "multimodal_eval_set", ".env")
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const entry = parseEnvLine(line);
      if (!entry) continue;
      const [key, value] = entry;
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
};

export const getRuntimeConfig = () => ({
  model: process.env.MONTESSORI_MODEL || defaultModel,
  apiKey: process.env.OPENROUTER_API_KEY || "",
  port: Number(process.env.MONTESSORI_PORT || 8787),
  httpReferer: process.env.OPENROUTER_HTTP_REFERER || "http://localhost",
  appTitle: process.env.OPENROUTER_APP_TITLE || "Montessori Space Vision Goal"
});
