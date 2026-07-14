import path from "node:path";
import { normalizeLesson } from "./file-utils.js";
import { config } from "./config.js";

/**
 * Validates the incoming batch conversion payload.
 *
 * @param {Array<{filePath: string, fileName?: string, lesson: string|number}>} batchItems - Input files with lesson mapping.
 * @param {{teacher?: string, teacherName?: string, city?: string, cityName?: string, subject?: string, subjectName?: string}} sharedTags - Shared metadata tags.
 * @returns {{error?: string, normalizedItems?: Array<{filePath: string, fileName: string, lesson: string, index: number}>, teacher?: string, teacherName?: string, city?: string, cityName?: string, subject?: string, subjectName?: string}} Validation output.
 */
export const validateBatchRequest = (batchItems, sharedTags) => {
  if (!Array.isArray(batchItems) || batchItems.length === 0) {
    return {
      error: "Please select at least one .wav file.",
    };
  }

  if (batchItems.length > config.MAX_FILE_COUNT) {
    return {
      error: `You can upload up to ${config.MAX_FILE_COUNT} files.`,
    };
  }

  const teacher = String(sharedTags?.teacher || "").trim();
  const city = String(sharedTags?.city || "").trim();
  const subject = String(sharedTags?.subject || "").trim();
  const teacherName = String(sharedTags?.teacherName || "").trim();
  const cityName = String(sharedTags?.cityName || "").trim();
  const subjectName = String(sharedTags?.subjectName || "").trim();

  if (
    !teacher ||
    !city ||
    !subject ||
    !teacherName ||
    !cityName ||
    !subjectName
  ) {
    return {
      error:
        "Teacher, city, and subject abbreviations and full names are required for batch conversion.",
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

  return {
    normalizedItems,
    teacher,
    teacherName,
    city,
    cityName,
    subject,
    subjectName,
  };
};
