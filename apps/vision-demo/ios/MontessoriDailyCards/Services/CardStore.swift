import Foundation
import Observation

@MainActor
@Observable
final class CardStore {
  var cards: [DailyCard]
  var selectedCardID: DailyCard.ID
  var syncState: SyncState = .idle

  init(cards: [DailyCard] = CardRepository.loadBundledCards()) {
    self.cards = cards.isEmpty ? [.sample] : cards
    self.selectedCardID = self.cards.first?.id ?? DailyCard.sample.id
  }

  var selectedCard: DailyCard {
    cards.first(where: { $0.id == selectedCardID }) ?? cards.first ?? .sample
  }

  var reviewCards: [DailyCard] {
    cards.filter(\.needsParentReview)
  }

  func selectToday() {
    selectedCardID = cards.first?.id ?? DailyCard.sample.id
  }

  func selectFirstReview() {
    selectedCardID = reviewCards.first?.id ?? cards.first?.id ?? DailyCard.sample.id
  }

  func syncFromLocalDemo(client: LocalDemoClient = LocalDemoClient()) async {
    syncState = .syncing
    do {
      let payload = try await client.fetchDailyCard()
      cards = CardRepository.upserting(payload.dailyCard, into: cards)
      selectedCardID = payload.dailyCard.id
      syncState = .synced("已同步 \(payload.source)")
    } catch {
      syncState = .failed("未连接演示台，已保留内置样例")
    }
  }
}

enum SyncState: Equatable {
  case idle
  case syncing
  case synced(String)
  case failed(String)

  var label: String {
    switch self {
    case .idle: "内置样例"
    case .syncing: "同步中"
    case .synced(let message): message
    case .failed(let message): message
    }
  }

  var symbolName: String {
    switch self {
    case .idle: "tray"
    case .syncing: "arrow.triangle.2.circlepath"
    case .synced: "checkmark.icloud"
    case .failed: "wifi.exclamationmark"
    }
  }

  var isSyncing: Bool {
    if case .syncing = self { return true }
    return false
  }
}
