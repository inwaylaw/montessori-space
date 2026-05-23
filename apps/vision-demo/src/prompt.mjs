export const allowedCategories = [
  "practical_life",
  "sensorial",
  "language",
  "math",
  "art",
  "movement",
  "order_return",
  "environment",
  "unknown"
];

const schemaText = `{
  "test_answer": "string, answer to the evaluation question",
  "observation": {
    "activity_label": "short visible activity label",
    "activity_category": "one of: ${allowedCategories.join(", ")}",
    "materials": ["visible Montessori material or object names"],
    "work_area": "floor_mat | table | shelf | multiple | unknown",
    "child_action": "taking_material | working | returning_material | waiting | mixed | unknown",
    "environment_cues": ["visible order, spill, layout, or return-to-shelf cues"],
    "safety_cues": ["visible safety cues only"],
    "confidence": "low | medium | high",
    "evidence": ["short visual evidence, no identity"],
    "needs_parent_review": true,
    "privacy_boundary": {
      "no_identity": true,
      "no_emotion": true,
      "no_diagnosis": true,
      "no_scoring": true
    },
    "corpus_tags": ["stable labels for retrieval and evaluation"]
  }
}`;

export const buildEvaluationMessages = (item, imageContent) => [
  {
    role: "system",
    content: [
      "You are a Montessori Space visual observation assistant.",
      "Only describe visible activity, objects, work area, order cues, and safety cues.",
      "Never identify a child, infer emotion, diagnose, score the child, or make parenting judgments.",
      "Return one valid JSON object only. Do not wrap it in markdown."
    ].join(" ")
  },
  {
    role: "user",
    content: [
      {
        type: "text",
        text: [
          "请按蒙氏空间语料标准观察画面，并回答评测问题。",
          "输出必须严格符合这个 JSON 结构：",
          schemaText,
          `评测问题：${item.question}`,
          [
            "test_answer 要尽量短，并优先使用具体教具、材料、动作或环境线索名称。",
            "不要只回答宽泛类别，例如能说“粉红塔”就不要只说“感官教具”，能说“剪纸/美工材料”就不要只说“艺术材料”。",
            "多帧顺序题要写动作顺序，不要只写 A/B/C 或第一帧/第二帧。",
            "环境线索题要同时写对象和状态，例如“托盘有水滴”。",
            "observation 要记录可见证据，不能包含身份、情绪、诊断或儿童评分。"
          ].join("\n")
        ].join("\n")
      },
      ...imageContent
    ]
  }
];

export const buildLiveMessages = ({ imageDataUrl, note = "" }) => [
  {
    role: "system",
    content: [
      "You are a Montessori Space visual observation assistant for a local prototype.",
      "Only describe visible Montessori activity, materials, work area, order cues, and safety cues.",
      "Never identify people, infer emotion, diagnose, score, or make claims about ability.",
      "Return one valid JSON object only. Do not wrap it in markdown."
    ].join(" ")
  },
  {
    role: "user",
    content: [
      {
        type: "text",
        text: [
          "请识别这一帧里最可能的蒙氏活动行为，并生成结构化观察。",
          note ? `现场备注：${note}` : "现场备注：无",
          "输出必须严格符合这个 JSON 结构：",
          schemaText,
          "test_answer 填写最短活动结论；所有字段只基于可见信息。"
        ].join("\n")
      },
      {
        type: "image_url",
        image_url: { url: imageDataUrl }
      }
    ]
  }
];
