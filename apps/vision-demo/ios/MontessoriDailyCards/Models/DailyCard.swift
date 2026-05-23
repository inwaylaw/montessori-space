import Foundation

struct DailyCard: Codable, Hashable, Identifiable {
  var id: String
  var dateLabel: String
  var title: String
  var subtitle: String
  var activityCategory: String
  var confidence: Confidence
  var workArea: String
  var childAction: String
  var materials: [String]
  var environmentCues: [String]
  var safetyCues: [String]
  var evidence: [String]
  var reviewPrompts: [String]
  var needsParentReview: Bool
  var sourceName: String
  var imageName: String?
  var privacy: PrivacyBoundary

  static let sample = DailyCard(
    id: "sample-card",
    dateLabel: "今日",
    title: "合成倒水练习",
    subtitle: "日常生活",
    activityCategory: "practical_life",
    confidence: .medium,
    workArea: "桌面",
    childAction: "操作中",
    materials: ["倒水托盘", "小水壶", "杯子"],
    environmentCues: ["托盘边缘有少量水滴", "材料仍在工作区"],
    safetyCues: [],
    evidence: ["合成样本：倒水练习托盘有水滴"],
    reviewPrompts: ["确认水滴是否需要家长处理", "确认材料是否已经归位"],
    needsParentReview: true,
    sourceName: "bundled sample",
    imageName: "10_daily_report_preview",
    privacy: PrivacyBoundary()
  )
}

enum Confidence: String, Codable, Hashable {
  case low
  case medium
  case high

  var title: String {
    switch self {
    case .low: "低"
    case .medium: "中"
    case .high: "高"
    }
  }

  var symbolName: String {
    switch self {
    case .low: "exclamationmark.circle"
    case .medium: "circle.lefthalf.filled"
    case .high: "checkmark.seal"
    }
  }
}

struct PrivacyBoundary: Codable, Hashable {
  var noIdentity = true
  var noEmotion = true
  var noDiagnosis = true
  var noScoring = true
}
