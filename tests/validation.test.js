import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateBatchRequest } from "../src/utils/validation.js";
import { config } from "../src/utils/config.js";

const MAX_FILE_COUNT = config.MAX_FILE_COUNT;

describe("validateBatchRequest", () => {
  it("returns error if batchItems is not an array", () => {
    const result = validateBatchRequest(null, {});
    assert.equal(result.error, "Please select at least one .wav file.");
  });

  it("returns error if batchItems is empty", () => {
    const result = validateBatchRequest([], {});
    assert.equal(result.error, "Please select at least one .wav file.");
  });

  it(`returns error if batchItems exceeds MAX_FILE_COUNT`, () => {
    const batchItems = new Array(MAX_FILE_COUNT + 1).fill({
      filePath: "test.wav",
      lesson: "1",
    });
    const result = validateBatchRequest(batchItems, {});
    assert.equal(result.error, `You can upload up to ${MAX_FILE_COUNT} files.`);
  });

  it("returns error if sharedTags is missing teacher", () => {
    const batchItems = [{ filePath: "test.wav", lesson: "1" }];
    const sharedTags = {
      city: "BER",
      cityName: "Berlin",
      subject: "M",
      subjectName: "Math",
      teacherName: "Mr. Smith",
    };
    const result = validateBatchRequest(batchItems, sharedTags);
    assert.equal(
      result.error,
      "Teacher, city, and subject abbreviations and full names are required for batch conversion.",
    );
  });

  it("returns error if sharedTags is missing city", () => {
    const batchItems = [{ filePath: "test.wav", lesson: "1" }];
    const sharedTags = {
      teacher: "MS",
      teacherName: "Mr. Smith",
      subject: "M",
      subjectName: "Math",
      cityName: "Berlin",
    };
    const result = validateBatchRequest(batchItems, sharedTags);
    assert.equal(
      result.error,
      "Teacher, city, and subject abbreviations and full names are required for batch conversion.",
    );
  });

  it("returns error if sharedTags is missing subject", () => {
    const batchItems = [{ filePath: "test.wav", lesson: "1" }];
    const sharedTags = {
      teacher: "MS",
      teacherName: "Mr. Smith",
      city: "BER",
      cityName: "Berlin",
      subjectName: "Math",
    };
    const result = validateBatchRequest(batchItems, sharedTags);
    assert.equal(
      result.error,
      "Teacher, city, and subject abbreviations and full names are required for batch conversion.",
    );
  });

  it("returns error if sharedTags are empty strings", () => {
    const batchItems = [{ filePath: "test.wav", lesson: "1" }];
    const sharedTags = {
      teacher: "  ",
      teacherName: "Mr. Smith",
      city: " BER ",
      cityName: "Berlin",
      subject: "   ",
      subjectName: "Math",
    };
    const result = validateBatchRequest(batchItems, sharedTags);
    assert.equal(
      result.error,
      "Teacher, city, and subject abbreviations and full names are required for batch conversion.",
    );
  });

  it("returns error if lessons are not unique", () => {
    const batchItems = [
      { filePath: "test1.wav", lesson: "1" },
      { filePath: "test2.wav", lesson: "01" }, // normalizeLesson("1") === "01", so these collide
    ];
    const sharedTags = {
      teacher: "MS",
      teacherName: "Mr. Smith",
      city: "BER",
      cityName: "Berlin",
      subject: "M",
      subjectName: "Math",
    };
    const result = validateBatchRequest(batchItems, sharedTags);
    assert.equal(
      result.error,
      "Lesson values must be unique across all selected files.",
    );
  });

  it("returns normalized items and parsed tags for valid requests", () => {
    const batchItems = [
      { filePath: "/path/to/test1.wav", lesson: "1" },
      { filePath: "/path/to/test2.wav", fileName: "custom.wav", lesson: "2" },
    ];
    const sharedTags = {
      teacher: "  MS  ",
      teacherName: "  Mr. Smith  ",
      city: " BER ",
      cityName: " Berlin ",
      subject: " M ",
      subjectName: " Math ",
    };
    const result = validateBatchRequest(batchItems, sharedTags);

    assert.equal(result.error, undefined);
    assert.equal(result.teacher, "MS");
    assert.equal(result.teacherName, "Mr. Smith");
    assert.equal(result.city, "BER");
    assert.equal(result.cityName, "Berlin");
    assert.equal(result.subject, "M");
    assert.equal(result.subjectName, "Math");

    assert.equal(result.normalizedItems.length, 2);

    assert.deepEqual(result.normalizedItems[0], {
      filePath: "/path/to/test1.wav",
      fileName: "test1.wav", // Fallback to path.basename
      lesson: "01",
      index: 0,
    });

    assert.deepEqual(result.normalizedItems[1], {
      filePath: "/path/to/test2.wav",
      fileName: "custom.wav", // Uses provided fileName
      lesson: "02",
      index: 1,
    });
  });
});
