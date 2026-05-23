import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultModel, getRuntimeConfig, loadLocalEnv, projectRoot } from "./env.mjs";
import { itemImagesToContent, loadTestset } from "./dataset.mjs";
import { appendJsonl, writeJson } from "./jsonl.mjs";
import { buildEvaluationMessages } from "./prompt.mjs";
import { callOpenRouter } from "./openrouter-client.mjs";
import { mockObservationForItem } from "./mock-model.mjs";
import { scoreItem, summarizeRecords } from "./score.mjs";

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
};

const timestamp = () => new Date().toISOString()
  .replace(/[-:]/g, "")
  .replace(".", "")
  .replace(/Z$/, `-${process.pid}Z`);

const selectItems = (items, args) => {
  if (args["sample-ids"]) {
    const byId = new Map(items.map((item) => [item.id, item]));
    return String(args["sample-ids"]).split(",").map((id) => {
      const item = byId.get(id.trim());
      if (!item) throw new Error(`Unknown sample id: ${id}`);
      return item;
    });
  }
  const limit = Number(args.limit || 0);
  return limit > 0 ? items.slice(0, limit) : items;
};

const writeSummaryMarkdown = (filePath, summary, manifest) => {
  const lines = [
    "# Montessori Vision Evaluation Summary",
    "",
    `- model: ${summary.model}`,
    `- testset: ${manifest.testset}`,
    `- mode: ${manifest.mode}`,
    `- score: ${summary.correct}/${summary.total} (${summary.score_percent}%)`,
    `- errors: ${summary.errors}`,
    `- avg_latency_ms: ${summary.avg_latency_ms ?? "n/a"}`,
    "",
    "This run stores structured observations and concise test answers. It does not store raw camera frames."
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
};

export const runEvaluation = async (argv = process.argv.slice(2)) => {
  loadLocalEnv();
  const args = parseArgs(argv);
  const runtime = getRuntimeConfig();
  const model = args.model || runtime.model || defaultModel;
  const dryRun = Boolean(args["dry-run"]);
  const mock = Boolean(args.mock);
  const maxCalls = Number(args["max-calls"] || 15);
  const delayMs = Number(args["delay-ms"] || 1500);
  const maxTokens = Number(args["max-tokens"] || 700);
  const timeoutMs = Number(args["timeout-ms"] || 90000);
  const { path: testsetPath, dir: testsetDir, items: allItems } = loadTestset(args.testset);
  const items = selectItems(allItems, args);

  if (!dryRun && !mock && items.length > maxCalls) {
    throw new Error(`Budget guard stopped the run: ${items.length} planned calls > --max-calls ${maxCalls}.`);
  }

  const outDir = path.resolve(args.out || path.join(projectRoot, "output", "runs", `eval-${timestamp()}`));
  fs.mkdirSync(outDir, { recursive: true });
  const predictionsPath = path.join(outDir, "predictions.jsonl");
  const manifest = {
    started_at: new Date().toISOString(),
    model,
    testset: testsetPath,
    item_count: items.length,
    mode: dryRun ? "dry-run" : mock ? "mock" : "cloud",
    max_calls: maxCalls,
    stores_raw_images: false
  };
  writeJson(path.join(outDir, "manifest.json"), manifest);

  const headers = {
    "HTTP-Referer": runtime.httpReferer,
    "X-Title": runtime.appTitle
  };
  const records = [];
  console.log(`Run directory: ${outDir}`);
  console.log(`Mode: ${manifest.mode}; Model: ${model}; Items: ${items.length}`);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const baseRecord = {
      id: item.id,
      category: item.category,
      question: item.question,
      expected_answer: item.expected_answer
    };

    try {
      let parsed;
      let latencyMs = null;
      let usage = null;
      if (dryRun) {
        parsed = { test_answer: "", observation: null };
      } else if (mock) {
        parsed = mockObservationForItem(item);
        latencyMs = 0;
      } else {
        const imageContent = itemImagesToContent(item, testsetDir);
        const result = await callOpenRouter({
          apiKey: runtime.apiKey,
          model,
          messages: buildEvaluationMessages(item, imageContent),
          maxTokens,
          timeoutMs,
          headers
        });
        parsed = result.parsed;
        latencyMs = result.latencyMs;
        usage = result.usage;
      }

      const answer = parsed.test_answer || "";
      const answerCorrect = dryRun ? false : scoreItem(item, answer);
      const observationCorrect = dryRun ? false : scoreItem(item, JSON.stringify(parsed.observation || {}));
      const record = {
        ...baseRecord,
        model,
        answer,
        answer_correct: answerCorrect,
        observation_correct: observationCorrect,
        correct: answerCorrect || observationCorrect,
        observation: parsed.observation || null,
        dry_run: dryRun,
        latency_ms: latencyMs,
        usage
      };
      records.push(record);
      appendJsonl(predictionsPath, record);
      console.log(`[${index + 1}/${items.length}] ${item.id} ${dryRun ? "planned" : record.correct ? "ok" : "miss"}`);
    } catch (error) {
      const record = { ...baseRecord, model, answer: "", correct: false, error: error.message };
      records.push(record);
      appendJsonl(predictionsPath, record);
      console.log(`[${index + 1}/${items.length}] ${item.id} error: ${error.message.slice(0, 180)}`);
    }

    if (!dryRun && !mock && delayMs > 0 && index < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const summary = summarizeRecords(records, model);
  writeJson(path.join(outDir, "summary.json"), summary);
  writeSummaryMarkdown(path.join(outDir, "summary.md"), summary, manifest);
  console.log(`Score: ${summary.correct}/${summary.total} (${summary.score_percent}%)`);
  console.log(`Summary: ${path.join(outDir, "summary.md")}`);
  if (!dryRun && summary.errors > 0 && !args["allow-errors"]) {
    throw new Error(`Evaluation finished with ${summary.errors} transport or parsing error(s). See ${predictionsPath}`);
  }
  return { outDir, summary };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runEvaluation().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
