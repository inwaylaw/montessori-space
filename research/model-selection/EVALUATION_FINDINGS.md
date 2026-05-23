# Evaluation Findings

## Current Project Context

The target hardware path is Jetson Orin Nano Super. For this reason, the model selection rule is:

1. Prefer the smallest open or open-weight Chinese multimodal model that passes project-critical tasks.
2. Use larger cloud models as quality ceilings or fallback references.
3. Keep every paid run bounded by `openrouter_budget.json` and every tested model bounded by `openrouter_model_redline.json`.

## Completed Runs

### Smoke Run: `openrouter-20260521-211304`

Scope: 3 models x 5 project-critical samples = 15 calls.

| Model | Score | Notes |
|---|---:|---|
| `qwen/qwen3-vl-8b-instruct` | 5/5 | Fast, cheapest, passed core samples. |
| `qwen/qwen3-vl-30b-a3b-instruct` | 5/5 | Passed core samples, slightly higher cost. |
| `z-ai/glm-4.6v` | 4/5 | Failed spatial item because it spent output budget on reasoning and returned no final answer. |

Approximate total cost: `$0.003734`.

### Full Qwen Finalist Run: `openrouter-20260521-211658`

Scope: 2 models x 27 samples = 54 calls.

| Model | Original Score | Corrected Score | Avg Latency | Approx Cost |
|---|---:|---:|---:|---:|
| `qwen/qwen3-vl-8b-instruct` | 26/27 | 27/27 | 1092 ms | `$0.003676` |
| `qwen/qwen3-vl-30b-a3b-instruct` | 27/27 | 27/27 | 1341 ms | `$0.005315` |

The original miss for `qwen/qwen3-vl-8b-instruct` was a scorer issue: the model answered `右`, which is a correct concise answer for `自行车在红色汽车的哪一侧？`. The accepted answer list has been updated, and both models rescore to 27/27 without additional API calls.

## Current Recommendation

`qwen/qwen3-vl-8b-instruct` is the leading practical candidate because it fully passed the current suite, costs less than the 30B model, and is closer to the Jetson/local edge deployment target.

`qwen/qwen3-vl-30b-a3b-instruct` should remain as the cloud fallback and quality ceiling candidate.

### Expanded Leaderboard Smoke Run: `openrouter-20260521-212812`

Scope: 5 models x 5 project-critical samples = 25 planned calls.

| Model | Score | Status |
|---|---:|---|
| `qwen/qwen3-vl-32b-instruct` | 5/5 | Passed. |
| `qwen/qwen3-vl-235b-a22b-instruct` | 5/5 | Passed. |
| `opengvlab/internvl3-14b` | 0/5 | API returned `No endpoints found`; not a capability failure. |
| `opengvlab/internvl3-78b` | 0/5 | API returned `No endpoints found`; not a capability failure. |
| `baidu/ernie-4.5-vl-28b-a3b` | 0/5 | Upstream 429/502 errors; not a capability failure. |

Approximate billed cost: `$0.001994`.

### Expanded Qwen Full Run: `openrouter-20260521-213028`

Scope: 2 models x 27 samples = 54 calls.

| Model | Score | Avg Latency | Approx Cost |
|---|---:|---:|---:|
| `qwen/qwen3-vl-32b-instruct` | 27/27 | 864 ms | `$0.003334` |
| `qwen/qwen3-vl-235b-a22b-instruct` | 27/27 | 2025 ms | `$0.007436` |

Both models passed the full suite. The 32B dense model is faster and cheaper than the 235B MoE upper-bound model on this test set.

## Current Ranking for This Project

| Rank | Model | Reason |
|---:|---|---|
| 1 | `qwen/qwen3-vl-8b-instruct` | Full score, lowest cost, closest to edge/local deployment. |
| 2 | `qwen/qwen3-vl-32b-instruct` | Full score, fastest observed full-run latency, stronger cloud/local workstation candidate. |
| 3 | `qwen/qwen3-vl-30b-a3b-instruct` | Full score, good cloud fallback, slightly slower/costlier than 8B on current suite. |
| 4 | `qwen/qwen3.5-flash-02-23` | Full score, useful API reference, but slower and token-heavier than Qwen3-VL on this suite. |
| 5 | `qwen/qwen3-vl-235b-a22b-instruct` | Full score, quality ceiling, but unnecessary for current tasks unless future tasks become harder. |
| Deferred | `opengvlab/internvl3-*`, `baidu/ernie-4.5-vl-28b-a3b`, `openbmb/MiniCPM-V-4_5` | Strong external reasons to test, but blocked by OpenRouter endpoint/upstream availability or no confirmed OpenRouter ID. |

### Qwen3.5 + GLM Smoke Run: `openrouter-20260521-213727`

Scope: 5 models x 5 project-critical samples = 25 calls, with `max_tokens=160` to reduce reasoning truncation risk.

| Model | Score | Status |
|---|---:|---|
| `qwen/qwen3.5-flash-02-23` | 5/5 | Passed; advanced to full run. |
| `z-ai/glm-4.6v` | 4/5 | Still failed spatial item due `finish_reason=length` with no final answer. |
| `z-ai/glm-5v-turbo` | 4/5 | Same spatial-item length failure pattern. |
| `qwen/qwen3.5-27b` | 3/5 | Length failures on chart/UI items. |
| `qwen/qwen3.5-9b` | 0/5 | Length failures and one fetch failure; not promoted. |

Approximate total cost: `$0.017858`.

### Qwen3.5 Flash Full Run: `openrouter-20260521-214115`

Scope: 1 model x 27 samples = 27 calls, with `max_tokens=160`.

| Model | Score | Avg Latency | Approx Cost |
|---|---:|---:|---:|
| `qwen/qwen3.5-flash-02-23` | 27/27 | 3192 ms | `$0.005111` |

Qwen3.5 Flash is capable on the current test set, but it used far more completion tokens than Qwen3-VL models. It is a good API fallback candidate, not the best edge/local candidate.

## Next Expansion Rule

Expand only to models that satisfy at least one of these:

- Open or open-weight Chinese VLM with strong OpenCompass/OpenVLM evidence.
- OpenRouter-callable high-performing model from a leading open VLM family.
- Small efficient model relevant to Jetson/local deployment, even if it must be tested locally later.
