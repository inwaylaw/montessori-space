import AppIntents
import Foundation

struct OpenTodayCardIntent: AppIntent {
  static let title: LocalizedStringResource = "打开今日卡片"
  static let description = IntentDescription("打开蒙氏空间今日观察卡片。")
  static var openAppWhenRun: Bool = true

  func perform() async throws -> some IntentResult {
    await MainActor.run {
      AppIntentRouter.shared.destination = .today
    }
    return .result()
  }
}

struct OpenReviewCardIntent: AppIntent {
  static let title: LocalizedStringResource = "打开需确认观察"
  static let description = IntentDescription("打开第一张需要家长复核的观察卡片。")
  static var openAppWhenRun: Bool = true

  func perform() async throws -> some IntentResult {
    await MainActor.run {
      AppIntentRouter.shared.destination = .review
    }
    return .result()
  }
}

struct SummarizeTodayCardIntent: AppIntent {
  static let title: LocalizedStringResource = "朗读今日摘要"
  static let description = IntentDescription("返回今日蒙氏观察卡片的简短摘要。")
  static var openAppWhenRun: Bool = false

  func perform() async throws -> some IntentResult & ProvidesDialog {
    let card = CardRepository.loadBundledCards().first ?? .sample
    let prompt = card.reviewPrompts.first ?? "请家长复核后再保存。"
    return .result(dialog: "\(card.title)：\(prompt)")
  }
}

struct MontessoriDailyShortcuts: AppShortcutsProvider {
  static var shortcutTileColor: ShortcutTileColor = .green

  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: OpenTodayCardIntent(),
      phrases: [
        "打开 \(.applicationName) 今日卡片",
        "查看 \(.applicationName) 今日观察"
      ],
      shortTitle: "今日卡片",
      systemImageName: "rectangle.stack"
    )

    AppShortcut(
      intent: OpenReviewCardIntent(),
      phrases: [
        "打开 \(.applicationName) 需确认观察",
        "查看 \(.applicationName) 复核卡片"
      ],
      shortTitle: "需确认",
      systemImageName: "checklist"
    )

    AppShortcut(
      intent: SummarizeTodayCardIntent(),
      phrases: [
        "朗读 \(.applicationName) 今日摘要"
      ],
      shortTitle: "今日摘要",
      systemImageName: "speaker.wave.2"
    )
  }
}
