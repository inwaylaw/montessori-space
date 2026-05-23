import Foundation
import Observation

enum IntentDestination: String, Codable, Equatable {
  case today
  case review
}

@MainActor
@Observable
final class AppIntentRouter {
  static let shared = AppIntentRouter()
  var destination: IntentDestination?

  private init() {}
}
