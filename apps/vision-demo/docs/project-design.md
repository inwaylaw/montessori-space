# 蒙氏空间视觉识别示范项目设计

## 需要的信息判断

我先确认了三类信息：

1. 现有项目资料：`montessori-space` 明确了本地优先、合成样本、隐私边界和不做诊断评分。
2. 现有测试资产：`multimodal_eval_set/montessori_frame_eval_set` 已有 15 条合成蒙氏帧样本，适合直接复用为模型能力测试集。
3. 运行约束：目标是先跑通示范流程，默认用 OpenRouter 上的 `qwen/qwen3-vl-8b-instruct`，不能把 API key 写入文件，真实摄像头 E2E 由用户最后手动执行。

因为这些信息足够形成一个最小可用示范，所以本轮没有继续向用户追问。

## 架构

```mermaid
flowchart LR
  A["合成测试图片 / 摄像头帧"] --> B["本地浏览器或评测脚本"]
  B --> C["Node 本地代理"]
  C --> D["OpenRouter Chat Completions"]
  D --> E["Qwen3-VL-30B-A3B-Instruct"]
  E --> F["结构化 observation JSON"]
  F --> G["自动评分 / 人工复核日志"]
```

## 组件

- `public/`: 本地 Web 观察台，支持摄像头、样张、本地图片。
- `src/server.mjs`: 原生 Node HTTP 服务，代理 OpenRouter 模型调用，不把密钥发到浏览器。
- `src/evaluate.mjs`: 合成测试集评测 runner，输出预测、摘要和 manifest。
- `src/prompt.mjs`: 统一提示词和结构化输出约束。
- `schemas/montessori_observation.schema.json`: 模型输出标准。
- `docs/corpus-standard.md`: 语料和标注标准。
- `testset/`: 复制后的合成蒙氏帧测试集。

## 数据流

自动评测：

1. 读取 `testset/testset.jsonl`。
2. 将图片转为 data URL，随问题一起发给模型。
3. 要求模型返回 `test_answer` 和 `observation`。
4. 用简单规则评分 `test_answer`。
5. 写入 `output/runs/eval-*/predictions.jsonl` 和 `summary.md`。

手动 E2E：

1. 本地浏览器获取摄像头帧或上传图片。
2. 浏览器把单帧 data URL 发给本地代理。
3. 本地代理调用 OpenRouter。此步骤属于云端辅助演示，被分析帧会发送到 OpenRouter。
4. 前端显示结构化观察。
5. 用户确认后可保存结构化日志；默认不保存原始帧。

## 错误处理

- API key 缺失时，服务健康检查和前端状态会显示缺失。
- 请求体超过 9 MB 会被拒绝，前端默认将图片压到最长边约 1280px。
- 模型返回非 JSON 时，后端尝试从文本中提取 JSON；失败会返回错误。
- 评测有 `--max-calls` 预算保护，默认最多 15 次云调用。

## 简约性取舍

- 不引入数据库。
- 不引入后端框架。
- 不做用户系统、权限系统或数据同步。
- 不训练模型，只测试云 VLM 能否生成合规观察。
- 不默认保存原始图片，降低隐私和合规风险。
