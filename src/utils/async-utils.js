/**
 * Processes items with a fixed worker pool and shared queue.
 *
 * @template T
 * @param {number} workers - Max number of concurrent workers.
 * @param {T[]} items - Items to process.
 * @param {(item: T) => Promise<void>} convertItem - Async processor for each item.
 * @returns {Promise<void>} Resolves after all items have been handled.
 */
export const runParallelBatch = async (workers, items, convertItem) => {
  const queue = [...items];

  /**
   * Consumes items from the queue until it is empty.
   *
   * @returns {Promise<void>} Worker completion state.
   */
  const runWorker = async () => {
    while (queue.length > 0) {
      const nextItem = queue.shift();
      if (!nextItem) {
        return;
      }
      await convertItem(nextItem);
    }
  };

  const workerCount = Math.max(1, Math.min(workers, items.length));
  const tasks = Array.from({ length: workerCount }, () => runWorker());
  await Promise.all(tasks);
};
