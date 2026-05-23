# Montessori Daily Cards iOS MVP

这是 `/goal` 下的 iOS 最小可用版本：一个 SwiftUI app + WidgetKit 小组件 + App Intents 系统入口。

## 打开方式

1. 用 Xcode 打开 `MontessoriDailyCards.xcodeproj`。
2. 选择 `MontessoriDailyCards` scheme。
3. 选择 iPhone simulator，运行。

## 与 Web demo 联动

保持现有 demo 运行：

```powershell
cd apps\vision-demo
npm run serve
```

iOS app 首页点“同步演示台”会请求：

```text
http://127.0.0.1:8787/api/daily-card
```

在 iOS Simulator 中，`127.0.0.1` 指向宿主机；真机测试时需要把 `LocalDemoClient` 的 base URL 改成电脑的局域网地址。

## 系统联动

- 小组件：`MontessoriDailyCardsWidget` 展示今日卡片摘要，点按打开 `montessori-daily-cards://today`。
- Shortcuts/Siri/Spotlight：通过 App Intents 暴露“打开今日卡片”“打开需确认观察”“朗读今日摘要”。
- Deep link：`montessori-daily-cards://today`、`montessori-daily-cards://review`。

## 隐私边界

MVP 只消费结构化观察结果和合成样例；不采集摄像头、不保存原始图片、不做身份、情绪、诊断或评分。

## TestFlight

TestFlight 上传需要 Mac + Xcode + Apple Developer 账号。预检与上传步骤见：

`TestFlight/README.md`
