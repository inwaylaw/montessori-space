import fs from "node:fs";
import path from "node:path";

export const readJsonl = (filePath) => fs
  .readFileSync(filePath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line, index) => {
    const json = index === 0 ? line.replace(/^\uFEFF/, "") : line;
    try {
      return JSON.parse(json);
    } catch (error) {
      throw new Error(`${filePath}:${index + 1} is not valid JSON: ${error.message}`);
    }
  });

export const appendJsonl = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
};

export const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
