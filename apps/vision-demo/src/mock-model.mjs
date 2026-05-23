const categoryByEvalCategory = {
  material_recognition: "sensorial",
  work_area: "environment",
  activity_type: "practical_life",
  environment_cue: "environment",
  order_return: "order_return",
  observation_tag: "order_return",
  safety_cue: "environment",
  privacy_boundary: "environment",
  multi_frame_event: "order_return",
  counting_work_areas: "environment",
  space_layout: "environment",
  report_reading: "environment"
};

export const mockObservationForItem = (item) => ({
  test_answer: item.expected_answer,
  observation: {
    activity_label: item.expected_answer,
    activity_category: categoryByEvalCategory[item.category] || "unknown",
    materials: item.acceptable_answers?.slice(0, 2) || [],
    work_area: item.category === "work_area" ? "floor_mat" : "unknown",
    child_action: item.category === "multi_frame_event" ? "mixed" : "working",
    environment_cues: item.category.includes("environment") || item.category.includes("order") ? [item.expected_answer] : [],
    safety_cues: item.category === "safety_cue" ? [item.expected_answer] : [],
    confidence: "high",
    evidence: [`mock fixture for ${item.id}`],
    needs_parent_review: true,
    privacy_boundary: {
      no_identity: true,
      no_emotion: true,
      no_diagnosis: true,
      no_scoring: true
    },
    corpus_tags: [item.category, item.id]
  }
});
