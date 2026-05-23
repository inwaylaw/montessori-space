# Model Selection for the Jetson Multimodal Project

## Project Need

The target system is an edge-AI prototype centered on Jetson Orin Nano Super. The practical architecture is:

1. Jetson handles camera input, preprocessing, lightweight local perception, and offline fallback.
2. A small or medium Chinese vision-language model is used for OCR, table/chart reading, UI understanding, spatial reasoning, and safety-scene checks.
3. Larger cloud models are only quality ceilings or fallback references, not the default hardware target.

## Hard Redline

The runner only executes models listed in `openrouter_model_redline.json`.

Default budget in `openrouter_budget.json`:

- Max total worst-case calls: 15
- Max models per run: 3
- Max items per model: 5
- Default retries: 0
- Minimum delay: 1500 ms
- Max output tokens: 80

Worst-case calls are calculated as:

```text
models * items * (1 + retries)
```

## Priority Test List

| Priority | Model | Default | Why It Matters |
|---:|---|---|---|
| 1 | `qwen/qwen3-vl-8b-instruct` | enabled | Best first proxy for a small open Chinese VLM that could inform Jetson/local feasibility. |
| 2 | `qwen/qwen3-vl-30b-a3b-instruct` | enabled | Stronger Qwen VL model for cloud-assisted edge workflow with better reasoning quality. |
| 3 | `qwen/qwen3-vl-32b-instruct` | disabled | Dense Qwen VL comparison point for OCR, tables, charts, and spatial reasoning. |
| 4 | `z-ai/glm-4.6v` | enabled | Non-Qwen Chinese VLM baseline to check whether failures are Qwen-specific. |
| 5 | `qwen/qwen2.5-vl-72b-instruct` | disabled | Strong older open Qwen VL upper baseline; useful when smaller models fail. |
| 6 | `qwen/qwen3-vl-8b-thinking` | disabled | Use only if reasoning failures appear; thinking models may use more completion tokens. |
| 7 | `qwen/qwen3-vl-30b-a3b-thinking` | disabled | Higher reasoning ceiling; keep off for smoke tests. |
| 8 | `baidu/ernie-4.5-vl-28b-a3b` | disabled | Chinese alternative candidate; test after Qwen/GLM if needed. |
| 9 | `qwen/qwen3.5-9b` | disabled | Qwen3.5 API reference for the original target, not open-source-first. |
| 10 | `qwen/qwen3.5-flash-02-23` | disabled | Fast Qwen3.5 cloud reference, not a local open model target. |

## Suggested Test Phases

### Phase 1: Safe Smoke Test

Purpose: find obvious failures cheaply.

```powershell
node .\run_openrouter_eval.js --models .\openrouter_models.json --sample-ids mve_001,mve_009,mve_012,mve_016,mve_021 --delay-ms 1500
```

With the default 3 enabled models and 5 project-critical items, this is 15 calls.

### Phase 2: Focused Task Test

Purpose: keep only the top 2-3 models from phase 1, then test 9 items covering OCR, chart, table, UI, and spatial reasoning.

Before running, edit `openrouter_models.json` and disable weaker models. Then deliberately raise `openrouter_budget.json` to allow the planned call count.

### Phase 3: Full Test

Purpose: run all 27 questions only on the finalist models.

Use 1-2 finalist models first. For 2 models and 27 items with no retries, the run is 54 calls.

## Selection Rule

Pick the smallest model that passes the project-critical categories:

- Must pass OCR receipt/sign/table basics.
- Must pass chart trend/value questions.
- Must pass spatial direction questions.
- Must handle simple UI reading.
- Multi-image comparison is a nice-to-have unless the project workflow needs before/after monitoring.

If `qwen/qwen3-vl-8b-instruct` is close enough, it is the best hardware-aligned candidate. If it fails core OCR/table/chart tasks, move to Qwen3-VL 30B/32B and treat Jetson as an edge sensor plus cloud/VLM client.
