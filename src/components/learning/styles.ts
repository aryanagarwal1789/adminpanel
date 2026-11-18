import type { CSSProperties } from "react";

export const inp: CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  color: "#f1f5f9",
  borderRadius: 6,
  padding: "8px 12px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: 13,
};
export const textareaStyle: CSSProperties = { ...inp, resize: "vertical", minHeight: 60 };
export const selectStyle: CSSProperties = { ...inp };
export const lbl: CSSProperties = {
  color: "#94a3b8",
  fontSize: 13,
  marginBottom: 6,
  display: "block",
};
export const card: CSSProperties = {
  background: "#1e293b",
  borderRadius: 8,
  padding: 20,
  marginBottom: 16,
};
export const cardTitle: CSSProperties = {
  color: "#f1f5f9",
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
};
export const saveBtn: CSSProperties = {
  background: "#3b82f6",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};
export const secBtn: CSSProperties = {
  background: "transparent",
  color: "#94a3b8",
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #334155",
  cursor: "pointer",
  fontSize: 13,
};
export const dangerBtn: CSSProperties = { ...secBtn, color: "#ef4444", borderColor: "#ef4444" };
