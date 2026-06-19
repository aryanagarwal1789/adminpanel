import type { BlockStyle, BorderStyle, ShadowSize } from "./types";
import { ColorPicker, ImageField, NumberInput, Select, Toggle } from "./fields";

const ALIGN_OPTS = [
  { value: "left",   label: "Left" },
  { value: "center", label: "Center" },
  { value: "right",  label: "Right" },
];

const BORDER_OPTS: { value: BorderStyle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

const SHADOW_OPTS: { value: ShadowSize; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const WEIGHT_OPTS = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

// (reserved) widget types that should show typography section


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 pb-4 border-b border-slate-800 last:border-b-0">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{title}</div>
      {children}
    </div>
  );
}

export function StyleEditor({
  style,
  update,
  showTypography,
}: {
  style: BlockStyle;
  update: (patch: Partial<BlockStyle>) => void;
  showTypography?: boolean;
}) {
  const transparent = style.bgTransparent ?? false;
  const borderStyle = style.borderStyle ?? "none";

  return (
    <div className="space-y-5">
      <Section title="Quick Presets">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => update({ bgColor: '#0D1F1C', headingColor: '#ffffff', textColor: '#8BBFB8', bgTransparent: false, bgGradientEnabled: false })}
            className="px-3 py-1.5 rounded text-xs font-medium text-white pb-transition"
            style={{ background: '#0D1F1C', border: '1px solid #2A4A47' }}
          >
            Dark Teal
          </button>
          <button
            type="button"
            onClick={() => update({ bgColor: '#0f172a', headingColor: '#ffffff', textColor: '#94a3b8', bgTransparent: false, bgGradientEnabled: false })}
            className="px-3 py-1.5 rounded text-xs font-medium text-white pb-transition"
            style={{ background: '#0f172a', border: '1px solid #1e293b' }}
          >
            Dark Navy
          </button>
          <button
            type="button"
            onClick={() => update({ bgGradientEnabled: true, bgGradientFrom: '#0D1F1C', bgGradientTo: '#000000', bgGradientAngle: 135, headingColor: '#ffffff', textColor: '#8BBFB8', bgTransparent: false })}
            className="px-3 py-1.5 rounded text-xs font-medium text-white pb-transition"
            style={{ background: 'linear-gradient(135deg,#0D1F1C,#000)', border: '1px solid #2A4A47' }}
          >
            Dark Gradient
          </button>
          <button
            type="button"
            onClick={() => update({ bgColor: '#ffffff', headingColor: '#0f172a', textColor: '#475569', bgTransparent: false, bgGradientEnabled: false })}
            className="px-3 py-1.5 rounded text-xs font-medium pb-transition"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }}
          >
            Light
          </button>
        </div>
      </Section>

      <Section title="Background">
        <Toggle label="Transparent" value={transparent} onChange={(v) => update({ bgTransparent: v })} />
        {!transparent && (
          <>
            <Toggle label="Use gradient" value={style.bgGradientEnabled ?? false} onChange={(v) => update({ bgGradientEnabled: v })} />
            {style.bgGradientEnabled ? (
              <>
                <ColorPicker label="From color" value={style.bgGradientFrom ?? '#0D1F1C'} onChange={(v) => update({ bgGradientFrom: v })} />
                <ColorPicker label="To color" value={style.bgGradientTo ?? '#000000'} onChange={(v) => update({ bgGradientTo: v })} />
                <NumberInput label="Angle (deg)" value={style.bgGradientAngle ?? 135} onChange={(v) => update({ bgGradientAngle: v })} />
              </>
            ) : (
              <>
                <ColorPicker label="Color" value={style.bgColor ?? ""} onChange={(v) => update({ bgColor: v })} />
                <ImageField label="Background image URL" value={style.bgImage ?? ""} onChange={(v) => update({ bgImage: v })} />
              </>
            )}
          </>
        )}
      </Section>

      <Section title="Size &amp; Layout">
        <NumberInput label="Min height (px, 0 = auto)" value={style.minHeight ?? 0} onChange={(v) => update({ minHeight: v || undefined })} />
        <Select<string>
          label="Content vertical align"
          value={style.contentVerticalAlign ?? 'top'}
          onChange={(v) => update({ contentVerticalAlign: v as BlockStyle['contentVerticalAlign'] })}
          options={[{ value: 'top', label: 'Top' }, { value: 'center', label: 'Center' }, { value: 'bottom', label: 'Bottom' }]}
        />
      </Section>

      <Section title="Padding">
        <PaddingDiagram style={style} update={update} />
      </Section>

      <Section title="Margin">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Top" value={style.marginTop ?? 0} onChange={(v) => update({ marginTop: v })} />
          <NumberInput label="Bottom" value={style.marginBottom ?? 0} onChange={(v) => update({ marginBottom: v })} />
        </div>
      </Section>

      <Section title="Border">
        <Select label="Style" value={borderStyle} onChange={(v) => update({ borderStyle: v })} options={BORDER_OPTS} />
        {borderStyle !== "none" && (
          <>
            <ColorPicker label="Color" value={style.borderColor ?? "#e2e8f0"} onChange={(v) => update({ borderColor: v })} />
            <NumberInput label="Width (px)" value={style.borderWidth ?? 1} onChange={(v) => update({ borderWidth: v })} />
          </>
        )}
        <NumberInput label="Radius (px)" value={style.borderRadius ?? 0} onChange={(v) => update({ borderRadius: v })} />
      </Section>

      <Section title="Shadow">
        <Select label="Shadow" value={(style.shadow ?? "none") as ShadowSize} onChange={(v) => update({ shadow: v })} options={SHADOW_OPTS} />
      </Section>

      <Section title="Text colors">
        <ColorPicker label="Heading color" value={style.headingColor ?? ""} onChange={(v) => update({ headingColor: v || undefined })} />
        <ColorPicker label="Body / subtext color" value={style.textColor ?? ""} onChange={(v) => update({ textColor: v || undefined })} />
      </Section>

      <Section title="Animation">
        <Select<string>
          label="Entrance animation"
          value={style.animation ?? 'none'}
          onChange={(v) => update({ animation: v === 'none' ? undefined : v })}
          options={[
            { value: 'none',        label: 'None' },
            { value: 'fade-up',     label: 'Fade Up' },
            { value: 'fade-down',   label: 'Fade Down' },
            { value: 'fade-in',     label: 'Fade In' },
            { value: 'slide-left',  label: 'Slide from Left' },
            { value: 'slide-right', label: 'Slide from Right' },
            { value: 'zoom-in',     label: 'Zoom In' },
            { value: 'bounce-in',   label: 'Bounce In' },
          ]}
        />
        {style.animation && style.animation !== 'none' && (
          <>
            <Select<string>
              label="Duration"
              value={String(style.animationDuration ?? 600)}
              onChange={(v) => update({ animationDuration: Number(v) })}
              options={[
                { value: '300',  label: 'Fast (300ms)' },
                { value: '500',  label: 'Normal (500ms)' },
                { value: '600',  label: 'Default (600ms)' },
                { value: '800',  label: 'Slow (800ms)' },
                { value: '1000', label: 'Slower (1s)' },
              ]}
            />
            <Select<string>
              label="Delay"
              value={String(style.animationDelay ?? 0)}
              onChange={(v) => update({ animationDelay: Number(v) })}
              options={[
                { value: '0',   label: 'No delay' },
                { value: '100', label: '100ms' },
                { value: '200', label: '200ms' },
                { value: '300', label: '300ms' },
                { value: '400', label: '400ms' },
                { value: '500', label: '500ms' },
                { value: '700', label: '700ms' },
              ]}
            />
          </>
        )}
      </Section>

      {showTypography && (
        <Section title="Typography">
          <Select<string>
            label="Text align"
            value={style.textAlign ?? "left"}
            onChange={(v) => update({ textAlign: v as BlockStyle['textAlign'] })}
            options={ALIGN_OPTS}
          />
          <NumberInput label="Font size (px)" value={style.fontSize ?? 16} onChange={(v) => update({ fontSize: v })} />
          <Select<string>
            label="Font weight"
            value={String(style.fontWeight ?? 400)}
            onChange={(v) => update({ fontWeight: Number(v) })}
            options={WEIGHT_OPTS}
          />
          <NumberInput label="Line height" value={style.lineHeight ?? 1.5} onChange={(v) => update({ lineHeight: v })} />
          <NumberInput label="Letter spacing (px)" value={style.letterSpacing ?? 0} onChange={(v) => update({ letterSpacing: v })} />
        </Section>
      )}
    </div>
  );
}

function PaddingDiagram({ style, update }: { style: BlockStyle; update: (p: Partial<BlockStyle>) => void }) {
  const cell = "w-full text-xs rounded px-1.5 py-1 bg-slate-800 border border-slate-700 text-white text-center outline-none focus:border-blue-500";
  const labelCls = "text-[10px] text-slate-400 mb-0.5";
  const Input = ({ k }: { k: "paddingTop" | "paddingRight" | "paddingBottom" | "paddingLeft" }) => (
    <input
      type="number"
      className={cell}
      value={(style[k] as number) ?? 0}
      onChange={(e) => update({ [k]: Number(e.target.value) } as Partial<BlockStyle>)}
    />
  );
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/40 p-3">
      <div className="grid grid-cols-3 gap-2 items-center">
        <div />
        <div>
          <div className={labelCls + " text-center"}>Top</div>
          <Input k="paddingTop" />
        </div>
        <div />
        <div>
          <div className={labelCls}>Left</div>
          <Input k="paddingLeft" />
        </div>
        <div className="h-14 border-2 border-dashed border-slate-600 rounded flex items-center justify-center text-[10px] text-slate-500">
          T/R/B/L
        </div>
        <div>
          <div className={labelCls}>Right</div>
          <Input k="paddingRight" />
        </div>
        <div />
        <div>
          <div className={labelCls + " text-center"}>Bottom</div>
          <Input k="paddingBottom" />
        </div>
        <div />
      </div>
    </div>
  );
}
