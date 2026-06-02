import { WIDGET_REGISTRY, type Widget } from "./widgets";
import { WIDGET_PREVIEW_MAP } from "./WidgetPreviews";

export function WidgetRenderer({ widget }: { widget: Widget }) {
  const p = widget.props;
  const Preview = WIDGET_PREVIEW_MAP[widget.type];

  // Stable CSS ID for scoped style injection
  const wid = `wid-${widget.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  const bgColor   = p.bgColor   ? String(p.bgColor)   : "";
  const textColor = p.textColor ? String(p.textColor) : "";

  // padding + borderRadius work fine on the wrapper div itself
  const wrapStyle: Record<string, string> = {};
  if (p.padding)      wrapStyle.padding      = `${Number(p.padding)}px`;
  if (p.borderRadius) wrapStyle.borderRadius = `${Number(p.borderRadius)}px`;

  // bgColor and textColor need !important to override Tailwind classes on child elements
  const css = [
    bgColor   ? `#${wid}>:first-child{background:${bgColor}!important}` : "",
    textColor ? `#${wid} *{color:${textColor}!important}`                : "",
  ].filter(Boolean).join("");

  const fallback = (
    <>
      {css && <style>{css}</style>}
      <div id={wid} style={wrapStyle}>
        <div className="border border-dashed border-slate-300 rounded-md p-4 bg-slate-50 text-center">
          <div className="text-xs font-semibold text-slate-500">
            {WIDGET_REGISTRY[widget.type]?.label ?? widget.type}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Widget preview</div>
        </div>
      </div>
    </>
  );

  if (!Preview) return fallback;

  return (
    <>
      {css && <style>{css}</style>}
      <div id={wid} style={wrapStyle}>
        <Preview p={p} />
      </div>
    </>
  );
}
