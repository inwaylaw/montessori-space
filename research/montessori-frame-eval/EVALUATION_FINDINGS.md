# Montessori Frame Evaluation Findings

Date: 2026-05-21

## Scope

This project-specific suite tests whether a small Chinese/open-weight VLM can support Montessori Space video-frame extraction and observation-card workflows.

The test set is synthetic and contains no real child data.

Coverage:

- Montessori material recognition
- Work-area recognition
- Practical-life activity recognition
- Environment and safety cues
- Return-to-shelf / order cues
- Observation-boundary compliance
- Multi-frame event sequencing
- Daily observation report reading

Files:

- Generator: `generate_montessori_testset.ps1`
- Test set: `testset.jsonl`
- Images: `images/*.png`
- Answer key: `answer_key.md`

## Run

Model: `qwen/qwen3-vl-8b-instruct`

Run directory: `..\runs\openrouter-20260521-215731`

Budget guard:

- 1 model
- 15 items
- 0 retries
- 1.5s request delay
- 15 worst-case calls

Raw OpenRouter run summary:

| Metric | Value |
| --- | ---: |
| Raw score | 9/15 |
| Raw score percent | 60.0% |
| Answered | 15/15 |
| Errors | 0 |
| Average latency | 1510 ms |
| Prompt tokens | 17854 |
| Completion tokens | 75 |
| Total tokens | 17929 |
| Approx cost | `$0.002232339` |

Offline adjudicated score: 10/15 (66.7%).

Reason for adjudication: answer `practical life` is a correct Montessori category for `实用生活`, so `ms_003` was added to the acceptable-answer list and rescored without additional API calls.

## Misses After Adjudication

| ID | Category | Expected | Model Answer | Interpretation |
| --- | --- | --- | --- | --- |
| `ms_001` | material_recognition | 粉红塔 | 叠叠乐 | Recognized stacking blocks, but missed the Montessori-specific material name. |
| `ms_004` | environment_cue | 托盘有水滴 | 托盘 | Detected the object but missed the subtle water-drop cue. |
| `ms_005` | order_return | 红棒 | 低矮教具架 | Failed return-to-shelf/material-specific cue. |
| `ms_007` | material_recognition | 剪纸/美工材料 | 剪刀 | Detected the tool, but not the activity/material category. |
| `ms_010` | multi_frame_event | 取用串珠-操作-归位 | A-B-C | Detected frame order but did not translate it into semantic event stages. |

## Current Read

Qwen3-VL-8B is good enough for a first-pass Montessori Space prototype when the output is low-risk and reviewable:

- It handled work area, privacy boundary, report reading, counting, spatial distribution, safety object, and final-state recognition.
- It is not yet reliable enough as the sole source of Montessori-specific observation labels.
- The fragile areas are domain vocabulary, subtle environment cues, return-to-shelf detection, and multi-frame semantic summarization.

Recommended next test:

1. Run the same suite with a Montessori-specific system prompt before changing hardware assumptions.
2. Compare Qwen3-VL-8B against Qwen3-VL-32B or Qwen3-VL-30B-A3B on the same 15 items.
3. Add 5-10 real-but-anonymized or hand-redrawn frames only after the synthetic suite is stable.

Hardware implication:

The Jetson-centered design is still plausible for frame extraction, local buffering, privacy filtering, and lightweight first-pass inference. For dependable Montessori observation cards, plan for either domain prompting/few-shot examples, a small material classifier layered before the VLM, or a larger/cloud fallback for uncertain cases.
