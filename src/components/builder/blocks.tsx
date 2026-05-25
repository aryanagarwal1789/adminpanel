import type { ButtonField, LinkField } from "./defaults";
import { DEFAULT_FIELDS } from "./defaults";
import type { Block, BlockType, LayoutVariant } from "./types";
import { WidgetRenderer } from "./WidgetRenderer";
import type { Widget } from "./widgets";

const LAYOUT_COLS: Record<LayoutVariant, number[]> = {
  "1": [1], "2": [1, 1], "3": [1, 1, 1], "1-2": [1, 2], "2-1": [2, 1], "4": [1, 1, 1, 1],
};

function btnClass(v: ButtonField["variant"] = "primary") {
  switch (v) {
    case "primary": return { className: "px-5 py-2.5 rounded-md text-white font-medium text-sm", style: { background: "#3b82f6" } };
    case "secondary": return { className: "px-5 py-2.5 rounded-md text-white font-medium text-sm", style: { background: "#0f172a" } };
    case "outline": return { className: "px-5 py-2.5 rounded-md font-medium text-sm border border-slate-300 text-slate-700", style: {} };
    case "ghost": return { className: "px-5 py-2.5 rounded-md font-medium text-sm text-slate-700 hover:bg-slate-100", style: {} };
  }
}

function Btn({ b }: { b?: ButtonField }) {
  if (!b || !b.label) return null;
  const v = b.variant ?? "primary";
  const { className, style } = btnClass(v);
  return <button data-pb-btn={v} className={className} style={style}>{b.label}</button>;
}

function Logo({ image, text, dark }: { image?: string; text?: string; dark?: boolean }) {
  if (image) return <img src={image} alt={text || "Logo"} className="h-7 w-auto object-contain" />;
  return <div className={`font-bold text-xl ${dark ? "text-white" : "text-slate-900"}`}>{text}</div>;
}

export function BlockRenderer({ block }: { block: Block }) {
  const f = block.fields as Record<string, unknown>;
  switch (block.type) {
    case "nav-simple":
      return (
        <nav className="flex items-center justify-between px-10 py-4" style={{ background: "#0f172a" }}>
          <Logo image={f.logoImage as string} text={f.logoText as string} dark />
          <div className="flex gap-8 text-white text-sm">
            {((f.links as LinkField[]) ?? []).map((l, i) => <a key={i}>{l.label}</a>)}
          </div>
          <Btn b={f.cta as ButtonField} />
        </nav>
      );
    case "nav-centered":
      return (
        <nav className="flex flex-col items-center gap-3 px-10 py-5" style={{ background: "#0f172a" }}>
          <Logo image={f.logoImage as string} text={f.logoText as string} dark />
          <div className="flex gap-8 text-white text-sm">
            {((f.links as LinkField[]) ?? []).map((l, i) => <a key={i}>{l.label}</a>)}
          </div>
        </nav>
      );
    case "hero-centered": {
      const bg = f.bgImage as string;
      return (
        <section
          className="py-24 px-6 text-center relative"
          style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: "#ffffff" }}
        >
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-5">{f.headline as string}</h1>
          <p className="text-lg text-slate-500 mb-8">{f.subtext as string}</p>
          <div className="flex gap-3 justify-center">
            <Btn b={f.primaryCta as ButtonField} />
            <Btn b={f.secondaryCta as ButtonField} />
          </div>
        </section>
      );
    }
    case "hero-split": {
      const right = f.imageRight !== false;
      const img = (
        <div className="aspect-video rounded-lg bg-slate-200 overflow-hidden">
          {(f.image as string) && <img src={f.image as string} alt="" className="w-full h-full object-cover" />}
        </div>
      );
      const text = (
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">{f.headline as string}</h1>
          <p className="text-slate-500 mb-6">{f.subtext as string}</p>
          <Btn b={f.cta as ButtonField} />
        </div>
      );
      return (
        <section className="bg-white py-20 px-10 grid grid-cols-2 gap-10 items-center">
          {right ? <>{text}{img}</> : <>{img}{text}</>}
        </section>
      );
    }
    case "features-3col":
    case "features-4col": {
      const cols = block.type === "features-3col" ? 3 : 4;
      const features = (f.features as { icon: string; title: string; description: string }[]) ?? [];
      return (
        <section className="py-20 px-10" style={{ background: "#f1f5f9" }}>
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">{f.title as string}</h2>
          {(f.subtext as string) && <p className="text-center text-slate-500 mb-10 max-w-2xl mx-auto">{f.subtext as string}</p>}
          <div className={`grid gap-6 max-w-6xl mx-auto`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {features.map((ft, i) => (
              <div key={i} className="bg-white p-6 rounded-lg">
                <div className="text-3xl mb-3">{ft.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{ft.title}</h3>
                <p className="text-sm text-slate-500">{ft.description}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "text-image": {
      const right = f.imageRight !== false;
      const img = (
        <div className="aspect-video rounded-lg bg-slate-200 overflow-hidden">
          {(f.image as string) && <img src={f.image as string} alt="" className="w-full h-full object-cover" />}
        </div>
      );
      const text = (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{f.headline as string}</h2>
          <p className="text-slate-500">{f.subtext as string}</p>
        </div>
      );
      return (
        <section className="bg-white py-20 px-10 grid grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
          {right ? <>{text}{img}</> : <>{img}{text}</>}
        </section>
      );
    }
    case "stats-bar": {
      const stats = (f.stats as { number: string; label: string; prefix: string; suffix: string }[]) ?? [];
      return (
        <section className="py-14 px-10 bg-white">
          <div className="grid gap-6 max-w-5xl mx-auto text-center" style={{ gridTemplateColumns: `repeat(${Math.max(stats.length, 1)}, minmax(0, 1fr))` }}>
            {stats.map((s, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-slate-900">{s.prefix}{s.number}{s.suffix}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "testimonials": {
      const items = (f.items as { quote: string; author: string; role: string; avatar: string }[]) ?? [];
      return (
        <section className="py-20 px-10" style={{ background: "#f1f5f9" }}>
          <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
            {items.map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-lg">
                <p className="text-slate-700 italic mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    {t.avatar && <img src={t.avatar} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.author}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "logo-grid": {
      const logos = (f.logos as { src: string; alt: string }[]) ?? [];
      return (
        <section className="py-16 px-10 bg-white">
          <p className="text-center text-sm text-slate-500 mb-8">{f.title as string}</p>
          <div className="grid grid-cols-6 gap-6 max-w-5xl mx-auto">
            {logos.map((l, i) => (
              <div key={i} className="h-10 rounded bg-slate-200 overflow-hidden flex items-center justify-center">
                {l.src && <img src={l.src} alt={l.alt} className="max-h-full max-w-full object-contain" />}
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "cta-banner":
      return (
        <section className="py-20 px-6 text-center" style={{ background: "#1e3a8a" }}>
          <h2 className="text-4xl font-bold text-white mb-3">{f.headline as string}</h2>
          <p className="text-blue-100 mb-6">{f.subtext as string}</p>
          <Btn b={f.button as ButtonField} />
        </section>
      );
    case "faq": {
      const items = (f.items as { question: string; answer: string }[]) ?? [];
      return (
        <section className="py-20 px-10 bg-white">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-10">{f.title as string}</h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {items.map((q, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4">
                <div className="font-medium text-slate-900">{q.question}</div>
                <div className="text-sm text-slate-500 mt-1">{q.answer}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "footer-simple":
      return (
        <footer className="flex items-center justify-between px-10 py-6" style={{ background: "#0f172a" }}>
          <div className="text-white text-sm flex items-center gap-3">
            <Logo image={f.logoImage as string} text={f.logoText as string} dark />
            <span className="text-slate-400">{f.copyright as string}</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-300">
            {((f.links as LinkField[]) ?? []).map((l, i) => <a key={i}>{l.label}</a>)}
          </div>
        </footer>
      );
    case "footer-columns":
      return (
        <footer className="px-10 py-12" style={{ background: "#0f172a" }}>
          <div className="grid grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div>
              <Logo image={f.logoImage as string} text={f.logoText as string} dark />
              <p className="text-slate-400 text-sm mt-3">{f.tagline as string}</p>
              <p className="text-slate-500 text-xs mt-4">{f.copyright as string}</p>
            </div>
            {[1, 2, 3].map((n) => (
              <div key={n}>
                <div className="text-white font-semibold mb-3 text-sm">{f[`col${n}Title`] as string}</div>
                <ul className="space-y-2 text-sm text-slate-400">
                  {(((f[`col${n}Links`] as LinkField[]) ?? [])).map((l, i) => <li key={i}>{l.label}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </footer>
      );
    case "layout": {
      const variant: LayoutVariant = block.layout ?? "2";
      const cols = LAYOUT_COLS[variant];
      const rawCols = (block.fields as { columns?: Widget[][] }).columns;
      const colsData: Widget[][] = cols.map((_, i) =>
        Array.isArray(rawCols?.[i]) ? (rawCols![i] as Widget[]) : [],
      );
      return (
        <section className="bg-white py-10 px-10">
          <div className="grid gap-4" style={{ gridTemplateColumns: cols.map((c) => `${c}fr`).join(" ") }}>
            {colsData.map((widgets, i) => (
              <div key={i}>
                {widgets.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-md py-12 px-4 text-center text-sm text-slate-400 bg-slate-50">
                    Empty — add widgets
                  </div>
                ) : (
                  <div className="space-y-4">
                    {widgets.map((w) => <WidgetRenderer key={w.id} widget={w} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }
  }
}

export function defaultBlock(type: BlockType, order: number, layout?: LayoutVariant): Block {
  if (type === "layout") {
    const lv = layout ?? "2";
    const nCols = LAYOUT_COLS[lv].length;
    return {
      id: `b_${Math.random().toString(36).slice(2, 9)}`,
      type, order,
      fields: { type: "layout", layout: lv, columns: Array.from({ length: nCols }, () => []) },
      style: { background: "", padding: "60px 0" },
      layout: lv,
      columns: [],
    };
  }
  // deep clone defaults
  const fields = JSON.parse(JSON.stringify(DEFAULT_FIELDS[type]));
  return {
    id: `b_${Math.random().toString(36).slice(2, 9)}`,
    type, order, fields,
    style: { background: "", padding: "60px 0" },
  };
}
