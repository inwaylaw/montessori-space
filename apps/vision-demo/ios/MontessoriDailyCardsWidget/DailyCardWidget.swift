import SwiftUI
import WidgetKit

struct DailyCardEntry: TimelineEntry {
  let date: Date
  let card: DailyCard
}

struct DailyCardProvider: TimelineProvider {
  func placeholder(in context: Context) -> DailyCardEntry {
    DailyCardEntry(date: .now, card: .sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (DailyCardEntry) -> Void) {
    completion(DailyCardEntry(date: .now, card: CardRepository.loadBundledCards().first ?? .sample))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DailyCardEntry>) -> Void) {
    let card = CardRepository.loadBundledCards().first ?? .sample
    let entry = DailyCardEntry(date: .now, card: card)
    let nextUpdate = Calendar.current.date(byAdding: .hour, value: 6, to: .now) ?? .now
    completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
  }
}

struct DailyCardWidget: Widget {
  let kind = "MontessoriDailyCardWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: DailyCardProvider()) { entry in
      DailyCardWidgetView(entry: entry)
        .containerBackground(WidgetTheme.paper, for: .widget)
        .widgetURL(URL(string: "montessori-daily-cards://today"))
    }
    .configurationDisplayName("蒙氏每日卡片")
    .description("在主屏幕快速查看今日观察摘要。")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
  }
}

private struct DailyCardWidgetView: View {
  @Environment(\.widgetFamily) private var family
  var entry: DailyCardEntry

  var body: some View {
    switch family {
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 3) {
        Text(entry.card.title)
          .font(.headline)
          .lineLimit(1)
        Text(entry.card.reviewPrompts.first ?? entry.card.subtitle)
          .font(.caption)
          .lineLimit(2)
      }
    case .systemMedium:
      HStack(spacing: 12) {
        imagePreview
          .frame(width: 92)
        summary
      }
    default:
      summary
    }
  }

  private var summary: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text(entry.card.dateLabel)
          .font(.caption.weight(.bold))
          .foregroundStyle(WidgetTheme.amber)
        Spacer()
        Image(systemName: entry.card.needsParentReview ? "checklist" : "checkmark.seal")
          .foregroundStyle(WidgetTheme.leaf)
      }

      Text(entry.card.title)
        .font(.headline.weight(.bold))
        .foregroundStyle(WidgetTheme.ink)
        .lineLimit(2)

      Text(entry.card.reviewPrompts.first ?? entry.card.subtitle)
        .font(.caption)
        .foregroundStyle(WidgetTheme.muted)
        .lineLimit(2)

      Spacer(minLength: 0)

      Label("打开复核", systemImage: "arrow.up.right")
        .font(.caption2.weight(.bold))
        .foregroundStyle(WidgetTheme.blue)
    }
  }

  private var imagePreview: some View {
    ZStack {
      if let imageName = entry.card.imageName {
        Image(imageName)
          .resizable()
          .scaledToFill()
      } else {
        Image(systemName: "rectangle.stack")
          .font(.largeTitle)
          .foregroundStyle(WidgetTheme.leaf)
      }
    }
    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
  }
}

private enum WidgetTheme {
  static let paper = Color(red: 0.97, green: 0.95, blue: 0.91)
  static let ink = Color(red: 0.15, green: 0.19, blue: 0.18)
  static let muted = Color(red: 0.42, green: 0.45, blue: 0.43)
  static let leaf = Color(red: 0.26, green: 0.45, blue: 0.37)
  static let blue = Color(red: 0.18, green: 0.37, blue: 0.53)
  static let amber = Color(red: 0.72, green: 0.43, blue: 0.18)
}

#Preview(as: .systemMedium) {
  DailyCardWidget()
} timeline: {
  DailyCardEntry(date: .now, card: .sample)
}
