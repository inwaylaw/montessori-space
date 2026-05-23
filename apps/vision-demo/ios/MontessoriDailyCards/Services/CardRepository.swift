import Foundation

enum CardRepository {
  static func loadBundledCards(bundle: Bundle = .main) -> [DailyCard] {
    guard let url = bundle.url(forResource: "DailyCardsSeed", withExtension: "json"),
          let data = try? Data(contentsOf: url) else {
      return [.sample]
    }

    do {
      let decoder = JSONDecoder()
      return try decoder.decode([DailyCard].self, from: data)
    } catch {
      return [.sample]
    }
  }

  static func upserting(_ card: DailyCard, into cards: [DailyCard]) -> [DailyCard] {
    var updated = cards
    if let index = updated.firstIndex(where: { $0.id == card.id }) {
      updated[index] = card
    } else {
      updated.insert(card, at: 0)
    }
    return updated
  }
}
