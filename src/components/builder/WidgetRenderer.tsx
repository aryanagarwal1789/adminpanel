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
    case "countdown": {
      const bg = (p.bgColor as string) || "#1e3a8a";
      const tc = (p.textColor as string) || "#ffffff";
      const lc = (p.labelColor as string) || "#93c5fd";
      const label = (p.label as string) || "Offer ends in";
      const boxes = ["00", "00", "00", "00"];
      const boxLabels = ["Days", "Hours", "Mins", "Secs"];
      return (
        <div className="rounded-lg p-5" style={{ background: bg }}>
          <div className="text-center text-sm font-medium mb-3" style={{ color: lc }}>{label}</div>
          <div className="grid grid-cols-4 gap-3">
            {boxes.map((v, i) => (
              <div key={i} className="rounded-md p-2 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="text-2xl font-bold" style={{ color: tc }}>{v}</div>
                <div className="text-[10px] mt-0.5" style={{ color: lc }}>{boxLabels[i]}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "tabs": {
      const items = (p.items as { title: string; content: string }[]) || [];
      const ac = (p.activeColor as string) || "#3b82f6";
      return (
        <div>
          <div className="flex gap-1 border-b border-slate-200 mb-3">
            {items.map((it, i) => (
              <div key={i} className="px-3 py-1.5 text-sm font-medium rounded-t cursor-default"
                style={{ color: i === 0 ? ac : (p.inactiveColor as string) || "#64748b", borderBottom: i === 0 ? `2px solid ${ac}` : "2px solid transparent" }}>
                {it.title}
              </div>
            ))}
          </div>
          {items[0] && <div className="text-sm text-slate-600">{items[0].content}</div>}
        </div>
      );
    }
    case "horizontal-spacer": {
      const h = (p.height as number) || 1;
      const w = (p.width as number) || 100;
      const color = (p.color as string) || "#e2e8f0";
      return (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: `${w}%`, height: `${h}px`, background: color, borderRadius: `${h}px` }} />
        </div>
      );
    }
    case "anchor":
      return (
        <div className="flex items-center gap-2 py-1">
          <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono">#{(p.id as string) || "anchor"}</span>
          {(p.label as string) && <span className="text-xs text-slate-400">{p.label as string}</span>}
        </div>
      );
    case "image-text": {
      const layout = (p.layout as string) || "left";
      const isLeft = layout === "left";
      const imgBlock = (
        <div className="bg-slate-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          {(p.image as string)
            ? <img src={p.image as string} alt="" className="w-full h-full object-cover" />
            : <span className="text-xs text-slate-400">Image</span>}
        </div>
      );
      const textBlock = (
        <div className="flex flex-col justify-center gap-2">
          <h3 className="text-xl font-bold text-slate-900">{(p.heading as string) || "Heading"}</h3>
          <p className="text-sm text-slate-600">{(p.text as string) || ""}</p>
          {(p.ctaLabel as string) && (
            <button className="self-start px-4 py-2 rounded text-white text-sm font-medium" style={{ background: "#3b82f6" }}>{p.ctaLabel as string}</button>
          )}
        </div>
      );
      return (
        <div className="grid grid-cols-2 gap-6">
          {isLeft ? <>{imgBlock}{textBlock}</> : <>{textBlock}{imgBlock}</>}
        </div>
      );
    }
    case "horizontal-menu":
    case "navigation-menu": {
      const items = (p.items as { label: string; url: string }[]) || [];
      const gap = (p.gap as number) || 24;
      const color = (p.color as string) || "#0f172a";
      const fontSize = (p.fontSize as number) || 14;
      const align = (p.align as string) || "left";
      const justifyMap: Record<string, string> = { left: "flex-start", center: "center", right: "flex-end" };
      return (
        <div style={{ display: "flex", gap: `${gap}px`, justifyContent: justifyMap[align] || "flex-start" }}>
          {items.map((it, i) => (
            <span key={i} style={{ color, fontSize: `${fontSize}px`, cursor: "default" }}>{it.label}</span>
          ))}
        </div>
      );
    }
    case "logo-grid": {
      const logos = (p.logos as { src: string; alt: string; url: string }[]) || [];
      const cols = (p.columns as number) || 4;
      const gs = p.grayscale as boolean;
      return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {logos.map((lg, i) => (
            <div key={i} className="flex items-center justify-center p-3 bg-slate-50 rounded border border-slate-200">
              {lg.src
                ? <img src={lg.src} alt={lg.alt || ""} className="max-h-10 w-auto object-contain" style={gs ? { filter: "grayscale(1) opacity(0.6)" } : {}} />
                : <span className="text-xs text-slate-400">{lg.alt || "Logo"}</span>}
            </div>
          ))}
        </div>
      );
    }
    case "gallery": {
      const images = (p.images as { src: string; alt: string }[]) || [];
      const cols = (p.columns as number) || 3;
      const gap = (p.gap as number) || 8;
      const radius = (p.radius as number) || 4;
      return (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: `${gap}px` }}>
          {images.map((im, i) => (
            <div key={i} className="aspect-square bg-slate-100 overflow-hidden" style={{ borderRadius: `${radius}px` }}>
              {im.src && <img src={im.src} alt={im.alt || ""} className="w-full h-full object-cover" />}
            </div>
          ))}
        </div>
      );
    }
    case "image-slider": {
      const images = (p.images as { src: string; alt: string }[]) || [];
      const aspect = (p.aspect as string) === "4:3" ? "4 / 3" : (p.aspect as string) === "1:1" ? "1 / 1" : "16 / 9";
      const radius = (p.radius as number) || 8;
      const first = images[0];
      return (
        <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: aspect, borderRadius: `${radius}px` }}>
          {first?.src
            ? <img src={first.src} alt={first.alt || ""} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Image slider</div>}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
              {images.length} images
            </div>
          )}
        </div>
      );
    }
    case "search-input": {
      const bg = (p.bgColor as string) || "#ffffff";
      const border = (p.borderColor as string) || "#e2e8f0";
      return (
        <div className="flex gap-2">
          <input
            readOnly
            className="flex-1 px-3 py-2 text-sm rounded-md"
            style={{ background: bg, border: `1px solid ${border}` }}
            placeholder={(p.placeholder as string) || "Search..."}
          />
          <button className="px-4 py-2 rounded-md text-white text-sm font-medium" style={{ background: "#3b82f6" }}>
            {(p.buttonLabel as string) || "Search"}
          </button>
        </div>
      );
    }
    case "recent-blog-posts":
    case "post-listing": {
      const title = (p.title as string) || (widget.type === "recent-blog-posts" ? "Recent Posts" : "All Posts");
      const cols = (p.columns as number) || 3;
      const count = widget.type === "recent-blog-posts" ? ((p.count as number) || 3) : 3;
      const placeholders = Array.from({ length: count }, (_, i) => i);
      return (
        <div>
          {title && <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {placeholders.map((i) => (
              <div key={i} className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                <div className="aspect-video bg-slate-100 flex items-center justify-center">
                  <span className="text-xs text-slate-400">Image</span>
                </div>
                <div className="p-3">
                  <div className="h-3 bg-slate-200 rounded w-3/4 mb-1.5" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "blog-email-subscription": {
      const bg = (p.bgColor as string) || "#eff6ff";
      const accent = (p.accentColor as string) || "#3b82f6";
      return (
        <div className="rounded-lg p-6" style={{ background: bg }}>
          <h3 className="text-lg font-bold text-slate-900 mb-1">{(p.title as string) || "Subscribe to our newsletter"}</h3>
          <p className="text-sm text-slate-600 mb-4">{(p.subtitle as string) || "Get the latest posts"}</p>
          <div className="flex gap-2">
            <input readOnly className="flex-1 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white"
              placeholder={(p.placeholder as string) || "Your email"} />
            <button className="px-4 py-2 rounded-md text-white text-sm font-medium" style={{ background: accent }}>
              {(p.buttonLabel as string) || "Subscribe"}
            </button>
          </div>
        </div>
      );
    }
    case "language-switcher": {
      const langs = (p.languages as { code: string; label: string }[]) || [];
      const current = (p.current as string) || "en";
      const active = langs.find((l) => l.code === current) || langs[0];
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm text-slate-700 cursor-default">
          <span>{active?.label || current}</span>
          <span className="text-slate-400">▾</span>
        </div>
      );
    }
    case "audio-player": {
      const bg = (p.bgColor as string) || "#1e293b";
      const tc = (p.textColor as string) || "#ffffff";
      const title = (p.title as string) || "Audio";
      return (
        <div className="rounded-lg p-4" style={{ background: bg }}>
          <div className="text-sm font-medium mb-3" style={{ color: tc }}>{title}</div>
          {(p.src as string)
            ? <audio controls src={p.src as string} className="w-full" />
            : (
              <div className="flex items-center gap-3">
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: "rgba(255,255,255,0.2)", color: tc }}>▶</button>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="h-full w-1/3 rounded-full" style={{ background: "rgba(255,255,255,0.6)" }} />
                </div>
                <span className="text-[10px]" style={{ color: tc }}>0:00</span>
              </div>
            )}
        </div>
      );
    }
    case "site-header": {
      const bg = (p.bgColor as string) || "#0f172a";
      const tc = (p.textColor as string) || "#ffffff";
      const links = (p.links as { label: string; url: string }[]) || [];
      return (
        <div className="px-6 py-3 flex items-center gap-6" style={{ background: bg }}>
          <div className="font-bold text-sm" style={{ color: tc }}>
            {(p.logoImage as string)
              ? <img src={p.logoImage as string} alt="" className="h-7 w-auto" />
              : (p.logoText as string) || "Site"}
          </div>
          <div className="flex-1 flex gap-4">
            {links.map((l, i) => (
              <span key={i} className="text-sm cursor-default" style={{ color: tc, opacity: 0.8 }}>{l.label}</span>
            ))}
          </div>
          {(p.ctaLabel as string) && (
            <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: "#3b82f6", color: "#fff" }}>
              {p.ctaLabel as string}
            </button>
          )}
        </div>
      );
    }
    case "post-filter": {
      const tags = (p.tags as { label: string }[]) || [];
      const ac = (p.activeColor as string) || "#3b82f6";
      return (
        <div className="flex flex-wrap gap-2">
          {tags.map((t, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs font-medium cursor-default"
              style={i === 0 ? { background: ac, color: "#fff" } : { background: "#f1f5f9", color: "#64748b" }}>
              {t.label}
            </span>
          ))}
        </div>
      );
    }
    case "rss-listing": {
      const feedUrl = (p.feedUrl as string) || "";
      const title = (p.title as string) || "RSS Feed";
      return (
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
          <p className="text-xs text-slate-500">{feedUrl ? `RSS feed from ${feedUrl}` : "Set a feed URL to display posts"}</p>
        </div>
      );
    }
    case "meetings": {
      const bg = (p.bgColor as string) || "#f8fafc";
      const embedUrl = (p.embedUrl as string) || "";
      if (embedUrl) {
        return <iframe src={embedUrl} className="w-full rounded-lg border border-slate-200" style={{ height: 480 }} />;
      }
      return (
        <div className="rounded-lg border border-slate-200 p-6 text-center" style={{ background: bg }}>
          <div className="text-3xl mb-2">📅</div>
          <h3 className="font-semibold text-slate-800 mb-3">{(p.title as string) || "Book a Meeting"}</h3>
          <button className="px-4 py-2 rounded text-white text-sm font-medium" style={{ background: "#3b82f6" }}>
            {(p.buttonLabel as string) || "Schedule"}
          </button>
        </div>
      );
    }
    case "payment": {
      const bg = (p.bgColor as string) || "#ffffff";
      const accent = (p.accentColor as string) || "#22c55e";
      return (
        <div className="rounded-lg border border-slate-200 p-6" style={{ background: bg }}>
          <h3 className="font-semibold text-slate-800 mb-1">{(p.title as string) || "Complete Purchase"}</h3>
          <div className="text-3xl font-bold text-slate-900 my-3">{(p.amount as string) || "$29"}</div>
          {(p.description as string) && <p className="text-sm text-slate-600 mb-3">{p.description as string}</p>}
          <button className="w-full px-4 py-2.5 rounded text-white text-sm font-semibold" style={{ background: accent }}>
            {(p.buttonLabel as string) || "Pay now"}
          </button>
        </div>
      );
    }
    case "product": {
      const bg = (p.bgColor as string) || "#ffffff";
      const badge = (p.badge as string) || "";
      return (
        <div className="rounded-lg border border-slate-200 overflow-hidden" style={{ background: bg }}>
          <div className="relative aspect-video bg-slate-100">
            {(p.image as string)
              ? <img src={p.image as string} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Image</div>}
            {badge && (
              <span className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">{badge}</span>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">{(p.name as string) || "Product Name"}</h3>
              <span className="font-bold text-slate-900 shrink-0">{(p.price as string) || "$49"}</span>
            </div>
            {(p.description as string) && <p className="text-xs text-slate-500 mb-3">{p.description as string}</p>}
            <button className="w-full px-4 py-2 rounded text-white text-sm font-medium" style={{ background: "#3b82f6" }}>
              {(p.ctaLabel as string) || "Buy now"}
            </button>
          </div>
        </div>
      );
    }
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
