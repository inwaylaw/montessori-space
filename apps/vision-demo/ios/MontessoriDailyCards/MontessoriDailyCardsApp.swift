import SwiftUI

@main
struct MontessoriDailyCardsApp: App {
  @State private var cardStore = CardStore()
  @State private var intentRouter = AppIntentRouter.shared

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environment(cardStore)
        .environment(intentRouter)
    }
  }
}
