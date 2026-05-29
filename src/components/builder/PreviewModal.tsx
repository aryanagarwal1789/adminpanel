'use client';
import { useEffect, useRef, useState } from "react";
import { X, Monitor, Smartphone } from "lucide-react";
import type { Block, Theme } from "./types";

const RENDERER = "http://localhost:3000";

interface PreviewModalProps {
  blocks: Block[];
  theme: Theme;
  pageKey: string;
  onClose: () => void;
}

export function PreviewModal({ blocks, theme, pageKey, onClose }: PreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  // Listen for PREVIEW_READY from the iframe, then push current blocks
  useEffect(() => {
    readyRef.current = false;

    const handler = (e: MessageEvent) => {
      if (e.data?.type === "PREVIEW_READY") {
        iframeRef.current?.contentWindow?.postMessage({ type: "PREVIEW_ACK" }, "*");
        iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_BLOCKS_REORDER", blocks }, "*");
        iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_THEME_UPDATE", theme }, "*");
        readyRef.current = true;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [blocks, theme]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const src = pageKey === 'landing'
    ? `${RENDERER}/?preview=1`
    : `${RENDERER}/${pageKey}?preview=1`;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#0f172a" }}>
      {/* Toolbar */}
      <div className="h-[44px] flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewport("desktop")}
            className={`p-2 rounded pb-transition ${viewport === "desktop" ? "text-white bg-slate-700" : "text-slate-400 hover:text-white"}`}
            title="Desktop"
          >
            <Monitor size={15} />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`p-2 rounded pb-transition ${viewport === "mobile" ? "text-white bg-slate-700" : "text-slate-400 hover:text-white"}`}
            title="Mobile"
          >
            <Smartphone size={15} />
          </button>
        </div>
        <div className="text-xs text-slate-500 font-mono">/{pageKey}</div>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-slate-700 text-slate-400 hover:text-white pb-transition"
          title="Close preview (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Iframe wrapper */}
      <div className="flex-1 overflow-auto flex items-start justify-center"
        style={{ background: viewport === "mobile" ? "#1e293b" : "#ffffff", padding: viewport === "mobile" ? "24px 0" : 0 }}
      >
        <iframe
          key={pageKey}
          ref={iframeRef}
          src={src}
          title="Page preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{
            border: viewport === "mobile" ? "1px solid #334155" : "none",
            borderRadius: viewport === "mobile" ? 12 : 0,
            width: viewport === "mobile" ? 390 : "100%",
            height: viewport === "mobile" ? 844 : "100%",
            display: "block",
            background: "#ffffff",
          }}
        />
      </div>
    </div>
  );
}
