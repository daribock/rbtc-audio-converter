import fs from "node:fs";
import path from "node:path";

/**
 * Validates and normalizes a lesson value into two-digit format.
 *
 * @param {string|number} lessonValue - Raw lesson input.
 * @returns {string} Two-digit lesson string.
 */
export const normalizeLesson = (lessonValue) => {
  const parsedLesson = Number.parseInt(String(lessonValue), 10);

  if (!Number.isInteger(parsedLesson) || parsedLesson <= 0) {
    throw new Error("Lesson values must be positive whole numbers.");
  }

  return String(parsedLesson).padStart(2, "0");
};

/**
 * Returns a non-existing output path by appending incremental suffixes when needed.
 *
 * @param {string} candidatePath - Desired output path.
 * @returns {Promise<string>} A unique writable output path.
 */
export const resolveUniqueFilePath = async (candidatePath) => {
  const parsedPath = path.parse(candidatePath);
  let attempt = 0;
  let currentPath = candidatePath;

  while (true) {
    try {
      await fs.promises.access(currentPath);
      attempt += 1;
      currentPath = path.join(
        parsedPath.dir,
        `${parsedPath.name} (${attempt})${parsedPath.ext}`,
      );
    } catch {
      return currentPath;
    }
  }
};

/**
 * Returns a safe creation date for a source file.
 *
 * @param {string} filePath - Absolute source file path.
 * @returns {Promise<Date>} File birthtime when available, otherwise current date.
 */
export const getSafeCreatedAt = async (filePath) => {
  try {
    const { birthtime } = await fs.promises.stat(filePath);
    return birthtime instanceof Date ? birthtime : new Date();
  } catch (err) {
    return new Date();
  }
};
