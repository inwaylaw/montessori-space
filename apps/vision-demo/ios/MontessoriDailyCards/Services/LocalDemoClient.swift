import Foundation

struct DailyCardPayload: Decodable {
  var ok: Bool
  var generatedAt: String
  var source: String
  var storesRawImages: Bool
  var dailyCard: DailyCard
}

struct LocalDemoClient {
  var baseURL = URL(string: "http://127.0.0.1:8787")!
  var session: URLSession = .shared

  func fetchDailyCard() async throws -> DailyCardPayload {
    let url = URL(string: "api/daily-card", relativeTo: baseURL)!
    let (data, response) = try await session.data(from: url)
    guard let httpResponse = response as? HTTPURLResponse,
          (200..<300).contains(httpResponse.statusCode) else {
      throw URLError(.badServerResponse)
    }

    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    return try decoder.decode(DailyCardPayload.self, from: data)
  }
}
