# Changelog

## Unreleased

- Clarified repository structure, language boundaries, and local verification from the root README.
- Added root `npm test`, GitHub Actions CI, and a privacy-focused pull request template.
- Added Linguist configuration to keep synthetic fixture generation scripts from overstating the primary implementation language.
- Removed a stale environment lookup that referenced an older outer-workspace evaluation folder.
- Consolidated the Montessori frame fixtures so the Web demo reads the canonical `research/montessori-frame-eval/` test set instead of carrying a duplicate copy.

## v0.2 - Vision Demo and Research Update

- Added `apps/vision-demo/`, a runnable Node.js demo for synthetic Montessori frame evaluation, local camera/manual image input, structured observation output, and iOS daily-card preview.
- Added `research/model-selection/` with a bounded Chinese multimodal model evaluation set, OpenRouter runner, budget guard, redline allowlist, and model-selection notes.
- Added `research/montessori-frame-eval/` with synthetic Montessori frame tasks and the first Qwen3-VL-8B evaluation findings.
- Added `docs/cloud-assisted-demo.md` to separate OpenRouter cloud-assisted demo mode from the long-term local-first deployment goal.
- Preserved v0.1 concept, privacy, and collaboration framing instead of replacing the initial public surface.

## v0.1 - GitHub Preview

- Published the initial local-first Montessori Space concept entrypoint.
- Added privacy, contribution, roadmap, and synthetic example documents.
- Kept whitepaper, pitch deck, and real child data out of the public repository.
