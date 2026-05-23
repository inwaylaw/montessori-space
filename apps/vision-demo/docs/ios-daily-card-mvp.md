# iOS 每日卡片预览 MVP 设计

## 对齐范围

- 复用现有 `Montessori vision demo` 的结构化观察 schema：活动、材料、工作区、环境线索、安全线索、证据、家长复核和隐私边界。
- 延续 `montessori-space` 的硬边界：本地优先、不上传原始儿童数据、不做儿童评分、诊断或情绪识别。
- MVP 的核心任务不是再做摄像头识别，而是把已经形成的观察结果整理成每天可快速浏览、可复核、可从系统入口打开的卡片。

## 外部参考结论

- AMI 对 Montessori 环境的表述强调准备好的环境、可选择材料、多个工作空间，以及家长基于观察来回应个体需要：https://montessori-ami.org/about-montessori/montessori-environments
- Montessori Center of Minnesota 的观察记录材料把每日观察、活动开始结束、发生了什么、需要考虑的点作为记录单位，这适合映射成每日卡片：https://www.montessoricentermn.org/wp-content/uploads/2013/04/Users-Manual-Montessori-Observation-Record-Keeping-Edited-2017.pdf
- Apple App Intents 能把 app 行为暴露给 Siri、Spotlight、Shortcuts、widgets 和 controls：https://developer.apple.com/documentation/AppIntents
- Apple WidgetKit 适合在 app 外展示及时、少量、可一眼扫读的信息，并支持从小组件打开具体 app 场景：https://developer.apple.com/cn/documentation/widgetkit/

## MVP 功能

1. 今日卡片预览：显示标题、活动类别、置信度、工作区、材料、环境线索和家长复核提示。
2. 演示台同步：从本机 `http://127.0.0.1:8787/api/daily-card` 拉取 Web demo 生成的最新卡片；失败时使用内置合成样例。
3. 系统联动：
   - WidgetKit 小组件展示今日卡片，并通过 deep link 打开 app 的今日卡片。
   - App Intents 暴露“打开今日卡片”“打开需确认观察”“朗读今日摘要”三个系统动作。
   - Deep link scheme：`montessori-daily-cards://today` 和 `montessori-daily-cards://review`。
4. 隐私边界内化：规则、schema 和复核流程持续约束产品行为，但不在卡片界面上逐条展示。

## 非目标

- 不在 iOS 端采集摄像头。
- 不保存原始图片。
- 不训练或内置视觉模型。
- 不做账号、云同步或儿童画像。
