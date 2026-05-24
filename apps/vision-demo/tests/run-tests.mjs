import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { projectRoot } from "../src/env.mjs";
import { canonicalTestsetRoot, defaultTestsetPath, loadTestset } from "../src/dataset.mjs";
import { buildDailyCardPayload, observationToDailyCard } from "../src/daily-card.mjs";
import { parseModelJson } from "../src/openrouter-client.mjs";
import { scoreItem } from "../src/score.mjs";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const { dir, items } = loadTestset();
assert(defaultTestsetPath === path.join(canonicalTestsetRoot, "testset.jsonl"), "Default test set should use the canonical research fixtures.");
assert(items.length === 15, `Expected 15 Montessori test items, got ${items.length}`);
for (const item of items) {
  assert(item.id && item.question && item.expected_answer, `Incomplete test item: ${JSON.stringify(item)}`);
  for (const imagePath of item.images || []) {
    assert(fs.existsSync(path.resolve(dir, imagePath)), `Missing image for ${item.id}: ${imagePath}`);
  }
}

assert(scoreItem(items[0], "这是粉红塔活动"), "Scorer should accept contains_any answer.");
assert(scoreItem(items.find((item) => item.id === "ms_012"), "2"), "Scorer should accept numeric answer.");
const parsed = parseModelJson("```json\n{\"test_answer\":\"粉红塔\",\"observation\":{\"confidence\":\"high\"}}\n```");
assert(parsed.test_answer === "粉红塔", "Model JSON parser should strip markdown fences.");

const schema = JSON.parse(fs.readFileSync(path.join(projectRoot, "schemas", "montessori_observation.schema.json"), "utf8"));
assert(schema.required.includes("observation"), "Schema should require observation.");

const dailyCardPayload = buildDailyCardPayload({ now: new Date("2026-05-23T08:00:00.000Z") });
assert(dailyCardPayload.daily_card.privacy.noDiagnosis, "Daily card should preserve no-diagnosis boundary.");
assert(dailyCardPayload.daily_card.reviewPrompts.length > 0, "Daily card should include review prompts.");
const convertedCard = observationToDailyCard({
  saved_at: "2026-05-23T08:00:00.000Z",
  source: "test",
  observation: {
    test_answer: "粉红塔",
    observation: {
      activity_label: "粉红塔",
      activity_category: "sensorial",
      materials: ["粉红塔"],
      work_area: "floor_mat",
      child_action: "working",
      environment_cues: ["工作毯已铺开"],
      safety_cues: [],
      confidence: "high",
      evidence: ["粉红塔在工作毯上"],
      needs_parent_review: true,
      privacy_boundary: {
        no_identity: true,
        no_emotion: true,
        no_diagnosis: true,
        no_scoring: true
      }
    }
  }
});
assert(convertedCard.title === "粉红塔", "Observation should convert to daily card title.");
assert(convertedCard.workArea === "地垫", "Observation work area should be localized.");

const filesToScan = [
  path.join(projectRoot, "README.md"),
  path.join(projectRoot, "src", "server.mjs"),
  path.join(projectRoot, "src", "evaluate.mjs"),
  path.join(projectRoot, "public", "app.js")
];
for (const filePath of filesToScan) {
  const content = fs.readFileSync(filePath, "utf8");
  const keyPrefix = "sk-" + "or-v1-";
  assert(!content.includes(keyPrefix), `Secret-like OpenRouter key found in ${filePath}`);
}

const appJs = fs.readFileSync(path.join(projectRoot, "public", "app.js"), "utf8");
assert(appJs.includes("关闭摄像头"), "Camera button should switch to close-camera text.");
assert(appJs.includes("getTracks().forEach"), "Camera close action should stop media tracks.");

const iosRoot = path.join(projectRoot, "ios");
const iosRequiredFiles = [
  "MontessoriDailyCards.xcodeproj/project.pbxproj",
  "MontessoriDailyCards.xcodeproj/xcshareddata/xcschemes/MontessoriDailyCards.xcscheme",
  "MontessoriDailyCards/MontessoriDailyCardsApp.swift",
  "MontessoriDailyCards/Views/ContentView.swift",
  "MontessoriDailyCards/System/MontessoriDailyIntents.swift",
  "MontessoriDailyCardsWidget/DailyCardWidget.swift",
  "MontessoriDailyCards/Resources/DailyCardsSeed.json",
  "MontessoriDailyCards/PrivacyInfo.xcprivacy",
  "MontessoriDailyCardsWidget/PrivacyInfo.xcprivacy",
  "TestFlight/ExportOptions.plist",
  "TestFlight/README.md"
];
for (const relativePath of iosRequiredFiles) {
  assert(fs.existsSync(path.join(iosRoot, relativePath)), `Missing iOS MVP file: ${relativePath}`);
}
const seedCards = JSON.parse(fs.readFileSync(path.join(iosRoot, "MontessoriDailyCards", "Resources", "DailyCardsSeed.json"), "utf8"));
assert(seedCards.length >= 2, "iOS seed data should include at least two cards.");
assert(seedCards.every((card) => card.privacy?.noDiagnosis && card.privacy?.noScoring), "iOS seed data must preserve privacy boundaries.");
const pbxproj = fs.readFileSync(path.join(iosRoot, "MontessoriDailyCards.xcodeproj", "project.pbxproj"), "utf8");
for (const token of ["MontessoriDailyCardsWidget.appex", "DailyCardsSeed.json", "MontessoriDailyIntents.swift", "DailyCardWidget.swift"]) {
  assert(pbxproj.includes(token), `Xcode project should reference ${token}.`);
}
assert(pbxproj.includes("PrivacyInfo.xcprivacy in Resources"), "Xcode project should bundle privacy manifests.");
const appPlist = fs.readFileSync(path.join(iosRoot, "MontessoriDailyCards", "Info.plist"), "utf8");
const widgetPlist = fs.readFileSync(path.join(iosRoot, "MontessoriDailyCardsWidget", "Info.plist"), "utf8");
assert(appPlist.includes("ITSAppUsesNonExemptEncryption"), "App plist should declare export-compliance encryption key.");
assert(widgetPlist.includes("ITSAppUsesNonExemptEncryption"), "Widget plist should declare export-compliance encryption key.");
const appPrivacy = fs.readFileSync(path.join(iosRoot, "MontessoriDailyCards", "PrivacyInfo.xcprivacy"), "utf8");
assert(appPrivacy.includes("NSPrivacyCollectedDataTypes") && appPrivacy.includes("NSPrivacyTracking"), "Privacy manifest should include tracking and data collection declarations.");
const exportOptions = fs.readFileSync(path.join(iosRoot, "TestFlight", "ExportOptions.plist"), "utf8");
assert(exportOptions.includes("app-store-connect") && exportOptions.includes("upload"), "TestFlight export options should target App Store Connect upload.");
const widgetSwift = fs.readFileSync(path.join(iosRoot, "MontessoriDailyCardsWidget", "DailyCardWidget.swift"), "utf8");
assert(widgetSwift.includes("montessori-daily-cards://today"), "Widget should deep-link into the app.");
assert(fs.existsSync(path.join(projectRoot, "public", "ios-preview.html")), "Browser iPhone preview page should exist.");
const iosContentView = fs.readFileSync(path.join(iosRoot, "MontessoriDailyCards", "Views", "ContentView.swift"), "utf8");
const iosDailyCardViews = fs.readFileSync(path.join(iosRoot, "MontessoriDailyCards", "Views", "DailyCardViews.swift"), "utf8");
assert(!iosContentView.includes("PrivacyBoundaryView"), "iOS app should keep privacy boundaries implicit, not visible.");
assert(!iosDailyCardViews.includes('Label("边界"'), "iOS app should not render literal boundary labels.");
const iosPreview = fs.readFileSync(path.join(projectRoot, "public", "ios-preview.js"), "utf8");
assert(iosPreview.includes("/api/daily-card"), "Browser iPhone preview should use daily-card API.");
const iosPreviewHtml = fs.readFileSync(path.join(projectRoot, "public", "ios-preview.html"), "utf8");
assert(!iosPreviewHtml.includes("boundary-block") && !iosPreviewHtml.includes("<h3>边界</h3>"), "Browser preview should not render boundary block.");

const outDir = path.join(projectRoot, "output", "test-mock");
fs.rmSync(outDir, { recursive: true, force: true });
const result = spawnSync(process.execPath, ["./src/evaluate.mjs", "--mock", "--limit", "3", "--out", outDir], {
  cwd: projectRoot,
  encoding: "utf8"
});
assert(result.status === 0, `Mock evaluation failed:\n${result.stdout}\n${result.stderr}`);
const summary = JSON.parse(fs.readFileSync(path.join(outDir, "summary.json"), "utf8"));
assert(summary.correct === 3 && summary.total === 3, `Unexpected mock summary: ${JSON.stringify(summary)}`);

console.log("All local tests passed.");
