import SwiftUI

struct ContentView: View {
  @Environment(CardStore.self) private var store
  @Environment(AppIntentRouter.self) private var intentRouter

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 18) {
          HeaderView(syncState: store.syncState) {
            Task { await store.syncFromLocalDemo() }
          }

          DailyCardHero(card: store.selectedCard)

          ReviewPanel(card: store.selectedCard)

          ObservationFactsView(card: store.selectedCard)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 20)
      }
      .background(MontessoriTheme.paper.ignoresSafeArea())
      .navigationTitle("每日卡片")
      .toolbar {
        ToolbarItemGroup(placement: .topBarTrailing) {
          Button {
            store.selectFirstReview()
          } label: {
            Label("需确认", systemImage: "checklist")
          }

          Link(destination: URL(string: "http://127.0.0.1:8787")!) {
            Label("Web 演示", systemImage: "safari")
          }
        }
      }
      .onOpenURL(perform: handleURL)
      .onChange(of: intentRouter.destination) { _, destination in
        handleIntentDestination(destination)
      }
    }
  }

  private func handleURL(_ url: URL) {
    let route = url.host ?? url.pathComponents.dropFirst().first
    switch route {
    case "review":
      store.selectFirstReview()
    default:
      store.selectToday()
    }
  }

  private func handleIntentDestination(_ destination: IntentDestination?) {
    guard let destination else { return }
    switch destination {
    case .today:
      store.selectToday()
    case .review:
      store.selectFirstReview()
    }
    intentRouter.destination = nil
  }
}

private struct HeaderView: View {
  var syncState: SyncState
  var onSync: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .top, spacing: 12) {
        VStack(alignment: .leading, spacing: 5) {
          Text("Montessori Space")
            .font(.caption.weight(.bold))
            .foregroundStyle(MontessoriTheme.amber)
          Text("今日观察预览")
            .font(.system(size: 31, weight: .bold, design: .rounded))
            .foregroundStyle(MontessoriTheme.ink)
        }

        Spacer()

        Button(action: onSync) {
          if syncState.isSyncing {
            ProgressView()
              .controlSize(.small)
          } else {
            Label("同步演示台", systemImage: "arrow.triangle.2.circlepath")
          }
        }
        .buttonStyle(.borderedProminent)
        .tint(MontessoriTheme.leaf)
        .disabled(syncState.isSyncing)
      }

      Label(syncState.label, systemImage: syncState.symbolName)
        .font(.subheadline.weight(.medium))
        .foregroundStyle(MontessoriTheme.blue)
    }
  }
}

#Preview {
  ContentView()
    .environment(CardStore())
    .environment(AppIntentRouter.shared)
}
