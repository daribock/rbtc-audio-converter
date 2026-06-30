import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runParallelBatch } from "../src/utils/async-utils.js";

describe("runParallelBatch", () => {
  it("processes all items exactly once", async () => {
    const items = [1, 2, 3, 4, 5];
    const processed = [];
    await runParallelBatch(3, items, async (item) => {
      processed.push(item);
    });
    assert.deepEqual(processed.sort((a, b) => a - b), items);
  });

  it("does not exceed the specified worker cap", async () => {
    let activeCount = 0;
    let peakActive = 0;
    const items = Array.from({ length: 6 }, (_, i) => i);

    await runParallelBatch(2, items, async () => {
      activeCount++;
      peakActive = Math.max(peakActive, activeCount);
      await new Promise((r) => setImmediate(r));
      activeCount--;
    });

    assert.ok(
      peakActive <= 2,
      `Peak concurrency ${peakActive} exceeded limit of 2`,
    );
  });

  it("processes items sequentially with a single worker", async () => {
    const order = [];
    await runParallelBatch(1, [1, 2, 3], async (item) => {
      order.push(item);
    });
    assert.deepEqual(order, [1, 2, 3]);
  });

  it("resolves immediately for an empty items array", async () => {
    await assert.doesNotReject(() => runParallelBatch(3, [], async () => {}));
  });

  it("propagates a rejection thrown inside convertItem", async () => {
    await assert.rejects(
      () =>
        runParallelBatch(2, [1], async () => {
          throw new Error("conversion failed");
        }),
      /conversion failed/,
    );
  });
});
