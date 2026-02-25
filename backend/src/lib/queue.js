/**
 * Simple In-Memory Queue to replace BullMQ/Redis
 */
class MemoryQueue {
  constructor(name) {
    this.name = name;
    this.handlers = [];
    this.errorHandlers = [];
    console.log(`✅ In-memory Queue [${name}] initialized`);
  }

  async add(jobName, data) {
    const job = {
      id: Math.random().toString(36).substring(7),
      name: jobName,
      data,
      timestamp: Date.now()
    };

    // Simulate async processing
    setImmediate(async () => {
      for (const handler of this.handlers) {
        try {
          await handler(job);
        } catch (err) {
          this.errorHandlers.forEach(h => h(job, err));
        }
      }
    });

    return job;
  }

  // BullMQ compatibility method
  on(event, handler) {
    if (event === 'error') {
      this.errorHandlers.push(handler);
    }
    return this;
  }

  // Internal method for workers to register
  _registerWorker(handler) {
    this.handlers.push(handler);
  }
}

export const emailQueue = new MemoryQueue('email-queue');

export default emailQueue;
