# 蒙氏空间

蒙氏空间是一个面向 0-6 岁婴幼儿家庭的本地优先 AI 观察项目。它以玛利亚·蒙台梭利“有准备的环境”为理念背景，希望在不牺牲家庭隐私和儿童安全边界的前提下，把家庭蒙氏空间中的探索、专注、材料使用和家长反馈整理成可回顾、可纠错、可解释的观察记录。

当前仓库是公开先行版：概念边界、隐私原则、合成样例、可运行视觉识别示范和研究记录。它不是完整产品发布。

## 这不是什么

- 不是云摄像头项目。
- 不是儿童评分、诊断或情绪识别系统。
- 不是开放儿童原始数据集项目。
- 不是默认云端训练、云端同步或平台数据积累项目。
- 不是替代父母、教师、医生或蒙氏顾问的判断工具。

## 当前阶段

v0.1 只承诺一个克制目标：先验证 Phase 1 Dummy Pipeline，也就是用本地视频或合成输入、抽帧、模拟 JSON、本地存储和日报生成，证明“家庭本地观察记录”这条数据生产管线可以安全地跑通。

Phase 2-4 中的本地视觉模型、蒙氏语义校准和低侵入硬件反馈，仍是后续方向，不属于当前首发承诺。

## 版本进展

v0.1 是 GitHub 先行版，重点是项目边界、隐私原则、合成示例和安全协作入口。

v0.2 新增一个可运行的视觉识别示范和研究记录：

- `apps/vision-demo/`: Node.js 本地 Web 观察台、本地模型代理、结构化观察 Schema、合成蒙氏帧测试集和 iOS 每日卡片 MVP。
- `research/model-selection/`: 通用中文多模态模型评测集、OpenRouter 受控评测脚本、模型预算和红线配置。
- `research/montessori-frame-eval/`: 面向蒙氏空间观察卡片的合成帧评测和初步结果。
- `docs/cloud-assisted-demo.md`: OpenRouter 云端辅助演示模式的边界说明。

重要区别：v0.2 的 OpenRouter 代理只是 `cloud-assisted demo mode`。它可以帮助研究云端 VLM 是否理解合成蒙氏帧，但它不是最终的本地部署方案。长期目标仍是 `local-first project`，真正本地 VLM/Jetson 推理仍在后续路线图中。

## 仓库结构与语言说明

这个仓库故意保留了多种语言，但每种语言都有清晰边界：

- JavaScript: `apps/vision-demo/src/` 和 `research/model-selection/` 中的本地服务、评测和打分脚本。
- HTML/CSS: `apps/vision-demo/public/` 中的浏览器观察台和 iOS 预览页面。
- Swift: `apps/vision-demo/ios/` 中的 iOS 每日卡片 MVP。
- PowerShell: `research/**/generate_*.ps1` 中的合成测试图和 JSONL 生成脚本。

GitHub 的 Languages 面板会按文件体积统计这些代码。为避免把一次性合成数据生成脚本误读成主技术栈，仓库使用 `.gitattributes` 对 GitHub Linguist 做了降噪；主线仍是本地优先 AI 观察 demo、研究评测和 iOS 预览。

## 本地快速验证

需要 Node.js 20+。默认验证不调用云服务，也不需要 API key。

```powershell
npm test
npm --prefix apps/vision-demo run eval:dry
npm --prefix apps/vision-demo run eval:mock
```

如需启动浏览器观察台：

```powershell
npm --prefix apps/vision-demo run serve
```

打开 `http://127.0.0.1:8787`。只有在配置 `OPENROUTER_API_KEY` 并主动点击识别或运行云端评测时，所选样张或帧才会发送到 OpenRouter。

## 阅读入口

- [隐私与数据边界](PRIVACY.md)
- [贡献指南](CONTRIBUTING.md)
- [路线图](ROADMAP.md)
- [OpenRouter 云端辅助演示边界](docs/cloud-assisted-demo.md)
- [v0.2 可运行视觉识别示范](apps/vision-demo/README.md)
- [模型选择研究记录](research/model-selection/MODEL_SELECTION.md)
- [蒙氏帧评测结果](research/montessori-frame-eval/EVALUATION_FINDINGS.md)
- [合成行为日志示例](examples/synthetic-behavior-log.json)
- [合成日报示例](examples/synthetic-daily-report.md)

## 可以贡献什么

当前欢迎的贡献以安全、文档和可复现为主：

- 改进 README、路线图、隐私说明和贡献说明。
- 审阅数据边界，指出可能导致真实儿童数据泄露或误用的表述。
- 提出 MontessoriBehaviorLog 的 Schema 建议。
- 补充纯本地设备路径、UVC、RTSP 或本地文件输入的兼容性反馈。
- 改进合成样例和演示日报，不使用真实儿童素材。

## 硬边界

真实儿童数据不进仓库。严禁在 issue、PR、commit、截图、日志、示例文件或演示材料中上传真实儿童原始视频、音频、完整家庭日志、可识别家庭空间信息或任何可识别儿童/家庭成员身份的数据。

如果一个建议必须依赖真实儿童原始数据才能讨论，请先把它抽象成合成样例、伪数据或非敏感描述。
