const $ = (id) => document.getElementById(id);

const elements = {
  sourceLabel: $("sourceLabel"),
  rawImageLabel: $("rawImageLabel"),
  syncButton: $("syncButton"),
  phoneSyncButton: $("phoneSyncButton"),
  appScreen: $("appScreen"),
  widgetScreen: $("widgetScreen"),
  heroImage: $("heroImage"),
  dateLabel: $("dateLabel"),
  cardTitle: $("cardTitle"),
  categoryLabel: $("categoryLabel"),
  confidenceLabel: $("confidenceLabel"),
  reviewLabel: $("reviewLabel"),
  reviewList: $("reviewList"),
  workAreaLabel: $("workAreaLabel"),
  actionLabel: $("actionLabel"),
  materialChips: $("materialChips"),
  cueChips: $("cueChips"),
  widgetDate: $("widgetDate"),
  widgetBadge: $("widgetBadge"),
  widgetTitle: $("widgetTitle"),
  widgetPrompt: $("widgetPrompt")
};

const confidenceText = {
  low: "低",
  medium: "中",
  high: "高"
};

const fallbackCard = {
  id: "fallback-browser-preview",
  dateLabel: "今日",
  title: "合成倒水练习",
  subtitle: "日常生活",
  confidence: "medium",
  workArea: "桌面",
  childAction: "操作中",
  materials: ["倒水托盘", "小水壶", "杯子"],
  environmentCues: ["托盘边缘有少量水滴", "材料仍在工作区"],
  safetyCues: [],
  reviewPrompts: ["确认水滴是否需要家长处理", "确认材料是否已经归位"],
  needsParentReview: true,
  imageName: "10_daily_report_preview",
  privacy: {
    noIdentity: true,
    noEmotion: true,
    noDiagnosis: true,
    noScoring: true
  }
};

let currentCard = fallbackCard;
let currentMode = "today";

const setLoading = (isLoading) => {
  elements.syncButton.classList.toggle("loading", isLoading);
  elements.phoneSyncButton.classList.toggle("loading", isLoading);
  elements.syncButton.disabled = isLoading;
  elements.phoneSyncButton.disabled = isLoading;
};

const imageForCard = (card) => (
  card.imageName ? `/testset/images/${card.imageName}.png` : "/testset/images/10_daily_report_preview.png"
);

const chips = (root, values, fallback) => {
  const items = (values && values.length > 0 ? values : [fallback]).slice(0, 6);
  root.replaceChildren(...items.map((value) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = value;
    return chip;
  }));
};

const renderPrompts = (prompts) => {
  elements.reviewList.replaceChildren(...prompts.map((prompt) => {
    const item = document.createElement("li");
    item.textContent = prompt;
    return item;
  }));
};

const renderCard = (card) => {
  const reviewPrompts = card.reviewPrompts?.length ? card.reviewPrompts : ["请家长复核后再保存"];
  const cues = [...(card.environmentCues || []), ...(card.safetyCues || [])];
  elements.heroImage.src = imageForCard(card);
  elements.dateLabel.textContent = card.dateLabel || "今日";
  elements.cardTitle.textContent = card.title || "待确认观察";
  elements.categoryLabel.textContent = card.subtitle || card.activityCategory || "待确认";
  elements.confidenceLabel.textContent = confidenceText[card.confidence] || card.confidence || "低";
  elements.reviewLabel.textContent = card.needsParentReview ? "需要" : "不需要";
  renderPrompts(reviewPrompts);
  elements.workAreaLabel.textContent = card.workArea || "待确认";
  elements.actionLabel.textContent = card.childAction || "待确认";
  chips(elements.materialChips, card.materials, "材料待确认");
  chips(elements.cueChips, cues, "暂无明显线索");

  elements.widgetDate.textContent = card.dateLabel || "今日";
  elements.widgetBadge.textContent = card.needsParentReview ? "需复核" : "已确认";
  elements.widgetTitle.textContent = card.title || "待确认观察";
  elements.widgetPrompt.textContent = reviewPrompts[0];
};

const renderMode = (mode) => {
  currentMode = mode;
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
    button.setAttribute("aria-selected", String(button.dataset.mode === mode));
  });
  const showWidget = mode === "widget";
  elements.widgetScreen.hidden = !showWidget;
  elements.appScreen.hidden = showWidget;

  if (mode === "review") {
    elements.appScreen.scrollTo({ top: 280, behavior: "smooth" });
  } else if (mode === "today") {
    elements.appScreen.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const syncCard = async () => {
  setLoading(true);
  try {
    const response = await fetch("/api/daily-card", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || payload.error) throw new Error(payload.error || `HTTP ${response.status}`);
    currentCard = payload.daily_card || fallbackCard;
    elements.sourceLabel.textContent = payload.source || "daily-card";
    elements.rawImageLabel.textContent = payload.stores_raw_images ? "可能保存" : "不保存";
  } catch (error) {
    currentCard = fallbackCard;
    elements.sourceLabel.textContent = "内置样例";
    elements.rawImageLabel.textContent = "不保存";
  } finally {
    renderCard(currentCard);
    renderMode(currentMode);
    setLoading(false);
  }
};

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => renderMode(button.dataset.mode));
});

elements.syncButton.addEventListener("click", syncCard);
elements.phoneSyncButton.addEventListener("click", syncCard);

renderCard(currentCard);
syncCard();
