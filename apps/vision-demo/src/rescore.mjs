import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTestset } from "./dataset.mjs";
import { readJsonl, writeJson } from "./jsonl.mjs";
import { scoreItem, summarizeRecords } from "./score.mjs";

const usage = () => {
  console.log("Usage: node ./src/rescore.mjs <predictions.jsonl> [out-dir]");
};

export const rescore = (predictionsPath, outDir = "") => {
  if (!predictionsPath) {
    usage();
    throw new Error("Missing predictions.jsonl path.");
  }
  const resolvedPredictions = path.resolve(predictionsPath);
  const outputDir = path.resolve(outDir || path.dirname(resolvedPredictions));
  const { items } = loadTestset();
  const byId = new Map(items.map((item) => [item.id, item]));
  const predictions = readJsonl(resolvedPredictions);
  const rescored = predictions.map((record) => {
    const item = byId.get(record.id);
    if (!item) return { ...record, correct: false, rescore_error: "missing testset item" };
    const answerCorrect = scoreItem(item, record.answer);
    const observationCorrect = scoreItem(item, JSON.stringify(record.observation || {}));
    return {
      ...record,
      answer_correct: answerCorrect,
      observation_correct: observationCorrect,
      correct: answerCorrect || observationCorrect
    };
  });

  const model = rescored[0]?.model || "unknown";
  const summary = {
    ...summarizeRecords(rescored, model),
    rescored_at: new Date().toISOString(),
    source_predictions: resolvedPredictions
  };
  fs.mkdirSync(outputDir, { recursive: true });
  const rescoredPath = path.join(outputDir, "rescored-predictions.jsonl");
  fs.writeFileSync(rescoredPath, rescored.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
  writeJson(path.join(outputDir, "rescore-summary.json"), summary);
  fs.writeFileSync(
    path.join(outputDir, "rescore-summary.md"),
    [
      "# Montessori Vision Rescore Summary",
      "",
      `- model: ${summary.model}`,
      `- score: ${summary.correct}/${summary.total} (${summary.score_percent}%)`,
      `- errors: ${summary.errors}`,
      `- source: ${summary.source_predictions}`
    ].join("\n") + "\n",
    "utf8"
  );
  console.log(`Rescore: ${summary.correct}/${summary.total} (${summary.score_percent}%)`);
  console.log(`Summary: ${path.join(outputDir, "rescore-summary.md")}`);
  return summary;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    rescore(process.argv[2], process.argv[3]);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
