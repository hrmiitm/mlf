// Preserve independent attempts; the legacy key remains a compatibility snapshot.
export const ATTEMPTS_KEY = "mlf-attempts-v2";
export const LEGACY_KEY = "mlf-study-session-v1";
export const attemptId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const copy = (value) => JSON.parse(JSON.stringify(value));
const valid = (a) =>
  a?.screen === "session" &&
  typeof a.paper === "string" &&
  ["exam", "practice"].includes(a.mode) &&
  a.answers &&
  typeof a.answers === "object";
export function createAttemptStore(storage) {
  let attempts = [],
    activeId,
    saved = true;
  try {
    const data = JSON.parse(storage?.getItem(ATTEMPTS_KEY) || "null");
    if (data?.version === 2 && Array.isArray(data.attempts)) {
      attempts = data.attempts.filter(
        (a) => valid(a) && typeof a.attemptId === "string",
      );
      activeId = data.activeId;
    }
    const legacy = JSON.parse(storage?.getItem(LEGACY_KEY) || "null");
    if (!attempts.length && valid(legacy)) {
      const migrated = {
        ...legacy,
        attemptId: legacy.attemptId || attemptId(),
        startedAt: legacy.startedAt || Date.now(),
      };
      attempts.push(migrated);
      activeId = migrated.attemptId;
    }
  } catch {
    /* Keep an in-memory attempt if storage is unavailable or corrupt. */
  }
  return {
    list(paper) {
      return copy(
        attempts.filter((a) => !paper || a.paper === paper),
      ).reverse();
    },
    get(id = activeId) {
      const a = attempts.find((a) => a.attemptId === id);
      return a ? copy(a) : null;
    },
    save(attempt) {
      // A second tab may have saved another attempt since this tab opened.
      try {
        const disk = JSON.parse(storage?.getItem(ATTEMPTS_KEY) || "null");
        if (disk?.version === 2 && Array.isArray(disk.attempts)) {
          const latest = disk.attempts.filter(
            (a) => valid(a) && typeof a.attemptId === "string",
          );
          const ids = new Set(latest.map((a) => a.attemptId));
          attempts = [
            ...latest,
            ...attempts.filter((a) => !ids.has(a.attemptId)),
          ];
        }
      } catch {
        /* Memory-only saves still work. */
      }
      const snapshot = copy({
        ...attempt,
        dialog: null,
        attemptId: attempt.attemptId || attemptId(),
        updatedAt: Date.now(),
      });
      attempt.attemptId = snapshot.attemptId;
      const index = attempts.findIndex(
        (a) => a.attemptId === snapshot.attemptId,
      );
      if (index >= 0) attempts[index] = snapshot;
      else attempts.push(snapshot);
      activeId = snapshot.attemptId;
      try {
        if (!storage) throw new Error("Storage unavailable");
        storage.setItem(
          ATTEMPTS_KEY,
          JSON.stringify({ version: 2, activeId, attempts }),
        );
        storage.setItem(LEGACY_KEY, JSON.stringify(snapshot));
        saved = true;
      } catch {
        saved = false;
      }
      return saved;
    },
    get saved() {
      return saved;
    },
  };
}
