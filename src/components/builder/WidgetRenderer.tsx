import type { ButtonField } from "./defaults";
import { WIDGET_REGISTRY, type Widget } from "./widgets";

function alignClass(a?: string) {
  return a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";
}
function alignFlex(a?: string) {
  return a === "center" ? "justify-center" : a === "right" ? "justify-end" : "justify-start";
}
function sizeClass(s?: string) {
  return s === "sm" ? "text-sm" : s === "lg" ? "text-lg" : "text-base";
}
function headingClass(l?: string) {
  switch (l) {
    case "h1": return "text-4xl font-bold";
    case "h3": return "text-xl font-semibold";
    case "h4": return "text-base font-semibold";
    default: return "text-2xl font-bold";
  }
}
function btnStyle(v: ButtonField["variant"] = "primary"): { className: string; style: React.CSSProperties } {
  switch (v) {
    case "primary": return { className: "px-4 py-2 rounded-md text-white text-sm font-medium", style: { background: "#3b82f6" } };
    case "secondary": return { className: "px-4 py-2 rounded-md text-white text-sm font-medium", style: { background: "#0f172a" } };
    case "outline": return { className: "px-4 py-2 rounded-md text-sm font-medium border border-slate-300 text-slate-700", style: {} };
    case "ghost": return { className: "px-4 py-2 rounded-md text-sm font-medium text-slate-700", style: {} };
  }
}

export function WidgetRenderer({ widget }: { widget: Widget }) {
  const p = widget.props;
  switch (widget.type) {
    case "heading":
    case "section-heading":
    case "section-header": {
      const Tag = ((p.level as string) || "h2") as keyof React.JSX.IntrinsicElements;
      const cls = `${headingClass(p.level as string)} ${alignClass(p.align as string)}`;
      return (
        <Tag className={cls} style={{ color: (p.color as string) || "#0f172a" }}>
          {(p.text as string) || "Heading"}
        </Tag>
      );
    }
    case "paragraph":
    case "text":
    case "rich-text":
      return (
        <p
          className={`${sizeClass(p.size as string)} ${alignClass(p.align as string)} whitespace-pre-wrap`}
          style={{ color: (p.color as string) || "#334155" }}
        >
          {(p.text as string) || "Text"}
        </p>
      );
    case "image": {
      const src = p.src as string;
      const w = (p.width as number) || 100;
      return (
        <div>
          <div
            className="overflow-hidden bg-slate-100"
            style={{ width: `${w}%`, borderRadius: `${(p.radius as number) ?? 0}px` }}
          >
            {src ? (
              <img src={src} alt={(p.alt as string) || ""} className="w-full h-auto block" />
            ) : (
              <div className="aspect-video flex items-center justify-center text-xs text-slate-400">No image</div>
            )}
          </div>
        </div>
      );
    }
    case "button": {
      const { className, style } = btnStyle((p.variant as ButtonField["variant"]) || "primary");
      const full = p.fullWidth as boolean;
      return (
        <div className={`flex ${alignFlex(p.align as string)}`}>
          <button className={`${className} ${full ? "w-full" : ""}`} style={style}>
            {(p.label as string) || "Button"}
          </button>
        </div>
      );
    }
    case "divider":
      return (
        <hr
          style={{
            borderTopStyle: ((p.style as string) || "solid") as React.CSSProperties["borderTopStyle"],
            borderTopWidth: `${(p.thickness as number) || 1}px`,
            borderTopColor: (p.color as string) || "#e2e8f0",
            borderBottom: "none",
            borderLeft: "none",
            borderRight: "none",
          }}
        />
      );
    case "spacer":
      return <div style={{ height: `${(p.height as number) || 40}px` }} />;
    case "icon":
      return (
        <div className={`flex ${alignFlex(p.align as string)}`}>
          <span style={{ fontSize: `${(p.size as number) || 32}px`, color: (p.color as string) || "#3b82f6", lineHeight: 1 }}>
            {(p.icon as string) || "✨"}
          </span>
        </div>
      );
    case "card":
      return (
        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
          {(p.image as string) && (
            <img src={p.image as string} alt="" className="w-full h-32 object-cover" />
          )}
          <div className="p-4">
            <h3 className="font-semibold text-slate-900 mb-1.5">{(p.title as string) || "Card"}</h3>
            <p className="text-sm text-slate-500 mb-3">{(p.description as string) || ""}</p>
            {(p.buttonLabel as string) && (
              <button className="text-sm font-medium text-blue-600">{p.buttonLabel as string} →</button>
            )}
          </div>
        </div>
      );
    case "video":
    case "video-embed": {
      const aspect = (p.aspect as string) === "4:3" ? "4 / 3" : (p.aspect as string) === "1:1" ? "1 / 1" : "16 / 9";
      return (
        <div className="bg-slate-900 rounded-md overflow-hidden flex items-center justify-center text-slate-400 text-xs" style={{ aspectRatio: aspect }}>
          {(p.url as string) ? `▶ ${p.url}` : "Video embed"}
        </div>
      );
    }
    case "form":
      return (
        <form className="space-y-2 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <input className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" placeholder="Name" disabled />
          <input className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" placeholder="Email" disabled />
          <button className="px-4 py-2 rounded text-white text-sm font-medium" style={{ background: "#3b82f6" }} type="button">
            {(p.submitLabel as string) || "Submit"}
          </button>
        </form>
      );
    case "list": {
      const items = (p.items as { text: string }[]) || [];
      const style = (p.style as string) || "bullet";
      if (style === "numbered") return <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">{items.map((it, i) => <li key={i}>{it.text}</li>)}</ol>;
      if (style === "none") return <ul className="text-sm text-slate-700 space-y-1">{items.map((it, i) => <li key={i}>{it.text}</li>)}</ul>;
      return <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">{items.map((it, i) => <li key={i}>{it.text}</li>)}</ul>;
    }
    case "accordion": {
      const items = (p.items as { title: string; body: string }[]) || [];
      return (
        <div className="border border-slate-200 rounded-md divide-y divide-slate-200">
          {items.map((it, i) => (
            <div key={i} className="p-3">
              <div className="font-medium text-sm text-slate-900">{it.title}</div>
              <div className="text-xs text-slate-500 mt-1">{it.body}</div>
            </div>
          ))}
        </div>
      );
    }
    case "pricing-card": {
      const features = (p.features as { text: string }[]) || [];
      const cta = p.cta as ButtonField;
      const hl = p.highlighted as boolean;
      const btn = btnStyle(cta?.variant);
      return (
        <div className={`rounded-lg p-5 bg-white ${hl ? "ring-2 ring-blue-500" : "border border-slate-200"}`}>
          <div className="text-sm font-semibold text-slate-500">{p.plan as string}</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {p.price as string}<span className="text-sm font-normal text-slate-500">{p.period as string}</span>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
            {features.map((f, i) => <li key={i}>✓ {f.text}</li>)}
          </ul>
          {cta?.label && (
            <button className={`${btn.className} mt-5 w-full`} style={btn.style}>{cta.label}</button>
          )}
        </div>
      );
    }
    case "metrics": {
      const items = (p.items as { number: string; label: string; description: string }[]) || [];
      return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}>
          {items.map((m, i) => (
            <div key={i}>
              <div className="text-2xl font-bold text-slate-900">{m.number}</div>
              <div className="text-sm font-medium text-slate-700">{m.label}</div>
              <div className="text-xs text-slate-500">{m.description}</div>
            </div>
          ))}
        </div>
      );
    }
    case "image-grid": {
      const imgs = (p.images as { src: string; alt: string }[]) || [];
      const cols = Number((p.columns as string) || "3");
      return (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {imgs.map((im, i) => (
            <div key={i} className="aspect-square bg-slate-100 rounded overflow-hidden">
              {im.src && <img src={im.src} alt={im.alt} className="w-full h-full object-cover" />}
            </div>
          ))}
        </div>
      );
    }
    case "testimonial-slider": {
      const items = (p.items as { quote: string; author: string; role: string; avatar: string }[]) || [];
      const t = items[0];
      if (!t) return <div className="text-xs text-slate-400">No testimonials</div>;
      return (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-slate-700 italic">"{t.quote}"</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
              {t.avatar && <img src={t.avatar} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">{t.author}</div>
              <div className="text-xs text-slate-500">{t.role}</div>
            </div>
          </div>
        </div>
      );
    }
    case "feature-list": {
      const items = (p.items as { icon: string; text: string }[]) || [];
      return (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-blue-500">{it.icon}</span>
              <span>{it.text}</span>
            </li>
          ))}
        </ul>
      );
    }
    case "logo":
      return (
        <div>
          {(p.src as string) ? (
            <img src={p.src as string} alt={(p.alt as string) || ""} style={{ width: `${(p.width as number) || 120}px` }} />
          ) : (
            <div className="text-sm font-bold text-slate-900" style={{ width: `${(p.width as number) || 120}px` }}>
              {(p.alt as string) || "Logo"}
            </div>
          )}
        </div>
      );
    default: {
      const meta = WIDGET_REGISTRY[widget.type];
      return (
        <div className="border border-dashed border-slate-300 rounded-md p-4 bg-slate-50 text-center">
          <div className="text-xs font-semibold text-slate-500">{meta?.label ?? widget.type}</div>
          <div className="text-[10px] text-slate-400 mt-1">Widget preview</div>
        </div>
      );
    }
  }
}
