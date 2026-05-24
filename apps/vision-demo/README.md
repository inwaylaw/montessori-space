# 蒙氏空间视觉识别示范项目

这个目录是 v0.2 的最小可运行示范：用合成蒙氏空间帧测试视觉语言模型是否能生成可复核的观察记录，并提供本地 Web 观察台和 iOS 每日卡片 MVP。

重要边界：OpenRouter 只用于 `cloud-assisted demo mode`。配置 `OPENROUTER_API_KEY` 并主动点击识别或运行云端评测时，被选择的样张或帧会发送到 OpenRouter。这不是最终的本地部署形态，也不能被描述成“被分析数据一定不上云”。详见 ../../docs/cloud-assisted-demo.md。

## 产物

- 本地 Web 观察台：`public/index.html`
- 本地模型代理：`src/server.mjs`
- iOS 每日卡片 MVP：`ios/MontessoriDailyCards.xcodeproj`
- Web/iOS 联动卡片 API：`GET /api/daily-card`
- 自动评测脚本：`src/evaluate.mjs`
- 输出 Schema：`schemas/montessori_observation.schema.json`
- 语料标准：`docs/corpus-standard.md`
- 架构说明：`docs/project-design.md`
- 手动 E2E 清单：`docs/e2e-checklist.md`
- 合成测试集：`../../research/montessori-frame-eval/testset.jsonl` 和 `../../research/montessori-frame-eval/images/`

## 默认模型

默认模型是 OpenRouter 上的 `qwen/qwen3-vl-8b-instruct`，因为当前公开研究记录显示它在本项目合成评测中是更接近边缘/本地部署方向的实用候选。可以用 `MONTESSORI_MODEL` 覆盖。

## 安装

不需要安装第三方依赖。需要 Node.js 20+。

```powershell
cd apps\vision-demo
npm test
```

## 本地验证

不调用云服务：

```powershell
cd apps\vision-demo
npm run eval:dry
npm run eval:mock
```

## 运行云端合成样本评测

不要把 API key 写入代码。用环境变量或本地 `.env`：

```powershell
cd apps\vision-demo
$env:OPENROUTER_API_KEY="你的 OpenRouter key"
npm run eval:smoke
```

输出会写到 `output/runs/eval-*/`，该目录不会进入 Git。

## 启动手动 E2E

```powershell
cd apps\vision-demo
$env:OPENROUTER_API_KEY="你的 OpenRouter key"
npm run serve
```

打开 `http://127.0.0.1:8787`。页面支持摄像头、合成样张和本地图片。浏览器不会接触 API key，原始帧也不会默认落盘；但主动识别的帧会进入 OpenRouter 云端模型调用。

## 可用命令

- `npm test`: 本地静态检查、Schema 检查、mock 评测。
- `npm run eval:dry`: 验证 5 条评测计划，不调用云服务。
- `npm run eval:mock`: 用 mock 模型跑完整 15 条流程。
- `npm run eval:smoke`: 用默认云模型跑 15 条合成蒙氏帧。
- `npm run serve`: 启动本地摄像头观察台。

## 风险

- 这只是示范流程，不是生产级儿童安全系统。
- 合成样本覆盖有限，不能代表真实家庭光照、遮挡、视角和儿童动作复杂度。
- 云模型会接收你主动发送的帧；真实儿童数据默认不得用于 OpenRouter demo。
- 自动评分只检查短答案，语义正确但表达不同的回答仍需要人工复核。
- 模型输出必须始终由家长复核，不能直接变成诊断、评分或育儿建议。
