import type { BlockStyle, BorderStyle, ShadowSize } from "./types";
import { ColorPicker, ImageField, NumberInput, Select, Toggle } from "./fields";

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
      <Section title="Background">
        <Toggle label="Transparent" value={transparent} onChange={(v) => update({ bgTransparent: v })} />
        {!transparent && (
          <>
            <ColorPicker label="Color" value={style.bgColor ?? ""} onChange={(v) => update({ bgColor: v })} />
            <ImageField label="Background image URL" value={style.bgImage ?? ""} onChange={(v) => update({ bgImage: v })} />
          </>
        )}
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

      {showTypography && (
        <Section title="Typography">
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
