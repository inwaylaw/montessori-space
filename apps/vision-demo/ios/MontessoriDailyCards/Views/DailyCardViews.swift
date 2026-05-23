import SwiftUI

enum MontessoriTheme {
  static let paper = Color(red: 0.97, green: 0.95, blue: 0.91)
  static let card = Color(red: 1.0, green: 0.99, blue: 0.96)
  static let ink = Color(red: 0.15, green: 0.19, blue: 0.18)
  static let muted = Color(red: 0.42, green: 0.45, blue: 0.43)
  static let line = Color(red: 0.85, green: 0.82, blue: 0.76)
  static let leaf = Color(red: 0.26, green: 0.45, blue: 0.37)
  static let blue = Color(red: 0.18, green: 0.37, blue: 0.53)
  static let amber = Color(red: 0.72, green: 0.43, blue: 0.18)
}

struct DailyCardHero: View {
  var card: DailyCard

  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      ZStack(alignment: .bottomLeading) {
        if let imageName = card.imageName {
          Image(imageName)
            .resizable()
            .scaledToFill()
        } else {
          Image(systemName: "rectangle.stack")
            .font(.system(size: 54))
            .foregroundStyle(MontessoriTheme.leaf)
            .frame(maxWidth: .infinity, minHeight: 190)
            .background(MontessoriTheme.paper)
        }

        VStack(alignment: .leading, spacing: 4) {
          Text(card.dateLabel)
            .font(.caption.weight(.bold))
          Text(card.title)
            .font(.title2.weight(.bold))
        }
        .foregroundStyle(.white)
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.black.opacity(0.36))
      }
      .frame(minHeight: 220)
      .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

      HStack(spacing: 10) {
        InfoPill(title: card.subtitle, systemImage: "square.grid.2x2")
        InfoPill(title: "置信度 \(card.confidence.title)", systemImage: card.confidence.symbolName)
        if card.needsParentReview {
          InfoPill(title: "需复核", systemImage: "person.crop.circle.badge.checkmark")
        }
      }
    }
    .panelStyle()
  }
}

struct ReviewPanel: View {
  var card: DailyCard

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Label("家长复核", systemImage: "checklist.checked")
        .font(.headline)
        .foregroundStyle(MontessoriTheme.ink)

      ForEach(card.reviewPrompts, id: \.self) { prompt in
        HStack(alignment: .top, spacing: 10) {
          Image(systemName: "circle")
            .font(.caption)
            .foregroundStyle(MontessoriTheme.amber)
            .padding(.top, 4)
          Text(prompt)
            .font(.body)
            .foregroundStyle(MontessoriTheme.ink)
        }
      }
    }
    .panelStyle()
  }
}

struct ObservationFactsView: View {
  var card: DailyCard

  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      Label("观察线索", systemImage: "eye")
        .font(.headline)
        .foregroundStyle(MontessoriTheme.ink)

      FactRow(title: "工作区", value: card.workArea, systemImage: "rectangle.inset.filled")
      FactRow(title: "动作", value: card.childAction, systemImage: "figure.child")
      ChipSection(title: "材料", values: card.materials, fallback: "待确认")
      ChipSection(title: "环境线索", values: card.environmentCues, fallback: "无明显线索")
      ChipSection(title: "安全线索", values: card.safetyCues, fallback: "无")

      VStack(alignment: .leading, spacing: 8) {
        Text("证据")
          .font(.subheadline.weight(.bold))
          .foregroundStyle(MontessoriTheme.muted)
        ForEach(card.evidence, id: \.self) { item in
          Text(item)
            .font(.callout)
            .foregroundStyle(MontessoriTheme.ink)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
      }
    }
    .panelStyle()
  }
}

private struct FactRow: View {
  var title: String
  var value: String
  var systemImage: String

  var body: some View {
    HStack(spacing: 10) {
      Image(systemName: systemImage)
        .foregroundStyle(MontessoriTheme.blue)
        .frame(width: 24)
      Text(title)
        .foregroundStyle(MontessoriTheme.muted)
      Spacer()
      Text(value)
        .fontWeight(.semibold)
        .foregroundStyle(MontessoriTheme.ink)
    }
  }
}

private struct ChipSection: View {
  var title: String
  var values: [String]
  var fallback: String

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(title)
        .font(.subheadline.weight(.bold))
        .foregroundStyle(MontessoriTheme.muted)

      FlowLayout(values: values.isEmpty ? [fallback] : values)
    }
  }
}

private struct FlowLayout: View {
  var values: [String]

  var body: some View {
    LazyVGrid(columns: [GridItem(.adaptive(minimum: 112), spacing: 8)], alignment: .leading, spacing: 8) {
      ForEach(values, id: \.self) { value in
        Text(value)
          .font(.callout.weight(.medium))
          .foregroundStyle(MontessoriTheme.ink)
          .lineLimit(2)
          .minimumScaleFactor(0.8)
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(.horizontal, 10)
          .padding(.vertical, 8)
          .background(MontessoriTheme.paper)
          .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
      }
    }
  }
}

private struct InfoPill: View {
  var title: String
  var systemImage: String

  var body: some View {
    Label(title, systemImage: systemImage)
      .font(.caption.weight(.bold))
      .foregroundStyle(MontessoriTheme.ink)
      .lineLimit(1)
      .minimumScaleFactor(0.8)
      .padding(.horizontal, 10)
      .padding(.vertical, 8)
      .background(MontessoriTheme.paper)
      .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
  }
}

private struct PanelStyle: ViewModifier {
  func body(content: Content) -> some View {
    content
      .padding(16)
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(MontessoriTheme.card)
      .overlay(
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .stroke(MontessoriTheme.line, lineWidth: 1)
      )
      .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
  }
}

private extension View {
  func panelStyle() -> some View {
    modifier(PanelStyle())
  }
}
