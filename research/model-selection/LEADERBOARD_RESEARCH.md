# Leaderboard Research for Expanded VLM Testing

Research date: 2026-05-21

## Sources Checked

- OpenCompass / VLMEvalKit: the main open VLM reference. VLMEvalKit says it supports 200+ LMMs and 70+ image/video benchmarks, and hosts the OpenVLM Leaderboard.
- OpenVLM Leaderboard: broad leaderboard with benchmark tabs such as MMBench, MME, MMMU, MathVista, OCRBench, ChartQA, TextVQA, RealWorldQA, and others.
- Qwen3-VL technical/report sources: Qwen3-VL is positioned as a leading open multimodal family across MMMU and visual-math benchmarks, with dense 8B/32B and MoE 30B-A3B/235B-A22B variants.
- InternVL3.5 sources: the family claims state-of-the-art open-source MLLM results at large scale, while OpenRouter currently exposes InternVL3 2B/14B/78B.
- MiniCPM-V 4.5 sources: strong OpenCompass average performance with only 8B parameters; important for edge/local exploration, but no clear OpenRouter model ID was found.
- GLM-4.6V sources: open multimodal VLM with 128K context and tool-use focus; already smoke-tested and kept as a comparison candidate.
- ERNIE-4.5-VL sources: open-source/open-weight Baidu VLM family; 28B-A3B is attractive for document/chart tasks and OpenRouter has a callable model.

## Expanded Candidate Classes

### Direct OpenRouter Candidates

| Priority | Model | Why Include | Project Role |
|---:|---|---|---|
| 1 | `qwen/qwen3-vl-32b-instruct` | Strong Qwen3-VL dense model; useful comparison against 30B-A3B. | Accuracy/latency comparison. |
| 2 | `opengvlab/internvl3-14b` | OpenRouter exposes InternVL3 14B; InternVL family ranks strongly in open VLM evaluations. | Independent China open VLM baseline. |
| 3 | `baidu/ernie-4.5-vl-28b-a3b` | Open-weight Baidu MoE VLM; good fit for document/chart/video style tasks. | China non-Qwen baseline. |
| 4 | `opengvlab/internvl3-78b` | Larger InternVL3 quality reference. | Open family upper baseline. |
| 5 | `qwen/qwen3-vl-235b-a22b-instruct` | Qwen3-VL high-end open MoE model. | Cloud quality ceiling. |
| 6 | `qwen/qwen3-vl-235b-a22b-thinking` | Higher reasoning ceiling, but likely higher completion-token risk. | Later reasoning-only test. |

### Deferred Local / Non-OpenRouter Candidates

| Model | Why It Matters | Blocker |
|---|---|---|
| `openbmb/MiniCPM-V-4_5` | 8B model with strong OpenCompass claims; very relevant to Jetson/local direction. | No confirmed OpenRouter model ID found. |
| `OpenGVLab/InternVL3_5-*` | InternVL3.5 is a leading open-source family on multimodal tasks. | OpenRouter currently showed InternVL3, not InternVL3.5, as callable. |

## Expanded Test Plan

Run a bounded 25-call smoke test:

```text
5 models * 5 project-critical samples * 1 attempt = 25 calls
```

Samples:

- `mve_001`: OCR receipt
- `mve_009`: chart understanding
- `mve_012`: table reading
- `mve_016`: UI understanding
- `mve_021`: spatial reasoning

Only models that pass the smoke test should be considered for a 27-item full run.

## Source Links

- OpenCompass/VLMEvalKit: https://github.com/open-compass/VLMEvalKit
- OpenVLM Leaderboard: https://huggingface.co/spaces/opencompass/open_vlm_leaderboard
- OpenRouter OpenGVLab provider page: https://openrouter.ai/opengvlab
- Qwen3-VL technical report: https://arxiv.org/abs/2511.21631
- InternVL3.5 paper: https://arxiv.org/abs/2508.18265
- MiniCPM-V 4.5 model card: https://huggingface.co/openbmb/MiniCPM-V-4_5
- GLM-4.6V model page: https://glm-v.com/
- ERNIE-4.5-VL OpenRouter page: https://openrouter.ai/baidu/ernie-4.5-vl-28b-a3b
