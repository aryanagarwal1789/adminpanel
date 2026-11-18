export type PublishFailure =
  | { kind: "stale" }
  | { kind: "not-migrated" }
  | { kind: "problems"; problems: string[] }
  | { kind: "other" };

export const NOT_MIGRATED_MESSAGE =
  "Learning content is being migrated \u2014 publishing is paused. Your draft is kept; try again later.";

/** Sorts a failed learning.publish /verify response into the flow it needs. */
export function classifyPublishFailure(status: number, body: unknown): PublishFailure {
  const b = (body ?? {}) as { code?: unknown; problems?: unknown };
  if (status === 409 && b.code === "LEARNING_STALE") return { kind: "stale" };
  if (status === 409 && b.code === "LEARNING_NOT_MIGRATED") return { kind: "not-migrated" };
  if (status === 400 && Array.isArray(b.problems))
    return {
      kind: "problems",
      problems: b.problems.map((p: unknown) =>
        typeof p === "string" ? p : ((p as { message?: string })?.message ?? JSON.stringify(p)),
      ),
    };
  return { kind: "other" };
}
