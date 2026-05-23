const $ = (id) => document.getElementById(id);

const elements = {
  video: $("video"),
  canvas: $("canvas"),
  samplePreview: $("samplePreview"),
  status: $("runtimeStatus"),
  startCamera: $("startCamera"),
  captureFrame: $("captureFrame"),
  analyzeFrame: $("analyzeFrame"),
  saveObservation: $("saveObservation"),
  sampleSelect: $("sampleSelect"),
  fileInput: $("fileInput"),
  note: $("note"),
  jsonOutput: $("jsonOutput"),
  activityLabel: $("activityLabel"),
  activityCategory: $("activityCategory"),
  confidence: $("confidence"),
  reviewFlag: $("reviewFlag")
};

let currentFrame = "";
let currentObservation = null;
let stream = null;

const setStatus = (message, isError = false) => {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
};

const showJson = (value) => {
  elements.jsonOutput.textContent = JSON.stringify(value, null, 2);
};

const setStageMode = (mode) => {
  elements.video.style.display = mode === "video" ? "block" : "none";
  elements.canvas.style.display = mode === "canvas" ? "block" : "none";
  elements.samplePreview.style.display = mode === "sample" ? "block" : "none";
};

const drawImageToCanvas = (source) => {
  const maxWidth = 1280;
  const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
  const ratio = sourceWidth > maxWidth ? maxWidth / sourceWidth : 1;
  elements.canvas.width = Math.round(sourceWidth * ratio);
  elements.canvas.height = Math.round(sourceHeight * ratio);
  const ctx = elements.canvas.getContext("2d");
  ctx.drawImage(source, 0, 0, elements.canvas.width, elements.canvas.height);
  currentFrame = elements.canvas.toDataURL("image/jpeg", 0.84);
  setStageMode("canvas");
  setStatus(`已截取 ${elements.canvas.width}x${elements.canvas.height}`);
};

const loadConfig = async () => {
  const response = await fetch("/api/config");
  const config = await response.json();
  setStatus(config.has_api_key ? `模型 ${config.model}` : "缺少 API key", !config.has_api_key);
  elements.sampleSelect.innerHTML = config.samples.map((sample) => (
    `<option value="${sample}">${sample.split("/").pop()}</option>`
  )).join("");
};

const loadSelectedSample = async () => {
  const src = elements.sampleSelect.value;
  if (!src) return;
  elements.samplePreview.src = src;
  await elements.samplePreview.decode();
  drawImageToCanvas(elements.samplePreview);
};

const syncCameraButton = () => {
  const isActive = Boolean(stream);
  elements.startCamera.textContent = isActive ? "关闭摄像头" : "启用摄像头";
  elements.startCamera.classList.toggle("secondary", isActive);
};

const stopCamera = () => {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
  stream = null;
  elements.video.pause();
  elements.video.srcObject = null;
  syncCameraButton();
  setStatus("摄像头已关闭");
  if (currentFrame) {
    setStageMode("canvas");
  } else {
    loadSelectedSample();
  }
};

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
      audio: false
    });
    elements.video.srcObject = stream;
    await elements.video.play();
    syncCameraButton();
    setStageMode("video");
    setStatus("摄像头已启用");
  } catch (error) {
    setStatus(error.message, true);
  }
};

elements.startCamera.addEventListener("click", async () => {
  if (stream) {
    stopCamera();
    return;
  }
  await startCamera();
});

elements.captureFrame.addEventListener("click", () => {
  if (!stream) {
    loadSelectedSample();
    return;
  }
  drawImageToCanvas(elements.video);
});

elements.sampleSelect.addEventListener("change", loadSelectedSample);

elements.fileInput.addEventListener("change", async () => {
  const file = elements.fileInput.files?.[0];
  if (!file) return;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  elements.samplePreview.src = dataUrl;
  await elements.samplePreview.decode();
  drawImageToCanvas(elements.samplePreview);
});

elements.analyzeFrame.addEventListener("click", async () => {
  try {
    if (!currentFrame) await loadSelectedSample();
    elements.analyzeFrame.disabled = true;
    setStatus("识别中");
    const response = await fetch("/api/analyze-frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: currentFrame, note: elements.note.value })
    });
    const payload = await response.json();
    if (!response.ok || payload.error) throw new Error(payload.error || `HTTP ${response.status}`);
    currentObservation = payload.result;
    showJson(payload);
    const observation = payload.result?.observation || {};
    elements.activityLabel.textContent = observation.activity_label || payload.result?.test_answer || "未识别";
    elements.activityCategory.textContent = observation.activity_category || "-";
    elements.confidence.textContent = observation.confidence || "-";
    elements.reviewFlag.textContent = observation.needs_parent_review ? "需要" : "不需要";
    elements.saveObservation.disabled = false;
    setStatus(`完成 ${payload.latency_ms}ms`);
  } catch (error) {
    setStatus(error.message, true);
    showJson({ error: error.message });
  } finally {
    elements.analyzeFrame.disabled = false;
  }
});

elements.saveObservation.addEventListener("click", async () => {
  if (!currentObservation) return;
  const response = await fetch("/api/save-observation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "manual-ui", observation: currentObservation })
  });
  const payload = await response.json();
  if (payload.ok) setStatus(`已保存 ${payload.path}`);
});

loadConfig()
  .then(() => {
    syncCameraButton();
    return loadSelectedSample();
  })
  .catch((error) => setStatus(error.message, true));
