import path from "node:path";
import { normalizeLesson } from "./file-utils.js";

export const MAX_BATCH_FILES = 15;

/**
 * Validates the incoming batch conversion payload.
 *
 * @param {Array<{filePath: string, fileName?: string, lesson: string|number}>} batchItems - Input files with lesson mapping.
 * @param {{teacher?: string, city?: string, subject?: string}} sharedTags - Shared metadata tags.
 * @returns {{error?: string, normalizedItems?: Array<{filePath: string, fileName: string, lesson: string, index: number}>, teacher?: string, city?: string, subject?: string}} Validation output.
 */
export const validateBatchRequest = (batchItems, sharedTags) => {
  if (!Array.isArray(batchItems) || batchItems.length === 0) {
    return {
      error: "Please select at least one .wav file.",
    };
  }

  if (batchItems.length > MAX_BATCH_FILES) {
    return {
      error: `You can upload up to ${MAX_BATCH_FILES} files.`,
    };
  }

  const teacher = String(sharedTags?.teacher || "").trim();
  const city = String(sharedTags?.city || "").trim();
  const subject = String(sharedTags?.subject || "").trim();

  if (!teacher || !city || !subject) {
    return {
      error: "Teacher, city, and subject are required for batch conversion.",
    };
  }

  const lessons = batchItems.map((item) => normalizeLesson(item.lesson));
  if (new Set(lessons).size !== lessons.length) {
    return {
      error: "Lesson values must be unique across all selected files.",
    };
  }

  const normalizedItems = batchItems.map((item, index) => ({
    filePath: item.filePath,
    fileName: item.fileName || path.basename(item.filePath || ""),
    lesson: lessons[index],
    index,
  }));

  return { normalizedItems, teacher, city, subject };
};
