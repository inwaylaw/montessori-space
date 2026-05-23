# OpenRouter 云端辅助演示边界

v0.2 包含一个可运行的视觉识别示范。它使用本地 Node.js 服务作为代理，并可调用 OpenRouter 上的视觉语言模型。这是 `cloud-assisted demo mode`，不是最终的本地部署形态。

## 什么时候会上云

只有同时满足以下条件时，图片内容才会发送给 OpenRouter：

- 用户在本机环境变量或本地 `.env` 中配置了 `OPENROUTER_API_KEY`。
- 用户主动点击 Web demo 的识别按钮，或主动运行云端评测命令。
- 当前请求使用的是 OpenRouter 模型调用，而不是 dry-run 或 mock 模式。

发送内容只应来自合成样张、手工构造的非敏感图像，或经过明确授权和脱敏的测试帧。公开仓库不包含真实儿童数据。

## 本地代理能保护什么

- API key 留在本机 Node.js 进程，不发送到浏览器。
- Web demo 不默认保存原始图片或摄像头帧。
- `POST /api/save-observation` 只保存结构化观察结果。
- 评测输出写入本地 `output/`，该目录被 `.gitignore` 排除。

## 本地代理不能承诺什么

- 不能承诺被 OpenRouter 分析的帧不出本机。
- 不能代表项目已经完成本地 VLM 或 Jetson 部署。
- 不能替代家长、教师、医生或蒙氏顾问判断。
- 不能用于儿童评分、发展诊断、情绪识别或身份识别。

## 推荐使用方式

- 默认使用 `npm run eval:dry` 或 `npm run eval:mock` 做本地验证。
- 只用合成样张运行 `npm run eval:smoke`。
- 真实儿童数据不要用于 OpenRouter demo。
- 如果目标是验证“数据不上云”，请等待或实现本地 VLM/Jetson 路径，而不是使用云端模型调用。
