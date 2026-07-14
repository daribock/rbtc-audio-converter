import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import {
  getSafeCreatedAt,
  normalizeLesson,
  resolveUniqueFilePath,
} from "../src/utils/file-utils.js";

describe("normalizeLesson", () => {
  it("returns '01' for input 1", () => {
    assert.equal(normalizeLesson(1), "01");
  });

  it("returns '10' for input 10", () => {
    assert.equal(normalizeLesson(10), "10");
  });

  it("returns '99' for input 99", () => {
    assert.equal(normalizeLesson(99), "99");
  });

  it("accepts a string number", () => {
    assert.equal(normalizeLesson("5"), "05");
  });

  it("throws on 0", () => {
    assert.throws(() => normalizeLesson(0), /positive whole numbers/);
  });

  it("throws on a negative number", () => {
    assert.throws(() => normalizeLesson(-1), /positive whole numbers/);
  });

  it("throws on NaN", () => {
    assert.throws(() => normalizeLesson(NaN), /positive whole numbers/);
  });

  it("throws on null", () => {
    assert.throws(() => normalizeLesson(null), /positive whole numbers/);
  });

  it("throws on an empty string", () => {
    assert.throws(() => normalizeLesson(""), /positive whole numbers/);
  });

  it("throws on a non-numeric string", () => {
    assert.throws(() => normalizeLesson("abc"), /positive whole numbers/);
  });
});

describe("resolveUniqueFilePath", () => {
  const dir = tmpdir();

  it("returns the candidate path when the file does not exist", async () => {
    const candidate = join(dir, `rbtc-noexist-${Date.now()}.mp3`);
    const result = await resolveUniqueFilePath(candidate);
    assert.equal(result, candidate);
  });

  it("appends (1) when the candidate already exists", async () => {
    const base = `rbtc-collision-${Date.now()}`;
    const candidate = join(dir, `${base}.mp3`);
    await writeFile(candidate, "");
    try {
      const result = await resolveUniqueFilePath(candidate);
      assert.equal(result, join(dir, `${base} (1).mp3`));
    } finally {
      await unlink(candidate).catch(() => {});
    }
  });

  it("increments to (2) when (1) also exists", async () => {
    const base = `rbtc-collision2-${Date.now()}`;
    const candidate = join(dir, `${base}.mp3`);
    const first = join(dir, `${base} (1).mp3`);
    await writeFile(candidate, "");
    await writeFile(first, "");
    try {
      const result = await resolveUniqueFilePath(candidate);
      assert.equal(result, join(dir, `${base} (2).mp3`));
    } finally {
      await unlink(candidate).catch(() => {});
      await unlink(first).catch(() => {});
    }
  });

  it("preserves the file extension in the suffixed path", async () => {
    const base = `rbtc-ext-${Date.now()}`;
    const candidate = join(dir, `${base}.mp3`);
    await writeFile(candidate, "");
    try {
      const result = await resolveUniqueFilePath(candidate);
      assert.ok(result.endsWith(".mp3"), `Expected .mp3 extension, got: ${result}`);
    } finally {
      await unlink(candidate).catch(() => {});
    }
  });
});

describe("getSafeCreatedAt", () => {
  const dir = tmpdir();

  it("returns the file birthtime when stat succeeds", async () => {
    const candidate = join(dir, `rbtc-created-at-${Date.now()}.mp3`);
    await writeFile(candidate, "");

    try {
      const createdAt = await getSafeCreatedAt(candidate);
      const { birthtime } = await fs.promises.stat(candidate);

      assert.ok(createdAt instanceof Date);
      assert.equal(createdAt.getTime(), birthtime.getTime());
    } finally {
      await unlink(candidate).catch(() => {});
    }
  });

  it("returns the current date when stat throws", async () => {
    const originalStat = fs.promises.stat;
    const before = Date.now();

    fs.promises.stat = async () => {
      throw new Error("stat failed");
    };

    try {
      const createdAt = await getSafeCreatedAt("/does/not/exist.mp3");
      const after = Date.now();

      assert.ok(createdAt instanceof Date);
      assert.ok(createdAt.getTime() >= before);
      assert.ok(createdAt.getTime() <= after);
    } finally {
      fs.promises.stat = originalStat;
    }
  });
});
