const fs = require("fs");
const path = require("path");

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const rawValue = trimmed.slice(eq + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function usage() {
  console.log(`Usage:
  node run_openrouter_eval.js --models openrouter_models.json [options]
  node run_openrouter_eval.js --models "provider/model-a,provider/model-b" [options]

Options:
  --testset <path>       Default: ./testset.jsonl
  --out <dir>            Default: ./runs/openrouter-<timestamp>
  --limit <n>            Run the first n items only
  --sample-ids <ids>     Comma-separated item ids to run instead of --limit
  --delay-ms <n>         Delay between requests. Default: 1200
  --retries <n>          Retries per failed request. Default: 0
  --timeout-ms <n>       Request timeout. Default: 90000
  --max-tokens <n>       Max completion tokens. Default: 80
  --redline <path>       Hard model allowlist. Default: ./openrouter_model_redline.json
  --budget <path>        Budget guard file. Default: ./openrouter_budget.json
  --dry-run              Validate files and print planned calls without API requests

Environment:
  OPENROUTER_API_KEY     Required unless --dry-run is used
  OPENROUTER_HTTP_REFERER Optional OpenRouter attribution header
  OPENROUTER_APP_TITLE   Optional OpenRouter attribution header`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");
}

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const json = index === 0 ? line.replace(/^\uFEFF/, "") : line;
      try {
        return JSON.parse(json);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1} is not valid JSON: ${error.message}`);
      }
    });
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function appendJsonl(filePath, value) {
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。！？、,.!?:：;；\-_/\\()[\]{}"'`]/g, "");
}

function extractNumber(value) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function scoreItem(item, answer) {
  const raw = String(answer ?? "");
  const norm = normalize(raw);
  const variants = [item.expected_answer, ...(item.acceptable_answers || [])].map(normalize).filter(Boolean);

  if (item.answer_type === "numeric") {
    const actual = extractNumber(raw);
    if (!Number.isFinite(actual)) return false;
    const expected = Number(item.numeric_value);
    const tolerance = Number(item.tolerance || 0);
    return Math.abs(actual - expected) <= tolerance;
  }

  if (item.answer_type === "exact") {
    return variants.some((variant) => norm === variant);
  }

  if (item.answer_type === "contains_all") {
    const keywords = (item.expected_keywords && item.expected_keywords.length ? item.expected_keywords : variants)
      .map(normalize)
      .filter(Boolean);
    return keywords.every((keyword) => norm.includes(keyword));
  }

  return variants.some((variant) => norm.includes(variant));
}

function safeFileName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "__").replace(/^_+|_+$/g, "") || "model";
}

function readModels(modelsArg) {
  if (!modelsArg) {
    throw new Error("Missing --models. Use openrouter_models.json or a comma-separated model id list.");
  }

  const maybePath = path.resolve(modelsArg);
  if (fs.existsSync(maybePath)) {
    const raw = readJsonFile(maybePath);
    const entries = Array.isArray(raw) ? raw : raw.models;
    if (!Array.isArray(entries)) throw new Error(`${modelsArg} must be a JSON array or { "models": [...] }`);
    return entries
      .filter((entry) => entry && entry.enabled !== false)
      .map((entry) => (typeof entry === "string" ? { id: entry, label: safeFileName(entry) } : { ...entry, label: entry.label || safeFileName(entry.id) }))
      .filter((entry) => entry.id);
  }

  return modelsArg
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => ({ id, label: safeFileName(id) }));
}

function selectItems(itemsRaw, args) {
  if (args["sample-ids"]) {
    const byId = new Map(itemsRaw.map((item) => [item.id, item]));
    const ids = String(args["sample-ids"])
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length) {
      throw new Error(`Unknown --sample-ids: ${missing.join(", ")}`);
    }
    return ids.map((id) => byId.get(id));
  }

  const limit = Number(args.limit || 0);
  return limit > 0 ? itemsRaw.slice(0, limit) : itemsRaw;
}

function loadRedline(redlinePath) {
  const resolved = path.resolve(redlinePath || path.join(__dirname, "openrouter_model_redline.json"));
  if (!fs.existsSync(resolved)) {
    throw new Error(`Missing model redline allowlist: ${resolved}`);
  }
  const redline = readJsonFile(resolved);
  const allowedModels = Array.isArray(redline.allowed_models) ? redline.allowed_models : [];
  if (!allowedModels.length) {
    throw new Error(`${resolved} must contain a non-empty allowed_models array.`);
  }
  return { path: resolved, redline, allowedModels };
}

function enforceRedline(models, redlineInfo) {
  const allowedById = new Map(redlineInfo.allowedModels.map((model) => [model.id, model]));
  const denied = models.filter((model) => !allowedById.has(model.id));
  if (denied.length) {
    throw new Error(
      [
        "Model redline violation: attempted to run models that are not in the allowlist.",
        ...denied.map((model) => `- ${model.id}`),
        `Edit ${redlineInfo.path} deliberately before testing anything outside the list.`
      ].join("\n")
    );
  }

  return models.map((model) => {
    const allowed = allowedById.get(model.id);
    return {
      ...allowed,
      ...model,
      label: model.label || allowed.label || safeFileName(model.id)
    };
  });
}

function loadBudget(budgetPath) {
  const resolved = path.resolve(budgetPath || path.join(__dirname, "openrouter_budget.json"));
  if (!fs.existsSync(resolved)) {
    throw new Error(`Missing budget guard file: ${resolved}`);
  }
  const budget = readJsonFile(resolved);
  return { path: resolved, budget };
}

function enforceBudget({ models, items, retries, delayMs, maxTokens, budgetInfo }) {
  const budget = budgetInfo.budget;
  const baseCalls = models.length * items.length;
  const worstCaseCalls = baseCalls * (1 + retries);
  const violations = [];

  if (models.length > Number(budget.max_models_per_run)) {
    violations.push(`models_per_run ${models.length} > ${budget.max_models_per_run}`);
  }
  if (items.length > Number(budget.max_items_per_model)) {
    violations.push(`items_per_model ${items.length} > ${budget.max_items_per_model}`);
  }
  if (retries > Number(budget.max_retries)) {
    violations.push(`retries ${retries} > ${budget.max_retries}`);
  }
  if (worstCaseCalls > Number(budget.max_total_calls)) {
    violations.push(`worst_case_calls ${worstCaseCalls} > ${budget.max_total_calls}`);
  }
  if (maxTokens > Number(budget.max_tokens)) {
    violations.push(`max_tokens ${maxTokens} > ${budget.max_tokens}`);
  }

  if (violations.length) {
    throw new Error(
      [
        "Budget guard stopped the run before any API call.",
        `Budget file: ${budgetInfo.path}`,
        `Plan: ${models.length} models * ${items.length} items * ${1 + retries} attempt(s) = ${worstCaseCalls} worst-case calls.`,
        ...violations.map((item) => `- ${item}`),
        "Lower --limit/model count, reduce --retries, or deliberately edit the budget file."
      ].join("\n")
    );
  }

  return {
    base_calls: baseCalls,
    worst_case_calls: worstCaseCalls,
    delay_ms: Math.max(delayMs, Number(budget.min_delay_ms || 0)),
    retries,
    max_tokens: maxTokens
  };
}

function imageToContent(testsetDir, imagePath) {
  const fullPath = path.resolve(testsetDir, imagePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Image not found: ${fullPath}`);
  }
  const ext = path.extname(fullPath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  const base64 = fs.readFileSync(fullPath).toString("base64");
  return {
    type: "image_url",
    image_url: {
      url: `data:${mime};base64,${base64}`
    }
  };
}

function buildMessages(item, testsetDir) {
  const content = [
    {
      type: "text",
      text: [
        "你正在参加一个多模态模型评测。",
        "请只回答最终答案，不要解释，不要复述题目。",
        "如果答案是数字，只输出数字或最短单位。",
        `问题：${item.question}`
      ].join("\n")
    }
  ];

  for (const imagePath of item.images || []) {
    content.push(imageToContent(testsetDir, imagePath));
  }

  return [
    {
      role: "system",
      content: "Answer the visual question concisely. Do not include reasoning."
    },
    {
      role: "user",
      content
    }
  ];
}

function extractAnswer(payload) {
  const content = payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

async function requestWithRetry(body, options) {
  let lastError;
  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    const started = Date.now();
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: options.headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const text = await response.text();
      const latencyMs = Date.now() - started;
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 1200)}`);
      }
      return { payload: JSON.parse(text), latencyMs, attempt };
    } catch (error) {
      lastError = error;
      if (attempt < options.retries) {
        await sleep(1000 * (attempt + 1));
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function summarize(model, records) {
  const answered = records.filter((record) => record.answer).length;
  const correct = records.filter((record) => record.correct).length;
  const errors = records.filter((record) => record.error).length;
  const latencies = records.filter((record) => Number.isFinite(record.latency_ms)).map((record) => record.latency_ms);
  const avgLatencyMs = latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : null;
  const usage = records.reduce(
    (acc, record) => {
      const itemUsage = record.usage || {};
      acc.prompt_tokens += Number(itemUsage.prompt_tokens || 0);
      acc.completion_tokens += Number(itemUsage.completion_tokens || 0);
      acc.total_tokens += Number(itemUsage.total_tokens || 0);
      return acc;
    },
    { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  );

  return {
    model: model.id,
    label: model.label,
    total: records.length,
    answered,
    correct,
    score_percent: records.length ? Number(((correct / records.length) * 100).toFixed(1)) : 0,
    errors,
    avg_latency_ms: avgLatencyMs,
    ...usage
  };
}

function writeSummaryFiles(outDir, summaries) {
  fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summaries, null, 2)}\n`);
  const headers = ["label", "model", "total", "answered", "correct", "score_percent", "errors", "avg_latency_ms", "prompt_tokens", "completion_tokens", "total_tokens"];
  const csv = [
    headers.join(","),
    ...summaries.map((summary) =>
      headers
        .map((header) => {
          const value = summary[header] ?? "";
          const text = String(value);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    )
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "summary.csv"), `${csv}\n`);
}

async function main() {
  loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    usage();
    return;
  }

  const dryRun = Boolean(args["dry-run"]);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!dryRun && !apiKey) {
    throw new Error("OPENROUTER_API_KEY is required. Set it in your shell environment; do not paste it into this script.");
  }

  const testsetPath = path.resolve(args.testset || path.join(__dirname, "testset.jsonl"));
  const testsetDir = path.dirname(testsetPath);
  const itemsRaw = readJsonl(testsetPath);
  const items = selectItems(itemsRaw, args);
  const redlineInfo = loadRedline(args.redline);
  const budgetInfo = loadBudget(args.budget);
  const models = enforceRedline(readModels(args.models), redlineInfo);
  if (!models.length) throw new Error("No enabled models found.");

  const outDir = path.resolve(args.out || path.join(__dirname, "runs", `openrouter-${timestamp()}`));
  fs.mkdirSync(outDir, { recursive: true });

  const requestedDelayMs = Number(args["delay-ms"] || 1200);
  const requestedRetries = Number(args.retries || 0);
  const requestedMaxTokens = Number(args["max-tokens"] || 80);
  const plan = enforceBudget({
    models,
    items,
    retries: requestedRetries,
    delayMs: requestedDelayMs,
    maxTokens: requestedMaxTokens,
    budgetInfo
  });

  const manifest = {
    started_at: new Date().toISOString(),
    testset: testsetPath,
    items: items.length,
    models: models.map((model) => model.id),
    dry_run: dryRun,
    redline: redlineInfo.path,
    budget: budgetInfo.path,
    plan
  };
  fs.writeFileSync(path.join(outDir, "run_manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const options = {
    retries: requestedRetries,
    delayMs: plan.delay_ms,
    timeoutMs: Number(args["timeout-ms"] || 90000),
    maxTokens: requestedMaxTokens,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  };

  if (process.env.OPENROUTER_HTTP_REFERER) {
    options.headers["HTTP-Referer"] = process.env.OPENROUTER_HTTP_REFERER;
  }
  if (process.env.OPENROUTER_APP_TITLE) {
    options.headers["X-Title"] = process.env.OPENROUTER_APP_TITLE;
  }

  const summaries = [];
  console.log(`Run directory: ${outDir}`);
  console.log(`Models: ${models.length}; Items per model: ${items.length}`);
  console.log(`Budget: ${plan.base_calls} base calls; ${plan.worst_case_calls} worst-case calls; delay ${plan.delay_ms}ms; retries ${plan.retries}`);

  for (const model of models) {
    const modelOut = path.join(outDir, `${safeFileName(model.label || model.id)}.jsonl`);
    const modelRecords = [];
    console.log(`\n== ${model.label || model.id} ==`);

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const baseRecord = {
        id: item.id,
        model: model.id,
        label: model.label || model.id,
        category: item.category,
        question: item.question,
        expected_answer: item.expected_answer
      };

      try {
        const messages = buildMessages(item, testsetDir);
        if (dryRun) {
          const record = {
            ...baseRecord,
            answer: "",
            correct: false,
            dry_run: true,
            image_count: (item.images || []).length
          };
          modelRecords.push(record);
          appendJsonl(modelOut, record);
          console.log(`[${index + 1}/${items.length}] ${item.id} dry-run`);
          continue;
        }

        const body = {
          model: model.id,
          messages,
          temperature: 0,
          max_tokens: options.maxTokens
        };

        const { payload, latencyMs, attempt } = await requestWithRetry(body, options);
        const answer = extractAnswer(payload);
        const correct = scoreItem(item, answer);
        const record = {
          ...baseRecord,
          answer,
          correct,
          latency_ms: latencyMs,
          attempt,
          finish_reason: payload.choices && payload.choices[0] && payload.choices[0].finish_reason,
          returned_model: payload.model || null,
          usage: payload.usage || null
        };
        modelRecords.push(record);
        appendJsonl(modelOut, record);
        console.log(`[${index + 1}/${items.length}] ${item.id} ${correct ? "ok" : "miss"} ${latencyMs}ms`);
      } catch (error) {
        const record = {
          ...baseRecord,
          answer: "",
          correct: false,
          error: error.message
        };
        modelRecords.push(record);
        appendJsonl(modelOut, record);
        console.log(`[${index + 1}/${items.length}] ${item.id} error: ${error.message.slice(0, 160)}`);
      }

      if (!dryRun && options.delayMs > 0 && index < items.length - 1) {
        await sleep(options.delayMs);
      }
    }

    const summary = summarize(model, modelRecords);
    summaries.push(summary);
    writeSummaryFiles(outDir, summaries);
    console.log(`Score: ${summary.correct}/${summary.total} (${summary.score_percent}%)`);
  }

  console.log(`\nWrote summary: ${path.join(outDir, "summary.csv")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
