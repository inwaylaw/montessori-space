import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./env.mjs";
import { readJsonl } from "./jsonl.mjs";

export const fallbackDailyCard = {
  id: "fallback-today",
  dateLabel: "今日",
  title: "合成倒水练习",
  subtitle: "日常生活",
  activityCategory: "practical_life",
  confidence: "medium",
  workArea: "桌面",
  childAction: "操作中",
  materials: ["倒水托盘", "小水壶", "杯子"],
  environmentCues: ["托盘边缘有少量水滴", "材料仍在工作区"],
  safetyCues: [],
  evidence: ["合成样本：倒水练习托盘有水滴"],
  reviewPrompts: [
    "确认水滴是否需要家长处理",
    "确认材料是否已经归位"
  ],
  needsParentReview: true,
  sourceName: "bundled synthetic fallback",
  imageName: "10_daily_report_preview",
  privacy: {
    noIdentity: true,
    noEmotion: true,
    noDiagnosis: true,
    noScoring: true
  }
};

const labels = {
  practical_life: "日常生活",
  sensorial: "感官",
  language: "语言",
  math: "数学",
  art: "艺术",
  movement: "运动",
  order_return: "归位与秩序",
  environment: "环境线索",
  unknown: "待确认"
};

const workAreaLabels = {
  floor_mat: "地垫",
  table: "桌面",
  shelf: "架面",
  multiple: "多个工作区",
  unknown: "待确认"
};

const actionLabels = {
  taking_material: "取用材料",
  working: "操作中",
  returning_material: "归位中",
  waiting: "等待中",
  mixed: "多阶段",
  unknown: "待确认"
};

const asArray = (value) => Array.isArray(value) ? value.filter(Boolean).map(String) : [];

const unwrapModelOutput = (value) => {
  if (value?.observation?.observation) return value.observation;
  if (value?.result?.observation) return value.result;
  return value?.observation ? value : { observation: value || {} };
};

const reviewPromptsFor = (observation) => {
  const prompts = [];
  if (observation.needs_parent_review) {
    prompts.push("确认活动名称、材料和现场备注是否匹配");
  }
  if (asArray(observation.safety_cues).length > 0) {
    prompts.push("先处理安全线索，再保存为成长记录");
  }
  if (asArray(observation.environment_cues).length > 0) {
    prompts.push("补充家长观察：环境线索是否影响后续活动");
  }
  if (prompts.length === 0) {
    prompts.push("补充一句家长观察，避免把模型输出当作结论");
  }
  return prompts.slice(0, 3);
};

export const observationToDailyCard = (record, now = new Date()) => {
  const modelOutput = unwrapModelOutput(record);
  const observation = modelOutput.observation || {};
  const category = observation.activity_category || "unknown";
  const activityLabel = observation.activity_label || modelOutput.test_answer || "待确认观察";
  const evidence = asArray(observation.evidence);

  return {
    id: `daily-${record?.saved_at || now.toISOString()}`,
    dateLabel: now.toLocaleDateString("zh-CN", { month: "long", day: "numeric" }),
    title: activityLabel,
    subtitle: labels[category] || labels.unknown,
    activityCategory: category,
    confidence: observation.confidence || "low",
    workArea: workAreaLabels[observation.work_area] || workAreaLabels.unknown,
    childAction: actionLabels[observation.child_action] || actionLabels.unknown,
    materials: asArray(observation.materials),
    environmentCues: asArray(observation.environment_cues),
    safetyCues: asArray(observation.safety_cues),
    evidence: evidence.length > 0 ? evidence : [`模型短答：${modelOutput.test_answer || "无"}`],
    reviewPrompts: reviewPromptsFor(observation),
    needsParentReview: Boolean(observation.needs_parent_review ?? true),
    sourceName: record?.source || "manual-ui",
    imageName: "10_daily_report_preview",
    privacy: {
      noIdentity: observation.privacy_boundary?.no_identity !== false,
      noEmotion: observation.privacy_boundary?.no_emotion !== false,
      noDiagnosis: observation.privacy_boundary?.no_diagnosis !== false,
      noScoring: observation.privacy_boundary?.no_scoring !== false
    }
  };
};

export const loadLatestManualObservation = (root = projectRoot) => {
  const logPath = path.join(root, "output", "manual-observations.jsonl");
  if (!fs.existsSync(logPath)) return null;
  const records = readJsonl(logPath);
  return records.at(-1) || null;
};

export const buildDailyCardPayload = ({ root = projectRoot, now = new Date() } = {}) => {
  const latest = loadLatestManualObservation(root);
  const dailyCard = latest ? observationToDailyCard(latest, now) : { ...fallbackDailyCard };

  return {
    ok: true,
    generated_at: now.toISOString(),
    source: latest ? "manual-observations" : "fallback",
    stores_raw_images: false,
    daily_card: dailyCard
  };
};
