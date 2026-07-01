import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTitle, cleanZoomAudioFile } from "../src/utils/audio-utils.js";

/**
 * Builds a Blob whose bytes contain the RIFF....WAVE signature at a given
 * byte offset, optionally preceded by arbitrary garbage bytes.
 *
 * @param {number} prefixLength - Number of garbage bytes to prepend.
 * @returns {Blob}
 */
const makeWavBlob = (prefixLength = 0) => {
  const prefix = new Uint8Array(prefixLength).fill(0xff);
  const header = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x00, 0x00, 0x00, 0x00, // chunk size (dummy)
    0x57, 0x41, 0x56, 0x45, // WAVE
    0x00,                   // minimal payload byte
  ]);
  return new Blob([prefix, header]);
};

describe("createTitle", () => {
  it("produces the expected YYMMDD subject lesson city teacher format", () => {
    const date = new Date(2025, 4, 7); // 2025-05-07
    assert.equal(
      createTitle("MK", "BER", "FIQH", "03", date),
      "250507 FIQH 03 BER MK",
    );
  });

  it("zero-pads single-digit months and days", () => {
    const date = new Date(2025, 0, 1); // January 1
    const title = createTitle("AB", "HH", "SUB", "01", date);
    assert.ok(
      title.startsWith("250101 "),
      `Expected prefix '250101 ', got: ${title}`,
    );
  });

  it("uses only the last two digits of the year", () => {
    const date = new Date(2000, 0, 1);
    const title = createTitle("AB", "HH", "SUB", "01", date);
    assert.ok(
      title.startsWith("00"),
      `Expected year part '00', got: ${title}`,
    );
  });
});

describe("cleanZoomAudioFile", () => {
  it("returns the original blob reference when the RIFF header is at byte 0", async () => {
    const blob = makeWavBlob(0);
    const result = await cleanZoomAudioFile(blob);
    assert.equal(result, blob);
  });

  it("strips prefix bytes and returns a blob starting at the RIFF offset", async () => {
    const prefixLength = 10;
    const blob = makeWavBlob(prefixLength);
    const result = await cleanZoomAudioFile(blob);
    assert.equal(result.size, blob.size - prefixLength);
  });

  it("throws when no RIFF....WAVE signature is found", async () => {
    const corrupt = new Blob([new Uint8Array([0xff, 0xfe, 0xfd])]);
    await assert.rejects(
      () => cleanZoomAudioFile(corrupt),
      /Keine gueltige WAV-Signatur/,
    );
  });
});
