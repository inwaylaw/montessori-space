const normalize = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/[\s\p{P}\p{S}]+/gu, "");

const extractNumber = (value) => {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
};

export const scoreItem = (item, answer) => {
  const raw = String(answer ?? "");
  const norm = normalize(raw);
  const variants = [item.expected_answer, ...(item.acceptable_answers || [])]
    .map(normalize)
    .filter(Boolean);

  if (item.answer_type === "numeric") {
    const actual = extractNumber(raw);
    if (!Number.isFinite(actual)) return false;
    const expected = Number(item.numeric_value);
    const tolerance = Number(item.tolerance || 0);
    return Math.abs(actual - expected) <= tolerance;
  }

  if (item.answer_type === "exact") {
    return variants.some((variant) => norm === variant);
  }

  if (item.answer_type === "contains_all") {
    const keywords = (item.expected_keywords?.length ? item.expected_keywords : variants)
      .map(normalize)
      .filter(Boolean);
    return keywords.every((keyword) => norm.includes(keyword));
  }

  return variants.some((variant) => norm.includes(variant));
};

export const summarizeRecords = (records, model) => {
  const correct = records.filter((record) => record.correct).length;
  const errors = records.filter((record) => record.error).length;
  const latencies = records.map((record) => record.latency_ms).filter(Number.isFinite);
  const avgLatencyMs = latencies.length
    ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
    : null;

  return {
    model,
    total: records.length,
    correct,
    score_percent: records.length ? Number(((correct / records.length) * 100).toFixed(1)) : 0,
    errors,
    avg_latency_ms: avgLatencyMs
  };
};
