# Montessori Frame Eval Set

Synthetic Montessori Space video-frame evaluation set. It uses generated frames only and contains no real child data.

This directory is the canonical Montessori-specific test set. The runnable Web demo reads these fixtures through its `/testset/...` route instead of carrying a duplicate copy under `apps/vision-demo/`.

## Coverage

- Montessori material recognition
- Work-area recognition
- Practical-life activity recognition
- Order / return-to-shelf cues
- Safety and environment cues
- Observation-boundary language
- Multi-frame event sequencing
- Daily report reading

## Run

```powershell
node ..\model-selection\run_openrouter_eval.js --models qwen/qwen3-vl-8b-instruct --testset .\testset.jsonl --delay-ms 1500
```
