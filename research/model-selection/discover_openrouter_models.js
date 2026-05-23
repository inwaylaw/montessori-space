const fs = require("fs");
const path = require("path");

const API_URL = "https://openrouter.ai/api/v1/models";

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

function usage() {
  console.log(`Usage:
  node discover_openrouter_models.js [--out openrouter_vision_models.json] [--all]

Find OpenRouter models whose declared input modalities include images and whose
output modalities include text. The output can be edited into openrouter_models.json.

Environment:
  OPENROUTER_API_KEY   Optional for model discovery, required by the runner.`);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasModality(model, field, modality) {
  const architecture = model.architecture || {};
  const values = asArray(architecture[field]).map((item) => String(item).toLowerCase());
  return values.includes(modality);
}

function toConfigEntry(model) {
  return {
    id: model.id,
    label: model.id.replace(/[/:]+/g, "-"),
    enabled: true,
    name: model.name || model.id,
    context_length: model.context_length || null,
    input_modalities: asArray(model.architecture && model.architecture.input_modalities),
    output_modalities: asArray(model.architecture && model.architecture.output_modalities),
    pricing: model.pricing || null
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    usage();
    return;
  }

  const headers = {};
  if (process.env.OPENROUTER_API_KEY) {
    headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY}`;
  }

  const response = await fetch(API_URL, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter models request failed: ${response.status} ${body.slice(0, 500)}`);
  }

  const payload = await response.json();
  const models = asArray(payload.data);
  const selected = models
    .filter((model) => args.all || (hasModality(model, "input_modalities", "image") && hasModality(model, "output_modalities", "text")))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map(toConfigEntry);

  const outPath = args.out ? path.resolve(args.out) : path.join(__dirname, "openrouter_vision_models.json");
  fs.writeFileSync(outPath, `${JSON.stringify(selected, null, 2)}\n`);

  console.log(`Wrote ${selected.length} model entries to ${outPath}`);
  console.log("Copy the models you want into openrouter_models.json, or pass comma-separated ids to run_openrouter_eval.js --models.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
