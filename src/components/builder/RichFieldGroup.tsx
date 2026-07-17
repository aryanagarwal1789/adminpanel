/**
 * RichFieldGroup — replaces a set of legacy split text inputs
 * (e.g. headingPre + headingAccent + headingSuffix) with ONE rich text field.
 *
 * Strategy (additive, back-compat):
 *  - Writes rich content to a NEW key `${base}Rich` (legacy keys left untouched).
 *  - The initial value is SEEDED from the legacy parts but NOT persisted until the
 *    user actually edits — so pre-rollout content is unchanged and the marketing
 *    site keeps rendering the legacy fields until it adopts `${base}Rich`.
 */
import React from "react";
import { RichTextInput } from "./RichTextInput";
import {
  composeSegmentsToDoc,
  isRichDoc,
  DEFAULT_ACCENT,
  type RichDoc,
  type LegacySegment,
} from "./rich-text";

export interface RichSegmentDef {
  /** legacy field key, e.g. "headingPre" */
  key: string;
  /** true = accent/bold/highlight segment */
  accent?: boolean;
}

export function RichFieldGroup({
  label,
  f,
  set,
  base,
  segments,
  accentColor,
}: {
  label: string;
  f: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
  base: string;
  segments: RichSegmentDef[];
  accentColor?: string;
}) {
  const richKey = `${base}Rich`;
  const existing = f[richKey];

  // Prefer explicit prop, then the block's own accent field / CSS var, then default.
  const styleVars = (f.styleVars as Record<string, string> | undefined) ?? undefined;
  const accent =
    accentColor ||
    (typeof f.accentColor === "string" ? f.accentColor : "") ||
    styleVars?.["--accent"] ||
    DEFAULT_ACCENT;

  const value: RichDoc = isRichDoc(existing)
    ? existing
    : composeSegmentsToDoc(
        segments.map<LegacySegment>((s) => ({
          text: typeof f[s.key] === "string" ? (f[s.key] as string) : "",
          accent: s.accent,
        })),
        accent,
      );

  return <RichTextInput label={label} value={value} onChange={(doc) => set(richKey, doc)} />;
}
