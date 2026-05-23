# 蒙氏空间

蒙氏空间是一个以于玛利亚·蒙台梭利教育理念的“有准备的环境”，旨在为0-6岁儿童提供秩序、自由、安全、美感和易接近的空间，本项目面向有 0-6 岁婴幼儿家庭构建本地优先 AI 观察项目。它希望帮助家长在保证家庭隐私安全主权的前提下，把家庭蒙氏空间中的探索、专注和家长反馈等异构信息整理成可回顾、可纠错、可解释的成长记录和数据资产，以探寻一条与以人为本、与AI共成长的开放路线。

当前仓库是 GitHub 先行版：概念倡议 + 安全协作入口。它不是完整产品发布，也不是可安装套件。

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

v0.2 在不覆盖 v0.1 内容的基础上，新增了一个可运行的视觉识别示范和研究记录：

- `apps/vision-demo/`: Node.js 本地 Web 观察台、本地模型代理、结构化观察 Schema、合成蒙氏帧测试集和 iOS 每日卡片 MVP。
- `research/model-selection/`: 通用中文多模态模型评测集、OpenRouter 受控评测脚本、模型预算和红线配置。
- `research/montessori-frame-eval/`: 面向蒙氏空间观察卡片的合成帧评测和初步结果。
- `docs/cloud-assisted-demo.md`: OpenRouter 云端辅助演示模式的边界说明。

重要区别：v0.2 的 OpenRouter 代理只是 `cloud-assisted demo mode`。它可以帮助研究云端 VLM 是否理解合成蒙氏帧，但它不是最终的本地部署方案，也不能被描述成“被分析数据一定不上云”。长期目标仍是 `local-first project`，真正本地 VLM/Jetson 推理仍在后续路线图中。

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
