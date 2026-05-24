import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { getRuntimeConfig, loadLocalEnv, projectRoot } from "./env.mjs";
import { appLocalTestsetRoot, canonicalTestsetRoot } from "./dataset.mjs";
import { appendJsonl } from "./jsonl.mjs";
import { buildLiveMessages } from "./prompt.mjs";
import { callOpenRouter } from "./openrouter-client.mjs";
import { buildDailyCardPayload } from "./daily-card.mjs";

loadLocalEnv();
const runtime = getRuntimeConfig();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

const readBody = (request, limitBytes = 9 * 1024 * 1024) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  request.on("data", (chunk) => {
    size += chunk.length;
    if (size > limitBytes) {
      reject(new Error("Request body is too large. Downscale the frame and try again."));
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });
  request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  request.on("error", reject);
});

const sendJson = (response, status, value) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value, null, 2));
};

const getTestsetRoot = () => (
  fs.existsSync(path.join(canonicalTestsetRoot, "testset.jsonl"))
    ? canonicalTestsetRoot
    : appLocalTestsetRoot
);

const serveFile = (response, requestPath) => {
  const publicRoot = path.join(projectRoot, "public");
  const routePath = requestPath === "/" ? "/index.html" : decodeURIComponent(requestPath);
  const isTestsetAsset = routePath.startsWith("/testset/");
  const baseRoot = isTestsetAsset ? getTestsetRoot() : publicRoot;
  const assetPath = isTestsetAsset ? routePath.slice("/testset".length) : routePath;
  const filePath = path.resolve(baseRoot, `.${assetPath}`);
  if (!filePath.startsWith(path.resolve(baseRoot))) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }
  response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
};

const analyzeFrame = async (payload) => {
  const imageDataUrl = String(payload.imageDataUrl || "");
  if (!imageDataUrl.startsWith("data:image/")) {
    throw new Error("imageDataUrl must be a data:image URL.");
  }
  const result = await callOpenRouter({
    apiKey: runtime.apiKey,
    model: runtime.model,
    messages: buildLiveMessages({ imageDataUrl, note: payload.note || "" }),
    headers: {
      "HTTP-Referer": runtime.httpReferer,
      "X-Title": runtime.appTitle
    }
  });
  return {
    model: runtime.model,
    latency_ms: result.latencyMs,
    usage: result.usage,
    result: result.parsed,
    raw_text: result.rawText
  };
};

const handleApi = async (request, response, url) => {
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, model: runtime.model, has_api_key: Boolean(runtime.apiKey) });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/config") {
      sendJson(response, 200, {
        model: runtime.model,
        has_api_key: Boolean(runtime.apiKey),
        stores_raw_images: false,
        daily_card_endpoint: "/api/daily-card",
        samples: [
          "/testset/images/01_pink_tower_mat.png",
          "/testset/images/02_pouring_tray.png",
          "/testset/images/03_red_rods_not_returned.png",
          "/testset/images/04_cutting_table.png",
          "/testset/images/09_two_work_areas.png"
        ]
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/daily-card") {
      sendJson(response, 200, buildDailyCardPayload());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/analyze-frame") {
      const payload = JSON.parse(await readBody(request));
      sendJson(response, 200, await analyzeFrame(payload));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/save-observation") {
      const payload = JSON.parse(await readBody(request, 512 * 1024));
      const record = {
        saved_at: new Date().toISOString(),
        source: payload.source || "manual",
        observation: payload.observation || payload
      };
      appendJsonl(path.join(projectRoot, "output", "manual-observations.jsonl"), record);
      sendJson(response, 200, { ok: true, path: "output/manual-observations.jsonl" });
      return;
    }

    sendJson(response, 404, { error: "Unknown API route" });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(request, response, url);
    return;
  }
  serveFile(response, url.pathname);
});

server.listen(runtime.port, "127.0.0.1", () => {
  console.log(`Montessori vision demo: http://127.0.0.1:${runtime.port}`);
  console.log(`Model: ${runtime.model}; API key loaded: ${runtime.apiKey ? "yes" : "no"}`);
});
