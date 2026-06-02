import React from "react";

/* ----------------------------- helpers ----------------------------- */

type P = Record<string, unknown>;

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : v == null ? fallback : String(v);

const num = (v: unknown, fallback: number): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const bool = (v: unknown, fallback = false): boolean =>
  typeof v === "boolean" ? v : fallback;

const arr = <T,>(v: unknown, fallback: T[] = []): T[] =>
  Array.isArray(v) ? (v as T[]) : fallback;

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

const alignClass = (a: unknown): string => {
  const v = str(a, "left");
  if (v === "center") return "text-center";
  if (v === "right") return "text-right";
  return "text-left";
};

const justifyClass = (a: unknown): string => {
  const v = str(a, "left");
  if (v === "center") return "justify-center";
  if (v === "right") return "justify-end";
  return "justify-start";
};

/* ----------------------------- icons ----------------------------- */

const ImageIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const PlayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8 5v14l11-7z" />
  </svg>
);

const ChevronDown = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronLeft = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const GlobeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const RssIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 11a9 9 0 0 1 9 9" />
    <path d="M4 4a16 16 0 0 1 16 16" />
    <circle cx="5" cy="19" r="1" />
  </svg>
);

const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const AnchorIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="22" x2="12" y2="8" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
  </svg>
);

/* ----------------------------- widgets ----------------------------- */

export function HeadingWidget({ p }: { p: P }) {
  const text = str(p.text, "Heading");
  const level = (str(p.level, "h2") as "h1" | "h2" | "h3" | "h4");
  const color = str(p.color, "");
  const sizes: Record<string, string> = {
    h1: "text-3xl font-bold tracking-tight",
    h2: "text-2xl font-semibold tracking-tight",
    h3: "text-xl font-semibold",
    h4: "text-base font-semibold",
  };
  const Tag = level as React.ElementType;
  const accent = level === "h3" || level === "h4";
  return (
    <div className={alignClass(p.align)}>
      <Tag
        className={`${sizes[level] ?? sizes.h2} text-slate-900 ${accent ? "border-l-2 border-blue-500 pl-3 inline-block" : ""}`}
        style={color ? { color } : undefined}
      >
        {text}
      </Tag>
    </div>
  );
}

export function ParagraphWidget({ p }: { p: P }) {
  const text = str(p.text, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.");
  const size = str(p.size, "base");
  const color = str(p.color, "");
  const sizeCls = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";
  return (
    <p
      className={`${sizeCls} ${alignClass(p.align)} text-slate-600 leading-relaxed whitespace-pre-wrap`}
      style={color ? { color } : undefined}
    >
      {text}
    </p>
  );
}

export function ImageWidget({ p }: { p: P }) {
  const src = str(p.src, "");
  const alt = str(p.alt, "");
  const width = Math.min(100, Math.max(0, num(p.width, 100)));
  const radius = num(p.radius, 8);
  if (!src) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 text-slate-400 aspect-video"
        style={{ width: `${width}%`, borderRadius: radius }}
      >
        <ImageIcon className="w-10 h-10" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="block object-cover"
      style={{ width: `${width}%`, borderRadius: radius }}
    />
  );
}

export function ButtonWidget({ p }: { p: P }) {
  const label = str(p.label, "Button");
  const variant = str(p.variant, "primary");
  const fullWidth = bool(p.fullWidth);
  const color = str(p.color, "");
  const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors";
  const variants: Record<string, string> = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-300 text-slate-900 bg-white hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
  };
  const cls = `${base} ${variants[variant] ?? variants.primary} ${fullWidth ? "w-full" : ""}`;
  const style: React.CSSProperties = {};
  if (color && (variant === "primary" || variant === "secondary")) style.backgroundColor = color;
  return (
    <div className={`flex ${justifyClass(p.align)}`}>
      <button type="button" className={cls} style={style}>
        {label}
      </button>
    </div>
  );
}

export function DividerWidget({ p }: { p: P }) {
  const style = str(p.style, "solid");
  const thickness = num(p.thickness, 1);
  const color = str(p.color, "#e2e8f0");
  return (
    <hr
      style={{
        borderTopStyle: style as React.CSSProperties["borderTopStyle"],
        borderTopWidth: thickness,
        borderTopColor: color,
        borderBottom: 0,
        borderLeft: 0,
        borderRight: 0,
      }}
    />
  );
}

export function SpacerWidget({ p }: { p: P }) {
  const height = num(p.height, 24);
  return (
    <div
      className="flex items-center justify-center text-[10px] text-slate-400 border border-dashed border-slate-200 rounded bg-slate-50/50"
      style={{ height }}
    >
      ↕ {height}px
    </div>
  );
}

export function IconWidget({ p }: { p: P }) {
  const icon = str(p.icon, "✨");
  const size = num(p.size, 40);
  const color = str(p.color, "");
  return (
    <div className={`flex ${justifyClass(p.align)}`}>
      <span style={{ fontSize: size, color: color || undefined, lineHeight: 1 }}>{icon}</span>
    </div>
  );
}

export function CardWidget({ p }: { p: P }) {
  const title = str(p.title, "Card title");
  const description = str(p.description, "A short description that explains what this card is about.");
  const image = str(p.image, "");
  const buttonLabel = str(p.buttonLabel, "Learn more");
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {image ? (
        <img src={image} alt="" className="w-full aspect-video object-cover" />
      ) : (
        <div className="w-full aspect-video bg-slate-100 flex items-center justify-center text-slate-400">
          <ImageIcon className="w-8 h-8" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{description}</p>
        {buttonLabel && (
          <a href={str(p.buttonUrl, "#")} className="mt-3 inline-flex items-center text-sm font-medium text-blue-500 hover:text-blue-600">
            {buttonLabel} <ChevronRight className="w-4 h-4 ml-0.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function VideoWidget({ p }: { p: P }) {
  const url = str(p.url, "");
  const aspect = str(p.aspect, "16:9");
  const aspectCls =
    aspect === "4:3" ? "aspect-[4/3]" : aspect === "1:1" ? "aspect-square" : "aspect-video";
  return (
    <div>
      <div className={`relative ${aspectCls} bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center`}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
        <div className="relative flex flex-col items-center gap-2 text-white/90">
          <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
            <PlayIcon className="w-6 h-6 ml-0.5" />
          </div>
          <span className="text-xs font-medium tracking-wide uppercase text-white/70">Video</span>
        </div>
      </div>
      {url && <p className="mt-2 text-xs text-slate-400 truncate">{url}</p>}
    </div>
  );
}

export function FormWidget({ p }: { p: P }) {
  const submitLabel = str(p.submitLabel, "Submit");
  const fields = arr<{ label?: string; type?: string }>(p.fields, [
    { label: "Name", type: "text" },
    { label: "Email", type: "email" },
    { label: "Message", type: "textarea" },
  ]);
  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      {fields.map((f, i) => {
        const label = str(f?.label, `Field ${i + 1}`);
        const type = str(f?.type, "text");
        return (
          <div key={i}>
            <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
            {type === "textarea" ? (
              <textarea
                readOnly
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                placeholder={`Your ${label.toLowerCase()}`}
              />
            ) : (
              <input
                readOnly
                type="text"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                placeholder={`Your ${label.toLowerCase()}`}
              />
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="w-full rounded-md bg-blue-500 text-white text-sm font-medium py-2 hover:bg-blue-600"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export function ListWidget({ p }: { p: P }) {
  const items = arr<{ text?: string }>(p.items, [
    { text: "First item" },
    { text: "Second item" },
    { text: "Third item" },
  ]);
  const style = str(p.style, "bullet");
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => {
        const text = str(it?.text, "");
        return (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
            {style === "numbered" ? (
              <span className="text-slate-400 tabular-nums font-medium min-w-[1.25rem]">{i + 1}.</span>
            ) : style === "bullet" ? (
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            ) : null}
            <span className="leading-relaxed">{text}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function AccordionWidget({ p }: { p: P }) {
  const items = arr<{ title?: string; body?: string }>(p.items, [
    { title: "What is included?", body: "Everything you need to get started in minutes." },
    { title: "How does billing work?" },
    { title: "Can I cancel anytime?" },
  ]);
  return (
    <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white overflow-hidden">
      {items.map((it, i) => {
        const open = i === 0;
        const title = str(it?.title, `Item ${i + 1}`);
        const body = str(it?.body, "");
        return (
          <div key={i}>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-slate-900">{title}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </div>
            {open && body && (
              <div className="px-4 pb-3 text-sm text-slate-600 leading-relaxed">{body}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PricingCardWidget({ p }: { p: P }) {
  const plan = str(p.plan, "Pro");
  const price = str(p.price, "$29");
  const period = str(p.period, "/mo");
  const description = str(p.description, "Everything you need to scale.");
  const features = arr<{ text?: string }>(p.features, [
    { text: "Unlimited projects" },
    { text: "Priority support" },
    { text: "Advanced analytics" },
  ]);
  const highlighted = bool(p.highlighted);
  const cta = obj(p.cta);
  const ctaLabel = str(cta.label, "Get started");

  return (
    <div
      className={`rounded-xl p-5 shadow-sm ${
        highlighted
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          : "bg-white border border-slate-200 text-slate-900"
      }`}
    >
      <div className={`text-xs font-semibold uppercase tracking-wider ${highlighted ? "text-blue-100" : "text-blue-500"}`}>
        {plan}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold">{price}</span>
        <span className={`text-sm ${highlighted ? "text-blue-100" : "text-slate-500"}`}>{period}</span>
      </div>
      <p className={`mt-2 text-sm ${highlighted ? "text-blue-50" : "text-slate-600"}`}>{description}</p>
      <ul className="mt-4 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckIcon className={`w-4 h-4 mt-0.5 shrink-0 ${highlighted ? "text-white" : "text-blue-500"}`} />
            <span className={highlighted ? "text-white/95" : "text-slate-700"}>{str(f?.text, "")}</span>
          </li>
        ))}
      </ul>
      <button
        className={`mt-5 w-full rounded-md py-2 text-sm font-medium ${
          highlighted
            ? "bg-white text-blue-600 hover:bg-blue-50"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

export function MetricsWidget({ p }: { p: P }) {
  const items = arr<{ number?: string; label?: string; description?: string }>(p.items, [
    { number: "98%", label: "Uptime", description: "Last 90 days" },
    { number: "12k", label: "Users", description: "Active monthly" },
    { number: "4.9", label: "Rating", description: "From reviews" },
  ]);
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, minmax(0,1fr))` }}>
      {items.map((it, i) => (
        <div key={i} className="space-y-1">
          <div className="w-6 h-0.5 rounded-full bg-blue-500" />
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{str(it?.number, "0")}</div>
          <div className="text-xs font-medium text-slate-700">{str(it?.label, "")}</div>
          {it?.description && (
            <div className="text-[10px] text-slate-500 leading-snug">{str(it.description, "")}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ImageGridWidget({ p }: { p: P }) {
  const images = arr<{ src?: string; alt?: string }>(p.images, [{}, {}, {}, {}]);
  const columns = Math.min(4, Math.max(2, num(p.columns, 3)));
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {images.map((im, i) => {
        const src = str(im?.src, "");
        return (
          <div key={i} className="aspect-square rounded-md overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400">
            {src ? (
              <img src={src} alt={str(im?.alt, "")} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TestimonialSliderWidget({ p }: { p: P }) {
  const items = arr<{ quote?: string; author?: string; role?: string; avatar?: string }>(p.items, [
    { quote: "This product completely changed how our team ships.", author: "Alex Chen", role: "Head of Product" },
  ]);
  const first = items[0] ?? {};
  const author = str(first.author, "Anonymous");
  const role = str(first.role, "");
  const avatar = str(first.avatar, "");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-4xl leading-none text-blue-500/30 font-serif">“</div>
      <p className="-mt-2 text-sm text-slate-700 leading-relaxed">
        {str(first.quote, "A great quote will appear here.")}
      </p>
      <div className="mt-4 flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={author} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-semibold text-slate-600">
            {author.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-slate-900">{author}</div>
          {role && <div className="text-xs text-slate-500">{role}</div>}
        </div>
      </div>
      {items.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-4 bg-blue-500" : "w-1.5 bg-slate-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeatureListWidget({ p }: { p: P }) {
  const items = arr<{ icon?: string; text?: string }>(p.items, [
    { icon: "⚡", text: "Lightning fast performance" },
    { icon: "🔒", text: "Secure by default" },
    { icon: "✨", text: "Delightful experience" },
  ]);
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-500 text-base shrink-0">
            {str(it?.icon, "•")}
          </span>
          <span className="text-sm text-slate-700 leading-relaxed pt-1">{str(it?.text, "")}</span>
        </li>
      ))}
    </ul>
  );
}

export function LogoWidget({ p }: { p: P }) {
  const src = str(p.src, "");
  const alt = str(p.alt, "Logo");
  const width = num(p.width, 120);
  const link = str(p.link, "");
  const inner = src ? (
    <img src={src} alt={alt} style={{ width }} className="block object-contain" />
  ) : (
    <div
      className="rounded-md bg-slate-100 text-slate-500 text-xs font-medium flex items-center justify-center"
      style={{ width, height: width / 3 }}
    >
      {alt}
    </div>
  );
  return link ? <a href={link}>{inner}</a> : <>{inner}</>;
}

export function CountdownWidget({ p }: { p: P }) {
  const label = str(p.label, "Launching in");
  const bgColor = str(p.bgColor, "#0f172a");
  const textColor = str(p.textColor, "#ffffff");
  const labelColor = str(p.labelColor, "#94a3b8");
  const units = ["Days", "Hours", "Mins", "Secs"];
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: bgColor }}>
      <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: labelColor }}>
        {label}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div key={u} className="rounded-lg bg-white/5 ring-1 ring-white/10 py-3 text-center">
            <div className="text-2xl font-bold tabular-nums" style={{ color: textColor }}>00</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider" style={{ color: labelColor }}>{u}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TabsWidget({ p }: { p: P }) {
  const items = arr<{ title?: string; content?: string }>(p.items, [
    { title: "Overview", content: "This is the overview tab content." },
    { title: "Details" },
    { title: "Settings" },
  ]);
  const activeColor = str(p.activeColor, "#3b82f6");
  const inactiveColor = str(p.inactiveColor, "#64748b");
  const first = items[0] ?? {};
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-200">
        {items.map((it, i) => {
          const active = i === 0;
          return (
            <div
              key={i}
              className="pb-2.5 text-sm font-medium relative"
              style={{ color: active ? activeColor : inactiveColor }}
            >
              {str(it?.title, `Tab ${i + 1}`)}
              {active && (
                <span
                  className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full"
                  style={{ backgroundColor: activeColor }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="pt-3 text-sm text-slate-600 leading-relaxed">
        {str(first.content, "Tab content goes here.")}
      </div>
    </div>
  );
}

export function HorizontalSpacerWidget({ p }: { p: P }) {
  const height = num(p.height, 2);
  const width = Math.min(100, Math.max(0, num(p.width, 50)));
  const color = str(p.color, "#e2e8f0");
  return (
    <div className="flex justify-center">
      <div style={{ height, width: `${width}%`, backgroundColor: color, borderRadius: 999 }} />
    </div>
  );
}

export function AnchorWidget({ p }: { p: P }) {
  const id = str(p.id, "section");
  const label = str(p.label, "");
  return (
    <div className="inline-flex items-center gap-2 text-slate-500">
      <AnchorIcon className="w-3.5 h-3.5" />
      <code className="text-[11px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">#{id}</code>
      {label && <span className="text-xs">{label}</span>}
    </div>
  );
}

export function ImageTextWidget({ p }: { p: P }) {
  const image = str(p.image, "");
  const heading = str(p.heading, "A compelling heading");
  const text = str(p.text, "A short paragraph that gives more context about the heading above.");
  const ctaLabel = str(p.ctaLabel, "");
  const layout = str(p.layout, "left");
  const imgEl = image ? (
    <img src={image} alt="" className="w-full aspect-video object-cover rounded-md" />
  ) : (
    <div className="w-full aspect-video bg-slate-100 rounded-md flex items-center justify-center text-slate-400">
      <ImageIcon />
    </div>
  );
  const textEl = (
    <div>
      <h3 className="text-base font-semibold text-slate-900">{heading}</h3>
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{text}</p>
      {ctaLabel && (
        <a href={str(p.ctaUrl, "#")} className="mt-3 inline-flex items-center text-sm font-medium text-blue-500 hover:text-blue-600">
          {ctaLabel} <ChevronRight className="w-4 h-4 ml-0.5" />
        </a>
      )}
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-4 items-center">
      {layout === "right" ? (
        <>
          {textEl}
          {imgEl}
        </>
      ) : (
        <>
          {imgEl}
          {textEl}
        </>
      )}
    </div>
  );
}

export function NavigationMenuWidget({ p }: { p: P }) {
  const items = arr<{ label?: string; url?: string }>(p.items, [
    { label: "Home" },
    { label: "Features" },
    { label: "Pricing" },
    { label: "About" },
  ]);
  const gap = num(p.gap, 16);
  const color = str(p.color, "");
  const hoverColor = str(p.hoverColor, "");
  const fontSize = num(p.fontSize, 14);
  return (
    <nav className={`flex items-center flex-wrap ${justifyClass(p.align)}`} style={{ gap, fontSize }}>
      {items.map((it, i) => (
        <a
          key={i}
          href={str(it?.url, "#")}
          className={`transition-colors ${i === 0 ? "font-semibold" : ""}`}
          style={{
            color: color || (i === 0 ? "#0f172a" : "#475569"),
            ["--nav-hover" as string]: hoverColor || color || "#0f172a",
          }}
          onMouseEnter={(e) => { if (hoverColor || color) (e.currentTarget as HTMLElement).style.color = hoverColor || color; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = color || (i === 0 ? "#0f172a" : "#475569"); }}
        >
          {str(it?.label, `Link ${i + 1}`)}
        </a>
      ))}
    </nav>
  );
}

export function LogoGridWidget({ p }: { p: P }) {
  const logos = arr<{ src?: string; alt?: string }>(p.logos, [{}, {}, {}, {}, {}, {}]);
  const columns = Math.min(6, Math.max(2, num(p.columns, 3)));
  const grayscale = bool(p.grayscale, true);
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {logos.map((l, i) => {
        const src = str(l?.src, "");
        const alt = str(l?.alt, "Logo");
        return (
          <div
            key={i}
            className="aspect-[3/2] rounded-md border border-slate-200 bg-white flex items-center justify-center p-3"
          >
            {src ? (
              <img
                src={src}
                alt={alt}
                className={`max-h-full max-w-full object-contain ${grayscale ? "grayscale opacity-70" : ""}`}
              />
            ) : (
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{alt}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GalleryWidget({ p }: { p: P }) {
  const images = arr<{ src?: string; alt?: string }>(p.images, [{}, {}, {}, {}, {}, {}]);
  const columns = Math.min(4, Math.max(2, num(p.columns, 3)));
  const gap = num(p.gap, 8);
  const radius = num(p.radius, 6);
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap }}>
      {images.map((im, i) => {
        const src = str(im?.src, "");
        return (
          <div
            key={i}
            className="aspect-square bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden"
            style={{ borderRadius: radius }}
          >
            {src ? (
              <img src={src} alt={str(im?.alt, "")} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ImageSliderWidget({ p }: { p: P }) {
  const images = arr<{ src?: string; alt?: string }>(p.images, [{}]);
  const aspect = str(p.aspect, "16:9");
  const radius = num(p.radius, 8);
  const aspectCls =
    aspect === "4:3" ? "aspect-[4/3]" : aspect === "1:1" ? "aspect-square" : "aspect-video";
  const first = images[0] ?? {};
  const src = str(first.src, "");
  const multi = images.length > 1;
  return (
    <div>
      <div className={`relative ${aspectCls} bg-slate-100 overflow-hidden`} style={{ borderRadius: radius }}>
        {src ? (
          <img src={src} alt={str(first.alt, "")} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
        {multi && (
          <>
            <button className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700">
              <ChevronLeft />
            </button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700">
              <ChevronRight />
            </button>
          </>
        )}
      </div>
      {multi && (
        <div className="mt-2 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full ${i === 0 ? "w-4 bg-blue-500" : "w-1.5 bg-slate-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchInputWidget({ p }: { p: P }) {
  const placeholder = str(p.placeholder, "Search...");
  const buttonLabel = str(p.buttonLabel, "Search");
  const bgColor = str(p.bgColor, "#ffffff");
  const borderColor = str(p.borderColor, "#e2e8f0");
  return (
    <div
      className="flex items-center gap-1 rounded-full border p-1 pl-4"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <SearchIcon className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        readOnly
        className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 py-1.5"
        placeholder={placeholder}
      />
      <button className="rounded-full bg-blue-500 text-white text-sm font-medium px-4 py-1.5 hover:bg-blue-600 shrink-0">
        {buttonLabel}
      </button>
    </div>
  );
}

const shimmer = (
  <style>{`
    @keyframes wp-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .wp-shimmer { background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%); background-size: 200% 100%; animation: wp-shimmer 1.6s linear infinite; }
  `}</style>
);

export function RecentBlogPostsWidget({ p }: { p: P }) {
  const title = str(p.title, "Recent posts");
  const columns = Math.min(4, Math.max(1, num(p.columns, 2)));
  const count = Math.max(1, num(p.count, 3));
  return (
    <div>
      {shimmer}
      <h3 className="text-base font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="aspect-video wp-shimmer" />
            <div className="p-3 space-y-2">
              <div className="h-3 rounded wp-shimmer w-4/5" />
              <div className="h-2 rounded wp-shimmer w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlogEmailSubscriptionWidget({ p }: { p: P }) {
  const title = str(p.title, "Subscribe to our newsletter");
  const subtitle = str(p.subtitle, "Get the latest posts delivered to your inbox.");
  const placeholder = str(p.placeholder, "you@example.com");
  const buttonLabel = str(p.buttonLabel, "Subscribe");
  const bgColor = str(p.bgColor, "#eff6ff");
  const accentColor = str(p.accentColor, "#3b82f6");
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: bgColor }}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          placeholder={placeholder}
          className="flex-1 min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400"
        />
        <button
          className="rounded-md px-4 py-2 text-sm font-medium text-white shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export function LanguageSwitcherWidget({ p }: { p: P }) {
  const languages = arr<{ code?: string; label?: string }>(p.languages, [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
  ]);
  const current = str(p.current, str(languages[0]?.code, "en"));
  const found = languages.find((l) => str(l?.code) === current) ?? languages[0] ?? {};
  return (
    <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
      <GlobeIcon className="w-4 h-4 text-slate-500" />
      <span className="font-medium">{str(found.label, current.toUpperCase())}</span>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
    </button>
  );
}

export function AudioPlayerWidget({ p }: { p: P }) {
  const title = str(p.title, "Untitled track");
  const bgColor = str(p.bgColor, "#0f172a");
  const textColor = str(p.textColor, "#ffffff");
  return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: bgColor, color: textColor }}>
      <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0 ring-1 ring-white/10">
        <PlayIcon className="w-4 h-4 ml-0.5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-white/70" />
        </div>
        <div className="mt-1 flex justify-between text-[10px] opacity-60 tabular-nums">
          <span>1:12</span>
          <span>3:45</span>
        </div>
      </div>
    </div>
  );
}

export function SiteHeaderWidget({ p }: { p: P }) {
  const logoImage = str(p.logoImage, "");
  const logoText = str(p.logoText, "Brand");
  const links = arr<{ label?: string; url?: string }>(p.links, [
    { label: "Features" },
    { label: "Pricing" },
    { label: "About" },
  ]);
  const bgColor = str(p.bgColor, "#ffffff");
  const textColor = str(p.textColor, "#0f172a");
  const ctaLabel = str(p.ctaLabel, "Sign up");
  return (
    <header
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="flex items-center gap-2 shrink-0">
        {logoImage ? (
          <img src={logoImage} alt={logoText} className="h-5 w-auto object-contain" />
        ) : (
          <div className="w-5 h-5 rounded bg-blue-500" />
        )}
        <span className="text-sm font-semibold">{logoText}</span>
      </div>
      <nav className="hidden sm:flex items-center gap-3 text-xs">
        {links.slice(0, 4).map((l, i) => (
          <a key={i} className="opacity-70 hover:opacity-100">{str(l?.label, "")}</a>
        ))}
      </nav>
      <a href={str(p.ctaUrl, "#")} className="rounded-md bg-blue-500 text-white text-xs font-medium px-3 py-1.5 shrink-0">
        {ctaLabel}
      </a>
    </header>
  );
}

export function PostFilterWidget({ p }: { p: P }) {
  const tags = arr<{ label?: string }>(p.tags, [
    { label: "All" },
    { label: "Design" },
    { label: "Engineering" },
    { label: "Product" },
  ]);
  const activeColor = str(p.activeColor, "#3b82f6");
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => {
        const active = i === 0;
        return (
          <span
            key={i}
            className={`text-xs px-3 py-1 rounded-full border ${
              active ? "text-white border-transparent" : "text-slate-600 bg-white border-slate-200"
            }`}
            style={active ? { backgroundColor: activeColor } : undefined}
          >
            {str(t?.label, "")}
          </span>
        );
      })}
    </div>
  );
}

export function RSSListingWidget({ p }: { p: P }) {
  const title = str(p.title, "Latest from the feed");
  const feedUrl = str(p.feedUrl, "");
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {shimmer}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50/50">
        <span className="flex items-center justify-center w-6 h-6 rounded bg-orange-500 text-white">
          <RssIcon className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">{title}</div>
          {feedUrl && <div className="text-[10px] text-slate-500 truncate">{feedUrl}</div>}
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="px-4 py-3 space-y-1.5">
            <div className="h-2.5 rounded wp-shimmer w-3/4" />
            <div className="h-2 rounded wp-shimmer w-1/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MeetingsWidget({ p }: { p: P }) {
  const title = str(p.title, "Book a meeting");
  const buttonLabel = str(p.buttonLabel, "Schedule now");
  const buttonUrl = str(p.buttonUrl, "#");
  const bgColor = str(p.bgColor, "#ffffff");
  const embedUrl = str(p.embedUrl, "");
  if (embedUrl) {
    return <iframe src={embedUrl} className="w-full rounded-lg border border-slate-200" style={{ height: 480 }} />;
  }
  return (
    <div className="rounded-xl border border-slate-200 p-5 shadow-sm" style={{ backgroundColor: bgColor }}>
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-500">
        <CalendarIcon />
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">Pick a time that works best for you.</p>
      <a href={buttonUrl} className="mt-4 block w-full rounded-md bg-blue-500 text-white text-sm font-medium py-2 text-center hover:bg-blue-600">
        {buttonLabel}
      </a>
    </div>
  );
}

export function PaymentWidget({ p }: { p: P }) {
  const title = str(p.title, "Complete your purchase");
  const amount = str(p.amount, "$49.00");
  const description = str(p.description, "One-time payment, secure checkout.");
  const buttonLabel = str(p.buttonLabel, "Pay now");
  const bgColor = str(p.bgColor, "#ffffff");
  const accentColor = str(p.accentColor, "#10b981");
  return (
    <div className="rounded-xl border border-slate-200 p-5 shadow-sm" style={{ backgroundColor: bgColor }}>
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">{amount}</div>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <button
        className="mt-4 w-full rounded-md text-white text-sm font-semibold py-2.5"
        style={{ backgroundColor: accentColor }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export function ProductWidget({ p }: { p: P }) {
  const name = str(p.name, "Product name");
  const price = str(p.price, "$29");
  const description = str(p.description, "Short product description goes here.");
  const image = str(p.image, "");
  const badge = str(p.badge, "");
  const ctaLabel = str(p.ctaLabel, "Add to cart");
  const bgColor = str(p.bgColor, "#ffffff");
  return (
    <div
      className="rounded-xl border border-slate-200 overflow-hidden shadow-sm"
      style={{ backgroundColor: bgColor }}
    >
      <div className="relative aspect-square bg-slate-100 flex items-center justify-center text-slate-400">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-10 h-10" />
        )}
        {badge && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider bg-blue-500 text-white px-2 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{name}</h3>
          <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">{price}</span>
        </div>
        <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">{description}</p>
        <a href={str(p.ctaUrl, "#")} className="mt-3 block w-full rounded-md bg-blue-500 text-white text-sm font-medium py-2 text-center hover:bg-blue-600">
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}

export function ContentLibraryWidget({ p }: { p: P }) {
  const title = str(p.title, "Content library");
  const count = Math.min(8, Math.max(2, num(p.count, 6)));
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="aspect-square rounded-md bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="h-2 rounded bg-slate-200 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- map ----------------------------- */

export const WIDGET_PREVIEW_MAP: Record<string, React.ComponentType<{ p: Record<string, unknown> }>> = {
  heading: HeadingWidget,
  "section-heading": HeadingWidget,
  "section-header": HeadingWidget,
  paragraph: ParagraphWidget,
  text: ParagraphWidget,
  "rich-text": ParagraphWidget,
  image: ImageWidget,
  button: ButtonWidget,
  divider: DividerWidget,
  spacer: SpacerWidget,
  icon: IconWidget,
  card: CardWidget,
  video: VideoWidget,
  "video-embed": VideoWidget,
  form: FormWidget,
  list: ListWidget,
  accordion: AccordionWidget,
  "pricing-card": PricingCardWidget,
  metrics: MetricsWidget,
  "image-grid": ImageGridWidget,
  "testimonial-slider": TestimonialSliderWidget,
  "feature-list": FeatureListWidget,
  logo: LogoWidget,
  countdown: CountdownWidget,
  tabs: TabsWidget,
  "horizontal-spacer": HorizontalSpacerWidget,
  anchor: AnchorWidget,
  "image-text": ImageTextWidget,
  "horizontal-menu": NavigationMenuWidget,
  "navigation-menu": NavigationMenuWidget,
  "logo-grid": LogoGridWidget,
  gallery: GalleryWidget,
  "image-slider": ImageSliderWidget,
  "search-input": SearchInputWidget,
  "recent-blog-posts": RecentBlogPostsWidget,
  "post-listing": RecentBlogPostsWidget,
  "blog-email-subscription": BlogEmailSubscriptionWidget,
  "language-switcher": LanguageSwitcherWidget,
  "audio-player": AudioPlayerWidget,
  "site-header": SiteHeaderWidget,
  "post-filter": PostFilterWidget,
  "rss-listing": RSSListingWidget,
  meetings: MeetingsWidget,
  payment: PaymentWidget,
  product: ProductWidget,
  "content-library": ContentLibraryWidget,
};
