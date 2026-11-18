export interface PublishBarInput {
  hasDraft: boolean;
  changeCount: number;
  /** Draft is based on an older server revision than the live copy. */
  stale: boolean;
  /** A 409 LEARNING_STALE came back from publish and is not yet resolved. */
  staleNotice: boolean;
}

/**
 * Visibility of the publish bar and its amber stale notice. The local
 * `staleNotice` flag only counts while the draft still has changes: a late 409
 * (e.g. a duplicate verify request) can set it after a successful publish, and
 * it must not keep an empty bar on screen.
 */
export function publishBarState({ hasDraft, changeCount, stale, staleNotice }: PublishBarInput) {
  const noticeLive = staleNotice && changeCount > 0;
  return {
    showBar: hasDraft && (changeCount > 0 || stale),
    showNotice: hasDraft && (stale || noticeLive),
    /** Local flag is dead weight: reset it so it cannot resurface on the next edit. */
    clearNotice: staleNotice && changeCount === 0 && !stale,
  };
}
