import { describe, expect, it } from "bun:test";
import { TimeoutError, delay, withTimeout } from "./timeout";

describe("TimeoutError", () => {
  it("is an instance of Error", () => {
    const err = new TimeoutError();
    expect(err).toBeInstanceOf(Error);
  });

  it("has correct name property", () => {
    expect(new TimeoutError().name).toBe("TimeoutError");
  });

  it("uses default message", () => {
    expect(new TimeoutError().message).toBe("Operation timed out");
  });

  it("accepts custom message", () => {
    expect(new TimeoutError("custom").message).toBe("custom");
  });
});

describe("withTimeout", () => {
  it("resolves when promise settles before timeout", async () => {
    const result = await withTimeout(
      new Promise<string>((r) => setTimeout(() => r("ok"), 10)),
      100,
    );
    expect(result).toBe("ok");
  });

  it("rejects with TimeoutError when timeout fires first", async () => {
    const never = new Promise<string>(() => {});
    try {
      await withTimeout(never, 10);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(TimeoutError);
      expect((e as TimeoutError).message).toBe("Operation timed out");
    }
  });

  it("rejects with TimeoutError using custom message", async () => {
    const never = new Promise<string>(() => {});
    try {
      await withTimeout(never, 10, "custom timeout");
      expect(true).toBe(false);
    } catch (e) {
      expect((e as TimeoutError).message).toBe("custom timeout");
    }
  });

  it("rejects with original error when promise rejects before timeout", async () => {
    const err = new Error("boom");
    try {
      await withTimeout(
        new Promise<string>((_, rej) => setTimeout(() => rej(err), 10)),
        100,
      );
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBe(err);
    }
  });

  it("cleans up the timer when promise resolves first", async () => {
    let timedOut = false;
    await new Promise<void>((resolve) => {
      const id = setTimeout(() => {
        timedOut = true;
        resolve();
      }, 50);
      withTimeout(Promise.resolve("fast"), 200).then(() => {
        clearTimeout(id);
        resolve();
      });
    });
    expect(timedOut).toBe(false);
  });
});

describe("delay", () => {
  it("resolves after the specified time", async () => {
    const start = Date.now();
    await delay(20);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(15);
  });

  it("resolves with undefined", async () => {
    const result = await delay(1);
    expect(result).toBeUndefined();
  });
});