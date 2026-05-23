import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./env.mjs";
import { readJsonl } from "./jsonl.mjs";

export const defaultTestsetPath = path.join(projectRoot, "testset", "testset.jsonl");

export const loadTestset = (testsetPath = defaultTestsetPath) => {
  const resolved = path.resolve(testsetPath);
  const testsetDir = path.dirname(resolved);
  const items = readJsonl(resolved);
  return { path: resolved, dir: testsetDir, items };
};

export const imageFileToContent = (testsetDir, imagePath) => {
  const fullPath = path.resolve(testsetDir, imagePath);
  if (!fullPath.startsWith(path.resolve(testsetDir))) {
    throw new Error(`Image path escapes testset directory: ${imagePath}`);
  }
  if (!fs.existsSync(fullPath)) throw new Error(`Image not found: ${fullPath}`);
  const ext = path.extname(fullPath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return {
    type: "image_url",
    image_url: {
      url: `data:${mime};base64,${fs.readFileSync(fullPath).toString("base64")}`
    }
  };
};

export const itemImagesToContent = (item, testsetDir) => (
  (item.images || []).map((imagePath) => imageFileToContent(testsetDir, imagePath))
);
