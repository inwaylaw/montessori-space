# Multimodal Model Evaluation Set

This folder contains a deterministic Chinese multimodal evaluation set for comparing local or cloud vision-language models.

It is a research aid for Montessori Space, not a production data source. The included images are generated or synthetic and do not contain real child data.

## Contents

- `images/`: 12 generated PNG images for general OCR, chart, table, UI, spatial, and safety checks.
- `testset.jsonl`: 27 labeled evaluation items.
- `answer_key.md`: human-readable expected answers.
- `predictions_template.jsonl`: template for model responses.
- `score_answers.js`: simple local scorer for exact, contains, and numeric checks.
- `run_openrouter_eval.js`: bounded OpenRouter runner.
- `openrouter_budget.json`: default call, token, retry, and delay limits.
- `openrouter_model_redline.json`: hard allowlist for cloud test candidates.
- `MODEL_SELECTION.md`: current model-selection rule and priority list.
- `EVALUATION_FINDINGS.md`: completed run summaries and current ranking.

## OpenRouter Boundary

OpenRouter runs are `cloud-assisted demo mode`. If `OPENROUTER_API_KEY` is set and the runner is executed without `--dry-run`, test images and prompts are sent to OpenRouter. Use this only with synthetic or non-sensitive images.

For local-only checks, use dry runs or local scoring:

```powershell
node .\run_openrouter_eval.js --dry-run --models .\openrouter_models.example.json --limit 5
node .\score_answers.js .\testset.jsonl .\predictions_template.jsonl
```

## JSONL Fields

- `id`: stable sample id.
- `images`: one or more relative image paths.
- `category`: skill being tested, such as OCR, chart, table, spatial reasoning, UI, or safety.
- `question`: Chinese user-facing question.
- `expected_answer`: concise gold answer.
- `answer_type`: `exact`, `contains_any`, `contains_all`, or `numeric`.
- `acceptable_answers`: allowed variants for automatic scoring.
- `numeric_value` and `tolerance`: used when `answer_type` is `numeric`.

The scorer is intentionally simple. For final model selection, review wrong answers manually, especially for semantically correct Chinese paraphrases.
