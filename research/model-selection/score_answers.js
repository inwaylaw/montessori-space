const fs = require("fs");

const [, , goldPath, predPath] = process.argv;

if (!goldPath || !predPath) {
  console.error("Usage: node score_answers.js <testset.jsonl> <predictions.jsonl>");
  process.exit(1);
}

function readJsonl(path) {
  return fs
    .readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const json = index === 0 ? line.replace(/^\uFEFF/, "") : line;
      try {
        return JSON.parse(json);
      } catch (error) {
        throw new Error(`${path}:${index + 1} is not valid JSON: ${error.message}`);
      }
    });
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

const gold = readJsonl(goldPath);
const predictions = new Map(readJsonl(predPath).map((item) => [item.id, item.answer]));

let correct = 0;
const misses = [];

for (const item of gold) {
  const answer = predictions.get(item.id);
  const ok = scoreItem(item, answer);
  if (ok) {
    correct += 1;
  } else {
    misses.push({
      id: item.id,
      category: item.category,
      question: item.question,
      expected: item.expected_answer,
      answer: answer ?? "",
    });
  }
}

console.log(`Score: ${correct}/${gold.length} (${((correct / gold.length) * 100).toFixed(1)}%)`);

if (misses.length) {
  console.log("\nMisses:");
  for (const miss of misses) {
    console.log(`- ${miss.id} [${miss.category}]`);
    console.log(`  Q: ${miss.question}`);
    console.log(`  Expected: ${miss.expected}`);
    console.log(`  Answer: ${miss.answer}`);
  }
}
