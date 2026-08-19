import { RichFieldGroup } from "./RichFieldGroup";
import { RichTextInput } from "./RichTextInput";
import { LinkField as PageLinkField } from "./LinkField";
import { richItemProps } from "./rich-text";
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  BlogPicker, ButtonEditor, ColorPicker, ImageField, LinkItemEditor, NumberInput, Repeater, Select, TextInput, Textarea, Toggle, VideoField,
  imageI18nProps,
} from "./fields";
import type { ButtonField, LinkField } from "./defaults";
import type { Block } from "./types";
import { LayoutEditor } from "./LayoutEditor";
import { WidgetListItem } from "./WidgetEditor";
import { defaultWidget, type Widget, type WidgetType } from "./widgets";

type FieldsOf = Record<string, unknown>;

const OBJECT_FIT_OPTIONS = [
  { value: 'cover', label: 'Cover (fill, may crop)' },
  { value: 'contain', label: 'Contain (fit, may letterbox)' },
  { value: 'fill', label: 'Fill (stretch, distorts)' },
  { value: 'none', label: 'None (original size)' },
  { value: 'scale-down', label: 'Scale down' },
] as const;
type ObjectFitValue = typeof OBJECT_FIT_OPTIONS[number]['value'];

// Shared "Width / Height / Aspect ratio / Object-fit" control group for an image.
// Pass the block's CURRENT hardcoded defaults via `defaults` so an untouched image
// keeps rendering exactly as before — these controls only override when the user
// explicitly sets a value. `withHeight=false` hides the height input for images
// whose box is width-only (natural aspect ratio, no forced height).
function ImageSizeControls({
  widthKey, heightKey, aspectRatioKey, fitKey, f, set, defaults, withHeight = true,
}: {
  widthKey: string; heightKey?: string; aspectRatioKey: string; fitKey: string;
  f: FieldsOf; set: (k: string, v: unknown) => void;
  defaults: { width?: number; height?: number; fit: ObjectFitValue };
  withHeight?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 font-medium">Image size</p>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Width (px)"
          value={(f[widthKey] as number) ?? defaults.width ?? 0}
          onChange={(v) => set(widthKey, v)}
        />
        {withHeight && heightKey && (
          <NumberInput
            label="Height (px)"
            value={(f[heightKey] as number) ?? defaults.height ?? 0}
            onChange={(v) => set(heightKey, v)}
          />
        )}
      </div>
      <TextInput
        label="Aspect ratio (e.g. 16/9) — overrides height when set"
        value={(f[aspectRatioKey] as string) ?? ''}
        onChange={(v) => set(aspectRatioKey, v)}
      />
      <Select<ObjectFitValue>
        label="Object-fit"
        value={(f[fitKey] as ObjectFitValue) ?? defaults.fit}
        onChange={(v) => set(fitKey, v)}
        options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
      />
    </div>
  );
}

// Standalone Object-fit control for a single image whose box size is fixed by the
// component/grid (only the fit is safe to expose). `def` = the image's current fit.
function FitSelect({
  label, fitKey, f, set, def,
}: {
  label: string; fitKey: string; f: FieldsOf; set: (k: string, v: unknown) => void; def: ObjectFitValue;
}) {
  return (
    <Select<ObjectFitValue>
      label={label}
      value={(f[fitKey] as ObjectFitValue) ?? def}
      onChange={(v) => set(fitKey, v)}
      options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
    />
  );
}

// Width (px max-width OR %) + aspect-ratio + object-fit group for a standalone
// image whose width is set inline (safe to override). `widthUnit` only changes the
// input label; the component interprets the number. Defaults preserve current render;
// object-fit only takes effect once an aspect ratio is set.
function ImageWHFit({
  label, widthKey, widthUnit, widthDef, aspectRatioKey, fitKey, fitDef, f, set,
}: {
  label: string; widthKey: string; widthUnit: 'px' | '%'; widthDef: number;
  aspectRatioKey: string; fitKey: string; fitDef: ObjectFitValue;
  f: FieldsOf; set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <NumberInput
        label={widthUnit === '%' ? 'Width (%)' : 'Max width (px)'}
        value={(f[widthKey] as number) ?? widthDef}
        onChange={(v) => set(widthKey, v)}
      />
      <TextInput
        label="Aspect ratio (e.g. 16/9) — enables object-fit"
        value={(f[aspectRatioKey] as string) ?? ''}
        onChange={(v) => set(aspectRatioKey, v)}
      />
      <FitSelect label="Object-fit (applies when aspect ratio set)" fitKey={fitKey} f={f} set={set} def={fitDef} />
    </div>
  );
}

interface Props {
  block: Block;
  update: (patch: FieldsOf) => void;
  openWidgetPicker: (col: number, onPick: (t: WidgetType) => void) => void;
  focusedItem?: { itemKey: string; itemIndex: number } | null;
}

const newLink = (): LinkField => ({ label: "New link", url: "#" });
const linkPreview = (l: LinkField) => l.label;

function renderBlockFields(
  block: Block,
  f: FieldsOf,
  set: (k: string, v: unknown) => void,
  update: (patch: FieldsOf) => void,
  openWidgetPicker: Props["openWidgetPicker"],
  focusedItem?: { itemKey: string; itemIndex: number } | null,
): React.ReactElement | null {
  switch (block.type) {
    case "html-embed": {
      const embedMode = (f.mode as string) === "inline" ? "inline" : "iframe";
      return (
        <div className="space-y-3">
          <Select
            label="Render mode"
            value={embedMode}
            onChange={(v) => set("mode", v)}
            options={[
              { value: "iframe", label: "Isolated (iframe) — full HTML documents, scripts, embeds" },
              { value: "inline", label: "Inline (direct DOM) — fragments that inherit the page look" },
            ]}
          />
          <p className="text-xs text-slate-500">
            {embedMode === "iframe"
              ? "Paste any HTML, including a full <!DOCTYPE html> document. It renders in an isolated frame, so its styles/scripts can't affect the rest of the page. Height auto-fits; set a value below to fix it."
              : "Paste an HTML fragment. It is injected directly into the page and inherits the site's fonts/width. Avoid unscoped selectors like body{} — they leak to the whole page. Scripts run."}
          </p>
          <Textarea
            label="HTML"
            value={(f.html as string) ?? ""}
            onChange={(v) => set("html", v)}
            rows={16}
          />
          {embedMode === "iframe" && (
            <NumberInput
              label="Height (px) — 0 = auto-fit"
              value={(f.height as number) ?? 0}
              onChange={(v) => set("height", v)}
            />
          )}
        </div>
      );
    }
    case "nav-simple":
      return (
        <div className="space-y-4">
          <ImageField label="Logo image URL" {...imageI18nProps(f, "logoImage", update)} />
          <RichFieldGroup label="Logo text" f={f} set={set} base="logoText" segments={[{ key: 'logoText' }]} />
          <ButtonEditor label="Primary CTA" value={f.cta as ButtonField} onChange={(v) => set("cta", v)} />
          <ButtonEditor label="Secondary CTA" value={f.ctaSecondary as ButtonField} onChange={(v) => set("ctaSecondary", v)} />
          <Repeater<LinkField>
            label="Nav links"
            items={(f.links as LinkField[]) ?? []}
            onChange={(v) => set("links", v)}
            newItem={newLink}
            itemPreview={linkPreview}
            renderItem={(it, u) => <LinkItemEditor value={it} onChange={u} />}
          />
        </div>
      );
    case "nav-centered":
      return (
        <div className="space-y-4">
          <ImageField label="Logo image URL" {...imageI18nProps(f, "logoImage", update)} />
          <RichFieldGroup label="Logo text" f={f} set={set} base="logoText" segments={[{ key: 'logoText' }]} />
          <Repeater<LinkField>
            label="Nav links" items={(f.links as LinkField[]) ?? []} onChange={(v) => set("links", v)}
            newItem={newLink} itemPreview={linkPreview}
            renderItem={(it, u) => <LinkItemEditor value={it} onChange={u} />}
          />
        </div>
      );
    case "footer-simple":
      return (
        <div className="space-y-4">
          <ImageField label="Logo image URL" {...imageI18nProps(f, "logoImage", update)} />
          <RichFieldGroup label="Logo text" f={f} set={set} base="logoText" segments={[{ key: 'logoText' }]} />
          <RichFieldGroup label="Copyright text" f={f} set={set} base="copyright" segments={[{ key: 'copyright' }]} />
          <Repeater<LinkField>
            label="Links" items={(f.links as LinkField[]) ?? []} onChange={(v) => set("links", v)}
            newItem={newLink} itemPreview={linkPreview}
            renderItem={(it, u) => <LinkItemEditor value={it} onChange={u} />}
          />
        </div>
      );
    case "footer-columns":
      return (
        <div className="space-y-4">
          <ImageField label="Logo image URL" {...imageI18nProps(f, "logoImage", update)} />
          <RichFieldGroup label="Logo text" f={f} set={set} base="logoText" segments={[{ key: 'logoText' }]} />
          <RichFieldGroup label="Tagline" f={f} set={set} base="tagline" segments={[{ key: 'tagline' }]} />
          <RichFieldGroup label="Copyright text" f={f} set={set} base="copyright" segments={[{ key: 'copyright' }]} />
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-3 pt-3 border-t border-slate-800">
              <TextInput label={`Column ${n} title`} value={f[`col${n}Title`] as string} onChange={(v) => set(`col${n}Title`, v)} />
              <Repeater<LinkField>
                label={`Column ${n} links`}
                items={(f[`col${n}Links`] as LinkField[]) ?? []}
                onChange={(v) => set(`col${n}Links`, v)}
                newItem={newLink} itemPreview={linkPreview}
                renderItem={(it, u) => <LinkItemEditor value={it} onChange={u} />}
              />
            </div>
          ))}
        </div>
      );
    case "hero-centered":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Headline" f={f} set={set} base="headline" segments={[{ key: 'headline' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <ButtonEditor label="Primary CTA" value={f.primaryCta as ButtonField} onChange={(v) => set("primaryCta", v)} />
          <ButtonEditor label="Secondary CTA" value={f.secondaryCta as ButtonField} onChange={(v) => set("secondaryCta", v)} />
          <ImageField label="Background image URL" {...imageI18nProps(f, "bgImage", update)} />
        </div>
      );
    case "hero-split":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Headline" f={f} set={set} base="headline" segments={[{ key: 'headline' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <ButtonEditor label="CTA" value={f.cta as ButtonField} onChange={(v) => set("cta", v)} />
          <ImageField label="Image URL" {...imageI18nProps(f, "image", update)} />
          <Toggle label="Image on right" value={f.imageRight as boolean} onChange={(v) => set("imageRight", v)} />
        </div>
      );
    case "features-3col":
    case "features-4col":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <RichFieldGroup label="Section subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <Repeater<{ icon: string; title: string; description: string }>
            label="Features"
            items={(f.features as { icon: string; title: string; description: string }[]) ?? []}
            onChange={(v) => set("features", v)}
            newItem={() => ({ icon: "✨", title: "New feature", description: "Description" })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <TextInput label="Icon (emoji)" value={it.icon} onChange={(x) => u({ ...it, icon: x })} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
              </>
            )}
          />
        </div>
      );
    case "text-image":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Headline" f={f} set={set} base="headline" segments={[{ key: 'headline' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <ImageField label="Image URL" {...imageI18nProps(f, "image", update)} />
          <Toggle label="Image on right" value={f.imageRight as boolean} onChange={(v) => set("imageRight", v)} />
        </div>
      );
    case "stats-bar":
      return (
        <div className="space-y-4">
          <Repeater<{ number: string; label: string; prefix: string; suffix: string }>
            label="Stats"
            items={(f.stats as { number: string; label: string; prefix: string; suffix: string }[]) ?? []}
            onChange={(v) => set("stats", v)}
            newItem={() => ({ number: "100", label: "Label", prefix: "", suffix: "+" })}
            itemPreview={(it) => `${it.prefix}${it.number}${it.suffix} ${it.label}`}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Number" {...richItemProps(it, 'number', u)} />
                <RichTextInput label="Label" {...richItemProps(it, 'label', u)} />
                <RichTextInput label="Prefix (optional)" {...richItemProps(it, 'prefix', u)} />
                <RichTextInput label="Suffix (optional)" {...richItemProps(it, 'suffix', u)} />
              </>
            )}
          />
        </div>
      );
    case "testimonials":
      return (
        <div className="space-y-4">
          <Repeater<{ quote: string; author: string; role: string; avatar: string }>
            label="Testimonials"
            items={(f.items as { quote: string; author: string; role: string; avatar: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ quote: "Great product.", author: "Name", role: "Role", avatar: "" })}
            itemPreview={(it) => it.author}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Quote" {...richItemProps(it, 'quote', u)} />
                <RichTextInput label="Author name" {...richItemProps(it, 'author', u)} />
                <RichTextInput label="Role / company" {...richItemProps(it, 'role', u)} />
                <ImageField label="Avatar URL" {...imageI18nProps(it, "avatar", (p) => u({ ...it, ...p }))} />
              </>
            )}
          />
        </div>
      );
    case "logo-grid":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <Repeater<{ src: string; alt: string }>
            label="Logos"
            items={(f.logos as { src: string; alt: string }[]) ?? []}
            onChange={(v) => set("logos", v)}
            newItem={() => ({ src: "", alt: "Logo" })}
            itemPreview={(it) => it.alt}
            renderItem={(it, u) => (
              <>
                <ImageField label="Logo image URL" {...imageI18nProps(it, "src", (p) => u({ ...it, ...p }))} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );
    case "cta-banner":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Headline" f={f} set={set} base="headline" segments={[{ key: 'headline' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <ButtonEditor label="Button" value={f.button as ButtonField} onChange={(v) => set("button", v)} />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <Repeater<{ question: string; answer: string }>
            label="FAQ items"
            items={(f.items as { question: string; answer: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ question: "New question?", answer: "Answer." })}
            itemPreview={(it) => it.question}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Question" {...richItemProps(it, 'question', u)} />
                <RichTextInput label="Answer" {...richItemProps(it, 'answer', u)} />
              </>
            )}
          />
        </div>
      );
    case "blog-preview":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Number of posts</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => set("count", n)}
                  className={`flex-1 py-1.5 text-xs rounded border pb-transition ${
                    (f.count as number) === n
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <TextInput label="CTA label" value={f.ctaLabel as string} onChange={(v) => set("ctaLabel", v)} placeholder="View all posts" />
          <TextInput label="CTA URL" value={f.ctaUrl as string} onChange={(v) => set("ctaUrl", v)} placeholder="/blog" />
        </div>
      );

    case "hero-gradient":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge text" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Headline" f={f} set={set} base="headline" segments={[{ key: 'headline' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <ButtonEditor label="Primary CTA" value={f.primaryCta as ButtonField} onChange={(v) => set("primaryCta", v)} />
          <ButtonEditor label="Secondary CTA" value={f.secondaryCta as ButtonField} onChange={(v) => set("secondaryCta", v)} />
          <ImageField label="Product image URL (optional)" {...imageI18nProps(f, "image", update)} />
        </div>
      );

    case "hero-centered-image":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge text" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Headline" f={f} set={set} base="headline" segments={[{ key: 'headline' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <ButtonEditor label="Primary CTA" value={f.primaryCta as ButtonField} onChange={(v) => set("primaryCta", v)} />
          <ButtonEditor label="Secondary CTA" value={f.secondaryCta as ButtonField} onChange={(v) => set("secondaryCta", v)} />
          <ImageField label="Screenshot / product image URL" {...imageI18nProps(f, "image", update)} />
        </div>
      );

    case "features-alternating":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <RichFieldGroup label="Section subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <Repeater<{ tag: string; title: string; description: string; image: string; ctaLabel: string; ctaUrl: string }>
            label="Feature rows"
            items={(f.items as { tag: string; title: string; description: string; image: string; ctaLabel: string; ctaUrl: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ tag: "Feature", title: "New feature", description: "Description here.", image: "", ctaLabel: "Learn more", ctaUrl: "#" })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Category tag" {...richItemProps(it, 'tag', u)} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
                <ImageField label="Image URL" {...imageI18nProps(it, "image", (p) => u({ ...it, ...p }))} />
                <RichTextInput label="CTA label" {...richItemProps(it, 'ctaLabel', u)} />
                <TextInput label="CTA URL" value={it.ctaUrl} onChange={(x) => u({ ...it, ctaUrl: x })} />
              </>
            )}
          />
        </div>
      );

    case "features-icon-cards":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <RichFieldGroup label="Section subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <Repeater<{ icon: string; iconBg: string; title: string; description: string }>
            label="Feature cards"
            items={(f.features as { icon: string; iconBg: string; title: string; description: string }[]) ?? []}
            onChange={(v) => set("features", v)}
            newItem={() => ({ icon: "✨", iconBg: "#f1f5f9", title: "New feature", description: "Description here." })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <TextInput label="Icon (emoji)" value={it.icon} onChange={(x) => u({ ...it, icon: x })} />
                <RichTextInput label="Icon background color" {...richItemProps(it, 'iconBg', u)} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
              </>
            )}
          />
        </div>
      );

    case "pricing-modern":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <RichFieldGroup label="Section subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <Repeater<{ name: string; price: string; period: string; description: string; highlighted: boolean; features: string[]; cta: ButtonField }>
            label="Pricing plans"
            items={(f.plans as { name: string; price: string; period: string; description: string; highlighted: boolean; features: string[]; cta: ButtonField }[]) ?? []}
            onChange={(v) => set("plans", v)}
            newItem={() => ({ name: "Plan", price: "$0", period: "/month", description: "Plan description", highlighted: false, features: ["Feature 1"], cta: { label: "Get started", url: "#", variant: "outline" as const } })}
            itemPreview={(it) => `${it.name} — ${it.price}`}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Plan name" {...richItemProps(it, 'name', u)} />
                <RichTextInput label="Price" {...richItemProps(it, 'price', u)} />
                <RichTextInput label="Billing period" {...richItemProps(it, 'period', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
                <Toggle label="Highlighted (featured plan)" value={it.highlighted} onChange={(x) => u({ ...it, highlighted: x })} />
                <Textarea label="Features (one per line)" value={it.features.join("\n")} onChange={(x) => u({ ...it, features: x.split("\n").filter(Boolean) })} />
                <ButtonEditor label="CTA button" value={it.cta} onChange={(x) => u({ ...it, cta: x })} />
              </>
            )}
          />
        </div>
      );

    case "testimonials-wall":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <Repeater<{ quote: string; author: string; role: string; company: string; stars: number }>
            label="Testimonials"
            items={(f.items as { quote: string; author: string; role: string; company: string; stars: number }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ quote: "Great product!", author: "Name", role: "Role", company: "Company", stars: 5 })}
            itemPreview={(it) => it.author}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Quote" {...richItemProps(it, 'quote', u)} />
                <RichTextInput label="Author name" {...richItemProps(it, 'author', u)} />
                <RichTextInput label="Role" {...richItemProps(it, 'role', u)} />
                <RichTextInput label="Company" {...richItemProps(it, 'company', u)} />
                <NumberInput label="Stars (1–5)" value={it.stars} onChange={(x) => u({ ...it, stars: Math.min(5, Math.max(1, x)) })} />
              </>
            )}
          />
        </div>
      );

    case "team-grid":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <RichFieldGroup label="Section subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <Repeater<{ name: string; role: string; avatar: string; linkedin: string }>
            label="Team members"
            items={(f.members as { name: string; role: string; avatar: string; linkedin: string }[]) ?? []}
            onChange={(v) => set("members", v)}
            newItem={() => ({ name: "Name", role: "Role", avatar: "", linkedin: "#" })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Name" {...richItemProps(it, 'name', u)} />
                <RichTextInput label="Role" {...richItemProps(it, 'role', u)} />
                <ImageField label="Avatar image URL" {...imageI18nProps(it, "avatar", (p) => u({ ...it, ...p }))} />
                <TextInput label="LinkedIn URL" value={it.linkedin} onChange={(x) => u({ ...it, linkedin: x })} />
              </>
            )}
          />
        </div>
      );

    case "stats-bold":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title (optional)" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <Repeater<{ number: string; suffix: string; label: string }>
            label="Stats"
            items={(f.stats as { number: string; suffix: string; label: string }[]) ?? []}
            onChange={(v) => set("stats", v)}
            newItem={() => ({ number: "100", suffix: "+", label: "Label" })}
            itemPreview={(it) => `${it.number}${it.suffix} ${it.label}`}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Number" {...richItemProps(it, 'number', u)} />
                <RichTextInput label="Suffix (+, %, ★, etc.)" {...richItemProps(it, 'suffix', u)} />
                <RichTextInput label="Label" {...richItemProps(it, 'label', u)} />
              </>
            )}
          />
        </div>
      );

    case "steps-process":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <RichFieldGroup label="Section subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <Repeater<{ number: string; title: string; description: string }>
            label="Steps"
            items={(f.steps as { number: string; title: string; description: string }[]) ?? []}
            onChange={(v) => set("steps", v)}
            newItem={() => ({ number: "04", title: "New step", description: "Step description." })}
            itemPreview={(it) => `${it.number} — ${it.title}`}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Step number" {...richItemProps(it, 'number', u)} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
              </>
            )}
          />
        </div>
      );

    case "cta-banner-gradient":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Headline" f={f} set={set} base="headline" segments={[{ key: 'headline' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <ButtonEditor label="Primary CTA" value={f.primaryCta as ButtonField} onChange={(v) => set("primaryCta", v)} />
          <ButtonEditor label="Secondary CTA" value={f.secondaryCta as ButtonField} onChange={(v) => set("secondaryCta", v)} />
        </div>
      );

    case "hero-salescode":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge text" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <RichFieldGroup label="Description" f={f} set={set} base="description" segments={[{ key: 'description' }]} />
          <RichFieldGroup label="CTA text" f={f} set={set} base="ctaText" segments={[{ key: 'ctaText' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string} onChange={(v) => set("ctaUrl", v)} />
          <RichFieldGroup label="Secondary CTA text (leave empty to hide)" f={f} set={set} base="ctaSecondaryText" segments={[{ key: 'ctaSecondaryText' }]} />
          <TextInput label="Secondary CTA URL" value={(f.ctaSecondaryUrl as string) ?? ""} onChange={(v) => set("ctaSecondaryUrl", v)} placeholder="e.g. https://youtu.be/..." />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Stage image (Person + Floating Cards)" value={(f.imgCenter as string) ?? ""} onChange={(v) => set("imgCenter", v)} />
          <ImageField label="Stage image — mobile (optional, overrides the above ≤620px)" value={(f.imgCenterMobile as string) ?? ""} onChange={(v) => set("imgCenterMobile", v)} />
        </div>
      );

    case "impact-salescode":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <ImageField label="Video" {...imageI18nProps(f, "videoUrl", update)} />
          <Repeater<{ value: string; suffix: string; description: string }>
            label="Stats"
            items={(f.stats as { value: string; suffix: string; description: string }[]) ?? []}
            onChange={(v) => set("stats", v)}
            newItem={() => ({ value: "0", suffix: "%", description: "Stat description" })}
            itemPreview={(it) => `${it.value}${it.suffix} — ${it.description}`}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Value" {...richItemProps(it, 'value', u)} />
                <RichTextInput label="Suffix (%, x, etc.)" {...richItemProps(it, 'suffix', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
              </>
            )}
          />
        </div>
      );

    case "clients-salescode":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <TextInput label="Section ID" value={f.sectionId as string} onChange={(v) => set("sectionId", v)} />
          <p className="text-xs text-slate-400 leading-relaxed">
            Logo images are managed via the Sections admin.
          </p>
        </div>
      );

    case "security-salescode":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<{ url: string; alt: string }>
            label="Certificates"
            items={(f.certs as { url: string; alt: string }[]) ?? []}
            onChange={(v) => set("certs", v)}
            newItem={() => ({ url: "", alt: "Certificate" })}
            itemPreview={(it) => it.alt}
            renderItem={(it, u) => (
              <>
                <ImageField label="Image" {...imageI18nProps(it, "url", (p) => u({ ...it, ...p }))} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );

    case "experience-video-salescode":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Title" f={f} set={set} base="title" segments={[{ key: 'title' }]} />
          <RichFieldGroup label="Subtitle (teal, below title)" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <ImageField label="Video" {...imageI18nProps(f, "videoUrl", update)} />
        </div>
      );

    case "cta-salescode":
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge text" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <RichFieldGroup label="CTA text" f={f} set={set} base="ctaText" segments={[{ key: 'ctaText' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string} onChange={(v) => set("ctaUrl", v)} />
        </div>
      );

    case 'navbar-salescode-slot':
      return (
        <div className="space-y-4">
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Background color</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={(f.bgColor as string) || '#f0f2f5'}
                onChange={(e) => set('bgColor', e.target.value)}
                style={{ width: 36, height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none', padding: 2 }}
              />
              <input
                type="text"
                value={(f.bgColor as string) || ''}
                onChange={(e) => set('bgColor', e.target.value)}
                placeholder="#f0f2f5"
                style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 6, padding: '6px 10px', fontSize: 12 }}
              />
              {(f.bgColor as string) && (
                <button onClick={() => set('bgColor', '')} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>Reset</button>
              )}
            </div>
          </div>
          <Repeater<{ label: string; href: string }>
            label="Nav links"
            items={(f.links as { label: string; href: string }[]) ?? [
              { label: "About Us", href: "/about" },
              { label: "Clients", href: "/clients" },
              { label: "Blogs", href: "/blog" },
              { label: "Contact Us", href: "/contact-us" },
            ]}
            onChange={(v) => set('links', v)}
            newItem={() => ({ label: 'New link', href: '/' })}
            itemPreview={(it) => it.label}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Label" {...richItemProps(it, 'label', u)} />
                <TextInput label="URL (e.g. /about)" value={it.href} onChange={(x) => u({ ...it, href: x })} />
              </>
            )}
          />
        </div>
      );

    case 'product-selection-slot':
    case 'platform-features-slot':
    case 'integrations-slot':
    case 'blogs-section-slot':
    case 'footer-salescode-slot':
    case 'about-page-slot':
    case 'clients-page-slot':
    case 'contact-page-slot':
    case 'blog-page-slot':
      return (
        <div style={{ padding: '16px', background: '#1e293b', borderRadius: 8, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
          This section manages its own content and data.
        </div>
      );

    case 'slick-hero-split':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Headline Start" f={f} set={set} base="headlineStart" segments={[{ key: 'headlineStart' }]} />
          <RichFieldGroup label="Headline Accent" f={f} set={set} base="headlineAccent" segments={[{ key: 'headlineAccent' }]} />
          <RichFieldGroup label="Headline End" f={f} set={set} base="headlineEnd" segments={[{ key: 'headlineEnd' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="primaryCtaLabel" segments={[{ key: 'primaryCtaLabel' }]} />
          <TextInput label="Primary CTA href" value={f.primaryCtaHref as string ?? ''} onChange={(v) => set('primaryCtaHref', v)} />
          <RichFieldGroup label="Secondary CTA label" f={f} set={set} base="secondaryCtaLabel" segments={[{ key: 'secondaryCtaLabel' }]} />
          <TextInput label="Secondary CTA href" value={f.secondaryCtaHref as string ?? ''} onChange={(v) => set('secondaryCtaHref', v)} />
          <ImageField label="Mockup image URL" {...imageI18nProps(f, "mockupImageUrl", update)} />
          <TextInput label="Mockup alt text" value={f.mockupAlt as string ?? ''} onChange={(v) => set('mockupAlt', v)} />
          <RichFieldGroup label="Trust label" f={f} set={set} base="trustLabel" segments={[{ key: 'trustLabel' }]} />
        </div>
      );

    case 'slick-hero-video':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Headline top" f={f} set={set} base="headlineTop" segments={[{ key: 'headlineTop' }]} />
          <RichFieldGroup label="Headline accent" f={f} set={set} base="headlineAccent" segments={[{ key: 'headlineAccent' }]} />
          <RichFieldGroup label="Headline bottom" f={f} set={set} base="headlineBottom" segments={[{ key: 'headlineBottom' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="primaryCtaLabel" segments={[{ key: 'primaryCtaLabel' }]} />
          <TextInput label="Primary CTA href" value={f.primaryCtaHref as string ?? ''} onChange={(v) => set('primaryCtaHref', v)} />
          <RichFieldGroup label="Secondary CTA label" f={f} set={set} base="secondaryCtaLabel" segments={[{ key: 'secondaryCtaLabel' }]} />
          <ImageField label="Video poster image" {...imageI18nProps(f, "videoPoster", update)} />
          <ImageField label="Video (mp4)" {...imageI18nProps(f, "videoSrc", update)} />
          <Repeater<{ value: string; label: string }>
            label="Metrics"
            items={(f.metrics as { value: string; label: string }[]) ?? []}
            onChange={(v) => set('metrics', v)}
            newItem={() => ({ value: '10K+', label: 'Users' })}
            itemPreview={(it) => `${it.value} ${it.label}`}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Value (e.g. 10K+)" {...richItemProps(it, 'value', u)} />
                <RichTextInput label="Label" {...richItemProps(it, 'label', u)} />
              </>
            )}
          />
        </div>
      );

    case 'slick-features-bento':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="subheading" segments={[{ key: 'subheading' }]} />
          <Repeater<{ icon: string; title: string; description: string; tone: string; span: string }>
            label="Features"
            items={(f.features as { icon: string; title: string; description: string; tone: string; span: string }[]) ?? []}
            onChange={(v) => set('features', v)}
            newItem={() => ({ icon: '✨', title: 'New feature', description: 'Description here.', tone: 'lime', span: 'sm' })}
            itemPreview={(it) => it.title}
            openIndex={focusedItem?.itemKey === 'features' ? focusedItem.itemIndex : undefined}
            renderItem={(it, u) => (
              <>
                <TextInput label="Icon (emoji)" value={it.icon} onChange={(x) => u({ ...it, icon: x })} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card tone</span>
                  <select value={it.tone ?? 'lime'} onChange={(e) => u({ ...it, tone: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }}>
                    {['lime','violet','amber','pink','sky','ink'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card size</span>
                  <select value={it.span ?? 'sm'} onChange={(e) => u({ ...it, span: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }}>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="tall">Tall</option>
                  </select>
                </div>
              </>
            )}
          />
        </div>
      );

    case 'slick-features-alternating':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <Repeater<{ tag: string; headline: string; headlineAccent: string; description: string; ctaLabel: string; ctaHref: string; imageUrl: string; imageAlt?: string; bullets?: string[] }>
            label="Rows"
            items={(f.rows as { tag: string; headline: string; headlineAccent: string; description: string; ctaLabel: string; ctaHref: string; imageUrl: string; imageAlt?: string; bullets?: string[] }[]) ?? []}
            onChange={(v) => set('rows', v)}
            newItem={() => ({ tag: 'NEW', headline: 'New', headlineAccent: 'feature', description: 'Description.', ctaLabel: 'Learn more →', ctaHref: '#', imageUrl: '' })}
            itemPreview={(it) => `${it.tag}: ${it.headline}`}
            openIndex={focusedItem?.itemKey === 'rows' ? focusedItem.itemIndex : undefined}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Tag chip" {...richItemProps(it, 'tag', u)} />
                <RichTextInput label="Headline" {...richItemProps(it, 'headline', u)} />
                <RichTextInput label="Headline accent" {...richItemProps(it, 'headlineAccent', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
                <RichTextInput label="CTA label" {...richItemProps(it, 'ctaLabel', u)} />
                <TextInput label="CTA href" value={(it as { ctaHref?: string }).ctaHref ?? ''} onChange={(x) => u({ ...it, ctaHref: x })} />
                <ImageField label="Image URL" {...imageI18nProps(it, "imageUrl", (p) => u({ ...it, ...p }))} />
                <TextInput label="Image alt text" value={(it as { imageAlt?: string }).imageAlt ?? ''} onChange={(x) => u({ ...it, imageAlt: x })} />
                <Repeater<string>
                  label="Bullet points"
                  items={(it as { bullets?: string[] }).bullets ?? []}
                  newItem={() => 'New bullet point'}
                  itemPreview={(b) => b}
                  onChange={(bullets) => u({ ...it, bullets })}
                  renderItem={(b, onB) => (
                    <TextInput label="Bullet" value={b} onChange={onB} />
                  )}
                />
              </>
            )}
          />
        </div>
      );

    case 'slick-pricing':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="subheading" segments={[{ key: 'subheading' }]} />
          <RichFieldGroup label="Currency symbol" f={f} set={set} base="currency" segments={[{ key: 'currency' }]} />
          <Repeater<{ name: string; description: string; monthlyPrice: number; annualPrice: number; features: string[]; ctaLabel: string; ctaHref: string; highlighted: boolean; badge: string }>
            label="Plans"
            openIndex={focusedItem?.itemKey === 'plans' ? focusedItem.itemIndex : undefined}
            items={(f.plans as { name: string; description: string; monthlyPrice: number; annualPrice: number; features: string[]; ctaLabel: string; ctaHref: string; highlighted: boolean; badge: string }[]) ?? []}
            onChange={(v) => set('plans', v)}
            newItem={() => ({ name: 'New plan', description: 'Plan description.', monthlyPrice: 29, annualPrice: 19, features: ['Feature one', 'Feature two'], ctaLabel: 'Get started', ctaHref: '#', highlighted: false, badge: '' })}
            itemPreview={(it) => `${it.name} — $${it.monthlyPrice}/mo`}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Plan name" {...richItemProps(it, 'name', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Monthly price" value={it.monthlyPrice ?? 0} onChange={(x) => u({ ...it, monthlyPrice: x })} />
                  <NumberInput label="Annual price" value={it.annualPrice ?? 0} onChange={(x) => u({ ...it, annualPrice: x })} />
                </div>
                <Repeater<string>
                  label="Features"
                  items={it.features ?? []}
                  newItem={() => 'New feature'}
                  itemPreview={(feat) => feat}
                  onChange={(features) => u({ ...it, features })}
                  renderItem={(feat, onFeat) => (
                    <TextInput label="Feature" value={feat} onChange={onFeat} />
                  )}
                />
                <RichTextInput label="CTA label" {...richItemProps(it, 'ctaLabel', u)} />
                <TextInput label="CTA href" value={it.ctaHref} onChange={(x) => u({ ...it, ctaHref: x })} />
                <RichTextInput label="Badge (e.g. ★ MOST POPULAR)" {...richItemProps(it, 'badge', u)} />
                <Toggle label="Highlighted (dark card)" value={it.highlighted} onChange={(x) => u({ ...it, highlighted: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-testimonials-carousel':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <Repeater<{ quote: string; name: string; role: string; company: string; avatarUrl: string; rating?: number }>
            label="Testimonials"
            items={(f.testimonials as { quote: string; name: string; role: string; company: string; avatarUrl: string; rating?: number }[]) ?? []}
            onChange={(v) => set('testimonials', v)}
            newItem={() => ({ quote: 'Add your testimonial here.', name: 'Name', role: 'Role', company: 'Company', avatarUrl: '', rating: 5 })}
            itemPreview={(it) => it.name}
            openIndex={focusedItem?.itemKey === 'testimonials' ? focusedItem.itemIndex : undefined}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Quote" {...richItemProps(it, 'quote', u)} />
                <RichTextInput label="Name" {...richItemProps(it, 'name', u)} />
                <RichTextInput label="Role" {...richItemProps(it, 'role', u)} />
                <RichTextInput label="Company" {...richItemProps(it, 'company', u)} />
                <ImageField label="Avatar URL" {...imageI18nProps(it, "avatarUrl", (p) => u({ ...it, ...p }))} />
                <NumberInput label="Rating (1–5)" value={(it as { rating?: number }).rating ?? 5} onChange={(x) => u({ ...it, rating: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-testimonials-logos':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Quote" f={f} set={set} base="quote" segments={[{ key: 'quote' }]} />
          <RichFieldGroup label="Author name" f={f} set={set} base="authorName" segments={[{ key: 'authorName' }]} />
          <RichFieldGroup label="Author role" f={f} set={set} base="authorRole" segments={[{ key: 'authorRole' }]} />
          <RichFieldGroup label="Author company" f={f} set={set} base="authorCompany" segments={[{ key: 'authorCompany' }]} />
          <ImageField label="Author avatar URL" {...imageI18nProps(f, "authorAvatarUrl", update)} />
          <Repeater<{ name: string; src: string }>
            label="Company logos"
            items={(f.logos as { name: string; src: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ name: 'Company', src: '' })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Company name" {...richItemProps(it, 'name', u)} />
                <ImageField label="Logo URL" {...imageI18nProps(it, "src", (p) => u({ ...it, ...p }))} />
              </>
            )}
          />
        </div>
      );

    case 'slick-stats':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Description" f={f} set={set} base="description" segments={[{ key: 'description' }]} />
          <Repeater<{ value: string; suffix: string; label: string }>
            label="Stats"
            items={(f.stats as { value: string; suffix: string; label: string }[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '0', suffix: '+', label: 'Metric' })}
            itemPreview={(it) => `${it.value}${it.suffix} — ${it.label}`}
            openIndex={focusedItem?.itemKey === 'stats' ? focusedItem.itemIndex : undefined}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Value" {...richItemProps(it, 'value', u)} />
                <RichTextInput label="Suffix (e.g. +, %, x)" {...richItemProps(it, 'suffix', u)} />
                <RichTextInput label="Label" {...richItemProps(it, 'label', u)} />
              </>
            )}
          />
        </div>
      );

    case 'slick-faq':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="subheading" segments={[{ key: 'subheading' }]} />
          <RichFieldGroup label="Contact CTA label" f={f} set={set} base="contactCtaLabel" segments={[{ key: 'contactCtaLabel' }]} />
          <TextInput label="Contact CTA href" value={f.contactCtaHref as string ?? ''} onChange={(v) => set('contactCtaHref', v)} />
          <Repeater<{ category: string; question: string; answer: string }>
            label="FAQ items"
            openIndex={focusedItem?.itemKey === 'items' ? focusedItem.itemIndex : undefined}
            items={(f.items as { category: string; question: string; answer: string }[]) ?? []}
            onChange={(v) => set('items', v)}
            newItem={() => ({ category: 'General', question: 'New question?', answer: 'Answer here.' })}
            itemPreview={(it) => it.question}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Category" {...richItemProps(it, 'category', u)} />
                <RichTextInput label="Question" {...richItemProps(it, 'question', u)} />
                <RichTextInput label="Answer" {...richItemProps(it, 'answer', u)} />
              </>
            )}
          />
        </div>
      );

    case 'slick-cta-glass':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="primaryCtaLabel" segments={[{ key: 'primaryCtaLabel' }]} />
          <TextInput label="Primary CTA href" value={f.primaryCtaHref as string ?? ''} onChange={(v) => set('primaryCtaHref', v)} />
          <RichFieldGroup label="Secondary CTA label" f={f} set={set} base="secondaryCtaLabel" segments={[{ key: 'secondaryCtaLabel' }]} />
          <TextInput label="Secondary CTA href" value={f.secondaryCtaHref as string ?? ''} onChange={(v) => set('secondaryCtaHref', v)} />
        </div>
      );

    case 'slick-team':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="subheading" segments={[{ key: 'subheading' }]} />
          <Repeater<{ name: string; role: string; bio: string; avatarUrl: string; linkedinUrl: string; accent: string }>
            label="Team members"
            openIndex={focusedItem?.itemKey === 'members' ? focusedItem.itemIndex : undefined}
            items={(f.members as { name: string; role: string; bio: string; avatarUrl: string; linkedinUrl: string; accent: string }[]) ?? []}
            onChange={(v) => set('members', v)}
            newItem={() => ({ name: 'Name', role: 'Role', bio: 'Bio here.', avatarUrl: '', linkedinUrl: '#', accent: 'lime' })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Name" {...richItemProps(it, 'name', u)} />
                <RichTextInput label="Role" {...richItemProps(it, 'role', u)} />
                <RichTextInput label="Bio" {...richItemProps(it, 'bio', u)} />
                <ImageField label="Avatar URL" {...imageI18nProps(it, "avatarUrl", (p) => u({ ...it, ...p }))} />
                <TextInput label="LinkedIn URL" value={it.linkedinUrl ?? ''} onChange={(x) => u({ ...it, linkedinUrl: x })} />
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card accent</span>
                  <select value={it.accent ?? 'lime'} onChange={(e) => u({ ...it, accent: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }}>
                    {['lime','violet','amber','pink'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}
          />
        </div>
      );

    case 'slick-integrations':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="subheading" segments={[{ key: 'subheading' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <Repeater<{ name: string; src: string }>
            label="Integration logos"
            items={(f.logos as { name: string; src: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ name: 'Tool', src: '' })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Name" {...richItemProps(it, 'name', u)} />
                <ImageField label="Logo URL" {...imageI18nProps(it, "src", (p) => u({ ...it, ...p }))} />
              </>
            )}
          />
        </div>
      );

    case 'slick-blog-grid':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="subheading" segments={[{ key: 'subheading' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <Repeater<{ coverUrl: string; tag: string; title: string; excerpt: string; authorName: string; authorAvatarUrl?: string; readTime?: string; date: string; href: string }>
            label="Blog posts"
            openIndex={focusedItem?.itemKey === 'posts' ? focusedItem.itemIndex : undefined}
            items={(f.posts as { coverUrl: string; tag: string; title: string; excerpt: string; authorName: string; authorAvatarUrl?: string; readTime?: string; date: string; href: string }[]) ?? []}
            onChange={(v) => set('posts', v)}
            newItem={() => ({ coverUrl: '', tag: 'Engineering', title: 'Post title', excerpt: 'Excerpt here.', authorName: 'Author', date: 'Jan 1, 2025', href: '#' })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <ImageField label="Cover image URL" {...imageI18nProps(it, "coverUrl", (p) => u({ ...it, ...p }))} />
                <RichTextInput label="Tag" {...richItemProps(it, 'tag', u)} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Excerpt" {...richItemProps(it, 'excerpt', u)} />
                <RichTextInput label="Author name" {...richItemProps(it, 'authorName', u)} />
                <ImageField label="Author avatar URL" {...imageI18nProps(it, "authorAvatarUrl", (p) => u({ ...it, ...p }))} />
                <TextInput label="Read time (e.g. 5 min)" value={(it as { readTime?: string }).readTime ?? ''} onChange={(x) => u({ ...it, readTime: x })} />
                <RichTextInput label="Date" {...richItemProps(it, 'date', u)} />
                <TextInput label="Link href" value={it.href} onChange={(x) => u({ ...it, href: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-timeline':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="subheading" segments={[{ key: 'subheading' }]} />
          <Repeater<{ icon: string; title: string; description: string }>
            label="Steps"
            items={(f.steps as { icon: string; title: string; description: string }[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ icon: '✅', title: 'New step', description: 'Step description.' })}
            openIndex={focusedItem?.itemKey === 'steps' ? focusedItem.itemIndex : undefined}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <TextInput label="Icon (emoji)" value={it.icon} onChange={(x) => u({ ...it, icon: x })} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(it, 'description', u)} />
              </>
            )}
          />
        </div>
      );

    case 'slick-footer-complex':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#111111'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#444444'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#FFB23F'}
                onChange={(e) => { set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value }); set('accentColor', e.target.value); }}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '96', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <RichFieldGroup label="Brand name" f={f} set={set} base="brandName" segments={[{ key: 'brandName' }]} />
          <RichFieldGroup label="Tagline" f={f} set={set} base="tagline" segments={[{ key: 'tagline' }]} />
          <RichFieldGroup label="Giant background word" f={f} set={set} base="giantBrandWord" segments={[{ key: 'giantBrandWord' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', display: 'block', marginBottom: 8 }}>Link Columns</span>
            <Repeater<{ title: string; links: { label: string; href: string }[] }>
              label="Columns"
              items={(f.columns as { title: string; links: { label: string; href: string }[] }[]) ?? []}
              newItem={() => ({ title: 'Column', links: [{ label: 'Link', href: '#' }] })}
              itemPreview={(col) => col.title}
              onChange={(v) => set('columns', v)}
              renderItem={(col, onChange) => (
                <div className="space-y-2">
                  <RichTextInput label="Column title" {...richItemProps(col, 'title', onChange)} />
                  <Repeater<{ label: string; href: string }>
                    label="Links"
                    items={col.links}
                    newItem={() => ({ label: 'Link', href: '#' })}
                    itemPreview={(link) => link.label}
                    onChange={(links) => onChange({ ...col, links })}
                    renderItem={(link, onLinkChange) => (
                      <div className="space-y-1">
                        <RichTextInput label="Label" {...richItemProps(link, 'label', onLinkChange)} />
                        <TextInput label="URL" value={link.href} onChange={(v) => onLinkChange({ ...link, href: v })} />
                      </div>
                    )}
                  />
                </div>
              )}
            />
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', display: 'block', marginBottom: 8 }}>Social Links</span>
            <Repeater<{ name: string; href: string }>
              label="Socials"
              items={(f.socials as { name: string; href: string }[]) ?? []}
              newItem={() => ({ name: 'twitter', href: '#' })}
              itemPreview={(s) => s.name}
              onChange={(v) => set('socials', v)}
              renderItem={(social, onChange) => (
                <div className="space-y-1">
                  <div>
                    <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Platform</span>
                    <select value={social.name} onChange={(e) => onChange({ ...social, name: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }}>
                      <option value="twitter">Twitter / X</option>
                      <option value="github">GitHub</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="youtube">YouTube</option>
                    </select>
                  </div>
                  <TextInput label="URL" value={social.href} onChange={(v) => onChange({ ...social, href: v })} />
                </div>
              )}
            />
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <RichFieldGroup label="Newsletter heading" f={f} set={set} base="newsletterHeading" segments={[{ key: 'newsletterHeading' }]} />
          <RichFieldGroup label="Newsletter subtext" f={f} set={set} base="newsletterSubtext" segments={[{ key: 'newsletterSubtext' }]} />
          <RichFieldGroup label="Newsletter CTA label" f={f} set={set} base="newsletterCtaLabel" segments={[{ key: 'newsletterCtaLabel' }]} />
          <TextInput label="Newsletter placeholder" value={f.newsletterPlaceholder as string ?? ''} onChange={(v) => set('newsletterPlaceholder', v)} />
          <RichFieldGroup label="Copyright" f={f} set={set} base="copyright" segments={[{ key: 'copyright' }]} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
        </div>
      );

    case 'slick-app-download':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--heading-color'] || '#ffffff'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--heading-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Body color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--body-color'] || '#94a3b8'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--body-color': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Accent color</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--accent'] || '#2dd4bf'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--accent': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Card background</span>
              <input type="color" value={(f.styleVars as Record<string,string> ?? {})['--card-bg'] || '#122E2A'}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--card-bg': e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '80', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <Repeater<{ badgeImage: string; storeUrl: string; deviceLabel: string; qrImage: string; qrLabel: string }>
            label="Stores"
            items={(f.stores as { badgeImage: string; storeUrl: string; deviceLabel: string; qrImage: string; qrLabel: string }[]) ?? []}
            onChange={(v) => set('stores', v)}
            newItem={() => ({ badgeImage: '', storeUrl: '#', deviceLabel: 'Store name', qrImage: '', qrLabel: 'Scan to install' })}
            itemPreview={(it) => it.deviceLabel || 'Store'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Badge image" {...imageI18nProps(it, "badgeImage", (p) => u({ ...it, ...p }))} />
                <TextInput label="Store URL" value={it.storeUrl} onChange={(x) => u({ ...it, storeUrl: x })} />
                <RichTextInput label="Device label" {...richItemProps(it, 'deviceLabel', u)} />
                <ImageField label="QR code image" {...imageI18nProps(it, "qrImage", (p) => u({ ...it, ...p }))} />
                <RichTextInput label="QR label" {...richItemProps(it, 'qrLabel', u)} />
              </>
            )}
          />
        </div>
      );

    case 'slick-app-showcase':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Tagline (bottom)" f={f} set={set} base="tagline" segments={[{ key: 'tagline' }]} />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Speed (s, lower=faster)" value={(f.speed as number) ?? 35} onChange={(v) => set('speed', v)} />
            <NumberInput label="Card width (px)" value={(f.cardWidth as number) ?? 260} onChange={(v) => set('cardWidth', v)} />
            <NumberInput label="Card height (px)" value={(f.cardHeight as number) ?? 520} onChange={(v) => set('cardHeight', v)} />
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ title: string; subtitle: string; image: string; cardBg: string }>
            label="Cards"
            items={(f.cards as { title: string; subtitle: string; image: string; cardBg: string }[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Feature', subtitle: 'Description here.', image: '', cardBg: '#0A3028' })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Subtitle" {...richItemProps(it, 'subtitle', u)} />
                <ImageField label="Phone screenshot" {...imageI18nProps(it, "image", (p) => u({ ...it, ...p }))} />
                <ColorPicker label="Card background" value={it.cardBg || '#0A3028'} onChange={(x: string) => u({ ...it, cardBg: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-promo-banner':
      return (
        <div className="space-y-4">
          <div style={{ paddingBottom: 8, marginBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Style Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>V. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-py'] || '32', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-py': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>H. padding (px)</span>
              <input type="number" min={0} max={300}
                value={parseInt((f.styleVars as Record<string,string> ?? {})['--section-px'] || '24', 10)}
                onChange={(e) => set('styleVars', { ...(f.styleVars as object ?? {}), '--section-px': `${e.target.value}px` })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '8px 0 4px' }} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
            <input type="color" value={(f.headingColor as string) || '#FFD700'}
              onChange={(e) => set('headingColor', e.target.value)}
              style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
          </div>
          <RichFieldGroup label="Subheading" f={f} set={set} base="subheading" segments={[{ key: 'subheading' }]} />
          <Repeater<string>
            label="Steps"
            items={(f.steps as string[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => 'New step'}
            itemPreview={(s) => s}
            renderItem={(s, u) => (
              <TextInput label="Step text" value={s} onChange={u} />
            )}
          />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <ImageField label="Right-side image URL" {...imageI18nProps(f, "image", update)} />
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Banner background color</span>
            <input type="color" value={(f.bgColor as string) || '#00B39F'}
              onChange={(e) => set('bgColor', e.target.value)}
              style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
          </div>
        </div>
      );

    case 'slick-dv-hero-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill Pre" f={f} set={set} base="pillPre" segments={[{ key: 'pillPre' }]} />
          <RichFieldGroup label="Pill Bold" f={f} set={set} base="pillBold" segments={[{ key: 'pillBold' }]} />
          <RichFieldGroup label="Pill Suffix" f={f} set={set} base="pillSuffix" segments={[{ key: 'pillSuffix' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Center image" {...imageI18nProps(f, "imgCenter", update)} />
          <NumberInput label="Center image width (px)" value={(f.imgCenterWidth as number) ?? 254} onChange={(v) => set('imgCenterWidth', v)} />
          <FitSelect label="Center image fit" fitKey="imgCenterFit" f={f} set={set} def="contain" />
          <ImageField label="Bottom-left card" {...imageI18nProps(f, "imgBottomLeft", update)} />
          <NumberInput label="Bottom-left card width (px)" value={(f.imgBottomLeftWidth as number) ?? 273} onChange={(v) => set('imgBottomLeftWidth', v)} />
          <FitSelect label="Bottom-left card fit" fitKey="imgBottomLeftFit" f={f} set={set} def="cover" />
          <ImageField label="Bottom-right card" {...imageI18nProps(f, "imgBottomRight", update)} />
          <NumberInput label="Bottom-right card width (px)" value={(f.imgBottomRightWidth as number) ?? 253} onChange={(v) => set('imgBottomRightWidth', v)} />
          <FitSelect label="Bottom-right card fit" fitKey="imgBottomRightFit" f={f} set={set} def="cover" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Floating chips</p>
          <RichFieldGroup label="Chip 1 — value" f={f} set={set} base="chip1Val" segments={[{ key: 'chip1Val' }]} />
          <RichFieldGroup label="Chip 1 — unit (teal)" f={f} set={set} base="chip1Unit" segments={[{ key: 'chip1Unit' }]} />
          <RichFieldGroup label="Chip 1 — label" f={f} set={set} base="chip1Lbl" segments={[{ key: 'chip1Lbl' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Chip 2 — value" f={f} set={set} base="chip2Val" segments={[{ key: 'chip2Val' }]} />
          <RichFieldGroup label="Chip 2 — unit (teal)" f={f} set={set} base="chip2Unit" segments={[{ key: 'chip2Unit' }]} />
          <RichFieldGroup label="Chip 2 — label" f={f} set={set} base="chip2Lbl" segments={[{ key: 'chip2Lbl' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Chip 3 — value" f={f} set={set} base="chip3Val" segments={[{ key: 'chip3Val' }]} />
          <RichFieldGroup label="Chip 3 — unit (teal)" f={f} set={set} base="chip3Unit" segments={[{ key: 'chip3Unit' }]} />
          <RichFieldGroup label="Chip 3 — label" f={f} set={set} base="chip3Lbl" segments={[{ key: 'chip3Lbl' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Chip 4 — value" f={f} set={set} base="chip4Val" segments={[{ key: 'chip4Val' }]} />
          <RichFieldGroup label="Chip 4 — unit (teal)" f={f} set={set} base="chip4Unit" segments={[{ key: 'chip4Unit' }]} />
          <RichFieldGroup label="Chip 4 — label" f={f} set={set} base="chip4Lbl" segments={[{ key: 'chip4Lbl' }]} />
        </div>
      );

    case 'slick-dv-hero':
      return (
        <div className="space-y-4">
          <ImageField label="Logo URL" {...imageI18nProps(f, "logo", update)} />
          <FitSelect label="Logo fit" fitKey="logoFit" f={f} set={set} def="fill" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Heading</div>
          <RichFieldGroup label="Heading Prefix" f={f} set={set} base="headingPrefix" segments={[{ key: 'headingPrefix' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Last Line" f={f} set={set} base="headingLastLine" segments={[{ key: 'headingLastLine' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaPrimaryLabel" segments={[{ key: 'ctaPrimaryLabel' }]} />
          <TextInput label="Primary CTA href" value={f.ctaPrimaryHref as string ?? ''} onChange={(v) => set('ctaPrimaryHref', v)} />
          <RichFieldGroup label="Secondary CTA label" f={f} set={set} base="ctaSecondaryLabel" segments={[{ key: 'ctaSecondaryLabel' }]} />
          <TextInput label="Demo video URL (embed)" value={f.demoVideoUrl as string ?? ''} onChange={(v) => set('demoVideoUrl', v)} />
          <TextInput label="Google Play URL" value={f.googlePlayUrl as string ?? ''} onChange={(v) => set('googlePlayUrl', v)} />
          <TextInput label="App Store URL" value={f.appStoreUrl as string ?? ''} onChange={(v) => set('appStoreUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Trust stats (e.g. "25+ companies")</div>
          <RichFieldGroup label="Stat 1" f={f} set={set} base="stat1Text" segments={[{ key: 'stat1Text' }]} />
          <RichFieldGroup label="Stat 2" f={f} set={set} base="stat2Text" segments={[{ key: 'stat2Text' }]} />
          <RichFieldGroup label="Stat 3" f={f} set={set} base="stat3Text" segments={[{ key: 'stat3Text' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Phone mockup image URL" {...imageI18nProps(f, "mockupImage", update)} />
          <ImageWHFit label="Phone mockup size" widthKey="mockupImageMaxWidth" widthUnit="px" widthDef={520} aspectRatioKey="mockupImageAspectRatio" fitKey="mockupImageFit" fitDef="cover" f={f} set={set} />
        </div>
      );

    case 'slick-dv-video-split':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Body text" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Video thumbnail URL" {...imageI18nProps(f, "videoThumb", update)} />
          <FitSelect label="Video thumbnail fit" fitKey="videoThumbFit" f={f} set={set} def="cover" />
          <RichFieldGroup label="Video caption" f={f} set={set} base="videoLabel" segments={[{ key: 'videoLabel' }]} />
          <TextInput label="Video embed URL" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
        </div>
      );

    case 'slick-dv-video-pointers': {
      type PointerField = { title?: string; tag?: string };
      return (
        <div className="space-y-4">
          <Toggle label="Reverse layout (video on left)" value={Boolean(f.reverseLayout)} onChange={(v) => set('reverseLayout', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<PointerField>
            label="Pointers"
            items={(f.pointers as PointerField[]) ?? []}
            onChange={(v) => set('pointers', v)}
            newItem={() => ({ title: 'New pointer', tag: '' })}
            itemPreview={(p) => p.title || '(empty)'}
            renderItem={(p, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(p, 'title', u)} />
                <RichTextInput label="Tag pill (optional)" {...richItemProps(p, 'tag', u)} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Video thumbnail URL" {...imageI18nProps(f, "videoThumb", update)} />
          <FitSelect label="Video thumbnail fit" fitKey="videoThumbFit" f={f} set={set} def="cover" />
          <RichFieldGroup label="Video caption" f={f} set={set} base="videoLabel" segments={[{ key: 'videoLabel' }]} />
          <TextInput label="Video embed URL" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
        </div>
      );
    }

    case 'slick-dv-vision':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Vision text (wrap **text** in double asterisks for teal bold)" f={f} set={set} base="visionText" segments={[{ key: 'visionText' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Stats</div>
          <div className="grid grid-cols-2 gap-2">
            <RichFieldGroup label="Stat 1 value" f={f} set={set} base="stat1Value" segments={[{ key: 'stat1Value' }]} />
            <RichFieldGroup label="Stat 1 label" f={f} set={set} base="stat1Label" segments={[{ key: 'stat1Label' }]} />
            <RichFieldGroup label="Stat 2 value" f={f} set={set} base="stat2Value" segments={[{ key: 'stat2Value' }]} />
            <RichFieldGroup label="Stat 2 label" f={f} set={set} base="stat2Label" segments={[{ key: 'stat2Label' }]} />
            <RichFieldGroup label="Stat 3 value" f={f} set={set} base="stat3Value" segments={[{ key: 'stat3Value' }]} />
            <RichFieldGroup label="Stat 3 label" f={f} set={set} base="stat3Label" segments={[{ key: 'stat3Label' }]} />
            <RichFieldGroup label="Stat 4 value" f={f} set={set} base="stat4Value" segments={[{ key: 'stat4Value' }]} />
            <RichFieldGroup label="Stat 4 label" f={f} set={set} base="stat4Label" segments={[{ key: 'stat4Label' }]} />
          </div>
        </div>
      );

    case 'slick-dv-carousel':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ image: string; alt: string; title: string; subtitle: string }>
            label="Carousel cards"
            items={(f.cards as { image: string; alt: string; title: string; subtitle: string }[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ image: '', alt: 'App screenshot', title: '', subtitle: '' })}
            itemPreview={(it) => it.title || it.alt || 'Card'}
            renderItem={(it, u) => (
              <>
                <RichTextInput label="Card title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Card subtitle" {...richItemProps(it, 'subtitle', u)} />
                <ImageField label="Screenshot image" {...imageI18nProps(it, "image", (p) => u({ ...it, ...p }))} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
          <FitSelect label="Card image fit (all cards)" fitKey="cardsFit" f={f} set={set} def="cover" />
        </div>
      );

    case 'slick-dv-split':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Screenshots (auto-advances every 3s)"
            items={(f.slides as string[]) ?? []}
            onChange={(v) => set('slides', v)}
            newItem={() => ''}
            itemPreview={(s) => s || '(empty)'}
            renderItem={(s, u) => <ImageField label="Slide image" value={s} onChange={u} />}
          />
          <FitSelect label="Slide image fit (all slides)" fitKey="slidesFit" f={f} set={set} def="cover" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ label: string }>
            label="Feature chips"
            items={(f.features as { label: string }[]) ?? []}
            onChange={(v) => set('features', v)}
            newItem={() => ({ label: 'Feature' })}
            itemPreview={(it) => it.label || 'Feature'}
            renderItem={(it, u) => (
              <RichTextInput label="Label" {...richItemProps(it, 'label', u)} />
            )}
          />
        </div>
      );

    case 'slick-dv-agent':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Body text" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <ColorPicker label="Background color" value={(f.bgColor as string) || '#0b0d0d'} onChange={(v: string) => set('bgColor', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Checklist bullets"
            items={(f.bullets as string[]) ?? []}
            onChange={(v) => set('bullets', v)}
            newItem={() => 'New feature'}
            itemPreview={(s) => s || '(empty)'}
            renderItem={(s, u) => <TextInput label="Bullet text" value={s} onChange={u} />}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Slides (auto-advances every 3s)"
            items={(f.slides as string[]) ?? []}
            onChange={(v) => set('slides', v)}
            newItem={() => ''}
            itemPreview={(s) => s || '(empty)'}
            renderItem={(s, u) => <ImageField label="Slide image URL" value={s} onChange={u} />}
          />
          <FitSelect label="Slide image fit (all slides)" fitKey="slidesFit" f={f} set={set} def="cover" />
        </div>
      );

    case 'slick-dv-download':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Android store URL" value={f.androidStoreUrl as string ?? ''} onChange={(v) => set('androidStoreUrl', v)} />
          <ImageField label="Android QR image (optional)" {...imageI18nProps(f, "androidQrUrl", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="iOS store URL" value={f.iosStoreUrl as string ?? ''} onChange={(v) => set('iosStoreUrl', v)} />
          <ImageField label="iOS QR image (optional)" {...imageI18nProps(f, "iosQrUrl", update)} />
          <FitSelect label="QR image fit (both QRs)" fitKey="qrFit" f={f} set={set} def="contain" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Phone mockup image (right side)" {...imageI18nProps(f, "phoneImage", update)} />
          <ImageWHFit label="Phone mockup size" widthKey="phoneImageMaxWidth" widthUnit="px" widthDef={460} aspectRatioKey="phoneImageAspectRatio" fitKey="phoneImageFit" fitDef="contain" f={f} set={set} />
        </div>
      );

    case 'slick-dv-who': {
      type WhoCard = { title?: string; description?: string; image?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<WhoCard>
            label="Cards"
            items={(f.cards as WhoCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'New card', description: 'Description here.', image: '' })}
            itemPreview={(c) => c.title || '(empty)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(c, 'description', u)} />
                <ImageField label="Card image" {...imageI18nProps(c, "image", (p) => u({ ...c, ...p }))} />
              </div>
            )}
          />
          <FitSelect label="Card image fit (all cards)" fitKey="cardsFit" f={f} set={set} def="cover" />
        </div>
      );
    }

    case 'slick-dv-register':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent (fallback if no rotating words)" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <Textarea label="Rotating teal words (one per line — animates through them)" value={((f.rotatingWords as string[]) ?? []).join('\n')} onChange={(v) => set('rotatingWords', v.split('\n').map((s) => s.trim()).filter(Boolean))} />
          <RichFieldGroup label="Body text" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <RichFieldGroup label="Form title" f={f} set={set} base="formTitle" segments={[{ key: 'formTitle' }]} />
          <RichFieldGroup label="Form subtext" f={f} set={set} base="formSubtext" segments={[{ key: 'formSubtext' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <RichFieldGroup label="API endpoint (POST)" f={f} set={set} base="apiEndpoint" segments={[{ key: 'apiEndpoint' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Bullet points"
            items={(f.bullets as string[]) ?? []}
            onChange={(v) => set('bullets', v)}
            newItem={() => 'New benefit'}
            itemPreview={(s) => s || '(empty)'}
            renderItem={(s, u) => <TextInput label="Bullet" value={s} onChange={u} />}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Roles (dropdown options)"
            items={(f.roles as string[]) ?? []}
            onChange={(v) => set('roles', v)}
            newItem={() => 'New role'}
            itemPreview={(s) => s || '(empty)'}
            renderItem={(s, u) => <TextInput label="Role" value={s} onChange={u} />}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Trust badges (below button)"
            items={(f.trustBadges as string[]) ?? []}
            onChange={(v) => set('trustBadges', v)}
            newItem={() => 'New badge'}
            itemPreview={(s) => s || '(empty)'}
            renderItem={(s, u) => <TextInput label="Badge" value={s} onChange={u} />}
          />
        </div>
      );

    case 'slick-sc-product-cards': {
      type PcCard = { title?: string; description?: string; logoImg?: string; logoAlt?: string; logoText?: string; logoColor?: string; href?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow pill" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading suffix" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<PcCard>
            label="Cards"
            items={(f.cards as PcCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Product', description: '', logoText: 'SC', logoColor: '#00C6B1', href: '#' })}
            itemPreview={(c) => c.title || '(untitled)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(c, 'description', u)} />
                <TextInput label="Logo image URL" value={c.logoImg ?? ''} onChange={(x) => u({ ...c, logoImg: x })} />
                <TextInput label="Logo alt text" value={c.logoAlt ?? ''} onChange={(x) => u({ ...c, logoAlt: x })} />
                <RichTextInput label="Logo text (if no image)" {...richItemProps(c, 'logoText', u)} />
                <TextInput label="Logo colour (hex)" value={c.logoColor ?? ''} onChange={(x) => u({ ...c, logoColor: x })} />
                <TextInput label="Link URL" value={c.href ?? ''} onChange={(x) => u({ ...c, href: x })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-product-showcase': {
      type PsCard = { title?: string; ctaLabel?: string; ctaUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Gradient" f={f} set={set} base="headingGradient" segments={[{ key: 'headingGradient' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<PsCard>
            label="Cards (3 slots: IR Recognition · AI Sales Agent · AI Coach)"
            items={(f.cards as PsCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Product', ctaLabel: 'Explore Demo', ctaUrl: '#' })}
            itemPreview={(c) => c.title || '(untitled)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Card title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="CTA label" {...richItemProps(c, 'ctaLabel', u)} />
                <TextInput label="CTA URL" value={c.ctaUrl ?? ''} onChange={(x) => u({ ...c, ctaUrl: x })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-ai-commerce': {
      type AcsCard = { kicker?: string; title?: string; copy?: string; ctaUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Gradient" f={f} set={set} base="headingGradient" segments={[{ key: 'headingGradient' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<AcsCard>
            label="Cards (6 slots, illustrations are hardcoded per slot)"
            items={(f.cards as AcsCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ kicker: 'Category', title: 'Feature Title', copy: '', ctaUrl: '#' })}
            itemPreview={(c) => c.title || c.kicker || '(untitled)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Kicker (category label)" {...richItemProps(c, 'kicker', u)} />
                <RichTextInput label="Card title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Copy" {...richItemProps(c, 'copy', u)} />
                <TextInput label="CTA URL" value={c.ctaUrl ?? ''} onChange={(x) => u({ ...c, ctaUrl: x })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-integrations': {
      type TileField = { imageUrl?: string; alt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Gradient" f={f} set={set} base="headingGradient" segments={[{ key: 'headingGradient' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<TileField>
            label="Integration tiles (up to 12)"
            items={(f.tiles as TileField[]) ?? []}
            onChange={(v) => set('tiles', v)}
            newItem={() => ({ imageUrl: '', alt: 'Integration' })}
            itemPreview={(t) => t.alt || '(unnamed)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <ImageField label="Logo image" {...imageI18nProps(t, "imageUrl", (p) => u({ ...t, ...p }))} />
                <TextInput label="Alt text" value={t.alt ?? ''} onChange={(x) => u({ ...t, alt: x })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sc-trust-metrics': {
      type StatField = { target: number; prefix?: string; suffix: string; label: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Gradient" f={f} set={set} base="headingGradient" segments={[{ key: 'headingGradient' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<StatField>
            label="Stats"
            items={(f.stats as StatField[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ target: 0, suffix: '+', label: 'Stat Label' })}
            itemPreview={(s) => `${s.target}${s.suffix} — ${s.label}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <NumberInput label="Target number" value={s.target} onChange={(x) => u({ ...s, target: x })} />
                <RichTextInput label="Prefix (optional, e.g. $)" {...richItemProps(s, 'prefix', u)} />
                <RichTextInput label="Suffix (e.g. +, M+, B+)" {...richItemProps(s, 'suffix', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'label', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-customer-stories': {
      type StoryField = {
        id?: string; brandName: string; brandColor: string;
        categoryLabel: string; title: string; description: string;
        speakerInitials: string; speakerName: string; speakerRole: string; storyUrl?: string;
      };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<StoryField>
            label="Stories"
            items={(f.stories as StoryField[]) ?? []}
            onChange={(v) => set('stories', v)}
            newItem={() => ({
              brandName: 'Brand Name', brandColor: '#0BC5B5',
              categoryLabel: 'Success Story',
              title: 'How Brand Achieved a Key Result',
              description: 'A brief description of the outcome and what drove it.',
              speakerInitials: 'AB', speakerName: 'Speaker Name', speakerRole: 'Role, Company',
              storyUrl: '',
            })}
            itemPreview={(s) => s.speakerName || s.brandName || '(unnamed)'}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Brand name" {...richItemProps(s, 'brandName', u)} />
                <ColorPicker label="Brand color" value={s.brandColor} onChange={(x) => u({ ...s, brandColor: x })} />
                <RichTextInput label="Category tag" {...richItemProps(s, 'categoryLabel', u)} />
                <RichTextInput label="Card title" {...richItemProps(s, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(s, 'description', u)} />
                <RichTextInput label="Speaker initials" {...richItemProps(s, 'speakerInitials', u)} />
                <RichTextInput label="Speaker name" {...richItemProps(s, 'speakerName', u)} />
                <RichTextInput label="Speaker role" {...richItemProps(s, 'speakerRole', u)} />
                <TextInput label="Story URL (optional)" value={s.storyUrl ?? ''} onChange={(x) => u({ ...s, storyUrl: x })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sc-platform-branded':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill / eyebrow" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading (plain start)" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading (teal accent word)" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (second line)" f={f} set={set} base="headingLine2" segments={[{ key: 'headingLine2' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <p className="text-xs text-slate-500">The right side embeds the live sign-in / sign-up (same as the /login page) — no fields to edit.</p>
        </div>
      );

    case 'slick-sc-founder-reels': {
      type ReelItem = { posterUrl?: string; videoUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading (plain start)" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading (teal emphasis)" f={f} set={set} base="headingEm" segments={[{ key: 'headingEm' }]} />
          <RichFieldGroup label="Heading (plain end)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<ReelItem>
            label="Reels (YouTube Shorts)"
            items={(f.reels as ReelItem[]) ?? []}
            onChange={(v) => set('reels', v)}
            newItem={() => ({ posterUrl: '', videoUrl: '' })}
            itemPreview={(_, i) => `Reel ${i + 1}`}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <TextInput label="YouTube Short / video URL" value={r.videoUrl ?? ''} onChange={(v) => u({ ...r, videoUrl: v })} />
                <ImageField label="Thumbnail (optional — falls back to the YouTube thumbnail)" {...imageI18nProps(r, "posterUrl", (p) => u({ ...r, ...p }))} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-testimonials': {
      type Review = { photo?: string; title?: unknown; body?: unknown; brandLogo?: string; name?: string; role?: string; videoUrl?: string; flip?: boolean };
      type Video = { thumb?: string; brandLogo?: string; name?: string; role?: string; videoUrl?: string };
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Tab 1 label (videos)" value={f.tabVideosLabel as string ?? ''} onChange={(v) => set('tabVideosLabel', v)} placeholder="Video Testimonials" />
            <TextInput label="Tab 2 label (reviews)" value={f.tabReviewsLabel as string ?? ''} onChange={(v) => set('tabReviewsLabel', v)} placeholder="Customer Reviews" />
          </div>
          <Select
            label="Default open tab"
            value={(f.defaultTab as string) ?? 'videos'}
            onChange={(v) => set('defaultTab', v)}
            options={[{ value: 'videos', label: 'Video Testimonials' }, { value: 'reviews', label: 'Customer Reviews' }]}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs font-semibold text-slate-400">Video tab — heading &amp; subheading</p>
          <RichFieldGroup label="Videos heading" f={f} set={set} base="videosHeading" segments={[{ key: 'videosHeading' }]} />
          <RichFieldGroup label="Videos subtitle" f={f} set={set} base="videosSub" segments={[{ key: 'videosSub' }]} />
          <p className="text-xs font-semibold text-slate-400">Reviews tab — heading &amp; subheading</p>
          <RichFieldGroup label="Reviews heading" f={f} set={set} base="reviewsHeading" segments={[{ key: 'reviewsHeading' }]} />
          <RichFieldGroup label="Reviews subtitle" f={f} set={set} base="reviewsSub" segments={[{ key: 'reviewsSub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<Video>
            label="Video testimonials (Tab 1)"
            items={(f.videos as Video[]) ?? []}
            onChange={(v) => set('videos', v)}
            newItem={() => ({ thumb: '', brandLogo: '', name: '', role: '', videoUrl: '' })}
            itemPreview={(v) => v.name || '(video)'}
            renderItem={(v, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail (optional — falls back to YouTube thumbnail)" {...imageI18nProps(v, "thumb", (p) => u({ ...v, ...p }))} />
                <ImageField label="Brand logo" {...imageI18nProps(v, "brandLogo", (p) => u({ ...v, ...p }))} />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput label="Name" value={v.name ?? ''} onChange={(x) => u({ ...v, name: x })} />
                  <TextInput label="Role / company" value={v.role ?? ''} onChange={(x) => u({ ...v, role: x })} />
                </div>
                <TextInput label="YouTube video URL" value={v.videoUrl ?? ''} onChange={(x) => u({ ...v, videoUrl: x })} placeholder="youtube.com/watch?v=… or youtu.be/…" />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<Review>
            label="Customer reviews (Tab 2)"
            items={(f.reviews as Review[]) ?? []}
            onChange={(v) => set('reviews', v)}
            newItem={() => ({ photo: '', title: '', body: '', brandLogo: '', name: '', role: '', videoUrl: '', flip: false })}
            itemPreview={(r) => r.name || '(review)'}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <ImageField label="Customer photo" {...imageI18nProps(r, "photo", (p) => u({ ...r, ...p }))} />
                <RichTextInput
                  label="Pull-quote title (rich text)"
                  value={r.title as never}
                  onChange={(doc) => u({ ...r, title: doc })}
                />
                <RichTextInput
                  label="Full transcript (rich text — bold / italic / color / lists)"
                  value={r.body as never}
                  onChange={(doc) => u({ ...r, body: doc })}
                />
                <ImageField label="Brand logo" {...imageI18nProps(r, "brandLogo", (p) => u({ ...r, ...p }))} />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput label="Name" value={r.name ?? ''} onChange={(x) => u({ ...r, name: x })} />
                  <TextInput label="Role" value={r.role ?? ''} onChange={(x) => u({ ...r, role: x })} />
                </div>
                <TextInput label="YouTube video URL (Watch button)" value={r.videoUrl ?? ''} onChange={(x) => u({ ...r, videoUrl: x })} placeholder="youtube.com/watch?v=… or youtu.be/…" />
                <Toggle label="Photo on the right (swap layout)" value={Boolean(r.flip)} onChange={(v) => u({ ...r, flip: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-brand-strip': {
      type LogoField = { imageUrl: string; alt: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Gradient" f={f} set={set} base="headingGradient" segments={[{ key: 'headingGradient' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<LogoField>
            label="Logos"
            items={(f.logos as LogoField[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ imageUrl: '', alt: 'Brand name' })}
            itemPreview={(l) => l.alt || '(unnamed)'}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <ImageField label="Logo URL" {...imageI18nProps(l, "imageUrl", (p) => u({ ...l, ...p }))} />
                <TextInput label="Alt text" value={l.alt} onChange={(x) => u({ ...l, alt: x })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="CTA note" f={f} set={set} base="ctaNote" segments={[{ key: 'ctaNote' }]} />
        </div>
      );
    }

    case 'slick-sc-impact-stats': {
      type StatField = { value?: string; suffix?: string; label?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<StatField>
            label="Stats"
            items={(f.stats as StatField[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '0', suffix: '%', label: 'Label' })}
            itemPreview={(s) => `${s.value ?? ''}${s.suffix ?? ''} — ${s.label ?? ''}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'value', u)} />
                <RichTextInput label="Suffix (e.g. %)" {...richItemProps(s, 'suffix', u)} />
                <RichTextInput label="Label (use \\n for line break)" {...richItemProps(s, 'label', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-think-tank': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <BlogPicker
            label="Posts to show"
            value={(f.selectedBlogSlugs as string[]) ?? []}
            onChange={(v) => set('selectedBlogSlugs', v)}
          />
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Pick specific posts to feature (drag to reorder), or leave empty to auto-show the 6 newest published posts.
          </p>
        </div>
      );
    }

    case 'slick-sc-data-safety': {
      type BadgeField = { imageUrl?: string; alt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtitle line 1" f={f} set={set} base="subtitleLine1" segments={[{ key: 'subtitleLine1' }]} />
          <RichFieldGroup label="Subtitle line 2" f={f} set={set} base="subtitleLine2" segments={[{ key: 'subtitleLine2' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<BadgeField>
            label="Certification badges"
            items={(f.badges as BadgeField[]) ?? []}
            onChange={(v) => set('badges', v)}
            newItem={() => ({ imageUrl: '', alt: 'Certification' })}
            itemPreview={(b) => b.alt || '(unnamed)'}
            renderItem={(b, u) => (
              <div className="space-y-2">
                <ImageField label="Badge image" {...imageI18nProps(b, "imageUrl", (p) => u({ ...b, ...p }))} />
                <TextInput label="Alt text" value={b.alt ?? ''} onChange={(x) => u({ ...b, alt: x })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-ai-product-grid': {
      type AiCardField = { title?: string; description?: string; thumbnailUrl?: string; videoUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading line 1" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading line 2" f={f} set={set} base="headingLine2" segments={[{ key: 'headingLine2' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <RichFieldGroup label="CTA label (trailing space = gap)" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<AiCardField>
            label="Product cards"
            items={(f.cards as AiCardField[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Product Name', description: '', thumbnailUrl: '', videoUrl: '' })}
            itemPreview={(c) => c.title || '(untitled)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(c, 'description', u)} />
                <ImageField label="Thumbnail image" {...imageI18nProps(c, "thumbnailUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Video URL (YouTube, YouTube Shorts, or direct mp4)" value={c.videoUrl ?? ''} onChange={(x) => u({ ...c, videoUrl: x })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-product-suite': {
      type CardField = { title?: string; description?: string; imageUrl?: string; imageAlt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<CardField>
            label="Cards"
            items={(f.cards as CardField[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Module Name', description: '', imageUrl: '', imageAlt: '' })}
            itemPreview={(c) => c.title || '(untitled)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(c, 'description', u)} />
                <ImageField label="Screenshot image" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt text" value={c.imageAlt ?? ''} onChange={(x) => u({ ...c, imageAlt: x })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-blog-insights': {
      type PostField = { badge?: string; title?: string; ctaLabel?: string; ctaUrl?: string; imageUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Featured post</p>
          {(() => {
            const fp = (f.featuredPost as PostField) ?? {};
            const upd = (patch: Partial<PostField>) => set('featuredPost', { ...fp, ...patch });
            return (
              <div className="space-y-2 pl-1 border-l-2 border-slate-700">
                <TextInput label="Badge" value={fp.badge ?? ''} onChange={(v) => upd({ badge: v })} />
                <Textarea label="Title" value={fp.title ?? ''} onChange={(v) => upd({ title: v })} />
                <ImageField label="Image" {...imageI18nProps(fp, "imageUrl", upd)} />
                <TextInput label="CTA label" value={fp.ctaLabel ?? ''} onChange={(v) => upd({ ctaLabel: v })} />
                <TextInput label="CTA URL" value={fp.ctaUrl ?? ''} onChange={(v) => upd({ ctaUrl: v })} />
              </div>
            );
          })()}
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<PostField>
            label="Side posts"
            items={(f.posts as PostField[]) ?? []}
            onChange={(v) => set('posts', v)}
            newItem={() => ({ badge: 'Category', title: 'Post Title', ctaLabel: 'Read More', ctaUrl: '#', imageUrl: '' })}
            itemPreview={(p) => p.title?.slice(0, 40) || '(untitled)'}
            renderItem={(p, u) => (
              <div className="space-y-2">
                <RichTextInput label="Badge" {...richItemProps(p, 'badge', u)} />
                <RichTextInput label="Title" {...richItemProps(p, 'title', u)} />
                <ImageField label="Image" {...imageI18nProps(p, "imageUrl", (patch) => u({ ...p, ...patch }))} />
                <RichTextInput label="CTA label" {...richItemProps(p, 'ctaLabel', u)} />
                <TextInput label="CTA URL" value={p.ctaUrl ?? ''} onChange={(v) => u({ ...p, ctaUrl: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="View all label" f={f} set={set} base="viewAllLabel" segments={[{ key: 'viewAllLabel' }]} />
          <TextInput label="View all URL" value={f.viewAllUrl as string ?? ''} onChange={(v) => set('viewAllUrl', v)} />
        </div>
      );
    }

    case 'slick-sfa-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <RichFieldGroup label="Subtitle Bold" f={f} set={set} base="subtitleBold" segments={[{ key: 'subtitleBold' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA button label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Input placeholder" value={f.ctaPlaceholder as string ?? ''} onChange={(v) => set('ctaPlaceholder', v)} />
          <RichFieldGroup label="Trust line" f={f} set={set} base="trustText" segments={[{ key: 'trustText' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Subtitle suffix" f={f} set={set} base="subtitleSuffix" segments={[{ key: 'subtitleSuffix' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Phone time" f={f} set={set} base="phoneTime" segments={[{ key: 'phoneTime' }]} />
          <RichFieldGroup label="Phone greeting" f={f} set={set} base="phoneGreeting" segments={[{ key: 'phoneGreeting' }]} />
          <RichFieldGroup label="Phone date" f={f} set={set} base="phoneDate" segments={[{ key: 'phoneDate' }]} />
          <RichFieldGroup label="Phone region badge" f={f} set={set} base="phoneRegionBadge" segments={[{ key: 'phoneRegionBadge' }]} />
          <RichFieldGroup label="Phone score card footer" f={f} set={set} base="phoneScoreCardFooter" segments={[{ key: 'phoneScoreCardFooter' }]} />
          <RichFieldGroup label="Phone analytics label" f={f} set={set} base="phoneAnalyticsLabel" segments={[{ key: 'phoneAnalyticsLabel' }]} />
          <RichFieldGroup label="Phone body greeting" f={f} set={set} base="phoneBodyGreeting" segments={[{ key: 'phoneBodyGreeting' }]} />
          <RichFieldGroup label="Phone body sub" f={f} set={set} base="phoneBodySub" segments={[{ key: 'phoneBodySub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Task 1 badge" f={f} set={set} base="phoneTask1Badge" segments={[{ key: 'phoneTask1Badge' }]} />
          <RichFieldGroup label="Task 1 title" f={f} set={set} base="phoneTask1Title" segments={[{ key: 'phoneTask1Title' }]} />
          <RichFieldGroup label="Task 1 title sub" f={f} set={set} base="phoneTask1TitleSub" segments={[{ key: 'phoneTask1TitleSub' }]} />
          <RichFieldGroup label="Task 1 sub" f={f} set={set} base="phoneTask1Sub" segments={[{ key: 'phoneTask1Sub' }]} />
          <RichFieldGroup label="Task 1 incentive" f={f} set={set} base="phoneTask1Incentive" segments={[{ key: 'phoneTask1Incentive' }]} />
          <RichFieldGroup label="Task 1 ring label" f={f} set={set} base="phoneTask1RingLabel" segments={[{ key: 'phoneTask1RingLabel' }]} />
          <RichFieldGroup label="Task 1 ring sub" f={f} set={set} base="phoneTask1RingSub" segments={[{ key: 'phoneTask1RingSub' }]} />
          <RichFieldGroup label="Task 1 ring value" f={f} set={set} base="phoneTask1RingValue" segments={[{ key: 'phoneTask1RingValue' }]} />
          <TextInput label="Task 1 ring total" value={String(f.phoneTask1RingTotal ?? '')} onChange={(v) => set('phoneTask1RingTotal', Number(v) || 100)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Task 2 badge" f={f} set={set} base="phoneTask2Badge" segments={[{ key: 'phoneTask2Badge' }]} />
          <RichFieldGroup label="Task 2 title" f={f} set={set} base="phoneTask2Title" segments={[{ key: 'phoneTask2Title' }]} />
          <RichFieldGroup label="Task 2 title sub" f={f} set={set} base="phoneTask2TitleSub" segments={[{ key: 'phoneTask2TitleSub' }]} />
          <RichFieldGroup label="Task 2 sub" f={f} set={set} base="phoneTask2Sub" segments={[{ key: 'phoneTask2Sub' }]} />
          <RichFieldGroup label="Task 2 incentive" f={f} set={set} base="phoneTask2Incentive" segments={[{ key: 'phoneTask2Incentive' }]} />
          <RichFieldGroup label="Task 2 ring label" f={f} set={set} base="phoneTask2RingLabel" segments={[{ key: 'phoneTask2RingLabel' }]} />
          <RichFieldGroup label="Task 2 ring sub" f={f} set={set} base="phoneTask2RingSub" segments={[{ key: 'phoneTask2RingSub' }]} />
          <RichFieldGroup label="Task 2 ring value" f={f} set={set} base="phoneTask2RingValue" segments={[{ key: 'phoneTask2RingValue' }]} />
          <TextInput label="Task 2 ring total" value={String(f.phoneTask2RingTotal ?? '')} onChange={(v) => set('phoneTask2RingTotal', Number(v) || 60)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Left card 1 title" f={f} set={set} base="cardL1Title" segments={[{ key: 'cardL1Title' }]} />
          <RichFieldGroup label="Left card 1 sub" f={f} set={set} base="cardL1Sub" segments={[{ key: 'cardL1Sub' }]} />
          <RichFieldGroup label="Left card 2 stat" f={f} set={set} base="cardL2Stat" segments={[{ key: 'cardL2Stat' }]} />
          <RichFieldGroup label="Left card 2 title" f={f} set={set} base="cardL2Title" segments={[{ key: 'cardL2Title' }]} />
          <RichFieldGroup label="Left card 2 sub" f={f} set={set} base="cardL2Sub" segments={[{ key: 'cardL2Sub' }]} />
          <RichFieldGroup label="Right card 1 badge" f={f} set={set} base="cardR1Badge" segments={[{ key: 'cardR1Badge' }]} />
          <RichFieldGroup label="Right card 1 body" f={f} set={set} base="cardR1Body" segments={[{ key: 'cardR1Body' }]} />
          <RichFieldGroup label="Right card 1 body highlight" f={f} set={set} base="cardR1BodyHighlight" segments={[{ key: 'cardR1BodyHighlight' }]} />
          <RichFieldGroup label="Right card 2 title" f={f} set={set} base="cardR2Title" segments={[{ key: 'cardR2Title' }]} />
          <RichFieldGroup label="Right card 2 sub" f={f} set={set} base="cardR2Sub" segments={[{ key: 'cardR2Sub' }]} />
          <RichFieldGroup label="Right card 3 stat" f={f} set={set} base="cardR3Stat" segments={[{ key: 'cardR3Stat' }]} />
          <RichFieldGroup label="Right card 3 title" f={f} set={set} base="cardR3Title" segments={[{ key: 'cardR3Title' }]} />
          <RichFieldGroup label="Right card 3 sub" f={f} set={set} base="cardR3Sub" segments={[{ key: 'cardR3Sub' }]} />
        </div>
      );

    case 'slick-sfa-ai-engine': {
      type AiTab = { label?: string; tag?: string; heading?: string; description?: string; features?: string[]; impactValue?: string; impactLabel?: string; impactSub?: string };
      const aiTabs = (f.tabs as AiTab[]) ?? [];
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<AiTab>
            label="Tabs"
            items={aiTabs}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', tag: 'AI Feature', heading: 'Feature heading', description: 'Feature description.', features: ['Feature 1'], impactValue: '3%', impactLabel: 'Sales uplift', impactSub: 'Description of impact' })}
            itemPreview={(t) => t.label || '(untitled)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(t, 'label', u)} />
                <RichTextInput label="Tag badge" {...richItemProps(t, 'tag', u)} />
                <RichTextInput label="Panel heading" {...richItemProps(t, 'heading', u)} />
                <RichTextInput label="Description" {...richItemProps(t, 'description', u)} />
                <Textarea label="Features (one per line)" value={(t.features ?? []).join('\n')} onChange={(v) => u({ ...t, features: v.split('\n').filter(Boolean) })} />
                <RichTextInput label="Impact value" {...richItemProps(t, 'impactValue', u)} />
                <RichTextInput label="Impact label" {...richItemProps(t, 'impactLabel', u)} />
                <RichTextInput label="Impact sub-label" {...richItemProps(t, 'impactSub', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sfa-guarantee': {
      type ResultField = { country?: string; value?: string; label?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <RichFieldGroup label="Refund pill text" f={f} set={set} base="refundText" segments={[{ key: 'refundText' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Proof section label" f={f} set={set} base="proofLabel" segments={[{ key: 'proofLabel' }]} />
          <Repeater<ResultField>
            label="Country results"
            items={(f.results as ResultField[]) ?? []}
            onChange={(v) => set('results', v)}
            newItem={() => ({ country: 'Country', value: '0%', label: 'avg sales uplift' })}
            itemPreview={(r) => `${r.country ?? ''} — ${r.value ?? ''}`}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <RichTextInput label="Country name" {...richItemProps(r, 'country', u)} />
                <RichTextInput label="Uplift value (e.g. 7%)" {...richItemProps(r, 'value', u)} />
                <RichTextInput label="Sub-label" {...richItemProps(r, 'label', u)} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Textarea label="Scope items (one per line)" value={((f.scopeItems as string[]) ?? []).join('\n')} onChange={(v) => set('scopeItems', v.split('\n').filter(Boolean))} />
        </div>
      );
    }

    case 'slick-sfa-guarantee-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Sub (\\n for line break)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    case 'slick-sfa-sales-team-cost': {
      type STTCard = { tag: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading highlight (red)" value={f.headingHighlight as string ?? ''} onChange={(v) => set('headingHighlight', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<STTCard>
            label="Group 1 cards (cost — red theme)"
            items={(f.group1Cards as STTCard[]) ?? []}
            onChange={(v) => set('group1Cards', v)}
            newItem={() => ({ tag: 'Tag', title: 'New card', desc: 'Description with **bold** highlight.' })}
            itemPreview={(c) => c.title || '(empty)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Tag" value={c.tag ?? ''} onChange={(v) => u({ ...c, tag: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Description (use **text** for bold)" value={c.desc ?? ''} onChange={(v) => u({ ...c, desc: v })} />
              </div>
            )}
          />
          <TextInput label="Group 1 stat number" value={f.group1OutNum as string ?? ''} onChange={(v) => set('group1OutNum', v)} />
          <TextInput label="Group 1 stat superscript" value={f.group1OutSup as string ?? ''} onChange={(v) => set('group1OutSup', v)} />
          <TextInput label="Group 1 stat label (use **text** for bold)" value={f.group1OutLabel as string ?? ''} onChange={(v) => set('group1OutLabel', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<STTCard>
            label="Group 2 cards (opportunity — teal theme)"
            items={(f.group2Cards as STTCard[]) ?? []}
            onChange={(v) => set('group2Cards', v)}
            newItem={() => ({ tag: 'Tag', title: 'New card', desc: 'Description with **bold** highlight.' })}
            itemPreview={(c) => c.title || '(empty)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Tag" value={c.tag ?? ''} onChange={(v) => u({ ...c, tag: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Description (use **text** for bold)" value={c.desc ?? ''} onChange={(v) => u({ ...c, desc: v })} />
              </div>
            )}
          />
          <TextInput label="Group 2 stat number" value={f.group2OutNum as string ?? ''} onChange={(v) => set('group2OutNum', v)} />
          <TextInput label="Group 2 stat superscript" value={f.group2OutSup as string ?? ''} onChange={(v) => set('group2OutSup', v)} />
          <TextInput label="Group 2 stat label (use **text** for bold)" value={f.group2OutLabel as string ?? ''} onChange={(v) => set('group2OutLabel', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Textarea label="Footnote" value={f.note as string ?? ''} onChange={(v) => set('note', v)} />
        </div>
      );
    }
    case 'slick-sfa-ai-engine-v2': {
      type AEV2Tab = { label?: string; tag?: string; headingGrad?: string; headingSuffix?: string; description?: string; features?: string[]; impactValue?: string; impactLabel?: string; impactSub?: string; img?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<AEV2Tab>
            label="Tabs"
            items={(f.tabs as AEV2Tab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', tag: 'New Tab', headingGrad: 'Heading ', headingSuffix: 'suffix', description: '', features: [], impactValue: '0%', impactLabel: 'Sales uplift', impactSub: '', img: '' })}
            itemPreview={(t) => t.label || '(unnamed)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(t, 'label', u)} />
                <RichTextInput label="Tag pill" {...richItemProps(t, 'tag', u)} />
                <RichTextInput label="Heading (teal part)" {...richItemProps(t, 'headingGrad', u)} />
                <RichTextInput label="Heading (dark suffix)" {...richItemProps(t, 'headingSuffix', u)} />
                <RichTextInput label="Description" {...richItemProps(t, 'description', u)} />
                <Textarea label="Features (one per line)" value={(t.features ?? []).join('\n')} onChange={(v) => u({ ...t, features: v.split('\n').filter(Boolean) })} />
                <RichTextInput label="Impact value" {...richItemProps(t, 'impactValue', u)} />
                <RichTextInput label="Impact label" {...richItemProps(t, 'impactLabel', u)} />
                <RichTextInput label="Impact sub" {...richItemProps(t, 'impactSub', u)} />
                <ImageField label="Tab image (right panel)" {...imageI18nProps(t, "img", (p) => u({ ...t, ...p }))} />
              </div>
            )}
          />
        </div>
      );
    }
    case 'slick-sfa-showcase':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Sub paragraph (\\n for line break)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Centre image (phone group)" {...imageI18nProps(f, "imgCenter", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Label — top left" f={f} set={set} base="labelTL" segments={[{ key: 'labelTL' }]} />
          <RichFieldGroup label="Label — mid left" f={f} set={set} base="labelML" segments={[{ key: 'labelML' }]} />
          <RichFieldGroup label="Label — bottom left" f={f} set={set} base="labelBL" segments={[{ key: 'labelBL' }]} />
          <RichFieldGroup label="Label — top right" f={f} set={set} base="labelTR" segments={[{ key: 'labelTR' }]} />
          <RichFieldGroup label="Label — mid right" f={f} set={set} base="labelMR" segments={[{ key: 'labelMR' }]} />
          <RichFieldGroup label="Label — bottom right" f={f} set={set} base="labelBR" segments={[{ key: 'labelBR' }]} />
        </div>
      );
    case 'slick-sfa-typical': {
      type TypSlide = { imageUrl?: string; imageAlt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <NumberInput label="Autoplay interval (ms, 0 = off)" value={f.autoplayMs as number ?? 3000} onChange={(v) => set('autoplayMs', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<TypSlide>
            label="Slides"
            items={(f.slides as TypSlide[]) ?? []}
            onChange={(v) => set('slides', v)}
            newItem={() => ({ imageUrl: '', imageAlt: '' })}
            itemPreview={(s) => s.imageAlt || 'Slide'}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <ImageField label="Slide image" {...imageI18nProps(s, "imageUrl", (p) => u({ ...s, ...p }))} />
                <TextInput label="Image alt" value={s.imageAlt ?? ''} onChange={(v) => u({ ...s, imageAlt: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Label — top left" f={f} set={set} base="labelTL" segments={[{ key: 'labelTL' }]} />
          <RichFieldGroup label="Label — mid left" f={f} set={set} base="labelML" segments={[{ key: 'labelML' }]} />
          <RichFieldGroup label="Label — bottom left" f={f} set={set} base="labelBL" segments={[{ key: 'labelBL' }]} />
          <RichFieldGroup label="Label — top right" f={f} set={set} base="labelTR" segments={[{ key: 'labelTR' }]} />
          <RichFieldGroup label="Label — mid right" f={f} set={set} base="labelMR" segments={[{ key: 'labelMR' }]} />
          <RichFieldGroup label="Label — bottom right" f={f} set={set} base="labelBR" segments={[{ key: 'labelBR' }]} />
        </div>
      );
    }
    case 'slick-sfa-revenue-loss':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading line 1" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading Line2 Pre" f={f} set={set} base="headingLine2Pre" segments={[{ key: 'headingLine2Pre' }]} />
          <RichFieldGroup label="Heading Line2 Grad" f={f} set={set} base="headingLine2Grad" segments={[{ key: 'headingLine2Grad' }]} />
          <RichFieldGroup label="Sub paragraph (use \\n for line break)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    case 'slick-sfa-insights': {
      type InsightCard = { name?: string; role?: string; logoImg?: string; logoAlt?: string; logoText?: string; logoColor?: string; thumbnail?: string; videoUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Lead paragraph" f={f} set={set} base="lead" segments={[{ key: 'lead' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<InsightCard>
            label="Video Cards"
            items={(f.cards as InsightCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ name: 'Speaker Name', role: 'Title\nCompany', logoText: 'Brand', logoColor: '#082B4B', logoImg: '', thumbnail: '', videoUrl: '' })}
            itemPreview={(c) => c.name || c.logoText || '(unnamed)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Name" {...richItemProps(c, 'name', u)} />
                <RichTextInput label="Role (use newline for line break)" {...richItemProps(c, 'role', u)} />
                <ImageField label="Logo image" {...imageI18nProps(c, "logoImg", (p) => u({ ...c, ...p }))} />
                <TextInput label="Logo alt text" value={c.logoAlt ?? ''} onChange={(v) => u({ ...c, logoAlt: v })} />
                <RichTextInput label="Logo text (fallback)" {...richItemProps(c, 'logoText', u)} />
                <ColorPicker label="Logo text color" value={c.logoColor ?? '#082B4B'} onChange={(v) => u({ ...c, logoColor: v })} />
                <ImageField label="Video thumbnail" {...imageI18nProps(c, "thumbnail", (p) => u({ ...c, ...p }))} />
                <TextInput label="Video URL" value={c.videoUrl ?? ''} onChange={(v) => u({ ...c, videoUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-dms-hero': {
      type TrustItem = { value?: string; label?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle text (before bold)" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <RichFieldGroup label="Subtitle Bold" f={f} set={set} base="subtitleBold" segments={[{ key: 'subtitleBold' }]} />
          <RichFieldGroup label="Subtitle Suffix" f={f} set={set} base="subtitleSuffix" segments={[{ key: 'subtitleSuffix' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA input placeholder" value={f.ctaPlaceholder as string ?? ''} onChange={(v) => set('ctaPlaceholder', v)} />
          <RichFieldGroup label="CTA button label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<TrustItem>
            label="Trust bar items"
            items={(f.trustItems as TrustItem[]) ?? []}
            onChange={(v) => set('trustItems', v)}
            newItem={() => ({ value: '', label: 'New stat' })}
            itemPreview={(t) => [t.value, t.label].filter(Boolean).join(' ') || '(empty)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value (bold, e.g. 3M+)" {...richItemProps(t, 'value', u)} />
                <RichTextInput label="Label" {...richItemProps(t, 'label', u)} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="AI Plan card title" f={f} set={set} base="planTitle" segments={[{ key: 'planTitle' }]} />
          <RichFieldGroup label="AI Plan card subtitle" f={f} set={set} base="planSub" segments={[{ key: 'planSub' }]} />
          <TextInput label="Plan row 1 — key" value={f.planRow1Key as string ?? ''} onChange={(v) => set('planRow1Key', v)} />
          <RichFieldGroup label="Plan row 1 — value" f={f} set={set} base="planRow1Val" segments={[{ key: 'planRow1Val' }]} />
          <TextInput label="Plan row 2 — key" value={f.planRow2Key as string ?? ''} onChange={(v) => set('planRow2Key', v)} />
          <RichFieldGroup label="Plan row 2 — value" f={f} set={set} base="planRow2Val" segments={[{ key: 'planRow2Val' }]} />
          <TextInput label="Plan row 3 — key" value={f.planRow3Key as string ?? ''} onChange={(v) => set('planRow3Key', v)} />
          <RichFieldGroup label="Plan row 3 — value" f={f} set={set} base="planRow3Val" segments={[{ key: 'planRow3Val' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Agent card name" f={f} set={set} base="agentName" segments={[{ key: 'agentName' }]} />
          <RichFieldGroup label="Agent Msg Pre" f={f} set={set} base="agentMsgPre" segments={[{ key: 'agentMsgPre' }]} />
          <RichFieldGroup label="Agent Msg Bold" f={f} set={set} base="agentMsgBold" segments={[{ key: 'agentMsgBold' }]} />
          <RichFieldGroup label="Agent message (after bold)" f={f} set={set} base="agentMsgPost" segments={[{ key: 'agentMsgPost' }]} />
        </div>
      );
    }

    case 'slick-dms-hero-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Line1 Pre" f={f} set={set} base="headingLine1Pre" segments={[{ key: 'headingLine1Pre' }]} />
          <RichFieldGroup label="Heading Line1 Grad" f={f} set={set} base="headingLine1Grad" segments={[{ key: 'headingLine1Grad' }]} />
          <RichFieldGroup label="Heading line 2" f={f} set={set} base="headingLine2" segments={[{ key: 'headingLine2' }]} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Center image (dashboard)" {...imageI18nProps(f, "imgCenter", update)} />
          <NumberInput label="Center image width (px)" value={(f.imgCenterWidth as number) ?? 660} onChange={(v) => set('imgCenterWidth', v)} />
          <FitSelect label="Center image fit" fitKey="imgCenterFit" f={f} set={set} def="fill" />
          <ImageField label="Left card image" {...imageI18nProps(f, "imgLeft", update)} />
          <ImageField label="Right card image" {...imageI18nProps(f, "imgRight", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Floating chips</p>
          <RichFieldGroup label="Chip 1 — value" f={f} set={set} base="chip1Val" segments={[{ key: 'chip1Val' }]} />
          <RichFieldGroup label="Chip 1 — unit (teal)" f={f} set={set} base="chip1Unit" segments={[{ key: 'chip1Unit' }]} />
          <RichFieldGroup label="Chip 1 — label" f={f} set={set} base="chip1Label" segments={[{ key: 'chip1Label' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Chip 2 — value" f={f} set={set} base="chip2Val" segments={[{ key: 'chip2Val' }]} />
          <RichFieldGroup label="Chip 2 — unit (teal)" f={f} set={set} base="chip2Unit" segments={[{ key: 'chip2Unit' }]} />
          <RichFieldGroup label="Chip 2 — label" f={f} set={set} base="chip2Label" segments={[{ key: 'chip2Label' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Chip 3 — value" f={f} set={set} base="chip3Val" segments={[{ key: 'chip3Val' }]} />
          <RichFieldGroup label="Chip 3 — unit (teal)" f={f} set={set} base="chip3Unit" segments={[{ key: 'chip3Unit' }]} />
          <RichFieldGroup label="Chip 3 — label" f={f} set={set} base="chip3Label" segments={[{ key: 'chip3Label' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Chip 4 — value" f={f} set={set} base="chip4Val" segments={[{ key: 'chip4Val' }]} />
          <RichFieldGroup label="Chip 4 — unit (teal)" f={f} set={set} base="chip4Unit" segments={[{ key: 'chip4Unit' }]} />
          <RichFieldGroup label="Chip 4 — label" f={f} set={set} base="chip4Label" segments={[{ key: 'chip4Label' }]} />
        </div>
      );

    case 'slick-dms-features-v2': {
      type DmsFV2Tab = { label?: string; headingPre?: string; headingGrad?: string; body?: string; bullets?: string[]; statValue?: string; statLabel?: string; statSuffix?: string; img?: string; };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <RichFieldGroup label="Footer text" f={f} set={set} base="footerText" segments={[{ key: 'footerText' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DmsFV2Tab>
            label="Tabs"
            items={(f.tabs as DmsFV2Tab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', headingPre: 'Panel', headingGrad: 'Title', body: 'Description.', bullets: ['Feature one'], statValue: '0%', statLabel: 'Outcome', statSuffix: 'guaranteed', img: '' })}
            itemPreview={(t) => t.label || '(untitled)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(t, 'label', u)} />
                <RichTextInput label="Panel heading (dark)" {...richItemProps(t, 'headingPre', u)} />
                <RichTextInput label="Panel heading (gradient)" {...richItemProps(t, 'headingGrad', u)} />
                <RichTextInput label="Body text" {...richItemProps(t, 'body', u)} />
                <Textarea label="Bullets (one per line)" value={(t.bullets ?? []).join('\n')} onChange={(v) => u({ ...t, bullets: v.split('\n').filter(Boolean) })} />
                <RichTextInput label="Stat value (e.g. 3%)" {...richItemProps(t, 'statValue', u)} />
                <RichTextInput label="Stat label" {...richItemProps(t, 'statLabel', u)} />
                <RichTextInput label="Stat suffix" {...richItemProps(t, 'statSuffix', u)} />
                <ImageField label="Tab image" {...imageI18nProps(t, "img", (p) => u({ ...t, ...p }))} />
              </div>
            )}
          />
          <ImageWHFit label="Tab image size (all tabs)" widthKey="tabImageWidthPercent" widthUnit="%" widthDef={100} aspectRatioKey="tabImageAspectRatio" fitKey="tabImageFit" fitDef="cover" f={f} set={set} />
        </div>
      );
    }

    case 'slick-dms-features': {
      type DmsFTab = { label?: string; headingPre?: string; headingGrad?: string; body?: string; bullets?: string[]; statValue?: string; statLabel?: string; statSuffix?: string; img?: string; };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Lede paragraph" f={f} set={set} base="lede" segments={[{ key: 'lede' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DmsFTab>
            label="Tabs (4 supported)"
            items={(f.tabs as DmsFTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', headingPre: 'Panel', headingGrad: 'Title', body: 'Description.', bullets: ['Feature one'], statValue: '0%', statLabel: 'Outcome', statSuffix: 'guaranteed', img: '' })}
            itemPreview={(t) => t.label || '(untitled)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(t, 'label', u)} />
                <RichTextInput label="Panel heading (dark)" {...richItemProps(t, 'headingPre', u)} />
                <RichTextInput label="Panel heading (gradient)" {...richItemProps(t, 'headingGrad', u)} />
                <RichTextInput label="Body text" {...richItemProps(t, 'body', u)} />
                <Textarea label="Bullets (one per line)" value={(t.bullets ?? []).join('\n')} onChange={(v) => u({ ...t, bullets: v.split('\n').filter(Boolean) })} />
                <RichTextInput label="Stat value (e.g. 3%)" {...richItemProps(t, 'statValue', u)} />
                <RichTextInput label="Stat label" {...richItemProps(t, 'statLabel', u)} />
                <RichTextInput label="Stat suffix" {...richItemProps(t, 'statSuffix', u)} />
                <ImageField label="Tab image" {...imageI18nProps(t, "img", (p) => u({ ...t, ...p }))} />
              </div>
            )}
          />
          <FitSelect label="Tab image fit (all tabs)" fitKey="tabImageFit" f={f} set={set} def="fill" />
        </div>
      );
    }

    case 'slick-dms-comparison': {
      type CmpRow = { title?: string; sub?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Italic subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <ImageField label="Standard DMS screen image (left/before side of slider)" {...imageI18nProps(f, "imgScreenOld", update)} />
          <FitSelect label="Standard DMS screen fit" fitKey="imgScreenOldFit" f={f} set={set} def="cover" />
          <ImageField label="NextGen DMS screen image (right/after side of slider)" {...imageI18nProps(f, "imgScreenNew", update)} />
          <FitSelect label="NextGen DMS screen fit" fitKey="imgScreenNewFit" f={f} set={set} def="cover" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Left panel label (Standard DMS)" f={f} set={set} base="oldLabel" segments={[{ key: 'oldLabel' }]} />
          <Repeater<CmpRow>
            label="Standard DMS rows"
            items={(f.oldRows as CmpRow[]) ?? []}
            onChange={(v) => set('oldRows', v)}
            newItem={() => ({ title: '', sub: '' })}
            itemPreview={(r) => r.title || '(empty)'}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <RichTextInput label="Row title" {...richItemProps(r, 'title', u)} />
                <RichTextInput label="Row sub-text" {...richItemProps(r, 'sub', u)} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Right panel label (NextGen DMS)" f={f} set={set} base="newLabel" segments={[{ key: 'newLabel' }]} />
          <Repeater<CmpRow>
            label="NextGen DMS rows"
            items={(f.newRows as CmpRow[]) ?? []}
            onChange={(v) => set('newRows', v)}
            newItem={() => ({ title: '', sub: '' })}
            itemPreview={(r) => r.title || '(empty)'}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <RichTextInput label="Row title" {...richItemProps(r, 'title', u)} />
                <RichTextInput label="Row sub-text" {...richItemProps(r, 'sub', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-dms-agents': {
      type DmsAgtItem = { name?: string; img?: string; lede?: string; benefits?: string[] };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Lede paragraph" f={f} set={set} base="lede" segments={[{ key: 'lede' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DmsAgtItem>
            label="Agents (4 supported)"
            items={(f.agents as DmsAgtItem[]) ?? []}
            onChange={(v) => set('agents', v)}
            newItem={() => ({ name: 'New Agent', lede: 'Agent description.', benefits: ['Benefit one.', 'Benefit two.'] })}
            itemPreview={(a) => a.name || '(untitled)'}
            renderItem={(a, u) => (
              <div className="space-y-2">
                <RichTextInput label="Agent name" {...richItemProps(a, 'name', u)} />
                <ImageField label="Agent image (overrides mockup)" {...imageI18nProps(a, "img", (p) => u({ ...a, ...p }))} />
                <RichTextInput label="Short description" {...richItemProps(a, 'lede', u)} />
                <TextInput label="Benefit 1" value={(a.benefits as string[] | undefined)?.[0] ?? ''} onChange={(v) => u({ ...a, benefits: [v, ...((a.benefits as string[] | undefined ?? []).slice(1))] })} />
                <TextInput label="Benefit 2" value={(a.benefits as string[] | undefined)?.[1] ?? ''} onChange={(v) => u({ ...a, benefits: [((a.benefits as string[] | undefined ?? [])[0]) ?? '', v] })} />
              </div>
            )}
          />
          <FitSelect label="Agent image fit (all agents)" fitKey="agentImageFit" f={f} set={set} def="cover" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Agent kicker label" f={f} set={set} base="kickerLabel" segments={[{ key: 'kickerLabel' }]} />
          <RichFieldGroup label="Features section label" f={f} set={set} base="featuresLabel" segments={[{ key: 'featuresLabel' }]} />
          <RichFieldGroup label="Benefits section label" f={f} set={set} base="benefitsLabel" segments={[{ key: 'benefitsLabel' }]} />
        </div>
      );
    }

    case 'slick-dms-voice-agents': {
      type VoiceAgent = { imageUrl?: string; imageAlt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Logo (top-left badge)" {...imageI18nProps(f, "logoUrl", update)} />
          <TextInput label="Logo alt" value={f.logoAlt as string ?? ''} onChange={(v) => set('logoAlt', v)} />
          <FitSelect label="Logo fit" fitKey="logoImageFit" f={f} set={set} def="cover" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Panel Title Pre" f={f} set={set} base="panelTitlePre" segments={[{ key: 'panelTitlePre' }]} />
          <RichFieldGroup label="Panel Title Bold" f={f} set={set} base="panelTitleBold" segments={[{ key: 'panelTitleBold' }]} />
          <RichFieldGroup label="Panel subtitle" f={f} set={set} base="panelSub" segments={[{ key: 'panelSub' }]} />
          <ImageField label="Panel background image (fills whole panel; defaults to black if empty)" {...imageI18nProps(f, "panelBgUrl", update)} />
          <ImageField label="Center mic image (defaults to a mic icon if empty)" {...imageI18nProps(f, "micImageUrl", update)} />
          <TextInput label="Mic image alt" value={f.micImageAlt as string ?? ''} onChange={(v) => set('micImageAlt', v)} />
          <FitSelect label="Mic image fit" fitKey="micImageFit" f={f} set={set} def="contain" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<VoiceAgent>
            label="Agent card images (exactly 4 — top-left, top-right, bottom-left, bottom-right)"
            items={(f.agents as VoiceAgent[]) ?? []}
            onChange={(v) => set('agents', v)}
            newItem={() => ({ imageUrl: '', imageAlt: '' })}
            itemPreview={(a) => a.imageAlt || '(untitled)'}
            renderItem={(a, u) => (
              <div className="space-y-2">
                <ImageField label="Agent card image (title + tag + photo, pre-composed)" {...imageI18nProps(a, "imageUrl", (p) => u({ ...a, ...p }))} />
                <TextInput label="Image alt" value={a.imageAlt ?? ''} onChange={(v) => u({ ...a, imageAlt: v })} />
              </div>
            )}
          />
          <FitSelect label="Agent card image fit (all 4)" fitKey="agentImageFit" f={f} set={set} def="fill" />
        </div>
      );
    }

    case 'slick-dms-faq': {
      type DmsFaqItem = { q?: string; a?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DmsFaqItem>
            label="FAQ items"
            items={(f.faqs as DmsFaqItem[]) ?? []}
            onChange={(v) => set('faqs', v)}
            newItem={() => ({ q: 'New question?', a: 'Answer goes here.' })}
            itemPreview={(item) => item.q || '(untitled)'}
            renderItem={(item, u) => (
              <div className="space-y-2">
                <RichTextInput label="Question" {...richItemProps(item, 'q', u)} />
                <RichTextInput label="Answer" {...richItemProps(item, 'a', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-dms-deploy-metrics': {
      type DeployMetric = { value?: number; unit?: string; label?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Rest" f={f} set={set} base="headingRest" segments={[{ key: 'headingRest' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DeployMetric>
            label="Metrics (4 supported)"
            items={(f.metrics as DeployMetric[]) ?? []}
            onChange={(v) => set('metrics', v)}
            newItem={() => ({ value: 0, unit: 'hrs', label: 'New Metric' })}
            itemPreview={(m) => m.label || '(untitled)'}
            renderItem={(m, u) => (
              <div className="space-y-2">
                <TextInput label="Value" value={String(m.value ?? 0)} onChange={(v) => u({ ...m, value: parseInt(v) || 0 })} />
                <RichTextInput label="Unit (min / hrs)" {...richItemProps(m, 'unit', u)} />
                <RichTextInput label="Label" {...richItemProps(m, 'label', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-dms-cta':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill eyebrow text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="primaryCtaLabel" segments={[{ key: 'primaryCtaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <RichFieldGroup label="Secondary CTA label" f={f} set={set} base="secondaryCtaLabel" segments={[{ key: 'secondaryCtaLabel' }]} />
          <TextInput label="Secondary CTA URL" value={f.secondaryCtaUrl as string ?? ''} onChange={(v) => set('secondaryCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Trust tagline" f={f} set={set} base="trustText" segments={[{ key: 'trustText' }]} />
        </div>
      );

    case 'slick-dms-guarantee':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill / eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Title Pre" f={f} set={set} base="titlePre" segments={[{ key: 'titlePre' }]} />
          <RichFieldGroup label="Title Accent" f={f} set={set} base="titleAccent" segments={[{ key: 'titleAccent' }]} />
          <RichFieldGroup label="Heading suffix (white)" f={f} set={set} base="titlePost" segments={[{ key: 'titlePost' }]} />
          <RichFieldGroup label="Body copy" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Stamp percentage text" f={f} set={set} base="stampPercent" segments={[{ key: 'stampPercent' }]} />
          <RichFieldGroup label="Stamp label text" f={f} set={set} base="stampLabel" segments={[{ key: 'stampLabel' }]} />
          <ImageField label="Stamp image (replaces the animated stamp when set)" {...imageI18nProps(f, "stampImageUrl", update)} />
          <TextInput label="Stamp image alt" value={f.stampImageAlt as string ?? ''} onChange={(v) => set('stampImageAlt', v)} />
          <ImageWHFit label="Stamp image size" widthKey="stampImageWidthPercent" widthUnit="%" widthDef={100} aspectRatioKey="stampImageAspectRatio" fitKey="stampImageFit" fitDef="cover" f={f} set={set} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA button label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA button URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-dms-integrations-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Main screenshot" {...imageI18nProps(f, "screenshotUrl", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Floating card 1" {...imageI18nProps(f, "card1Img", update)} />
          <ImageField label="Floating card 2" {...imageI18nProps(f, "card2Img", update)} />
        </div>
      );

    case 'slick-dms-integrations':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow label" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Lede paragraph" f={f} set={set} base="lede" segments={[{ key: 'lede' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Integration 1 letter" f={f} set={set} base="integration1Letter" segments={[{ key: 'integration1Letter' }]} />
          <RichFieldGroup label="Integration 1 name" f={f} set={set} base="integration1Name" segments={[{ key: 'integration1Name' }]} />
          <RichFieldGroup label="Integration 1 sub" f={f} set={set} base="integration1Sub" segments={[{ key: 'integration1Sub' }]} />
          <RichFieldGroup label="Integration 2 letter" f={f} set={set} base="integration2Letter" segments={[{ key: 'integration2Letter' }]} />
          <RichFieldGroup label="Integration 2 name" f={f} set={set} base="integration2Name" segments={[{ key: 'integration2Name' }]} />
          <RichFieldGroup label="Integration 2 sub" f={f} set={set} base="integration2Sub" segments={[{ key: 'integration2Sub' }]} />
          <RichFieldGroup label="Sync status text" f={f} set={set} base="syncText" segments={[{ key: 'syncText' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="KPI 1 label" f={f} set={set} base="kpi1Label" segments={[{ key: 'kpi1Label' }]} />
          <RichFieldGroup label="KPI 1 value" f={f} set={set} base="kpi1Value" segments={[{ key: 'kpi1Value' }]} />
          <RichFieldGroup label="KPI 1 unit" f={f} set={set} base="kpi1Unit" segments={[{ key: 'kpi1Unit' }]} />
          <RichFieldGroup label="KPI 2 label" f={f} set={set} base="kpi2Label" segments={[{ key: 'kpi2Label' }]} />
          <RichFieldGroup label="KPI 2 value" f={f} set={set} base="kpi2Value" segments={[{ key: 'kpi2Value' }]} />
          <RichFieldGroup label="KPI 2 unit" f={f} set={set} base="kpi2Unit" segments={[{ key: 'kpi2Unit' }]} />
          <RichFieldGroup label="KPI 3 label" f={f} set={set} base="kpi3Label" segments={[{ key: 'kpi3Label' }]} />
          <RichFieldGroup label="KPI 3 value" f={f} set={set} base="kpi3Value" segments={[{ key: 'kpi3Value' }]} />
          <RichFieldGroup label="Chart label" f={f} set={set} base="chartLabel" segments={[{ key: 'chartLabel' }]} />
        </div>
      );

    case 'slick-eb2b-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading suffix" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <RichFieldGroup label="Trust text" f={f} set={set} base="trustText" segments={[{ key: 'trustText' }]} />
        </div>
      );

    case 'slick-eb2b-hero-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading line 1" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading line 2 prefix" f={f} set={set} base="headingIn" segments={[{ key: 'headingIn' }]} />
          <RichFieldGroup label="Heading gradient word" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Built-in hero art</p>
          <NumberInput label="Centre phone width (px)" value={(f.phoneWidth as number) ?? 254} onChange={(v) => set('phoneWidth', v)} />
          <FitSelect label="Centre phone fit" fitKey="phoneFit" f={f} set={set} def="fill" />
          <FitSelect label="Floating frames fit" fitKey="frameFit" f={f} set={set} def="fill" />
        </div>
      );

    case 'slick-sfa-hero-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading line 1" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading Line2 Pre" f={f} set={set} base="headingLine2Pre" segments={[{ key: 'headingLine2Pre' }]} />
          <RichFieldGroup label="Heading Line2 Grad" f={f} set={set} base="headingLine2Grad" segments={[{ key: 'headingLine2Grad' }]} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Left card 1 (top)" {...imageI18nProps(f, "imgCl1", update)} />
          <ImageField label="Left card 2 (middle)" {...imageI18nProps(f, "imgCl2", update)} />
          <ImageField label="Left card 3 (bottom)" {...imageI18nProps(f, "imgCl3", update)} />
          <ImageField label="Centre phone" {...imageI18nProps(f, "imgPhone", update)} />
          <ImageField label="Right card 1 (top)" {...imageI18nProps(f, "imgCr1", update)} />
          <ImageField label="Right card 2 (middle)" {...imageI18nProps(f, "imgCr2", update)} />
          <ImageField label="Right card 3 (bottom)" {...imageI18nProps(f, "imgCr3", update)} />
        </div>
      );

    case 'slick-eb2b-scale': {
      type ScaleStat = { num?: string; label?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<ScaleStat>
            label="Stats (4 cards)"
            items={(f.stats as ScaleStat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ num: '0+', label: 'New stat' })}
            itemPreview={(s) => s.label || '(untitled)'}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'num', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'label', u)} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ img?: string; alt?: string; text?: string; sub?: string }>
            label="Logos"
            items={(f.logos as { img?: string; alt?: string; text?: string; sub?: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ img: '', alt: '', text: 'Brand', sub: '' })}
            itemPreview={(it) => it.alt || it.text || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <ImageField label="Logo image (overrides text)" {...imageI18nProps(it, "img", (p) => u({ ...it, ...p }))} />
                <TextInput label="Alt text" value={it.alt ?? ''} onChange={(v) => u({ ...it, alt: v })} />
                <RichTextInput label="Text fallback" {...richItemProps(it, 'text', u)} />
                <RichTextInput label="Sub (optional)" {...richItemProps(it, 'sub', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-eb2b-why':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad1" f={f} set={set} base="headingGrad1" segments={[{ key: 'headingGrad1' }]} />
          <RichFieldGroup label="Heading Mid" f={f} set={set} base="headingMid" segments={[{ key: 'headingMid' }]} />
          <RichFieldGroup label="Heading Grad2" f={f} set={set} base="headingGrad2" segments={[{ key: 'headingGrad2' }]} />
          <RichFieldGroup label="Body copy" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Video URL (YouTube embed or direct)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Video thumbnail" {...imageI18nProps(f, "videoThumb", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Media Title" f={f} set={set} base="mediaTitle" segments={[{ key: 'mediaTitle' }]} />
          <RichFieldGroup label="Media Title Highlight" f={f} set={set} base="mediaTitleHighlight" segments={[{ key: 'mediaTitleHighlight' }]} />
          <RichFieldGroup label="Media card title suffix" f={f} set={set} base="mediaTitlePost" segments={[{ key: 'mediaTitlePost' }]} />
          <Repeater<{ n: string; l: string }>
            label="Media stats"
            items={(f.mediaStats as { n: string; l: string }[]) ?? []}
            onChange={(v) => set('mediaStats', v)}
            newItem={() => ({ n: '0+', l: 'Label' })}
            itemPreview={(it) => `${it.n} ${it.l}`}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(it, 'n', u)} />
                <RichTextInput label="Label" {...richItemProps(it, 'l', u)} />
              </div>
            )}
          />
          <RichFieldGroup label="Media footer brand" f={f} set={set} base="mediaFooterBrand" segments={[{ key: 'mediaFooterBrand' }]} />
          <RichFieldGroup label="Media footer sub" f={f} set={set} base="mediaFooterSub" segments={[{ key: 'mediaFooterSub' }]} />
        </div>
      );

    case 'slick-eb2b-features':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ title: string; body: string; stat: string; image?: string }>
            label="Features"
            items={(f.features as { title: string; body: string; stat: string; image?: string }[]) ?? []}
            onChange={(v) => set('features', v)}
            newItem={() => ({ title: 'New feature', body: 'Description', stat: '[ Impact stat ]', image: '' })}
            itemPreview={(it) => it.title || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(it, 'body', u)} />
                <RichTextInput label="Stat" {...richItemProps(it, 'stat', u)} />
                <ImageField label="Card image (overrides coded mockup)" {...imageI18nProps(it, "image", (p) => u({ ...it, ...p }))} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-eb2b-integrations':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill badge text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Body copy" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Hub centre text" f={f} set={set} base="hubText" segments={[{ key: 'hubText' }]} />
          <Repeater<{ label?: string; image?: string }>
            label="Satellite nodes (max 6)"
            items={(f.nodes as { label?: string; image?: string }[]) ?? []}
            onChange={(v) => set('nodes', v)}
            newItem={() => ({ label: '', image: '' })}
            itemPreview={(it) => it.label || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Label (shown if no image)" {...richItemProps(it, 'label', u)} />
                <ImageField label="Logo image" {...imageI18nProps(it, "image", (p) => u({ ...it, ...p }))} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-eb2b-impact':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow / pill text" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ title: string; body: string; image?: string; metricValue: string; metricLabel: string; metricSub: string; stat: string; statLabel?: string; statSub?: string }>
            label="Cards"
            items={(f.cards as { title: string; body: string; image?: string; metricValue: string; metricLabel: string; metricSub: string; stat: string; statLabel?: string; statSub?: string }[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'New card', body: 'Description', image: '', metricValue: '0%', metricLabel: 'Metric', metricSub: 'context', stat: 'Stat', statLabel: '', statSub: '' })}
            itemPreview={(it) => it.title || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(it, 'body', u)} />
                <ImageField label="Card image" {...imageI18nProps(it, "image", (p) => u({ ...it, ...p }))} />
                <RichTextInput label="Metric 1 value" {...richItemProps(it, 'metricValue', u)} />
                <RichTextInput label="Metric 1 label" {...richItemProps(it, 'metricLabel', u)} />
                <RichTextInput label="Metric 1 sub" {...richItemProps(it, 'metricSub', u)} />
                <RichTextInput label="Metric 2 value" {...richItemProps(it, 'stat', u)} />
                <RichTextInput label="Metric 2 label" {...richItemProps(it, 'statLabel', u)} />
                <RichTextInput label="Metric 2 sub" {...richItemProps(it, 'statSub', u)} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-eb2b-deployments':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow / pill text" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading suffix" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Body copy" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ value: string; label: string }>
            label="Stats (3 boxes)"
            items={(f.stats as { value: string; label: string }[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '0+', label: 'Metric' })}
            itemPreview={(it) => it.value || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value" {...richItemProps(it, 'value', u)} />
                <RichTextInput label="Label" {...richItemProps(it, 'label', u)} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Right side image" {...imageI18nProps(f, "sectionImg", update)} />
        </div>
      );

    case 'slick-sc-faq-explorer':
      // Hero copy only — the 382 questions always render from faqExplorerData.ts
      // on the self-serve site (never CMS data), so there is no FAQ list to edit here.
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading (dark part)" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading accent (teal)" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Subheading — normal start" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Subheading — bold word" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Subheading — normal end" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Search placeholder" value={f.searchPlaceholder as string ?? ''} onChange={(v) => set('searchPlaceholder', v)} />
        </div>
      );

    case 'slick-eb2b-faq':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ q: string; a: string }>
            label="FAQs"
            items={(f.faqs as { q: string; a: string }[]) ?? []}
            onChange={(v) => set('faqs', v)}
            newItem={() => ({ q: 'New question?', a: 'Answer here.' })}
            itemPreview={(it) => it.q || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Question" {...richItemProps(it, 'q', u)} />
                <RichTextInput label="Answer" {...richItemProps(it, 'a', u)} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label={'"View more" button label'} f={f} set={set} base="viewMoreLabel" segments={[{ key: 'viewMoreLabel' }]} />
          <PageLinkField label={'"View more" button URL (opens in a new tab)'} value={f.viewMoreUrl as string ?? ''} onChange={(v) => set('viewMoreUrl', v)} />
        </div>
      );

    case 'slick-contact-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Sub line 1" f={f} set={set} base="subLine1" segments={[{ key: 'subLine1' }]} />
          <RichFieldGroup label="Sub Line2 Pre" f={f} set={set} base="subLine2Pre" segments={[{ key: 'subLine2Pre' }]} />
          <RichFieldGroup label="Sub Line2 Bold" f={f} set={set} base="subLine2Bold" segments={[{ key: 'subLine2Bold' }]} />
          <RichFieldGroup label="Sub Line2 Tail" f={f} set={set} base="subLine2Tail" segments={[{ key: 'subLine2Tail' }]} />
          <RichFieldGroup label="Trusted by label" f={f} set={set} base="trustedLabel" segments={[{ key: 'trustedLabel' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Stat 1 value" f={f} set={set} base="stat1Val" segments={[{ key: 'stat1Val' }]} />
          <RichFieldGroup label="Stat 1 label" f={f} set={set} base="stat1Label" segments={[{ key: 'stat1Label' }]} />
          <RichFieldGroup label="Stat 2 value" f={f} set={set} base="stat2Val" segments={[{ key: 'stat2Val' }]} />
          <RichFieldGroup label="Stat 2 label" f={f} set={set} base="stat2Label" segments={[{ key: 'stat2Label' }]} />
          <RichFieldGroup label="Stat 3 value" f={f} set={set} base="stat3Val" segments={[{ key: 'stat3Val' }]} />
          <RichFieldGroup label="Stat 3 label" f={f} set={set} base="stat3Label" segments={[{ key: 'stat3Label' }]} />
          <RichFieldGroup label="Stat 4 value" f={f} set={set} base="stat4Val" segments={[{ key: 'stat4Val' }]} />
          <RichFieldGroup label="Stat 4 label" f={f} set={set} base="stat4Label" segments={[{ key: 'stat4Label' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Logo 1" {...imageI18nProps(f, "logo1", update)} />
          <ImageField label="Logo 2" {...imageI18nProps(f, "logo2", update)} />
          <ImageField label="Logo 3" {...imageI18nProps(f, "logo3", update)} />
          <ImageField label="Logo 4" {...imageI18nProps(f, "logo4", update)} />
          <ImageField label="Logo 5" {...imageI18nProps(f, "logo5", update)} />
          <ImageField label="Logo 6" {...imageI18nProps(f, "logo6", update)} />
          <ImageField label="Logo 7" {...imageI18nProps(f, "logo7", update)} />
          <ImageField label="Logo 8" {...imageI18nProps(f, "logo8", update)} />
        </div>
      );

    case 'slick-experience-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Line1" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Heading line 2 suffix (dark)" f={f} set={set} base="headingLine2Mid" segments={[{ key: 'headingLine2Mid' }]} />
          <RichFieldGroup label="Heading line 3 (dark)" f={f} set={set} base="headingLine3" segments={[{ key: 'headingLine3' }]} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
        </div>
      );

    case 'slick-experience-video':
      return (
        <div className="space-y-4">
          <TextInput label="Video URL (mp4)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Thumbnail URL (optional)" {...imageI18nProps(f, "thumbnailUrl", update)} />
        </div>
      );

    case 'slick-experience-testimonials':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <Repeater<{ thumbnail: string; videoUrl: string; name: string; role: string; company: string; logoUrl: string; logoAlt: string }>
            label="Testimonials"
            items={(f.testimonials as { thumbnail: string; videoUrl: string; name: string; role: string; company: string; logoUrl: string; logoAlt: string }[]) ?? []}
            onChange={(v) => set('testimonials', v)}
            newItem={() => ({ thumbnail: '', videoUrl: '', name: '', role: '', company: '', logoUrl: '', logoAlt: '' })}
            itemPreview={(it) => it.name || 'Testimonial'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Thumbnail URL" {...imageI18nProps(it, "thumbnail", (p) => u({ ...it, ...p }))} />
                <TextInput label="Video URL (mp4)" value={it.videoUrl} onChange={(x) => u({ ...it, videoUrl: x })} />
                <RichTextInput label="Name" {...richItemProps(it, 'name', u)} />
                <RichTextInput label="Role" {...richItemProps(it, 'role', u)} />
                <RichTextInput label="Company" {...richItemProps(it, 'company', u)} />
                <ImageField label="Company logo URL" {...imageI18nProps(it, "logoUrl", (p) => u({ ...it, ...p }))} />
                <TextInput label="Logo alt text" value={it.logoAlt} onChange={(x) => u({ ...it, logoAlt: x })} />
              </>
            )}
          />
          <RichFieldGroup label="Logos strip label" f={f} set={set} base="logosLabel" segments={[{ key: 'logosLabel' }]} />
          <Repeater<{ url: string; alt: string }>
            label="Leader logos"
            items={(f.logos as { url: string; alt: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ url: '', alt: '' })}
            itemPreview={(it) => it.alt || 'Logo'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Logo URL" {...imageI18nProps(it, "url", (p) => u({ ...it, ...p }))} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-experience-topics':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <Repeater<{ icon: string; iconShape: string; title: string }>
            label="Topics"
            items={(f.topics as { icon: string; iconShape: string; title: string }[]) ?? []}
            onChange={(v) => set('topics', v)}
            newItem={() => ({ icon: '✦', iconShape: 'circle', title: '' })}
            itemPreview={(it) => it.title?.slice(0, 40) || 'Topic'}
            renderItem={(it, u) => (
              <>
                <TextInput label="Icon (emoji or short text)" value={it.icon} onChange={(x) => u({ ...it, icon: x })} />
                <select
                  value={it.iconShape}
                  onChange={(e) => u({ ...it, iconShape: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13 }}
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="diamond">Diamond</option>
                </select>
                <RichTextInput label="Title text" {...richItemProps(it, 'title', u)} />
              </>
            )}
          />
          <RichFieldGroup label="CTA label (**bold** supported)" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-exp-two-ways':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Panel 1 — Immersive Sessions</p>
          <RichFieldGroup label="Tab label" f={f} set={set} base="p1Tab" segments={[{ key: 'p1Tab' }]} />
          <Repeater<{ src: string }>
            label="Photos (auto-scroll)"
            items={(f.p1Images as { src: string }[]) ?? []}
            onChange={(v) => set('p1Images', v)}
            newItem={() => ({ src: '' })}
            itemPreview={(it) => (it.src ? it.src.split('/').pop() ?? 'Photo' : 'Photo')}
            renderItem={(it, u) => (
              <ImageField label="Photo" value={it.src} onChange={(x) => u({ ...it, src: x })} />
            )}
          />
          <RichFieldGroup label="Body text (**bold**=teal)" f={f} set={set} base="p1Body" segments={[{ key: 'p1Body' }]} />
          <RichFieldGroup label="Bullet 1" f={f} set={set} base="p1B1" segments={[{ key: 'p1B1' }]} />
          <RichFieldGroup label="Bullet 2" f={f} set={set} base="p1B2" segments={[{ key: 'p1B2' }]} />
          <RichFieldGroup label="Bullet 3" f={f} set={set} base="p1B3" segments={[{ key: 'p1B3' }]} />
          <RichFieldGroup label="Bullet 4" f={f} set={set} base="p1B4" segments={[{ key: 'p1B4' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Panel 2 — Leadership Workshops</p>
          <RichFieldGroup label="Tab label" f={f} set={set} base="p2Tab" segments={[{ key: 'p2Tab' }]} />
          <Repeater<{ src: string }>
            label="Photos (auto-scroll)"
            items={(f.p2Images as { src: string }[]) ?? []}
            onChange={(v) => set('p2Images', v)}
            newItem={() => ({ src: '' })}
            itemPreview={(it) => (it.src ? it.src.split('/').pop() ?? 'Photo' : 'Photo')}
            renderItem={(it, u) => (
              <ImageField label="Photo" value={it.src} onChange={(x) => u({ ...it, src: x })} />
            )}
          />
          <RichFieldGroup label="Body text (**bold**=teal)" f={f} set={set} base="p2Body" segments={[{ key: 'p2Body' }]} />
          <RichFieldGroup label="Bullet 1" f={f} set={set} base="p2B1" segments={[{ key: 'p2B1' }]} />
          <RichFieldGroup label="Bullet 2" f={f} set={set} base="p2B2" segments={[{ key: 'p2B2' }]} />
          <RichFieldGroup label="Bullet 3" f={f} set={set} base="p2B3" segments={[{ key: 'p2B3' }]} />
          <RichFieldGroup label="Bullet 4" f={f} set={set} base="p2B4" segments={[{ key: 'p2B4' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label (**bold**=dark)" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-exp-ai-stack':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          {([1,2,3,4,5,6] as const).map(n => (
            <div key={n} className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Card {n}</p>
              <TextInput label="Image URL" value={f[`c${n}Img`] as string ?? ''} onChange={(v) => set(`c${n}Img`, v)} />
              <TextInput label="Video URL" value={f[`c${n}Video`] as string ?? ''} onChange={(v) => set(`c${n}Video`, v)} />
              <TextInput label="Title" value={f[`c${n}Title`] as string ?? ''} onChange={(v) => set(`c${n}Title`, v)} />
              <Textarea label="Description" value={f[`c${n}Body`] as string ?? ''} onChange={(v) => set(`c${n}Body`, v)} />
              {n < 6 && <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />}
            </div>
          ))}
        </div>
      );

    case 'slick-blogs-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Heading Line2" f={f} set={set} base="headingLine2" segments={[{ key: 'headingLine2' }]} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
        </div>
      );

    case 'slick-careers-life':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <Repeater<{ url: string; alt: string; tall: boolean }>
            label="Photos"
            items={(f.photos as { url: string; alt: string; tall: boolean }[]) ?? []}
            onChange={(v) => set('photos', v)}
            newItem={() => ({ url: '', alt: '', tall: false })}
            itemPreview={(it) => it.alt || 'Photo'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Photo URL" {...imageI18nProps(it, "url", (p) => u({ ...it, ...p }))} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }}>
                  <input type="checkbox" checked={!!it.tall} onChange={(e) => u({ ...it, tall: e.target.checked })} />
                  Tall (portrait)
                </label>
              </>
            )}
          />
        </div>
      );

    case 'slick-careers-awards':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading prefix" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Tail" f={f} set={set} base="headingTail" segments={[{ key: 'headingTail' }]} />
          <Repeater<{ imgUrl: string; imgAlt: string; title: string }>
            label="Awards"
            items={(f.awards as { imgUrl: string; imgAlt: string; title: string }[]) ?? []}
            onChange={(v) => set('awards', v)}
            newItem={() => ({ imgUrl: '', imgAlt: '', title: '' })}
            itemPreview={(it) => it.title || 'Award'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Award image URL" {...imageI18nProps(it, "imgUrl", (p) => u({ ...it, ...p }))} />
                <TextInput label="Alt text" value={it.imgAlt} onChange={(x) => u({ ...it, imgAlt: x })} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
              </>
            )}
          />
        </div>
      );

    case 'slick-careers-process':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <p className="text-xs text-slate-400">Steps use built-in defaults. To customise, edit the component directly.</p>
        </div>
      );

    case 'slick-careers-expect':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <p className="text-xs text-slate-400">Cards use built-in defaults. To customise, edit the component directly.</p>
        </div>
      );

    case 'slick-careers-culture':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <p className="text-xs text-slate-400">Principle cards use built-in defaults. To customise, edit the component directly.</p>
        </div>
      );

    case 'slick-careers-about':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Body (use **bold** for bold words)" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
        </div>
      );

    case 'slick-help-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading (dark part)" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading accent (teal)" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Subheading — normal start" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Subheading — bold word" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Subheading — normal end" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Search placeholder" value={f.searchPlaceholder as string ?? ''} onChange={(v) => set('searchPlaceholder', v)} />
          <TextInput label="Search results URL (optional — Enter navigates to ?q=…)" value={f.searchUrl as string ?? ''} onChange={(v) => set('searchUrl', v)} />
        </div>
      );

    case 'slick-careers-hero':
    case 'slick-ab-hero-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading line 1 (dark)" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading line 2 (teal)" f={f} set={set} base="headingLine2" segments={[{ key: 'headingLine2' }]} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Stat 1 value" f={f} set={set} base="stat1Val" segments={[{ key: 'stat1Val' }]} />
          <RichFieldGroup label="Stat 1 label" f={f} set={set} base="stat1Label" segments={[{ key: 'stat1Label' }]} />
          <RichFieldGroup label="Stat 2 value" f={f} set={set} base="stat2Val" segments={[{ key: 'stat2Val' }]} />
          <RichFieldGroup label="Stat 2 label" f={f} set={set} base="stat2Label" segments={[{ key: 'stat2Label' }]} />
          <RichFieldGroup label="Stat 3 value" f={f} set={set} base="stat3Val" segments={[{ key: 'stat3Val' }]} />
          <RichFieldGroup label="Stat 3 label" f={f} set={set} base="stat3Label" segments={[{ key: 'stat3Label' }]} />
          <RichFieldGroup label="Stat 4 value" f={f} set={set} base="stat4Val" segments={[{ key: 'stat4Val' }]} />
          <RichFieldGroup label="Stat 4 label" f={f} set={set} base="stat4Label" segments={[{ key: 'stat4Label' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Brands section label" f={f} set={set} base="brandsLabel" segments={[{ key: 'brandsLabel' }]} />
          <ImageField label="Logo 1" {...imageI18nProps(f, "logo1", update)} />
          <ImageField label="Logo 2" {...imageI18nProps(f, "logo2", update)} />
          <ImageField label="Logo 3" {...imageI18nProps(f, "logo3", update)} />
          <ImageField label="Logo 4" {...imageI18nProps(f, "logo4", update)} />
          <ImageField label="Logo 5" {...imageI18nProps(f, "logo5", update)} />
          <ImageField label="Logo 6" {...imageI18nProps(f, "logo6", update)} />
          <ImageField label="Logo 7" {...imageI18nProps(f, "logo7", update)} />
          <ImageField label="Logo 8" {...imageI18nProps(f, "logo8", update)} />
        </div>
      );

    case 'slick-clients-testimonials':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <p className="text-xs text-slate-400">Testimonials use built-in defaults. To customise, edit the component directly.</p>
        </div>
      );

    case 'slick-clients-grid':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle (use **bold** for bold)" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <Repeater<{ url: string; alt: string }>
            label="Client logos"
            items={(f.logos as { url: string; alt: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ url: '', alt: '' })}
            itemPreview={(it) => it.alt || 'Logo'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Logo image URL" {...imageI18nProps(it, "url", (p) => u({ ...it, ...p }))} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-clients-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Badge" f={f} set={set} base="headingBadge" segments={[{ key: 'headingBadge' }]} />
          <RichFieldGroup label="Heading Post" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Stat 1 value" f={f} set={set} base="stat1Val" segments={[{ key: 'stat1Val' }]} />
          <RichFieldGroup label="Stat 1 label" f={f} set={set} base="stat1Label" segments={[{ key: 'stat1Label' }]} />
          <RichFieldGroup label="Stat 2 value" f={f} set={set} base="stat2Val" segments={[{ key: 'stat2Val' }]} />
          <RichFieldGroup label="Stat 2 label" f={f} set={set} base="stat2Label" segments={[{ key: 'stat2Label' }]} />
          <RichFieldGroup label="Stat 3 value" f={f} set={set} base="stat3Val" segments={[{ key: 'stat3Val' }]} />
          <RichFieldGroup label="Stat 3 label" f={f} set={set} base="stat3Label" segments={[{ key: 'stat3Label' }]} />
          <RichFieldGroup label="Stat 4 value" f={f} set={set} base="stat4Val" segments={[{ key: 'stat4Val' }]} />
          <RichFieldGroup label="Stat 4 label" f={f} set={set} base="stat4Label" segments={[{ key: 'stat4Label' }]} />
        </div>
      );

    case 'slick-ab-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading suffix" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <TextInput label="Hero image URL" value={f.heroImageUrl as string ?? ''} onChange={(v) => set('heroImageUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Hero image alt text" value={f.heroImageAlt as string ?? ''} onChange={(v) => set('heroImageAlt', v)} />
          <Repeater<{ label: string }>
            label="Pills"
            items={(f.pills as { label: string }[]) ?? []}
            onChange={(v) => set('pills', v)}
            newItem={() => ({ label: 'New pill' })}
            itemPreview={(it) => it.label || '(untitled)'}
            renderItem={(it, u) => (
              <RichTextInput label="Label" {...richItemProps(it, 'label', u)} />
            )}
          />
        </div>
      );

    case 'slick-ab-mission-vision':
      return (
        <div className="space-y-4">
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Mission row</p>
          <RichFieldGroup label="Mission pill" f={f} set={set} base="missionPill" segments={[{ key: 'missionPill' }]} />
          <RichFieldGroup label="Mission Heading Pre" f={f} set={set} base="missionHeadingPre" segments={[{ key: 'missionHeadingPre' }]} />
          <RichFieldGroup label="Mission Heading Teal" f={f} set={set} base="missionHeadingTeal" segments={[{ key: 'missionHeadingTeal' }]} />
          <RichFieldGroup label="Mission Heading Tail" f={f} set={set} base="missionHeadingTail" segments={[{ key: 'missionHeadingTail' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="missionSub" segments={[{ key: 'missionSub' }]} />
          <ImageField label="Mission image" {...imageI18nProps(f, "missionImg", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Vision row</p>
          <RichFieldGroup label="Vision pill" f={f} set={set} base="visionPill" segments={[{ key: 'visionPill' }]} />
          <RichFieldGroup label="Vision Heading Pre" f={f} set={set} base="visionHeadingPre" segments={[{ key: 'visionHeadingPre' }]} />
          <RichFieldGroup label="Vision Heading Teal" f={f} set={set} base="visionHeadingTeal" segments={[{ key: 'visionHeadingTeal' }]} />
          <RichFieldGroup label="Vision Heading Tail" f={f} set={set} base="visionHeadingTail" segments={[{ key: 'visionHeadingTail' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="visionSub" segments={[{ key: 'visionSub' }]} />
          <ImageField label="Vision image" {...imageI18nProps(f, "visionImg", update)} />
        </div>
      );

    case 'slick-ab-intro':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Paragraph — alternating normal / bold</p>
          <RichFieldGroup label="Text 1 (normal)" f={f} set={set} base="textSeg1" segments={[{ key: 'textSeg1' }]} />
          <RichFieldGroup label="Text 1 (bold)" f={f} set={set} base="textBold1" segments={[{ key: 'textBold1' }]} />
          <RichFieldGroup label="Text 2 (normal)" f={f} set={set} base="textSeg2" segments={[{ key: 'textSeg2' }]} />
          <RichFieldGroup label="Text 2 (bold)" f={f} set={set} base="textBold2" segments={[{ key: 'textBold2' }]} />
          <RichFieldGroup label="Text 3 (normal)" f={f} set={set} base="textSeg3" segments={[{ key: 'textSeg3' }]} />
          <RichFieldGroup label="Text 3 (bold)" f={f} set={set} base="textBold3" segments={[{ key: 'textBold3' }]} />
          <RichFieldGroup label="Text 4 (normal)" f={f} set={set} base="textSeg4" segments={[{ key: 'textSeg4' }]} />
          <RichFieldGroup label="Text 4 (bold)" f={f} set={set} base="textBold4" segments={[{ key: 'textBold4' }]} />
          <RichFieldGroup label="Text 5 (normal)" f={f} set={set} base="textSeg5" segments={[{ key: 'textSeg5' }]} />
          <RichFieldGroup label="Text 5 (bold)" f={f} set={set} base="textBold5" segments={[{ key: 'textBold5' }]} />
          <RichFieldGroup label="Text 6 (normal)" f={f} set={set} base="textSeg6" segments={[{ key: 'textSeg6' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Video poster" {...imageI18nProps(f, "posterUrl", update)} />
          <TextInput label="Video URL" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-ab-founder-banner':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Bold" f={f} set={set} base="headingBold" segments={[{ key: 'headingBold' }]} />
          <RichFieldGroup label="Heading suffix" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ text: string; cls?: string }>
            label="Logos"
            items={(f.logos as { text: string; cls?: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ text: 'Brand', cls: '' })}
            itemPreview={(it) => it.text || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Text" {...richItemProps(it, 'text', u)} />
                <RichTextInput label="CSS class (optional)" {...richItemProps(it, 'cls', u)} />
              </div>
            )}
          />
          <Repeater<{ pre?: string; n: string; l: string }>
            label="Stats"
            items={(f.stats as { pre?: string; n: string; l: string }[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ pre: '', n: '0+', l: 'Label' })}
            itemPreview={(it) => `${it.n} ${it.l}`}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Prefix (optional)" {...richItemProps(it, 'pre', u)} />
                <RichTextInput label="Number" {...richItemProps(it, 'n', u)} />
                <RichTextInput label="Label" {...richItemProps(it, 'l', u)} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-ab-stats':
      return (
        <div className="space-y-4">
          <Repeater<{num:string;label:string;sub:string}>
            label="Stats"
            items={(f.stats as {num:string;label:string;sub:string}[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ num: '0+', label: 'Metric', sub: 'Description' })}
            itemPreview={(it) => `${it.num} ${it.label}`}
            renderItem={(item, update) => (
              <>
                <RichTextInput label="Number" {...richItemProps(item, 'num', update)} />
                <RichTextInput label="Label" {...richItemProps(item, 'label', update)} />
                <RichTextInput label="Sub-label" {...richItemProps(item, 'sub', update)} />
              </>
            )}
          />
        </div>
      );

    case 'slick-ab-story':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Paragraph 1 (HTML)" f={f} set={set} base="p1" segments={[{ key: 'p1' }]} />
          <RichFieldGroup label="Paragraph 2 (HTML)" f={f} set={set} base="p2" segments={[{ key: 'p2' }]} />
          <RichFieldGroup label="Paragraph 3 (HTML)" f={f} set={set} base="p3" segments={[{ key: 'p3' }]} />
          <RichFieldGroup label="Quote text" f={f} set={set} base="quoteText" segments={[{ key: 'quoteText' }]} />
          <RichFieldGroup label="Quote author name" f={f} set={set} base="quoteAuthorName" segments={[{ key: 'quoteAuthorName' }]} />
          <RichFieldGroup label="Quote author title" f={f} set={set} base="quoteAuthorTitle" segments={[{ key: 'quoteAuthorTitle' }]} />
          <RichFieldGroup label="Author initials" f={f} set={set} base="quoteAuthorInitials" segments={[{ key: 'quoteAuthorInitials' }]} />
        </div>
      );

    case 'slick-ab-video':
      return (
        <div className="space-y-4">
          <TextInput label="Video URL" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <RichFieldGroup label="Aria label" f={f} set={set} base="ariaLabel" segments={[{ key: 'ariaLabel' }]} />
        </div>
      );

    case 'slick-ab-awards':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
        </div>
      );

    case 'slick-ab-founders-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Founder 1</p>
          <ImageField label="Photo" {...imageI18nProps(f, "f1Photo", update)} />
          <RichFieldGroup label="Name" f={f} set={set} base="f1Name" segments={[{ key: 'f1Name' }]} />
          <RichFieldGroup label="Role" f={f} set={set} base="f1Role" segments={[{ key: 'f1Role' }]} />
          <TextInput label="LinkedIn URL" value={f.f1LinkedIn as string ?? ''} onChange={(v) => set('f1LinkedIn', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Founder 2</p>
          <ImageField label="Photo" {...imageI18nProps(f, "f2Photo", update)} />
          <RichFieldGroup label="Name" f={f} set={set} base="f2Name" segments={[{ key: 'f2Name' }]} />
          <RichFieldGroup label="Role" f={f} set={set} base="f2Role" segments={[{ key: 'f2Role' }]} />
          <TextInput label="LinkedIn URL" value={f.f2LinkedIn as string ?? ''} onChange={(v) => set('f2LinkedIn', v)} />
        </div>
      );

    case 'slick-ab-founders':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
        </div>
      );

    case 'slick-ab-investors':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Show more label" f={f} set={set} base="toggleMoreLabel" segments={[{ key: 'toggleMoreLabel' }]} />
          <RichFieldGroup label="Show less label" f={f} set={set} base="toggleLessLabel" segments={[{ key: 'toggleLessLabel' }]} />
          <RichFieldGroup label="Biz team section label" f={f} set={set} base="bizTeamLabel" segments={[{ key: 'bizTeamLabel' }]} />
          <RichFieldGroup label="Tech team section label" f={f} set={set} base="techTeamLabel" segments={[{ key: 'techTeamLabel' }]} />
          <Repeater<{ name: string; role: string; prevRole: string; linkedinUrl?: string }>
            label="Biz team members"
            items={(f.bizTeam as { name: string; role: string; prevRole: string; linkedinUrl?: string }[]) ?? []}
            onChange={(v) => set('bizTeam', v)}
            newItem={() => ({ name: 'Name', role: 'Role', prevRole: 'Prev Role', linkedinUrl: '' })}
            itemPreview={(it) => it.name || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Name" {...richItemProps(it, 'name', u)} />
                <RichTextInput label="Role" {...richItemProps(it, 'role', u)} />
                <RichTextInput label="Previous role" {...richItemProps(it, 'prevRole', u)} />
                <TextInput label="LinkedIn URL" value={it.linkedinUrl ?? ''} onChange={(v) => u({ ...it, linkedinUrl: v })} />
              </div>
            )}
          />
          <Repeater<{ name: string; role: string; prevRole: string; linkedinUrl?: string }>
            label="Tech team members"
            items={(f.techTeam as { name: string; role: string; prevRole: string; linkedinUrl?: string }[]) ?? []}
            onChange={(v) => set('techTeam', v)}
            newItem={() => ({ name: 'Name', role: 'Role', prevRole: 'Prev Role', linkedinUrl: '' })}
            itemPreview={(it) => it.name || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Name" {...richItemProps(it, 'name', u)} />
                <RichTextInput label="Role" {...richItemProps(it, 'role', u)} />
                <RichTextInput label="Previous role" {...richItemProps(it, 'prevRole', u)} />
                <TextInput label="LinkedIn URL" value={it.linkedinUrl ?? ''} onChange={(v) => u({ ...it, linkedinUrl: v })} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-ab-investors-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          {([1,2,3,4,5,6,7,8,9,10] as const).map(n => (
            <div key={n} className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Investor {n}</p>
              <TextInput label="Name" value={f[`i${n}Name`] as string ?? ''} onChange={(v) => set(`i${n}Name`, v)} />
              <TextInput label="Role" value={f[`i${n}Role`] as string ?? ''} onChange={(v) => set(`i${n}Role`, v)} />
              <TextInput label="Photo URL" value={f[`i${n}Image`] as string ?? ''} onChange={(v) => set(`i${n}Image`, v)} />
              <TextInput label="LinkedIn URL" value={f[`i${n}LinkedIn`] as string ?? ''} onChange={(v) => set(`i${n}LinkedIn`, v)} />
              {n < 10 && <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />}
            </div>
          ))}
        </div>
      );

    case 'slick-ab-team-section':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Tech team label" f={f} set={set} base="techLabel" segments={[{ key: 'techLabel' }]} />
          <RichFieldGroup label="Biz team label" f={f} set={set} base="bizLabel" segments={[{ key: 'bizLabel' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Core Tech Team</p>
          {([1,2,3,4,5,6,7,8] as const).map(n => (
            <div key={n} className="space-y-2">
              <p className="text-xs text-slate-500">Tech Member {n}</p>
              <TextInput label="Name" value={f[`t${n}Name`] as string ?? ''} onChange={(v) => set(`t${n}Name`, v)} />
              <TextInput label="Role" value={f[`t${n}Role`] as string ?? ''} onChange={(v) => set(`t${n}Role`, v)} />
              <TextInput label="Photo URL" value={f[`t${n}Image`] as string ?? ''} onChange={(v) => set(`t${n}Image`, v)} />
              <TextInput label="LinkedIn URL" value={f[`t${n}LinkedIn`] as string ?? ''} onChange={(v) => set(`t${n}LinkedIn`, v)} />
              {n < 8 && <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />}
            </div>
          ))}
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Core Business Team</p>
          {([1,2,3,4,5,6,7,8,9] as const).map(n => (
            <div key={n} className="space-y-2">
              <p className="text-xs text-slate-500">Biz Member {n}</p>
              <TextInput label="Name" value={f[`b${n}Name`] as string ?? ''} onChange={(v) => set(`b${n}Name`, v)} />
              <TextInput label="Role" value={f[`b${n}Role`] as string ?? ''} onChange={(v) => set(`b${n}Role`, v)} />
              <TextInput label="Photo URL" value={f[`b${n}Image`] as string ?? ''} onChange={(v) => set(`b${n}Image`, v)} />
              <TextInput label="LinkedIn URL" value={f[`b${n}LinkedIn`] as string ?? ''} onChange={(v) => set(`b${n}LinkedIn`, v)} />
              {n < 9 && <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />}
            </div>
          ))}
        </div>
      );

    case 'slick-ab-journey':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Part1" f={f} set={set} base="headingPart1" segments={[{ key: 'headingPart1' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Heading Part2" f={f} set={set} base="headingPart2" segments={[{ key: 'headingPart2' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          {([1,2,3,4,5,6] as const).map(n => (
            <div key={n} className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Milestone {n}</p>
              <TextInput label="Year" value={f[`m${n}Year`] as string ?? ''} onChange={(v) => set(`m${n}Year`, v)} />
              <TextInput label="Title" value={f[`m${n}Title`] as string ?? ''} onChange={(v) => set(`m${n}Title`, v)} />
              <TextInput label="Subtitle" value={f[`m${n}Sub`] as string ?? ''} onChange={(v) => set(`m${n}Sub`, v)} />
              {n < 6 && <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />}
            </div>
          ))}
        </div>
      );

    case 'slick-ab-cta':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-sc-hero-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill Pre" f={f} set={set} base="pillPre" segments={[{ key: 'pillPre' }]} />
          <RichFieldGroup label="Pill Bold" f={f} set={set} base="pillBold" segments={[{ key: 'pillBold' }]} />
          <RichFieldGroup label="Pill Suffix" f={f} set={set} base="pillSuffix" segments={[{ key: 'pillSuffix' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Heading Line1" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Sub (use **text** for bold)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Center image" {...imageI18nProps(f, "imgCenter", update)} />
          <ImageField label="Center image — mobile (optional, shown ≤620px)" {...imageI18nProps(f, "imgCenterMobile", update)} />
        </div>
      );

    case 'slick-sc-hero-v3':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Heading Line1" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Center image" {...imageI18nProps(f, "imgCenter", update)} />
        </div>
      );

    case 'slick-sc-navbar': {
      type NavItem = { name: string; desc: string; href: string; iconKey: string; ai?: boolean; iconImage?: string; iconBg?: string };
      type NavCat = { key: string; label: string; sub: string; accent: string; iconKey: string; items: NavItem[]; flagship?: boolean };
      type PresenceItem = { name?: string; href?: string; desc?: string; iconEmoji?: string };
      return (
        <div className="space-y-4">
          <ImageField label="Logo image" {...imageI18nProps(f, "logoSrc", update)} />
          <RichFieldGroup label="CTA button label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA button URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solutions mega-menu</p>
          <RichFieldGroup label="Footer note" f={f} set={set} base="footerNote" segments={[{ key: 'footerNote' }]} />
          <RichFieldGroup label="Browse-all label" f={f} set={set} base="browseAllLabel" segments={[{ key: 'browseAllLabel' }]} />
          <TextInput label="Browse-all URL" value={f.browseAllUrl as string ?? ''} onChange={(v) => set('browseAllUrl', v)} />
          <Repeater<NavCat>
            label="Categories"
            items={(f.solutionCategories as NavCat[]) ?? []}
            onChange={(v) => set('solutionCategories', v)}
            newItem={() => ({ key: 'new', label: 'New Category', sub: 'Subtitle', accent: '#00a392', iconKey: 'users', items: [] })}
            itemPreview={(c) => c.label}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Label" {...richItemProps(c, 'label', u)} />
                <RichTextInput label="Subtitle" {...richItemProps(c, 'sub', u)} />
                <TextInput label="Accent hex (e.g. #00a392)" value={c.accent ?? ''} onChange={(v) => u({ ...c, accent: v })} />
                <TextInput label="Icon key (stack, users, handshake, scan, robot, puzzle, plug)" value={c.iconKey ?? ''} onChange={(v) => u({ ...c, iconKey: v })} />
                <Toggle label="Flagship (star badge + divider after)" value={Boolean(c.flagship)} onChange={(v) => u({ ...c, flagship: v })} />
                <Repeater<NavItem>
                  label="Items"
                  items={c.items ?? []}
                  onChange={(v) => u({ ...c, items: v })}
                  newItem={() => ({ name: 'New product', desc: 'Description', href: '#', iconKey: 'buildings', ai: true })}
                  itemPreview={(it) => it.name}
                  renderItem={(it, ui) => (
                    <div className="space-y-2">
                      <RichTextInput label="Name" {...richItemProps(it, 'name', ui)} />
                      <RichTextInput label="Description" {...richItemProps(it, 'desc', ui)} />
                      <PageLinkField label="Link URL" value={it.href ?? ''} onChange={(v) => ui({ ...it, href: v })} />
                      <TextInput label="Icon key" value={it.iconKey ?? ''} onChange={(v) => ui({ ...it, iconKey: v })} />
                      <ImageField label="Upload icon (overrides the icon key)" {...imageI18nProps(it, "iconImage", (p) => ui({ ...it, ...p }))} />
                      <ColorPicker label="Icon background (blank = default tint)" value={it.iconBg ?? ''} onChange={(v) => ui({ ...it, iconBg: v })} />
                      <Toggle label="Show AI badge" value={Boolean(it.ai)} onChange={(v) => ui({ ...it, ai: v })} />
                    </div>
                  )}
                />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Presence dropdown</p>
          <Repeater<PresenceItem>
            label="Countries"
            items={(f.globalPresence as PresenceItem[]) ?? []}
            onChange={(v) => set('globalPresence', v)}
            newItem={() => ({ name: 'Country Presence', href: '/global-presence/', desc: 'AI-native solutions', iconEmoji: '🌍' })}
            itemPreview={(g) => g.name || '(country)'}
            renderItem={(g, u) => (
              <div className="space-y-2">
                <TextInput label="Name" value={g.name ?? ''} onChange={(v) => u({ ...g, name: v })} placeholder="Nigeria Presence" />
                <TextInput label="Flag emoji" value={g.iconEmoji ?? ''} onChange={(v) => u({ ...g, iconEmoji: v })} placeholder="🇳🇬" />
                <TextInput label="Description" value={g.desc ?? ''} onChange={(v) => u({ ...g, desc: v })} placeholder="AI-native solutions in Nigeria" />
                <PageLinkField label="Link URL" value={g.href ?? ''} onChange={(v) => u({ ...g, href: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-footer':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="CTA eyebrow" f={f} set={set} base="ctaEyebrow" segments={[{ key: 'ctaEyebrow' }]} />
          <RichFieldGroup label="Cta Heading Pre" f={f} set={set} base="ctaHeadingPre" segments={[{ key: 'ctaHeadingPre' }]} />
          <RichFieldGroup label="Cta Heading Grad" f={f} set={set} base="ctaHeadingGrad" segments={[{ key: 'ctaHeadingGrad' }]} />
          <RichFieldGroup label="CTA heading suffix" f={f} set={set} base="ctaHeadingPost" segments={[{ key: 'ctaHeadingPost' }]} />
          <RichFieldGroup label="CTA subtext" f={f} set={set} base="ctaSub" segments={[{ key: 'ctaSub' }]} />
          <RichFieldGroup label="CTA button label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA button URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Email" f={f} set={set} base="email" segments={[{ key: 'email' }]} />
          <RichFieldGroup label="Phone" f={f} set={set} base="phone" segments={[{ key: 'phone' }]} />
          <RichFieldGroup label="Phone hours" f={f} set={set} base="phoneHours" segments={[{ key: 'phoneHours' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="LinkedIn URL" value={f.linkedinUrl as string ?? ''} onChange={(v) => set('linkedinUrl', v)} />
          <TextInput label="X / Twitter URL" value={f.xUrl as string ?? ''} onChange={(v) => set('xUrl', v)} />
          <TextInput label="Instagram URL" value={f.instagramUrl as string ?? ''} onChange={(v) => set('instagramUrl', v)} />
          <TextInput label="YouTube URL" value={f.youtubeUrl as string ?? ''} onChange={(v) => set('youtubeUrl', v)} />
          <TextInput label="Facebook URL" value={f.facebookUrl as string ?? ''} onChange={(v) => set('facebookUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Copyright text" f={f} set={set} base="copyright" segments={[{ key: 'copyright' }]} />
        </div>
      );

    case 'slick-sc-footer-v2': {
      type FLink = { label: string; href: string; badge?: string };
      type SLink = { icon: string; label: string; href: string };
      type DtcFeat = { text?: string; iconUrl?: string };
      type PGroup = { label: string; items: FLink[] };
      const linkColumn = (
        title: string, key: string, tKey: string, withBadge: boolean,
      ) => (
        <>
          <TextInput label={`${title} — column title`} value={f[tKey] as string ?? ''} onChange={(v) => set(tKey, v)} />
          <Repeater<FLink>
            label={`${title} links`}
            items={(f[key] as FLink[]) ?? []}
            onChange={(v) => set(key, v)}
            newItem={() => ({ label: 'New link', href: '#' })}
            itemPreview={(l) => l.label}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <RichTextInput label="Label" {...richItemProps(l, 'label', u)} />
                <PageLinkField label="URL" value={l.href ?? ''} onChange={(v) => u({ ...l, href: v })} />
                {withBadge && <TextInput label="Badge (new / hiring — optional)" value={l.badge ?? ''} onChange={(v) => u({ ...l, badge: v })} />}
              </div>
            )}
          />
        </>
      );
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-medium">Dare to Compare card</p>
          <ImageField label="Logo" {...imageI18nProps(f, "dtcLogo", update)} />
          <RichFieldGroup label="Heading (normal part)" f={f} set={set} base="dtcHeadingPre" segments={[{ key: 'dtcHeadingPre' }]} />
          <RichFieldGroup label="Heading (gold accent)" f={f} set={set} base="dtcHeadingAccent" segments={[{ key: 'dtcHeadingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="dtcSubtitle" segments={[{ key: 'dtcSubtitle' }]} />
          <Repeater<DtcFeat>
            label="Feature cards"
            items={(f.dtcFeatures as DtcFeat[]) ?? []}
            onChange={(v) => set('dtcFeatures', v)}
            newItem={() => ({ text: 'New feature (**bold** for teal)', iconUrl: '' })}
            itemPreview={(x) => x.text || '(empty)'}
            renderItem={(x, u) => (
              <div className="space-y-2">
                <TextInput label="Text (wrap **text** for teal bold)" value={x.text ?? ''} onChange={(v) => u({ ...x, text: v })} />
                <ImageField label="Icon" {...imageI18nProps(x, "iconUrl", (p) => u({ ...x, ...p }))} />
              </div>
            )}
          />
          <RichFieldGroup label="CTA button label" f={f} set={set} base="dtcCtaLabel" segments={[{ key: 'dtcCtaLabel' }]} />
          <TextInput label="CTA button URL" value={f.dtcCtaUrl as string ?? ''} onChange={(v) => set('dtcCtaUrl', v)} />
          <RichFieldGroup label="Footnote" f={f} set={set} base="dtcFootnote" segments={[{ key: 'dtcFootnote' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Logo URL" value={f.logoSrc as string ?? ''} onChange={(v) => set('logoSrc', v)} />
          <RichFieldGroup label="Tagline" f={f} set={set} base="tagline" segments={[{ key: 'tagline' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Phone" f={f} set={set} base="phone" segments={[{ key: 'phone' }]} />
          <RichFieldGroup label="Phone hours" f={f} set={set} base="phoneHours" segments={[{ key: 'phoneHours' }]} />
          <RichFieldGroup label="Email" f={f} set={set} base="email" segments={[{ key: 'email' }]} />
          <RichFieldGroup label="Email label" f={f} set={set} base="emailLabel" segments={[{ key: 'emailLabel' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs text-slate-500 font-medium">All Products mega-grid (grouped columns)</p>
          <Repeater<PGroup>
            label="Product groups"
            items={(f.productGroups as PGroup[]) ?? []}
            onChange={(v) => set('productGroups', v)}
            newItem={() => ({ label: 'New group', items: [{ label: 'New link', href: '#' }] })}
            itemPreview={(g) => g.label || '(group)'}
            renderItem={(g, u) => (
              <div className="space-y-2">
                <TextInput label="Group title" value={g.label ?? ''} onChange={(v) => u({ ...g, label: v })} />
                <Repeater<FLink>
                  label="Links"
                  items={g.items ?? []}
                  onChange={(v) => u({ ...g, items: v })}
                  newItem={() => ({ label: 'New link', href: '#' })}
                  itemPreview={(l) => l.label || '(link)'}
                  renderItem={(l, ul) => (
                    <div className="space-y-2">
                      <TextInput label="Label" value={l.label ?? ''} onChange={(v) => ul({ ...l, label: v })} />
                      <PageLinkField label="URL" value={l.href ?? ''} onChange={(v) => ul({ ...l, href: v })} />
                    </div>
                  )}
                />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          {linkColumn('Resources', 'resources', 'resourcesTitle', true)}
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          {linkColumn('Company', 'company', 'companyTitle', true)}
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Social — column title" f={f} set={set} base="socialTitle" segments={[{ key: 'socialTitle' }]} />
          <Repeater<SLink>
            label="Social links"
            items={(f.social as SLink[]) ?? []}
            onChange={(v) => set('social', v)}
            newItem={() => ({ icon: 'li', label: 'New', href: '#' })}
            itemPreview={(s) => s.label}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (li / ig / yt)" value={s.icon ?? ''} onChange={(v) => u({ ...s, icon: v })} />
                <RichTextInput label="Label" {...richItemProps(s, 'label', u)} />
                <TextInput label="URL" value={s.href ?? ''} onChange={(v) => u({ ...s, href: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Trust bar label" f={f} set={set} base="trustLabel" segments={[{ key: 'trustLabel' }]} />
          <Repeater<string>
            label="Trust pills"
            items={(f.trust as string[]) ?? []}
            onChange={(v) => set('trust', v)}
            newItem={() => 'New pill'}
            itemPreview={(t) => t || '(empty)'}
            renderItem={(t, u) => <TextInput label="Pill" value={t ?? ''} onChange={(v) => u(v)} />}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Copyright text" f={f} set={set} base="copyright" segments={[{ key: 'copyright' }]} />
          <Repeater<FLink>
            label="Legal links (bottom bar)"
            items={(f.legal as FLink[]) ?? []}
            onChange={(v) => set('legal', v)}
            newItem={() => ({ label: 'New link', href: '#' })}
            itemPreview={(l) => l.label}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <RichTextInput label="Label" {...richItemProps(l, 'label', u)} />
                <PageLinkField label="URL" value={l.href ?? ''} onChange={(v) => u({ ...l, href: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-offices-v2': {
      type OV2 = { city?: string; address?: string; icon?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<OV2>
            label="Offices"
            items={(f.offices as OV2[]) ?? []}
            onChange={(v) => set('offices', v)}
            newItem={() => ({ city: 'CITY', icon: 'dubai', address: 'Address here.' })}
            itemPreview={(o) => o.city || '(empty)'}
            renderItem={(o, u) => (
              <div className="space-y-2">
                <RichTextInput label="City name (uppercase)" {...richItemProps(o, 'city', u)} />
                <TextInput label="Icon (dubai/auckland/mumbai/brazil/mexico/gurgaon)" value={o.icon ?? ''} onChange={(v) => u({ ...o, icon: v })} />
                <RichTextInput label="Address" {...richItemProps(o, 'address', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-offices':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading line 1" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading Line2 Pre" f={f} set={set} base="headingLine2Pre" segments={[{ key: 'headingLine2Pre' }]} />
          <RichFieldGroup label="Heading Line2 Grad" f={f} set={set} base="headingLine2Grad" segments={[{ key: 'headingLine2Grad' }]} />
          <TextInput label="LinkedIn URL" value={f.linkedinUrl as string ?? ''} onChange={(v) => set('linkedinUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Get directions link label" f={f} set={set} base="directionsLabel" segments={[{ key: 'directionsLabel' }]} />
          <RichFieldGroup label="LinkedIn section title" f={f} set={set} base="linkedinTitle" segments={[{ key: 'linkedinTitle' }]} />
          <RichFieldGroup label="LinkedIn section description" f={f} set={set} base="linkedinDesc" segments={[{ key: 'linkedinDesc' }]} />
          <RichFieldGroup label="LinkedIn link label" f={f} set={set} base="linkedinLinkLabel" segments={[{ key: 'linkedinLinkLabel' }]} />
        </div>
      );

    case 'slick-lets-talk':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Sub bold/gradient text" f={f} set={set} base="subCode" segments={[{ key: 'subCode' }]} />
          <RichFieldGroup label="Sub suffix text" f={f} set={set} base="subSuffix" segments={[{ key: 'subSuffix' }]} />
          <Repeater<string>
            label="Nav step labels"
            items={(f.navLabels as string[]) ?? []}
            onChange={(v) => set('navLabels', v)}
            newItem={() => ''}
            itemPreview={(it) => it || '(untitled)'}
            renderItem={(it, u) => (
              <TextInput label="Label" value={it ?? ''} onChange={u} />
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Final card eyebrow" f={f} set={set} base="finalEyebrow" segments={[{ key: 'finalEyebrow' }]} />
          <RichFieldGroup label="Final card title" f={f} set={set} base="finalTitle" segments={[{ key: 'finalTitle' }]} />
          <RichFieldGroup label="Final card description" f={f} set={set} base="finalDesc" segments={[{ key: 'finalDesc' }]} />
        </div>
      );

    case 'slick-sc-contact-hs':
      return (
        <div className="space-y-4">
          <TextInput label="HubSpot Portal ID" value={f.portalId as string ?? ''} onChange={(v) => set('portalId', v)} />
          <TextInput label="HubSpot Form ID (GUID)" value={f.formId as string ?? ''} onChange={(v) => set('formId', v)} />
          <RichFieldGroup label="HubSpot Region (e.g. na1, eu1)" f={f} set={set} base="region" segments={[{ key: 'region' }]} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Lede" f={f} set={set} base="lede" segments={[{ key: 'lede' }]} />
          <RichFieldGroup label="Card title" f={f} set={set} base="cardTitle" segments={[{ key: 'cardTitle' }]} />
          <RichFieldGroup label="Card subtitle" f={f} set={set} base="cardSub" segments={[{ key: 'cardSub' }]} />
        </div>
      );

    case 'slick-contact':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading suffix" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Lede text" f={f} set={set} base="lede" segments={[{ key: 'lede' }]} />
          <RichFieldGroup label="Email" f={f} set={set} base="email" segments={[{ key: 'email' }]} />
          <RichFieldGroup label="Phone" f={f} set={set} base="phone" segments={[{ key: 'phone' }]} />
          <RichFieldGroup label="HQ" f={f} set={set} base="hq" segments={[{ key: 'hq' }]} />
          <RichFieldGroup label="Regional offices" f={f} set={set} base="regionalOffices" segments={[{ key: 'regionalOffices' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Form title" f={f} set={set} base="formTitle" segments={[{ key: 'formTitle' }]} />
          <RichFieldGroup label="Form sub" f={f} set={set} base="formSub" segments={[{ key: 'formSub' }]} />
          <RichFieldGroup label="Submit button label" f={f} set={set} base="submitLabel" segments={[{ key: 'submitLabel' }]} />
          <RichFieldGroup label="Success message" f={f} set={set} base="successMessage" segments={[{ key: 'successMessage' }]} />
          <Repeater<string>
            label="Product options"
            items={(f.productOptions as string[]) ?? []}
            onChange={(v) => set('productOptions', v)}
            newItem={() => ''}
            itemPreview={(it) => it || '(untitled)'}
            renderItem={(it, u) => (
              <TextInput label="Option" value={it ?? ''} onChange={u} />
            )}
          />
          <Repeater<string>
            label="Source options"
            items={(f.sourceOptions as string[]) ?? []}
            onChange={(v) => set('sourceOptions', v)}
            newItem={() => ''}
            itemPreview={(it) => it || '(untitled)'}
            renderItem={(it, u) => (
              <TextInput label="Option" value={it ?? ''} onChange={u} />
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Demo card title" f={f} set={set} base="demoTitle" segments={[{ key: 'demoTitle' }]} />
          <RichFieldGroup label="Demo card sub" f={f} set={set} base="demoSub" segments={[{ key: 'demoSub' }]} />
          <RichFieldGroup label="Contact rail heading" f={f} set={set} base="contactTitle" segments={[{ key: 'contactTitle' }]} />
        </div>
      );

    case 'slick-sc-video-showcase':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge text" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Gradient" f={f} set={set} base="headingGradient" segments={[{ key: 'headingGradient' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Thumbnail image" {...imageI18nProps(f, "thumbnailUrl", update)} />
          <TextInput label="Video URL (.mp4 / YouTube / Vimeo)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label (prefix)" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-scai-vision-security': {
      type SecBadge = { image?: string; alt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SecBadge>
            label="Certification badges"
            items={(f.badges as SecBadge[]) ?? []}
            onChange={(v) => set('badges', v)}
            newItem={() => ({ image: '', alt: 'New badge' })}
            itemPreview={(b) => b.alt || '(untitled)'}
            renderItem={(b, u) => (
              <div className="space-y-2">
                <TextInput label="Alt text / name" value={b.alt ?? ''} onChange={(v) => u({ ...b, alt: v })} />
                <ImageField label="Badge image" {...imageI18nProps(b, "image", (p) => u({ ...b, ...p }))} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <FitSelect label="Badge image fit (all badges)" fitKey="badgeFit" f={f} set={set} def="contain" />
        </div>
      );
    }

    case 'slick-scai-vision-results': {
      type ResultStat = { label?: string; value?: string; desc?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<ResultStat>
            label="Stat cards"
            items={(f.stats as ResultStat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ label: 'Increase', value: '1x', desc: 'New metric' })}
            itemPreview={(s) => `${s.value ?? ''} — ${s.desc ?? '(empty)'}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Card label (e.g. Increase)" {...richItemProps(s, 'label', u)} />
                <RichTextInput label="Value (e.g. 2x)" {...richItemProps(s, 'value', u)} />
                <RichTextInput label="Description" {...richItemProps(s, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-vision-stat-bar': {
      type SBItem = { value?: string; label?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow (badge)" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SBItem>
            label="Stats"
            items={(f.stats as SBItem[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '0x', label: 'New metric' })}
            itemPreview={(s) => `${s.value ?? ''} — ${s.label ?? '(empty)'}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value (e.g. 95%+)" {...richItemProps(s, 'value', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'label', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-vision-measures': {
      type MRow = { kPre?: string; kHl?: string; kPost?: string; v?: string };
      type MTab = { label?: string; headingPre?: string; headingAccent?: string; body?: string; bigValue?: string; bigLabel?: string; rows?: MRow[]; imageUrl?: string; imageAlt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow (badge)" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<MTab>
            label="Tabs"
            items={(f.tabs as MTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New tab', headingPre: 'Heading ', headingAccent: 'accent', body: '', bigValue: '0x', bigLabel: '', rows: [], imageUrl: '', imageAlt: '' })}
            itemPreview={(t) => t.label || '(tab)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(t, 'label', u)} />
                <RichTextInput label="Panel heading prefix" {...richItemProps(t, 'headingPre', u)} />
                <RichTextInput label="Panel heading accent (teal)" {...richItemProps(t, 'headingAccent', u)} />
                <RichTextInput label="Body" {...richItemProps(t, 'body', u)} />
                <RichTextInput label="Big value (e.g. 95%+)" {...richItemProps(t, 'bigValue', u)} />
                <RichTextInput label="Big value label" {...richItemProps(t, 'bigLabel', u)} />
                <ImageField label="Panel image" {...imageI18nProps(t, "imageUrl", (p) => u({ ...t, ...p }))} />
                <TextInput label="Image alt / placeholder caption" value={t.imageAlt ?? ''} onChange={(v) => u({ ...t, imageAlt: v })} />
                <Repeater<MRow>
                  label="Rows"
                  items={t.rows ?? []}
                  onChange={(v) => u({ ...t, rows: v })}
                  newItem={() => ({ kPre: '', kHl: 'highlight', kPost: '', v: '' })}
                  itemPreview={(r) => `${r.kPre ?? ''}${r.kHl ?? ''}${r.kPost ?? ''}`.trim() || '(row)'}
                  renderItem={(r, ur) => (
                    <div className="space-y-2">
                      <RichTextInput label="Label — before highlight" {...richItemProps(r, 'kPre', ur)} />
                      <RichTextInput label="Label — highlighted (teal)" {...richItemProps(r, 'kHl', ur)} />
                      <RichTextInput label="Label — after highlight" {...richItemProps(r, 'kPost', ur)} />
                      <RichTextInput label="Sub value" {...richItemProps(r, 'v', ur)} />
                    </div>
                  )}
                />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <FitSelect label="Panel image fit (all tabs)" fitKey="imageFit" f={f} set={set} def="cover" />
        </div>
      );
    }

    case 'slick-scai-vision-showcase': {
      type SVSCard = { title?: string; sub?: string; accuracy?: string; img?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SVSCard>
            label="Cards"
            items={(f.cards as SVSCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Store Type', sub: '0 SKUs detected', accuracy: '0%', img: '' })}
            itemPreview={(c) => c.title || '(card)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Sub (e.g. 28 SKUs detected)" {...richItemProps(c, 'sub', u)} />
                <RichTextInput label="Accuracy badge (e.g. 89%)" {...richItemProps(c, 'accuracy', u)} />
                <ImageField label="Card image" {...imageI18nProps(c, "img", (p) => u({ ...c, ...p }))} />
              </div>
            )}
          />
          <FitSelect label="Card image fit (all cards)" fitKey="cardImageFit" f={f} set={set} def="cover" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Textarea label="Feature strip (one per line)" value={(f.features as string[] ?? []).join('\n')} onChange={(v) => set('features', v.split('\n').filter(Boolean))} />
        </div>
      );
    }

    case 'slick-scai-vision-channels': {
      type SVCRow = { badge?: string; headingPre?: string; headingGrad?: string; headingSuffix?: string; body?: string; tags?: string[]; img?: string; imgRight?: boolean };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SVCRow>
            label="Rows"
            items={(f.rows as SVCRow[]) ?? []}
            onChange={(v) => set('rows', v)}
            newItem={() => ({ badge: 'Badge', headingGrad: 'Heading', body: '', tags: [], img: '', imgRight: true })}
            itemPreview={(r) => r.badge || '(row)'}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <RichTextInput label="Badge label" {...richItemProps(r, 'badge', u)} />
                <RichTextInput label="Heading prefix (dark)" {...richItemProps(r, 'headingPre', u)} />
                <RichTextInput label="Heading gradient (teal)" {...richItemProps(r, 'headingGrad', u)} />
                <RichTextInput label="Heading suffix (dark)" {...richItemProps(r, 'headingSuffix', u)} />
                <RichTextInput label="Body text" {...richItemProps(r, 'body', u)} />
                <Textarea label="Tags (one per line)" value={(r.tags ?? []).join('\n')} onChange={(v) => u({ ...r, tags: v.split('\n').filter(Boolean) })} />
                <ImageField label="Row image" {...imageI18nProps(r, "img", (p) => u({ ...r, ...p }))} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                  <input type="checkbox" checked={r.imgRight !== false} onChange={(e) => u({ ...r, imgRight: e.target.checked })} />
                  Image on right (uncheck = image on left)
                </label>
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <FitSelect label="Row image fit (all rows)" fitKey="rowImageFit" f={f} set={set} def="cover" />
        </div>
      );
    }

    case 'slick-scai-vision-performance': {
      type SVPMetric = { boldWord?: string; label?: string; value?: string };
      type SVPTab = { label?: string; headingGrad1?: string; headingMid?: string; headingGrad2?: string; headingSuffix?: string; body?: string; bigStat?: string; bigStatLabel?: string; metrics?: SVPMetric[] };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SVPTab>
            label="Tabs"
            items={(f.tabs as SVPTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', headingGrad1: 'SCAI', headingMid: ' delivers ', headingGrad2: 'results', headingSuffix: '', body: '', bigStat: '0', bigStatLabel: 'Key Metric', metrics: [] })}
            itemPreview={(t) => t.label || '(unnamed)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(t, 'label', u)} />
                <RichTextInput label="Heading teal word 1" {...richItemProps(t, 'headingGrad1', u)} />
                <RichTextInput label="Heading middle text" {...richItemProps(t, 'headingMid', u)} />
                <RichTextInput label="Heading teal word 2" {...richItemProps(t, 'headingGrad2', u)} />
                <RichTextInput label="Heading suffix (white)" {...richItemProps(t, 'headingSuffix', u)} />
                <RichTextInput label="Body text" {...richItemProps(t, 'body', u)} />
                <RichTextInput label="Big stat" {...richItemProps(t, 'bigStat', u)} />
                <RichTextInput label="Big stat label" {...richItemProps(t, 'bigStatLabel', u)} />
                <Repeater<SVPMetric>
                  label="Metrics"
                  items={t.metrics ?? []}
                  onChange={(m) => u({ ...t, metrics: m })}
                  newItem={() => ({ boldWord: 'Metric', label: 'label', value: 'value' })}
                  itemPreview={(m) => m.boldWord || '(metric)'}
                  renderItem={(m, um) => (
                    <div className="space-y-1">
                      <RichTextInput label="Bold word (teal)" {...richItemProps(m, 'boldWord', um)} />
                      <RichTextInput label="Label (white)" {...richItemProps(m, 'label', um)} />
                      <RichTextInput label="Value (grey)" {...richItemProps(m, 'value', um)} />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-vision-revenue-loss': {
      type SVRLStat = { stat?: string; label?: string; badge?: string; icon?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading line 1 (dark)" f={f} set={set} base="headingPre1" segments={[{ key: 'headingPre1' }]} />
          <RichFieldGroup label="Heading Pre2" f={f} set={set} base="headingPre2" segments={[{ key: 'headingPre2' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle (\\n for line break)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Donut centre value" f={f} set={set} base="donutCenter" segments={[{ key: 'donutCenter' }]} />
          <RichFieldGroup label="Donut centre label" f={f} set={set} base="donutLabel" segments={[{ key: 'donutLabel' }]} />
          <TextInput label="Loss percent (number)" value={String(f.lossPercent ?? 25)} onChange={(v) => set('lossPercent', Number(v) || 25)} />
          <RichFieldGroup label="Legend — capture label" f={f} set={set} base="captureLabel" segments={[{ key: 'captureLabel' }]} />
          <RichFieldGroup label="Legend — loss label" f={f} set={set} base="lossLabel" segments={[{ key: 'lossLabel' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SVRLStat>
            label="Stat rows"
            items={(f.stats as SVRLStat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ stat: '0%', label: 'description', badge: '-0%', icon: 'alert' })}
            itemPreview={(s) => s.stat || '(unnamed)'}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Stat value" {...richItemProps(s, 'stat', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'label', u)} />
                <RichTextInput label="Badge text" {...richItemProps(s, 'badge', u)} />
                <TextInput label="Icon (clipboard/eye/clock/alert)" value={s.icon ?? ''} onChange={(v) => u({ ...s, icon: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-vision-actions': {
      type SCAIVACard = { title?: string; description?: string; img?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading line 1 (dark)" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SCAIVACard>
            label="Cards"
            items={(f.cards as SCAIVACard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Feature', description: '', img: '' })}
            itemPreview={(c) => c.title || '(unnamed)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(c, 'description', u)} />
                <ImageField label="Card image" {...imageI18nProps(c, "img", (p) => u({ ...c, ...p }))} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <FitSelect label="Card image fit (all cards)" fitKey="cardImageFit" f={f} set={set} def="fill" />
        </div>
      );
    }

    case 'slick-scai-vision-insights': {
      type SCAIVITab = { label?: string; tag?: string; headingGrad?: string; headingSuffix?: string; body?: string; bullets?: string[]; whyHeading?: string; whyPre?: string; whyBold?: string; whyTail?: string; img?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading Pre2" f={f} set={set} base="headingPre2" segments={[{ key: 'headingPre2' }]} />
          <RichFieldGroup label="Heading Grad2" f={f} set={set} base="headingGrad2" segments={[{ key: 'headingGrad2' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SCAIVITab>
            label="Tabs"
            items={(f.tabs as SCAIVITab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', tag: 'Dashboard', headingGrad: 'Feature ', headingSuffix: 'That Drives Results', body: '', bullets: [], whyHeading: 'Why SCAI is Different?', whyPre: '', whyBold: '', whyTail: '', img: '' })}
            itemPreview={(t) => t.label || '(unnamed)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(t, 'label', u)} />
                <RichTextInput label="Tag badge" {...richItemProps(t, 'tag', u)} />
                <RichTextInput label="Heading (teal part)" {...richItemProps(t, 'headingGrad', u)} />
                <RichTextInput label="Heading (dark suffix)" {...richItemProps(t, 'headingSuffix', u)} />
                <RichTextInput label="Body text" {...richItemProps(t, 'body', u)} />
                <Textarea label="Bullets (one per line)" value={(t.bullets ?? []).join('\n')} onChange={(v) => u({ ...t, bullets: v.split('\n').filter(Boolean) })} />
                <RichTextInput label="Why heading" {...richItemProps(t, 'whyHeading', u)} />
                <RichTextInput label="Why — text before bold" {...richItemProps(t, 'whyPre', u)} />
                <RichTextInput label="Why — bold text" {...richItemProps(t, 'whyBold', u)} />
                <RichTextInput label="Why — text after bold" {...richItemProps(t, 'whyTail', u)} />
                <ImageField label="Tab image (right panel)" {...imageI18nProps(t, "img", (p) => u({ ...t, ...p }))} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <FitSelect label="Tab image fit (all tabs)" fitKey="tabImageFit" f={f} set={set} def="contain" />
        </div>
      );
    }

    case 'slick-scai-vision-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Sub Pre" f={f} set={set} base="subPre" segments={[{ key: 'subPre' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Mid" f={f} set={set} base="subMid" segments={[{ key: 'subMid' }]} />
          <RichFieldGroup label="Sub Bold2" f={f} set={set} base="subBold2" segments={[{ key: 'subBold2' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Centre phone" {...imageI18nProps(f, "imgPhone", update)} />
          <NumberInput label="Centre phone width (px)" value={(f.imgPhoneWidth as number) ?? 254} onChange={(v) => set('imgPhoneWidth', v)} />
          <NumberInput label="Centre phone height (px, 0 = auto/natural)" value={(f.imgPhoneHeight as number) ?? 0} onChange={(v) => set('imgPhoneHeight', v)} />
          <TextInput label="Centre phone aspect ratio (e.g. 3/4) — leave blank if using height" value={f.imgPhoneAspectRatio as string ?? ''} onChange={(v) => set('imgPhoneAspectRatio', v)} />
          <FitSelect label="Centre phone fit" fitKey="imgPhoneFit" f={f} set={set} def="contain" />
          <ImageField label="Bottom-left card (Share of Shelf)" {...imageI18nProps(f, "imgBottomLeft", update)} />
          <NumberInput label="Bottom-left card width (px)" value={(f.imgBottomLeftWidth as number) ?? 273} onChange={(v) => set('imgBottomLeftWidth', v)} />
          <TextInput label="Bottom-left aspect ratio (e.g. 16/9) — enables object-fit" value={f.imgBottomLeftAspectRatio as string ?? ''} onChange={(v) => set('imgBottomLeftAspectRatio', v)} />
          <FitSelect label="Bottom-left card fit" fitKey="imgBottomLeftFit" f={f} set={set} def="fill" />
          <ImageField label="Bottom-right card (Task completed)" {...imageI18nProps(f, "imgBottomRight", update)} />
          <NumberInput label="Bottom-right card width (px)" value={(f.imgBottomRightWidth as number) ?? 253} onChange={(v) => set('imgBottomRightWidth', v)} />
          <TextInput label="Bottom-right aspect ratio (e.g. 16/9) — enables object-fit" value={f.imgBottomRightAspectRatio as string ?? ''} onChange={(v) => set('imgBottomRightAspectRatio', v)} />
          <FitSelect label="Bottom-right card fit" fitKey="imgBottomRightFit" f={f} set={set} def="fill" />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Floating chips</p>
          <RichFieldGroup label="Chip 1 — value" f={f} set={set} base="chip1Val" segments={[{ key: 'chip1Val' }]} />
          <RichFieldGroup label="Chip 1 — unit (teal)" f={f} set={set} base="chip1Unit" segments={[{ key: 'chip1Unit' }]} />
          <RichFieldGroup label="Chip 1 — label" f={f} set={set} base="chip1Lbl" segments={[{ key: 'chip1Lbl' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Chip 2 — value" f={f} set={set} base="chip2Val" segments={[{ key: 'chip2Val' }]} />
          <RichFieldGroup label="Chip 2 — unit (teal)" f={f} set={set} base="chip2Unit" segments={[{ key: 'chip2Unit' }]} />
          <RichFieldGroup label="Chip 2 — label" f={f} set={set} base="chip2Lbl" segments={[{ key: 'chip2Lbl' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Chip 3 — value" f={f} set={set} base="chip3Val" segments={[{ key: 'chip3Val' }]} />
          <RichFieldGroup label="Chip 3 — unit (teal)" f={f} set={set} base="chip3Unit" segments={[{ key: 'chip3Unit' }]} />
          <RichFieldGroup label="Chip 3 — label" f={f} set={set} base="chip3Lbl" segments={[{ key: 'chip3Lbl' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Chip 4 — value" f={f} set={set} base="chip4Val" segments={[{ key: 'chip4Val' }]} />
          <RichFieldGroup label="Chip 4 — unit (teal)" f={f} set={set} base="chip4Unit" segments={[{ key: 'chip4Unit' }]} />
          <RichFieldGroup label="Chip 4 — label" f={f} set={set} base="chip4Lbl" segments={[{ key: 'chip4Lbl' }]} />
        </div>
      );

    case 'slick-scai-whatsapp-agent': {
      type WABullet = { text: string; highlight?: string };
      type WALang = { label: string; flag: string; thumbnailUrl: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Tagline Accent" f={f} set={set} base="taglineAccent" segments={[{ key: 'taglineAccent' }]} />
          <RichFieldGroup label="Tagline Rest" f={f} set={set} base="taglineRest" segments={[{ key: 'taglineRest' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="primaryCtaLabel" segments={[{ key: 'primaryCtaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ghostCtaLabel" segments={[{ key: 'ghostCtaLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ghostCtaUrl as string ?? ''} onChange={(v) => set('ghostCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<WABullet>
            label="Bullet points"
            items={(f.bullets as WABullet[]) ?? []}
            onChange={(v) => set('bullets', v)}
            newItem={() => ({ text: 'New bullet point', highlight: '' })}
            itemPreview={(b) => b.text.slice(0, 40) || '(empty)'}
            renderItem={(b, u) => (
              <div className="space-y-2">
                <RichTextInput label="Text" {...richItemProps(b, 'text', u)} />
                <RichTextInput label="Highlight (teal)" {...richItemProps(b, 'highlight', u)} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<WALang>
            label="Languages"
            items={(f.languages as WALang[]) ?? []}
            onChange={(v) => set('languages', v)}
            newItem={() => ({ label: 'New Language', flag: '🌐', thumbnailUrl: '' })}
            itemPreview={(l) => `${l.flag} ${l.label}`}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <RichTextInput label="Flag emoji" {...richItemProps(l, 'flag', u)} />
                <RichTextInput label="Label" {...richItemProps(l, 'label', u)} />
                <ImageField label="Thumbnail" {...imageI18nProps(l, "thumbnailUrl", (p) => u({ ...l, ...p }))} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-hoardings': {
      type HoardImg = { url?: string; alt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Mid" f={f} set={set} base="headingMid" segments={[{ key: 'headingMid' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <NumberInput label="Scroll duration (seconds, higher = slower)" value={(f.speed as number) ?? 40} onChange={(v) => set('speed', v)} />
          <Repeater<HoardImg>
            label="Marquee images"
            items={(f.images as HoardImg[]) ?? []}
            onChange={(v) => set('images', v)}
            newItem={() => ({ url: '', alt: '' })}
            itemPreview={(im) => im.alt || im.url || 'Image'}
            renderItem={(im, u) => (
              <div className="space-y-2">
                <ImageField label="Image" {...imageI18nProps(im, "url", (p) => u({ ...im, ...p }))} />
                <TextInput label="Alt text" value={im.alt ?? ''} onChange={(v) => u({ ...im, alt: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-best-agent': {
      type ChartField = { scaiValue?: number; scaiLabel?: string; compValue?: number; compLabel1?: string; compLabel2?: string; yAxisLabel?: string };
      type BulletField = { title?: string; desc?: string };
      type HeadingSegField = { text?: string; kind?: 'bold' | 'semi' | 'normal' };
      type TableRowField = { cap?: string; salescode?: string; other?: string };
      type TableField = { colCap?: string; colScai?: string; colOther?: string; rows?: TableRowField[] };
      type TabField = {
        tabLabel?: string;
        headingSegments?: HeadingSegField[];
        headingBold?: string; headingSemi1?: string; headingNormal?: string; headingSemi2?: string;
        body?: string; bigStat?: string; bigStatLabel?: string; bullets?: BulletField[];
        panelType?: 'chart' | 'table'; chart?: ChartField; table?: TableField;
      };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle Pre" f={f} set={set} base="subtitlePre" segments={[{ key: 'subtitlePre' }]} />
          <RichFieldGroup label="Subtitle Accent" f={f} set={set} base="subtitleAccent" segments={[{ key: 'subtitleAccent' }]} />
          <RichFieldGroup label="Subtitle Post" f={f} set={set} base="subtitlePost" segments={[{ key: 'subtitlePost' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<TabField>
            label="Comparison tabs (4)"
            items={(f.tabs as TabField[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({
              tabLabel: 'New Tab',
              headingSegments: [
                { text: 'SCAI ', kind: 'bold' },
                { text: 'does something', kind: 'semi' },
                { text: ' better.', kind: 'normal' },
              ],
              body: 'Description of this capability.', bigStat: '0', bigStatLabel: 'Stat label',
              bullets: [{ title: 'Bullet title', desc: 'Bullet description' }, { title: 'Bullet title', desc: 'Bullet description' }],
              panelType: 'chart',
              chart: { scaiValue: 1, scaiLabel: 'SCAI', compValue: 1, compLabel1: 'Nearest', compLabel2: 'Competitor', yAxisLabel: 'Metric' },
              table: { colCap: 'Capabilities', colScai: 'Salescode', colOther: 'Other', rows: [{ cap: 'Capability', salescode: 'Yes', other: 'No' }] },
            })}
            itemPreview={(t) => t.tabLabel || '(untitled)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(t, 'tabLabel', u)} />
                <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
                <p className="text-xs text-slate-500 font-medium">Heading (segments, in order · bold = teal)</p>
                <Repeater<HeadingSegField>
                  label="Heading segments"
                  items={t.headingSegments ?? []}
                  onChange={(v) => u({ ...t, headingSegments: v })}
                  newItem={() => ({ text: 'text ', kind: 'normal' })}
                  itemPreview={(s) => `${s.kind ?? 'normal'}: ${s.text ?? ''}`}
                  renderItem={(s, us) => (
                    <div className="space-y-2">
                      <TextInput label="Text" value={s.text ?? ''} onChange={(v) => us({ ...s, text: v })} />
                      <Select<'bold' | 'semi' | 'normal'>
                        label="Style"
                        value={s.kind ?? 'normal'}
                        onChange={(v) => us({ ...s, kind: v })}
                        options={[
                          { value: 'bold', label: 'Bold (teal)' },
                          { value: 'semi', label: 'Semi-bold (white)' },
                          { value: 'normal', label: 'Normal (white)' },
                        ]}
                      />
                    </div>
                  )}
                />
                <RichTextInput label="Body paragraph" {...richItemProps(t, 'body', u)} />
                <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
                <RichTextInput label="Big stat (e.g. '< 1 sec')" {...richItemProps(t, 'bigStat', u)} />
                <RichTextInput label="Big stat label" {...richItemProps(t, 'bigStatLabel', u)} />
                <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
                <Repeater<BulletField>
                  label="Bullets (2)"
                  items={t.bullets ?? []}
                  onChange={(v) => u({ ...t, bullets: v })}
                  newItem={() => ({ title: 'Bullet title', desc: 'Bullet description' })}
                  itemPreview={(b) => b.title || '(empty)'}
                  renderItem={(b, ub) => (
                    <div className="space-y-2">
                      <RichTextInput label="Title" {...richItemProps(b, 'title', ub)} />
                      <RichTextInput label="Description" {...richItemProps(b, 'desc', ub)} />
                    </div>
                  )}
                />
                <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
                <Select<'chart' | 'table'>
                  label="Right panel"
                  value={t.panelType ?? 'chart'}
                  onChange={(v) => u({ ...t, panelType: v })}
                  options={[
                    { value: 'chart', label: 'Bar chart' },
                    { value: 'table', label: 'Comparison table' },
                  ]}
                />
                {(t.panelType ?? 'chart') === 'table' ? (
                  <>
                    <p className="text-xs text-slate-500 font-medium">Comparison table</p>
                    <div className="grid grid-cols-3 gap-2">
                      <TextInput label="Col 1" value={t.table?.colCap ?? ''} onChange={(v) => u({ ...t, table: { ...t.table, colCap: v } })} />
                      <TextInput label="Col 2 (teal)" value={t.table?.colScai ?? ''} onChange={(v) => u({ ...t, table: { ...t.table, colScai: v } })} />
                      <TextInput label="Col 3" value={t.table?.colOther ?? ''} onChange={(v) => u({ ...t, table: { ...t.table, colOther: v } })} />
                    </div>
                    <Repeater<TableRowField>
                      label="Rows"
                      items={t.table?.rows ?? []}
                      onChange={(v) => u({ ...t, table: { ...t.table, rows: v } })}
                      newItem={() => ({ cap: 'Capability', salescode: 'Yes', other: 'No' })}
                      itemPreview={(r) => r.cap || '(row)'}
                      renderItem={(r, ur) => (
                        <div className="space-y-2">
                          <TextInput label="Capability (\n for line break)" value={r.cap ?? ''} onChange={(v) => ur({ ...r, cap: v })} />
                          <TextInput label="Salescode value" value={r.salescode ?? ''} onChange={(v) => ur({ ...r, salescode: v })} />
                          <TextInput label="Other value" value={r.other ?? ''} onChange={(v) => ur({ ...r, other: v })} />
                        </div>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 font-medium">Chart (bar comparison)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberInput label="SCAI value" value={t.chart?.scaiValue ?? 1} onChange={(v) => u({ ...t, chart: { ...t.chart, scaiValue: v } })} />
                      <NumberInput label="Competitor value" value={t.chart?.compValue ?? 1} onChange={(v) => u({ ...t, chart: { ...t.chart, compValue: v } })} />
                    </div>
                    <TextInput label="SCAI bar label" value={t.chart?.scaiLabel ?? ''} onChange={(v) => u({ ...t, chart: { ...t.chart, scaiLabel: v } })} />
                    <TextInput label="Competitor bar label (line 1)" value={t.chart?.compLabel1 ?? ''} onChange={(v) => u({ ...t, chart: { ...t.chart, compLabel1: v } })} />
                    <TextInput label="Competitor bar label (line 2)" value={t.chart?.compLabel2 ?? ''} onChange={(v) => u({ ...t, chart: { ...t.chart, compLabel2: v } })} />
                    <TextInput label="Y-axis label" value={t.chart?.yAxisLabel ?? ''} onChange={(v) => u({ ...t, chart: { ...t.chart, yAxisLabel: v } })} />
                  </>
                )}
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-global-showcase': {
      type GSPanel = { thumbnailUrl: string; videoUrl?: string; alt: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<GSPanel>
            label="Video panels"
            items={(f.panels as GSPanel[]) ?? []}
            onChange={(v) => set('panels', v)}
            newItem={() => ({ thumbnailUrl: '', videoUrl: '', alt: 'Showcase panel' })}
            itemPreview={(p) => p.alt || '(empty)'}
            renderItem={(p, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail" {...imageI18nProps(p, "thumbnailUrl", (patch) => u({ ...p, ...patch }))} />
                <TextInput label="Video URL (YouTube or direct .mp4)" value={p.videoUrl ?? ''} onChange={(v) => u({ ...p, videoUrl: v })} />
                <TextInput label="Alt text" value={p.alt} onChange={(v) => u({ ...p, alt: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-human-test': {
      type HTClip = { thumbnailUrl: string; videoUrl?: string };
      type HTMetric = { label: string; labelBold: string; value: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading accent 1 (teal)" f={f} set={set} base="headingAccent1" segments={[{ key: 'headingAccent1' }]} />
          <RichFieldGroup label="Heading Mid" f={f} set={set} base="headingMid" segments={[{ key: 'headingMid' }]} />
          <RichFieldGroup label="Heading Accent2" f={f} set={set} base="headingAccent2" segments={[{ key: 'headingAccent2' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="subheading" segments={[{ key: 'subheading' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Human test %" f={f} set={set} base="humanTestPercent" segments={[{ key: 'humanTestPercent' }]} />
          <RichFieldGroup label="Stat Desc Normal" f={f} set={set} base="statDescNormal" segments={[{ key: 'statDescNormal' }]} />
          <RichFieldGroup label="Stat Desc Bold" f={f} set={set} base="statDescBold" segments={[{ key: 'statDescBold' }]} />
          <RichFieldGroup label="Stat desc (italic teal)" f={f} set={set} base="statDescItalicAccent" segments={[{ key: 'statDescItalicAccent' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="primaryCtaLabel" segments={[{ key: 'primaryCtaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<HTClip>
            label="Video clips"
            items={(f.clips as HTClip[]) ?? []}
            onChange={(v) => set('clips', v)}
            newItem={() => ({ thumbnailUrl: '', videoUrl: '' })}
            itemPreview={(c) => c.thumbnailUrl ? 'Clip (has thumbnail)' : 'Clip (placeholder)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail" {...imageI18nProps(c, "thumbnailUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Video URL (YouTube Short / mp4 — click to play)" value={c.videoUrl ?? ''} onChange={(v) => u({ ...c, videoUrl: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<HTMetric>
            label="Stat metrics"
            items={(f.metrics as HTMetric[]) ?? []}
            onChange={(v) => set('metrics', v)}
            newItem={() => ({ label: '', labelBold: 'Metric', value: '0%+' })}
            itemPreview={(m) => `${m.label}${m.labelBold} Rate — ${m.value}`}
            renderItem={(m, u) => (
              <div className="space-y-2">
                <RichTextInput label="Label prefix" {...richItemProps(m, 'label', u)} />
                <RichTextInput label="Label bold" {...richItemProps(m, 'labelBold', u)} />
                <RichTextInput label="Value" {...richItemProps(m, 'value', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-industry': {
      type IndustryCat = { label: string; icon: string };
      const ICON_OPTS = ['cupSoda','cookie','milk','candy','sparkles','wrench','pill','wheat','snowflake','croissant'] as const;
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="primaryCtaLabel" segments={[{ key: 'primaryCtaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ghostCtaLabel" segments={[{ key: 'ghostCtaLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ghostCtaUrl as string ?? ''} onChange={(v) => set('ghostCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<IndustryCat>
            label="Categories"
            items={(f.categories as IndustryCat[]) ?? []}
            onChange={(v) => set('categories', v)}
            newItem={() => ({ label: 'New Category', icon: 'sparkles' })}
            itemPreview={(c) => c.label || '(empty)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Label" {...richItemProps(c, 'label', u)} />
                <div className="text-xs text-slate-400">Icon</div>
                <div className="flex gap-1.5 flex-wrap">
                  {ICON_OPTS.map(ico => (
                    <button key={ico} onClick={() => u({ ...c, icon: ico })}
                      className={`px-2 py-1 text-xs rounded ${c.icon === ico ? 'bg-teal-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      {ico}
                    </button>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-quick-guide': {
      type QGStep = { label: string; title: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Bold" f={f} set={set} base="headingBold" segments={[{ key: 'headingBold' }]} />
          <RichFieldGroup label="Heading Mid" f={f} set={set} base="headingMid" segments={[{ key: 'headingMid' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="primaryCtaLabel" segments={[{ key: 'primaryCtaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Video thumbnail" {...imageI18nProps(f, "thumbnailUrl", update)} />
          <VideoField label="Upload video" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <TextInput label="…or paste a video URL (YouTube / .mp4)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <RichFieldGroup label="Video caption" f={f} set={set} base="videoCaption" segments={[{ key: 'videoCaption' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<QGStep>
            label="Steps"
            items={(f.steps as QGStep[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ label: 'STEP 4', title: 'New step' })}
            itemPreview={(s) => s.title || '(empty)'}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Step label" {...richItemProps(s, 'label', u)} />
                <RichTextInput label="Step title" {...richItemProps(s, 'title', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-multilingual': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Left card text" f={f} set={set} base="leftCardText" segments={[{ key: 'leftCardText' }]} />
          <RichFieldGroup label="Center bold line" f={f} set={set} base="centerBold" segments={[{ key: 'centerBold' }]} />
          <RichFieldGroup label="Center sub line" f={f} set={set} base="centerSub" segments={[{ key: 'centerSub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Right image" {...imageI18nProps(f, "rightImageUrl", update)} />
          <TextInput label="Right image alt text" value={f.rightImageAlt as string ?? ''} onChange={(v) => set('rightImageAlt', v)} />
        </div>
      );
    }

    case 'slick-scai-final-cta': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="subtitle" segments={[{ key: 'subtitle' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <RichFieldGroup label="CTA bold suffix" f={f} set={set} base="ctaBold" segments={[{ key: 'ctaBold' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Background image" {...imageI18nProps(f, "bgImageUrl", update)} />
        </div>
      );
    }

    case 'slick-dare-to-compare': {
      type DTCFeature = { text: string; iconUrl?: string };
      return (
        <div className="space-y-4">
          <ImageField label="Logo image (optional — falls back to text)" {...imageI18nProps(f, "logoUrl", update)} />
          <TextInput label="Logo alt text" value={f.logoAlt as string ?? ''} onChange={(v) => set('logoAlt', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Heading prefix (white)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (gold)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DTCFeature>
            label="Feature rows (use **text** for teal-bold accent)"
            items={(f.features as DTCFeature[]) ?? []}
            onChange={(v) => set('features', v)}
            newItem={() => ({ text: 'New feature **highlight**', iconUrl: '' })}
            itemPreview={(ft) => ft.text || '(empty)'}
            renderItem={(ft, u) => (
              <div className="space-y-2">
                <Textarea label="Text" value={ft.text} onChange={(v) => u({ ...ft, text: v })} />
                <ImageField label="Icon/logo image (optional — falls back to default icon)" {...imageI18nProps(ft, "iconUrl", (p) => u({ ...ft, ...p }))} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <Textarea label="Footnote" value={f.footnote as string ?? ''} onChange={(v) => set('footnote', v)} />
        </div>
      );
    }

    case 'slick-scai-revenue': {
      type RLMetricField = { value: string; label: string; impact: string; icon: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Line1" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <TextInput label="Sales loss % (number)" value={String(f.salesLossPercent ?? 33)} onChange={(v) => set('salesLossPercent', Number(v))} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<RLMetricField>
            label="Metric cards"
            items={(f.metrics as RLMetricField[]) ?? []}
            onChange={(v) => set('metrics', v)}
            newItem={() => ({ value: '0%', label: 'New metric', impact: '-0%', icon: 'truck' })}
            itemPreview={(m) => m.label || '(empty)'}
            renderItem={(m, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value" {...richItemProps(m, 'value', u)} />
                <RichTextInput label="Label" {...richItemProps(m, 'label', u)} />
                <RichTextInput label="Impact" {...richItemProps(m, 'impact', u)} />
                <div className="text-xs text-slate-400">Icon</div>
                <div className="flex gap-2 flex-wrap">
                  {(['truck','map','userX','ban'] as const).map(ico => (
                    <button key={ico} onClick={() => u({ ...m, icon: ico })}
                      className={`px-2 py-1 text-xs rounded ${m.icon === ico ? 'bg-red-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      {ico}
                    </button>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-pilot': {
      type PilotMetricField = { value: string; label: string; comparison: string; comparedTo: string; icon: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Rest" f={f} set={set} base="headingRest" segments={[{ key: 'headingRest' }]} />
          <RichFieldGroup label="Subtext" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<PilotMetricField>
            label="Metric cards"
            items={(f.metrics as PilotMetricField[]) ?? []}
            onChange={(v) => set('metrics', v)}
            newItem={() => ({ value: '0%', label: 'New Metric', comparison: 'vs —', comparedTo: 'with Human', icon: 'callPickup' })}
            itemPreview={(m) => m.label || '(empty)'}
            renderItem={(m, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value" {...richItemProps(m, 'value', u)} />
                <RichTextInput label="Label" {...richItemProps(m, 'label', u)} />
                <RichTextInput label="Comparison" {...richItemProps(m, 'comparison', u)} />
                <RichTextInput label="Compared to" {...richItemProps(m, 'comparedTo', u)} />
                <div className="text-xs text-slate-400">Icon</div>
                <div className="flex gap-2 flex-wrap">
                  {(['callPickup','engagement','orderConversion','repeatCall'] as const).map(ico => (
                    <button key={ico} onClick={() => u({ ...m, icon: ico })}
                      className={`px-2 py-1 text-xs rounded ${m.icon === ico ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      {ico}
                    </button>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-capabilities':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <ImageField label="Diagram image" {...imageI18nProps(f, "diagramImg", update)} />
        </div>
      );

    case 'slick-scai-why':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 1 — Left tall (Ultra-Configurable Agents)</p>
          <RichFieldGroup label="Title" f={f} set={set} base="c1Title" segments={[{ key: 'c1Title' }]} />
          <RichFieldGroup label="Body" f={f} set={set} base="c1Body" segments={[{ key: 'c1Body' }]} />
          <ImageField label="Agent image" {...imageI18nProps(f, "c1Image", update)} />
          <RichFieldGroup label="Caption (teal line)" f={f} set={set} base="c1Caption" segments={[{ key: 'c1Caption' }]} />
          <RichFieldGroup label="Caption (bold line)" f={f} set={set} base="c1CaptionSub" segments={[{ key: 'c1CaptionSub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 2 — Middle top (Instant Multi-Channel)</p>
          <RichFieldGroup label="Title" f={f} set={set} base="c2Title" segments={[{ key: 'c2Title' }]} />
          <RichFieldGroup label="C2 Body Pre" f={f} set={set} base="c2BodyPre" segments={[{ key: 'c2BodyPre' }]} />
          <RichFieldGroup label="C2 Body Bold" f={f} set={set} base="c2BodyBold" segments={[{ key: 'c2BodyBold' }]} />
          <RichFieldGroup label="Body (after bold)" f={f} set={set} base="c2BodyPost" segments={[{ key: 'c2BodyPost' }]} />
          <ImageField label="Side image" {...imageI18nProps(f, "c2Image", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Banner — Agentic AI CTA</p>
          <RichFieldGroup label="Banner Pre" f={f} set={set} base="bannerPre" segments={[{ key: 'bannerPre' }]} />
          <RichFieldGroup label="Banner Bold3" f={f} set={set} base="bannerBold3" segments={[{ key: 'bannerBold3' }]} />
          <RichFieldGroup label="CTA button label" f={f} set={set} base="bannerCtaLabel" segments={[{ key: 'bannerCtaLabel' }]} />
          <TextInput label="CTA button URL" value={f.bannerCtaUrl as string ?? ''} onChange={(v) => set('bannerCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 3 — Middle bottom (Train Fast)</p>
          <RichFieldGroup label="Title" f={f} set={set} base="c3Title" segments={[{ key: 'c3Title' }]} />
          <RichFieldGroup label="C3 Body Pre" f={f} set={set} base="c3BodyPre" segments={[{ key: 'c3BodyPre' }]} />
          <RichFieldGroup label="C3 Body Bold" f={f} set={set} base="c3BodyBold" segments={[{ key: 'c3BodyBold' }]} />
          <RichFieldGroup label="Body (after bold)" f={f} set={set} base="c3BodyPost" segments={[{ key: 'c3BodyPost' }]} />
          <ImageField label="Side image" {...imageI18nProps(f, "c3Image", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 4 — Right top (Embedded in RTM)</p>
          <RichFieldGroup label="Title" f={f} set={set} base="c4Title" segments={[{ key: 'c4Title' }]} />
          <RichFieldGroup label="Body" f={f} set={set} base="c4Body" segments={[{ key: 'c4Body' }]} />
          <ImageField label="Image" {...imageI18nProps(f, "c4Image", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 5 — Right bottom (AI Agents)</p>
          <RichFieldGroup label="Title" f={f} set={set} base="c5Title" segments={[{ key: 'c5Title' }]} />
          <RichFieldGroup label="Body" f={f} set={set} base="c5Body" segments={[{ key: 'c5Body' }]} />
          <ImageField label="Visual image" {...imageI18nProps(f, "c5Image", update)} />
        </div>
      );

    case 'slick-scai-video-showcase':
      return (
        <div className="space-y-4">
          <TextInput label="Video URL" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Thumbnail" {...imageI18nProps(f, "posterUrl", update)} />
        </div>
      );

    case 'slick-scai-agents':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          {([1,2,3,4,5,6,7,8] as const).map(n => (
            <div key={n}>
              <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px' }}>Agent {n}</p>
              <ImageField label={`Agent ${n} avatar`} {...imageI18nProps(f, `a${n}Img`, update)} />
              <TextInput label="Title (before teal)" value={f[`a${n}TitlePre`] as string ?? ''} onChange={(v) => set(`a${n}TitlePre`, v)} />
              <TextInput label="Title (teal word)" value={f[`a${n}TitleTeal`] as string ?? ''} onChange={(v) => set(`a${n}TitleTeal`, v)} />
              <TextInput label="Title (after teal)" value={f[`a${n}TitlePost`] as string ?? ''} onChange={(v) => set(`a${n}TitlePost`, v)} />
              <Textarea label="Body" value={f[`a${n}Body`] as string ?? ''} onChange={(v) => set(`a${n}Body`, v)} />
            </div>
          ))}
        </div>
      );

    case 'slick-scai-how-it-works':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Section image" {...imageI18nProps(f, "sectionImg", update)} />
        </div>
      );

    case 'slick-scai-hero-v2':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading line 1 (dark)" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Heading line 2 (teal)" f={f} set={set} base="headingLine2" segments={[{ key: 'headingLine2' }]} />
          <RichFieldGroup label="Sub Normal" f={f} set={set} base="subNormal" segments={[{ key: 'subNormal' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Promo Normal" f={f} set={set} base="promoNormal" segments={[{ key: 'promoNormal' }]} />
          <RichFieldGroup label="Promo Teal" f={f} set={set} base="promoTeal" segments={[{ key: 'promoTeal' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Center agent image" {...imageI18nProps(f, "imgCenter", update)} />
          <ImageField label="Left UI screenshot" {...imageI18nProps(f, "imgLeft", update)} />
          <ImageField label="Right UI screenshot" {...imageI18nProps(f, "imgRight", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Card 1 value (top-left)" f={f} set={set} base="c1Val" segments={[{ key: 'c1Val' }]} />
          <RichFieldGroup label="Card 1 label" f={f} set={set} base="c1Lbl" segments={[{ key: 'c1Lbl' }]} />
          <RichFieldGroup label="Card 2 value (top-right)" f={f} set={set} base="c2Val" segments={[{ key: 'c2Val' }]} />
          <RichFieldGroup label="Card 2 label" f={f} set={set} base="c2Lbl" segments={[{ key: 'c2Lbl' }]} />
          <RichFieldGroup label="Card 3 value (bottom-left)" f={f} set={set} base="c3Val" segments={[{ key: 'c3Val' }]} />
          <RichFieldGroup label="Card 3 label" f={f} set={set} base="c3Lbl" segments={[{ key: 'c3Lbl' }]} />
          <RichFieldGroup label="Card 4 value (bottom-right)" f={f} set={set} base="c4Val" segments={[{ key: 'c4Val' }]} />
          <RichFieldGroup label="Card 4 label" f={f} set={set} base="c4Lbl" segments={[{ key: 'c4Lbl' }]} />
        </div>
      );

    case 'slick-scai-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading line 1" f={f} set={set} base="headingLine1" segments={[{ key: 'headingLine1' }]} />
          <RichFieldGroup label="Badge Pre" f={f} set={set} base="badgePre" segments={[{ key: 'badgePre' }]} />
          <RichFieldGroup label="Badge Highlight" f={f} set={set} base="badgeHighlight" segments={[{ key: 'badgeHighlight' }]} />
          <RichFieldGroup label="Body Bold" f={f} set={set} base="bodyBold" segments={[{ key: 'bodyBold' }]} />
          <RichFieldGroup label="Body" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="primaryCtaLabel" segments={[{ key: 'primaryCtaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ghostCtaLabel" segments={[{ key: 'ghostCtaLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ghostCtaUrl as string ?? ''} onChange={(v) => set('ghostCtaUrl', v)} />
          <RichFieldGroup label="Credits label" f={f} set={set} base="creditsLabel" segments={[{ key: 'creditsLabel' }]} />
          <RichFieldGroup label="Credits highlight (teal)" f={f} set={set} base="creditsHighlight" segments={[{ key: 'creditsHighlight' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Register URL (post-call CTA)" value={f.registerUrl as string ?? ''} onChange={(v) => set('registerUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Avatar image" {...imageI18nProps(f, "avatarUrl", update)} />
          <RichFieldGroup label="Mic label (Tap to Talk)" f={f} set={set} base="micLabel" segments={[{ key: 'micLabel' }]} />
          <RichFieldGroup label="Mic sub-label" f={f} set={set} base="micSub" segments={[{ key: 'micSub' }]} />
          <RichFieldGroup label="Language label" f={f} set={set} base="langLabel" segments={[{ key: 'langLabel' }]} />
          <ImageField label="Language flag URL" {...imageI18nProps(f, "langFlag", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Typewriter phrases"
            items={(f.typedPhrases as string[]) ?? []}
            onChange={(v) => set('typedPhrases', v)}
            newItem={() => 'New phrase'}
            itemPreview={(s) => s || '(empty)'}
            renderItem={(s, u) => <TextInput label="Phrase" value={s} onChange={u} />}
          />
        </div>
      );

    case 'slick-sc-privacy-policy':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Hero subheading" f={f} set={set} base="heroSub" segments={[{ key: 'heroSub' }]} />
          <RichFieldGroup label="Effective date" f={f} set={set} base="effectiveDate" segments={[{ key: 'effectiveDate' }]} />
        </div>
      );

    case 'slick-sc-platform-grid': {
      type PlatformItem = { titleBold: string; titleLight: string; icon: string; tags: string[]; href: string; iconImage?: string; iconBg?: string };
      const PG_ICON_OPTS = [
        'buildings','plant','binoculars','chart-line-up','warehouse','barn','shopping-cart','truck',
        'scan','camera','device-mobile-camera','headset','chalkboard-teacher','brain','rocket-launch',
        'megaphone-simple','target','list-checks','airplane-tilt','coins','map-pin-plus','currency-inr',
        'whatsapp-logo','wallet',
      ] as const;
      const PG_CATS = [
        { key: 'sales', label: 'Sales Teams' }, { key: 'trade', label: 'Trade Partners' },
        { key: 'image', label: 'Image Recognition' }, { key: 'agents', label: 'AI Agents' },
        { key: 'plugins', label: 'AI Plugins' }, { key: 'connectors', label: 'Connectors' },
      ] as const;
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge text" f={f} set={set} base="eyebrowLabel" segments={[{ key: 'eyebrowLabel' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Footer pre-text" f={f} set={set} base="ctaPreText" segments={[{ key: 'ctaPreText' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<PlatformItem>
            label="Product cards"
            items={(f.items as PlatformItem[]) ?? []}
            onChange={(v) => set('items', v)}
            newItem={() => ({ titleBold: 'AI Native', titleLight: 'New Product', icon: 'buildings', tags: ['sales'], href: '#' })}
            itemPreview={(it) => `${it.titleBold} ${it.titleLight}`}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title (bold)" {...richItemProps(it, 'titleBold', u)} />
                <RichTextInput label="Title (light)" {...richItemProps(it, 'titleLight', u)} />
                <TextInput label="Link URL" value={it.href} onChange={(v) => u({ ...it, href: v })} />
                <ImageField label="Upload icon (overrides the built-in icon below when set)" {...imageI18nProps(it, "iconImage", (p) => u({ ...it, ...p }))} />
                <ColorPicker label="Icon card background (blank = category tint)" value={it.iconBg ?? ''} onChange={(v) => u({ ...it, iconBg: v })} />
                <div className="text-xs text-slate-400">Built-in icon</div>
                <div className="flex gap-1.5 flex-wrap">
                  {PG_ICON_OPTS.map(ico => (
                    <button key={ico} onClick={() => u({ ...it, icon: ico })}
                      className={`px-2 py-1 text-xs rounded ${it.icon === ico ? 'bg-teal-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      {ico}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-400">Categories</div>
                <div className="flex gap-1.5 flex-wrap">
                  {PG_CATS.map(cat => {
                    const active = it.tags.includes(cat.key);
                    return (
                      <button key={cat.key}
                        onClick={() => u({ ...it, tags: active ? it.tags.filter(t => t !== cat.key) : [...it.tags, cat.key] })}
                        className={`px-2 py-1 text-xs rounded ${active ? 'bg-teal-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-conclave-hero': {
      return (
        <div className="space-y-4">
          <ImageField label="Branding image (logo + heading as one image)" {...imageI18nProps(f, "brandingImageSrc", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Date" f={f} set={set} base="date" segments={[{ key: 'date' }]} />
          <RichFieldGroup label="Venue" f={f} set={set} base="venue" segments={[{ key: 'venue' }]} />
          <p className="text-xs text-slate-400">Portrait photos (scrolling strip — add as many as needed)</p>
          {((f.photos as string[]) ?? []).map((src: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <ImageField label={`Photo ${i + 1}`} value={src} onChange={(v) => { const arr = [...((f.photos as string[]) ?? [])]; arr[i] = v; set('photos', arr); }} />
              </div>
              <button type="button" className="text-xs text-red-400 hover:text-red-300 px-2 py-1 mt-5" onClick={() => { const arr = [...((f.photos as string[]) ?? [])]; arr.splice(i, 1); set('photos', arr); }}>✕</button>
            </div>
          ))}
          <button type="button" className="text-xs text-teal-400 hover:text-teal-300" onClick={() => set('photos', [...((f.photos as string[]) ?? []), ''])}>+ Add photo</button>
        </div>
      );
    }

    case 'slick-conclave-speakers': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading part 1" f={f} set={set} base="heading1" segments={[{ key: 'heading1' }]} />
          <RichFieldGroup label="Heading part 2 (teal)" f={f} set={set} base="heading2" segments={[{ key: 'heading2' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Photos"
            items={(f.photos as string[]) ?? []}
            onChange={(v) => set('photos', v)}
            newItem={() => ''}
            itemPreview={(url) => url ? url.split('/').pop() ?? 'photo' : '(empty)'}
            renderItem={(url, update) => (
              <ImageField label="Photo URL" value={url ?? ''} onChange={(v) => update(v)} />
            )}
          />
        </div>
      );
    }

    case 'slick-conclave-agenda':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Section heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Agenda image" {...imageI18nProps(f, "agendaImage", update)} />
        </div>
      );

    case 'slick-conclave-stats': {
      type Stat = { value: string; label: string; sublabel?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow line 1" f={f} set={set} base="eyebrow1" segments={[{ key: 'eyebrow1' }]} />
          <RichFieldGroup label="Eyebrow line 2 (teal)" f={f} set={set} base="eyebrow2" segments={[{ key: 'eyebrow2' }]} />
          <ImageField label="Banner image (full-width)" {...imageI18nProps(f, "bannerImage", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<Stat>
            label="Stats"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '10+', label: 'Leaders', sublabel: '' })}
            itemPreview={(s) => `${s.value} ${s.label}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value" {...richItemProps(s, 'value', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'label', u)} />
                <RichTextInput label="Sublabel" {...richItemProps(s, 'sublabel', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-saudi-presence': {
      type Card = { image?: string; captionBold?: string; captionRest?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Heading Suffix" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<Card>
            label="Cards"
            items={(f.cards as Card[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ image: '', captionBold: '', captionRest: '' })}
            itemPreview={(c) => c.captionBold || 'Card'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Image" {...imageI18nProps(c, "image", (p) => u({ ...c, ...p }))} />
                <RichTextInput label="Caption bold" {...richItemProps(c, 'captionBold', u)} />
                <RichTextInput label="Caption rest" {...richItemProps(c, 'captionRest', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-saudi-platform': {
      return (
        <div className="space-y-4">
          <VideoField label="Upload video (mp4/webm) — overrides image" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <TextInput label="…or paste a video link (mp4/webm plays inline, or a YouTube URL)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Section image (full-width) — also the video poster" {...imageI18nProps(f, "imageSrc", update)} />
          <RichFieldGroup label="CTA label (HTML ok)" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sc-saudi-video': {
      return (
        <div className="space-y-4">
          <TextInput label="YouTube URL / Shorts (overrides image)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} placeholder="youtube.com/watch?v=… or youtube.com/shorts/…" />
          <ImageField label="Fallback image" {...imageI18nProps(f, "imageSrc", update)} />
          <RichFieldGroup label="CTA label (HTML ok)" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sc-saudi-products': {
      type ProductItem = { pill?: string; headingWhite?: string; headingTeal?: string; description?: string; features?: Array<{ label: string; text: string }>; ctaLabel?: string; ctaHref?: string; imageSrc?: string; videoSrc?: string; };
      type FeatureItem = { label: string; text: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow pill" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<ProductItem>
            label="Products"
            items={(f.products as ProductItem[]) ?? []}
            onChange={(v) => set('products', v)}
            newItem={() => ({ pill: '', headingWhite: 'AI Native', headingTeal: 'Product', description: '', features: [], ctaLabel: 'Know More', ctaHref: '#', imageSrc: '', videoSrc: '' })}
            itemPreview={(p) => `${p.headingWhite ?? ''} ${p.headingTeal ?? ''}`.trim() || '(empty)'}
            renderItem={(p, u) => (
              <div className="space-y-3">
                <RichTextInput label="Pill tag" {...richItemProps(p, 'pill', u)} />
                <RichTextInput label="Heading (white)" {...richItemProps(p, 'headingWhite', u)} />
                <RichTextInput label="Heading (teal)" {...richItemProps(p, 'headingTeal', u)} />
                <RichTextInput label="Description" {...richItemProps(p, 'description', u)} />
                <Repeater<FeatureItem>
                  label="Features"
                  items={p.features ?? []}
                  onChange={(v) => u({ ...p, features: v })}
                  newItem={() => ({ label: 'Feature', text: '' })}
                  itemPreview={(feat) => feat.label || '(empty)'}
                  renderItem={(feat, uf) => (
                    <div className="space-y-2">
                      <RichTextInput label="Bold label" {...richItemProps(feat, 'label', uf)} />
                      <RichTextInput label="Description" {...richItemProps(feat, 'text', uf)} />
                    </div>
                  )}
                />
                <RichTextInput label="CTA label" {...richItemProps(p, 'ctaLabel', u)} />
                <TextInput label="CTA URL" value={p.ctaHref ?? ''} onChange={(v) => u({ ...p, ctaHref: v })} />
                <ImageField label="Product image (also used as video poster)" {...imageI18nProps(p, "imageSrc", (patch) => u({ ...p, ...patch }))} />
                <VideoField label="Product video — upload (autoplays; overrides image when set)" value={p.videoSrc ?? ''} onChange={(v) => u({ ...p, videoSrc: v })} />
                <TextInput label="…or paste a video link (mp4/webm URL)" value={p.videoSrc ?? ''} onChange={(v) => u({ ...p, videoSrc: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-saudi-leadership': {
      type Card = { image?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill text" f={f} set={set} base="pillText" segments={[{ key: 'pillText' }]} />
          <RichFieldGroup label="Heading White" f={f} set={set} base="headingWhite" segments={[{ key: 'headingWhite' }]} />
          <RichFieldGroup label="Heading Teal" f={f} set={set} base="headingTeal" segments={[{ key: 'headingTeal' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<Card>
            label="Cards"
            items={(f.cards as Card[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ image: '' })}
            itemPreview={(_, i) => `Card ${i + 1}`}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Image" {...imageI18nProps(c, "image", (p) => u({ ...c, ...p }))} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-saudi-hero': {
      type RoleItem = { title: string; subtitle: string };
      return (
        <div className="space-y-4">
          <ImageField label="Logo" {...imageI18nProps(f, "logoSrc", update)} />
          <RichFieldGroup label="Eyebrow text" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading English" f={f} set={set} base="headingEn" segments={[{ key: 'headingEn' }]} />
          <RichFieldGroup label="Heading Arabic" f={f} set={set} base="headingAr" segments={[{ key: 'headingAr' }]} />
            <RichFieldGroup label="Subtext line" f={f} set={set} base="subtext" segments={[{ key: 'subtext' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs text-slate-500">Person photos (4 — 2 left, 2 right)</p>
          {[0, 1, 2, 3].map(i => (
            <ImageField key={i} label={`Photo ${i + 1}`} value={((f.photos as string[]) ?? [])[i] ?? ''} onChange={(v) => { const arr = [...((f.photos as string[]) ?? ['','','',''])]; arr[i] = v; set('photos', arr); }} />
          ))}
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Map image (optional)" {...imageI18nProps(f, "mapSrc", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Stat value" f={f} set={set} base="statValue" segments={[{ key: 'statValue' }]} />
          <RichFieldGroup label="Stat label" f={f} set={set} base="statLabel" segments={[{ key: 'statLabel' }]} />
          <RichFieldGroup label="Stat description" f={f} set={set} base="statDesc" segments={[{ key: 'statDesc' }]} />
          <RichFieldGroup label="Stat highlight (teal)" f={f} set={set} base="statHighlight" segments={[{ key: 'statHighlight' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<RoleItem>
            label="Team roles"
            items={(f.roles as RoleItem[]) ?? []}
            onChange={(v) => set('roles', v)}
            newItem={() => ({ title: 'Role Title', subtitle: 'Native Arabic/English Speaker' })}
            itemPreview={(r) => r.title || '(empty)'}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(r, 'title', u)} />
                <RichTextInput label="Subtitle" {...richItemProps(r, 'subtitle', u)} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Language card title" f={f} set={set} base="langTitle" segments={[{ key: 'langTitle' }]} />
          <RichFieldGroup label="Language card body" f={f} set={set} base="langBody" segments={[{ key: 'langBody' }]} />
          <ImageField label="Language card image" {...imageI18nProps(f, "langImageSrc", update)} />
          <RichFieldGroup label="ZATCA card title" f={f} set={set} base="zatcaTitle" segments={[{ key: 'zatcaTitle' }]} />
          <RichFieldGroup label="ZATCA card body" f={f} set={set} base="zatcaBody" segments={[{ key: 'zatcaBody' }]} />
          <ImageField label="ZATCA card image" {...imageI18nProps(f, "zatcaImageSrc", update)} />
          <RichFieldGroup label="Channel card title" f={f} set={set} base="channelTitle" segments={[{ key: 'channelTitle' }]} />
          <RichFieldGroup label="Channel card body" f={f} set={set} base="channelBody" segments={[{ key: 'channelBody' }]} />
          <ImageField label="Channel card image" {...imageI18nProps(f, "channelImageSrc", update)} />
          <ImageField label="Roles section image (replaces map + roles)" {...imageI18nProps(f, "rolesImageSrc", update)} />
          <ImageField label="Bottom right image" {...imageI18nProps(f, "bottomImageSrc", update)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label (HTML ok)" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-conclave-guests': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading part 1" f={f} set={set} base="heading1" segments={[{ key: 'heading1' }]} />
          <RichFieldGroup label="Heading part 2 (teal)" f={f} set={set} base="heading2" segments={[{ key: 'heading2' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Photos"
            items={(f.photos as string[]) ?? []}
            onChange={(v) => set('photos', v)}
            newItem={() => ''}
            itemPreview={(url) => url ? url.split('/').pop() ?? 'photo' : '(empty)'}
            renderItem={(url, update) => (
              <ImageField label="Photo URL" value={url ?? ''} onChange={(v) => update(v)} />
            )}
          />
        </div>
      );
    }

    case 'slick-conclave-register':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading line 1" f={f} set={set} base="heading1" segments={[{ key: 'heading1' }]} />
          <RichFieldGroup label="Heading line 2 (teal)" f={f} set={set} base="heading2" segments={[{ key: 'heading2' }]} />
          <RichFieldGroup label="Date" f={f} set={set} base="date" segments={[{ key: 'date' }]} />
          <RichFieldGroup label="Venue" f={f} set={set} base="venue" segments={[{ key: 'venue' }]} />
          <RichFieldGroup label="Form heading line 1 (teal)" f={f} set={set} base="formHeading1" segments={[{ key: 'formHeading1' }]} />
          <RichFieldGroup label="Form heading line 2 (white)" f={f} set={set} base="formHeading2" segments={[{ key: 'formHeading2' }]} />
          <RichFieldGroup label="Submit button label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Form endpoint URL" value={f.formEndpoint as string ?? ''} onChange={(v) => set('formEndpoint', v)} />
        </div>
      );

    case 'slick-ac-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill (bold prefix)" f={f} set={set} base="pillPre" segments={[{ key: 'pillPre' }]} />
          <RichFieldGroup label="Pill (rest)" f={f} set={set} base="pillPost" segments={[{ key: 'pillPost' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle (start)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero screenshot URL" {...imageI18nProps(f, "heroImageUrl", update)} />
          <TextInput label="Hero image alt" value={f.heroImageAlt as string ?? ''} onChange={(v) => set('heroImageAlt', v)} />
          <ImageSizeControls
            widthKey="heroImageMaxWidth" heightKey="heroImageHeight" aspectRatioKey="heroImageAspectRatio" fitKey="heroImageFit"
            f={f} set={set} defaults={{ width: 980, height: 420, fit: 'contain' }}
          />
        </div>
      );

    case 'slick-ac-how-it-works': {
      type HiwStep = { title: string; desc: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <ImageField label="Center circle photo URL" {...imageI18nProps(f, "centerImageUrl", update)} />
          <Select<ObjectFitValue>
            label="Object-fit (frame size is fixed — tied to the spinning ring graphic)"
            value={(f.centerImageFit as ObjectFitValue) ?? 'cover'}
            onChange={(v) => set('centerImageFit', v)}
            options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
          />
          <Repeater<HiwStep>
            label="Steps (3)"
            items={(f.steps as HiwStep[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ title: 'STEP', desc: 'Step description.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title (e.g. SETUP)" {...richItemProps(s, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(s, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-problem': {
      type ProbCard = { icon: string; title: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge (red)" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading (pre)" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading red word 1" f={f} set={set} base="headingRed1" segments={[{ key: 'headingRed1' }]} />
          <RichFieldGroup label="Heading (mid)" f={f} set={set} base="headingMid" segments={[{ key: 'headingMid' }]} />
          <RichFieldGroup label="Heading red word 2" f={f} set={set} base="headingRed2" segments={[{ key: 'headingRed2' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ProbCard>
            label="Problem cards (5)"
            items={(f.cards as ProbCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: 'head', title: 'Problem' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (head / msg / eye / target / chart)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
              </div>
            )}
          />
          <RichFieldGroup label="Stat number (e.g. 3–8% Sales Lost)" f={f} set={set} base="statNum" segments={[{ key: 'statNum' }]} />
          <RichFieldGroup label="Stat Pre" f={f} set={set} base="statPre" segments={[{ key: 'statPre' }]} />
          <RichFieldGroup label="Stat Bold" f={f} set={set} base="statBold" segments={[{ key: 'statBold' }]} />
        </div>
      );
    }

    case 'slick-ac-capabilities': {
      type CapCard = { icon: string; title: string; desc: string; highlight?: boolean };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<CapCard>
            label="Capability cards (6)"
            items={(f.cards as CapCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: 'spark', title: 'Feature', desc: 'Feature description.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (refresh / head / target / msg / chart / spark)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(c, 'desc', u)} />
                <Toggle label="Highlight card (teal gradient)" value={c.highlight ?? false} onChange={(v) => u({ ...c, highlight: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-stats': {
      type Stat = { num: string; unit: string; label: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <Repeater<Stat>
            label="Stats (4 columns)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ num: '0', unit: '%', label: 'Stat label' })}
            itemPreview={(s) => `${s.num}${s.unit}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'num', u)} />
                <RichTextInput label="Unit (%, min, /7…)" {...richItemProps(s, 'unit', u)} />
                <RichTextInput label="Label (use line break for 2 lines)" {...richItemProps(s, 'label', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-execution': {
      type ExecCard = { icon: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ExecCard>
            label="Cards (5)"
            items={(f.cards as ExecCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: 'apps', title: 'Card', desc: 'Card description.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (apps / box / phone / clock / user)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(c, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-pitch': {
      type PitchTab = { icon: string; title: string; desc: string; imageUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<PitchTab>
            label="Tabs (4) — phone mockup"
            items={(f.tabs as PitchTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ icon: 'eye', title: 'Tab', desc: 'Tab description.', imageUrl: '' })}
            itemPreview={(t) => t.title}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (eye / head / mic / msg)" value={t.icon ?? ''} onChange={(v) => u({ ...t, icon: v })} />
                <RichTextInput label="Title" {...richItemProps(t, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(t, 'desc', u)} />
                <ImageField label="Phone screen image URL" {...imageI18nProps(t, "imageUrl", (p) => u({ ...t, ...p }))} />
              </div>
            )}
          />
          <ImageSizeControls
            widthKey="frameWidth" heightKey="frameHeight" aspectRatioKey="frameAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ width: 300, height: 600, fit: 'cover' }}
          />
        </div>
      );
    }

    case 'slick-ac-scenario': {
      type ScTab = { icon: string; title: string; desc: string; imageUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ScTab>
            label="Tabs (3) — phone mockup"
            items={(f.tabs as ScTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ icon: 'bolt', title: 'Scenario', desc: 'Scenario description.', imageUrl: '' })}
            itemPreview={(t) => t.title}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (bolt / chart / mic)" value={t.icon ?? ''} onChange={(v) => u({ ...t, icon: v })} />
                <RichTextInput label="Title" {...richItemProps(t, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(t, 'desc', u)} />
                <ImageField label="Phone screen image URL" {...imageI18nProps(t, "imageUrl", (p) => u({ ...t, ...p }))} />
              </div>
            )}
          />
          <ImageSizeControls
            widthKey="frameWidth" heightKey="frameHeight" aspectRatioKey="frameAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ width: 300, height: 600, fit: 'cover' }}
          />
        </div>
      );
    }

    case 'slick-ac-launch': {
      type LaunchStep = { icon: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <Repeater<LaunchStep>
            label="Steps (3)"
            items={(f.steps as LaunchStep[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ icon: 'rocket', title: 'Step', desc: 'Step description.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (users / database / rocket)" value={s.icon ?? ''} onChange={(v) => u({ ...s, icon: v })} />
                <RichTextInput label="Title" {...richItemProps(s, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(s, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-objections':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Teal lead line" f={f} set={set} base="tealLine" segments={[{ key: 'tealLine' }]} />
          <RichFieldGroup label="Body paragraph" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <TextInput label="YouTube video link" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Thumbnail / image (shown before play, or standalone if no video)" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="frameWidth" heightKey="frameHeight" aspectRatioKey="frameAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ width: 330, height: 500, fit: 'cover' }}
          />
        </div>
      );

    case 'slick-ac-backend': {
      type BeTab = { title: string; desc: string; imageUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<BeTab>
            label="Tabs (3) — wide image"
            items={(f.tabs as BeTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ title: 'Role', desc: 'Role description.', imageUrl: '' })}
            itemPreview={(t) => t.title}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(t, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(t, 'desc', u)} />
                <ImageField label="View image URL" {...imageI18nProps(t, "imageUrl", (p) => u({ ...t, ...p }))} />
              </div>
            )}
          />
          <ImageSizeControls
            widthKey="imageMaxWidth" heightKey="imageHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ width: 540, height: 420, fit: 'cover' }}
          />
        </div>
      );
    }

    case 'slick-ac-brand-strip': {
      type Logo = { imageUrl?: string; alt?: string; width?: number; height?: number; fit?: ObjectFitValue };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Label" f={f} set={set} base="label" segments={[{ key: 'label' }]} />
          <NumberInput label="Scroll speed (seconds)" value={(f.speedSeconds as number) ?? 30} onChange={(v) => set('speedSeconds', v)} />
          <Repeater<Logo>
            label="Logos"
            items={(f.logos as Logo[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ imageUrl: '', alt: 'Logo' })}
            itemPreview={(l) => l.alt || l.imageUrl || '(empty)'}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <ImageField label="Logo image URL" {...imageI18nProps(l, "imageUrl", (p) => u({ ...l, ...p }))} />
                <TextInput label="Alt / placeholder" value={l.alt ?? ''} onChange={(v) => u({ ...l, alt: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Width (px)" value={l.width ?? 120} onChange={(v) => u({ ...l, width: v })} />
                  <NumberInput label="Height (px)" value={l.height ?? 40} onChange={(v) => u({ ...l, height: v })} />
                </div>
                <Select<ObjectFitValue>
                  label="Object-fit"
                  value={l.fit ?? 'contain'}
                  onChange={(v) => u({ ...l, fit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-cta': {
      type CheckItem = { text: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge (with shield)" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Line1 Pre" f={f} set={set} base="headingLine1Pre" segments={[{ key: 'headingLine1Pre' }]} />
          <RichFieldGroup label="Heading Line1 Grad" f={f} set={set} base="headingLine1Grad" segments={[{ key: 'headingLine1Grad' }]} />
          <RichFieldGroup label="Heading Line2 Pre" f={f} set={set} base="headingLine2Pre" segments={[{ key: 'headingLine2Pre' }]} />
          <RichFieldGroup label="Heading Line2 Grad" f={f} set={set} base="headingLine2Grad" segments={[{ key: 'headingLine2Grad' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <TextInput label="Email placeholder" value={f.emailPlaceholder as string ?? ''} onChange={(v) => set('emailPlaceholder', v)} />
          <RichFieldGroup label="CTA button label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <Repeater<CheckItem>
            label="Check bullets (3)"
            items={(f.checks as CheckItem[]) ?? []}
            onChange={(v) => set('checks', v)}
            newItem={() => ({ text: 'Benefit text' })}
            itemPreview={(c) => c.text}
            renderItem={(c, u) => (
              <RichTextInput label="Text" {...richItemProps(c, 'text', u)} />
            )}
          />
        </div>
      );
    }


    case 'slick-da-hero': {
      type Chip = { val: string; lbl: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Sub Pre" f={f} set={set} base="subPre" segments={[{ key: 'subPre' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Subtitle (tail)" f={f} set={set} base="subPost" segments={[{ key: 'subPost' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero screenshot URL" {...imageI18nProps(f, "mockImageUrl", update)} />
          <TextInput label="Hero image alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <ImageSizeControls
            widthKey="mockImageMaxWidth" aspectRatioKey="mockImageAspectRatio" fitKey="mockImageFit"
            f={f} set={set} defaults={{ width: 980, fit: 'contain' }} withHeight={false}
          />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ val: '[V]', lbl: 'Metric label' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Value (or [Vx] placeholder)" value={c.val ?? ''} onChange={(v) => u({ ...c, val: v })} />
                <RichTextInput label="Label" {...richItemProps(c, 'lbl', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-brand-strip': {
      type Logo = { url?: string; label?: string; width?: number; height?: number; fit?: ObjectFitValue };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Heading — teal accent (optional)" f={f} set={set} base="headingGradient" segments={[{ key: 'headingGradient' }]} />
          <RichFieldGroup label="Heading — suffix (optional)" f={f} set={set} base="headingSuffix" segments={[{ key: 'headingSuffix' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stat cards (leave blank to hide)</p>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Stat 1 value" value={f.stat1Value as string ?? ''} onChange={(v) => set('stat1Value', v)} />
            <TextInput label="Stat 1 label" value={f.stat1Label as string ?? ''} onChange={(v) => set('stat1Label', v)} />
            <TextInput label="Stat 2 value" value={f.stat2Value as string ?? ''} onChange={(v) => set('stat2Value', v)} />
            <TextInput label="Stat 2 label" value={f.stat2Label as string ?? ''} onChange={(v) => set('stat2Label', v)} />
            <TextInput label="Stat 3 value" value={f.stat3Value as string ?? ''} onChange={(v) => set('stat3Value', v)} />
            <TextInput label="Stat 3 label" value={f.stat3Label as string ?? ''} onChange={(v) => set('stat3Label', v)} />
            <TextInput label="Stat 4 value" value={f.stat4Value as string ?? ''} onChange={(v) => set('stat4Value', v)} />
            <TextInput label="Stat 4 label" value={f.stat4Label as string ?? ''} onChange={(v) => set('stat4Label', v)} />
          </div>
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="CTA label (leave blank to hide)" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<Logo>
            label="Logos (static)"
            items={(f.logos as Logo[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ url: '', label: 'Customer' })}
            itemPreview={(l) => l.label || l.url || '(empty)'}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <ImageField label="Logo image URL" {...imageI18nProps(l, "url", (p) => u({ ...l, ...p }))} />
                <RichTextInput label="Label / alt" {...richItemProps(l, 'label', u)} />
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Max width (px)" value={l.width ?? 118} onChange={(v) => u({ ...l, width: v })} />
                  <NumberInput label="Max height (px)" value={l.height ?? 44} onChange={(v) => u({ ...l, height: v })} />
                </div>
                <Select<ObjectFitValue>
                  label="Object-fit"
                  value={l.fit ?? 'contain'}
                  onChange={(v) => u({ ...l, fit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-problem': {
      type StatCite = { label: string; big: string; claim: string; srcName: string; srcUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge (red)" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ label: 'Label', big: '00%', claim: 'Claim text.', srcName: 'Source (Year)', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Label (uppercase)" {...richItemProps(s, 'label', u)} />
                <RichTextInput label="Big number" {...richItemProps(s, 'big', u)} />
                <RichTextInput label="Claim" {...richItemProps(s, 'claim', u)} />
                <RichTextInput label="Source name" {...richItemProps(s, 'srcName', u)} />
                <TextInput label="Source URL" value={s.srcUrl ?? ''} onChange={(v) => u({ ...s, srcUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-darkpanel':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Body" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <ImageField label="Right image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" heightKey="imageMaxHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ height: 340, fit: 'contain' }}
          />
        </div>
      );

    case 'slick-da-workflow': {
      type FlowItem = { li1Bold: string; li1: string; li2Bold: string; li2: string };
      type Step = { num: string; title: string; benefit: string; items: FlowItem };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<Step>
            label="Steps (4)"
            items={(f.steps as Step[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ num: '0X', title: 'Step', benefit: 'Benefit', items: { li1Bold: 'Bold:', li1: ' rest.', li2Bold: 'Bold:', li2: ' rest.' } })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'num', u)} />
                <RichTextInput label="Title" {...richItemProps(s, 'title', u)} />
                <RichTextInput label="Benefit pill" {...richItemProps(s, 'benefit', u)} />
                <TextInput label="Line 1 bold" value={s.items?.li1Bold ?? ''} onChange={(v) => u({ ...s, items: { ...s.items, li1Bold: v } })} />
                <TextInput label="Line 1 rest" value={s.items?.li1 ?? ''} onChange={(v) => u({ ...s, items: { ...s.items, li1: v } })} />
                <TextInput label="Line 2 bold" value={s.items?.li2Bold ?? ''} onChange={(v) => u({ ...s, items: { ...s.items, li2Bold: v } })} />
                <TextInput label="Line 2 rest" value={s.items?.li2 ?? ''} onChange={(v) => u({ ...s, items: { ...s.items, li2: v } })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-capabilities': {
      type CapCard = { imageUrl?: string; imageAlt?: string; imageFit?: ObjectFitValue; title: string; benefit: string; descPre?: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<CapCard>
            label="Capability cards (8)"
            items={(f.cards as CapCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', title: 'Capability', benefit: 'Benefit', descPre: '', descBold: 'Bold', descTail: ' rest.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail image URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <Select<ObjectFitValue>
                  label="Object-fit (thumbnail frame size is fixed by the grid)"
                  value={c.imageFit ?? 'contain'}
                  onChange={(v) => u({ ...c, imageFit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Benefit pill" {...richItemProps(c, 'benefit', u)} />
                <RichTextInput label="Desc (before bold)" {...richItemProps(c, 'descPre', u)} />
                <RichTextInput label="Desc (bold)" {...richItemProps(c, 'descBold', u)} />
                <RichTextInput label="Desc (after bold)" {...richItemProps(c, 'descTail', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-split': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Body Pre" f={f} set={set} base="bodyPre" segments={[{ key: 'bodyPre' }]} />
          <RichFieldGroup label="Body Bold1" f={f} set={set} base="bodyBold1" segments={[{ key: 'bodyBold1' }]} />
          <RichFieldGroup label="Body Mid" f={f} set={set} base="bodyMid" segments={[{ key: 'bodyMid' }]} />
          <RichFieldGroup label="Body Bold2" f={f} set={set} base="bodyBold2" segments={[{ key: 'bodyBold2' }]} />
          <RichFieldGroup label="Body Tail" f={f} set={set} base="bodyTail" segments={[{ key: 'bodyTail' }]} />
          <Repeater<string>
            label="Feature chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New chip'}
            itemPreview={(c) => c || '(empty)'}
            renderItem={(c, u) => (
              <TextInput label="Chip" value={c ?? ''} onChange={(v) => u(v)} />
            )}
          />
          <ImageField label="Right image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" heightKey="imageMaxHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ height: 420, fit: 'contain' }}
          />
        </div>
      );
    }

    case 'slick-da-impact': {
      type IStat = { v: string; k: string; sub: string };
      type ICard = { title: string; bodyPre: string; bodyBold: string; bodyTail: string; imageUrl?: string; imageFit?: ObjectFitValue; stats: IStat[] };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ICard>
            label="Impact cards (3)"
            items={(f.cards as ICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Impact', bodyPre: 'Text ', bodyBold: 'bold', bodyTail: '.', imageUrl: '', stats: [ { v: '00%', k: 'metric', sub: 'note' }, { v: '00%', k: 'metric', sub: 'note' } ] })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (before bold)" {...richItemProps(c, 'bodyPre', u)} />
                <RichTextInput label="Body (bold)" {...richItemProps(c, 'bodyBold', u)} />
                <RichTextInput label="Body (after bold)" {...richItemProps(c, 'bodyTail', u)} />
                <ImageField label="Viz image URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <Select<ObjectFitValue>
                  label="Object-fit (viz frame size is fixed by the grid)"
                  value={c.imageFit ?? 'contain'}
                  onChange={(v) => u({ ...c, imageFit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
                <Repeater<IStat>
                  label="Stats (2)"
                  items={c.stats ?? []}
                  onChange={(sv) => u({ ...c, stats: sv })}
                  newItem={() => ({ v: '00%', k: 'metric', sub: 'note' })}
                  itemPreview={(s) => s.k}
                  renderItem={(s, su) => (
                    <div className="space-y-2">
                      <TextInput label="Value (or [VERIFY: x])" value={s.v ?? ''} onChange={(v) => su({ ...s, v })} />
                      <RichTextInput label="Key" {...richItemProps(s, 'k', su)} />
                      <RichTextInput label="Sub-note" {...richItemProps(s, 'sub', su)} />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-proof': {
      type PCard = { title: string; bodyPre: string; bodyBold: string; bodyTail: string; v: string; k: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <Repeater<PCard>
            label="Proof cards (3)"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Proof', bodyPre: 'Text.', bodyBold: '', bodyTail: '', v: '00', k: 'metric' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (before bold)" {...richItemProps(c, 'bodyPre', u)} />
                <RichTextInput label="Body (bold, optional)" {...richItemProps(c, 'bodyBold', u)} />
                <RichTextInput label="Body (after bold)" {...richItemProps(c, 'bodyTail', u)} />
                <TextInput label="Value (or [VERIFY: x])" value={c.v ?? ''} onChange={(v) => u({ ...c, v })} />
                <RichTextInput label="Key" {...richItemProps(c, 'k', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-cta':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );


    case 'slick-pe-hero': {
      type Chip = { valPre: string; valAccent: string; valPost: string; lbl: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero mockup URL" {...imageI18nProps(f, "mockImageUrl", update)} />
          <TextInput label="Hero image alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <ImageSizeControls
            widthKey="mockImageMaxWidth" heightKey="mockImageMaxHeight" aspectRatioKey="mockImageAspectRatio" fitKey="mockImageFit"
            f={f} set={set} defaults={{ width: 680, height: 320, fit: 'cover' }}
          />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', valPost: '', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value (before accent)" {...richItemProps(c, 'valPre', u)} />
                <RichTextInput label="Accent (teal, e.g. + or arrow)" {...richItemProps(c, 'valAccent', u)} />
                <RichTextInput label="Value (after accent)" {...richItemProps(c, 'valPost', u)} />
                <RichTextInput label="Label" {...richItemProps(c, 'lbl', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-pe-statbar': {
      type Stat = { n: string; l: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'n', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'l', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-pe-problem': {
      type StatCite = { big: string; claim: string; srcName: string; srcUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill (coral)" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim text.', srcName: 'Source (Year)', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Big number (coral)" {...richItemProps(s, 'big', u)} />
                <RichTextInput label="Claim" {...richItemProps(s, 'claim', u)} />
                <RichTextInput label="Source name" {...richItemProps(s, 'srcName', u)} />
                <TextInput label="Source URL" value={s.srcUrl ?? ''} onChange={(v) => u({ ...s, srcUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-pe-darkpanel':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Body Pre" f={f} set={set} base="bodyPre" segments={[{ key: 'bodyPre' }]} />
          <RichFieldGroup label="Body Bold1" f={f} set={set} base="bodyBold1" segments={[{ key: 'bodyBold1' }]} />
          <RichFieldGroup label="Body Mid" f={f} set={set} base="bodyMid" segments={[{ key: 'bodyMid' }]} />
          <RichFieldGroup label="Body Bold2" f={f} set={set} base="bodyBold2" segments={[{ key: 'bodyBold2' }]} />
          <RichFieldGroup label="Body Tail" f={f} set={set} base="bodyTail" segments={[{ key: 'bodyTail' }]} />
          <ImageField label="Right image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <NumberInput label="Max width (px, 0 = unset)" value={(f.imageMaxWidth as number) ?? 0} onChange={(v) => set('imageMaxWidth', v)} />
          <TextInput
            label="Aspect ratio (e.g. 4/3) — optional, overrides natural image height"
            value={(f.imageAspectRatio as string) ?? ''}
            onChange={(v) => set('imageAspectRatio', v)}
          />
          <Select<ObjectFitValue>
            label="Object-fit (only applies when an aspect ratio is set above)"
            value={(f.imageFit as ObjectFitValue) ?? 'cover'}
            onChange={(v) => set('imageFit', v)}
            options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
          />
        </div>
      );

    case 'slick-pe-stages': {
      type Stage = { num: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<Stage>
            label="Steps (4)"
            items={(f.stages as Stage[]) ?? []}
            onChange={(v) => set('stages', v)}
            newItem={() => ({ num: '0', title: 'Step', desc: 'Step description.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'num', u)} />
                <RichTextInput label="Title" {...richItemProps(s, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(s, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-pe-capabilities': {
      type FCard = { imageUrl?: string; imageAlt?: string; imageAspectRatio?: string; imageFit?: ObjectFitValue; title: string; descPre?: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<FCard>
            label="Capability cards (6)"
            items={(f.cards as FCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', title: 'Capability', descPre: '', descBold: 'Bold', descTail: ' rest.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail image URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <TextInput
                  label="Aspect ratio (e.g. 4/3) — optional, overrides natural image height"
                  value={c.imageAspectRatio ?? ''}
                  onChange={(v) => u({ ...c, imageAspectRatio: v })}
                />
                <Select<ObjectFitValue>
                  label="Object-fit (only applies when an aspect ratio is set above)"
                  value={c.imageFit ?? 'cover'}
                  onChange={(v) => u({ ...c, imageFit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Desc (before bold)" {...richItemProps(c, 'descPre', u)} />
                <RichTextInput label="Desc (bold)" {...richItemProps(c, 'descBold', u)} />
                <RichTextInput label="Desc (after bold)" {...richItemProps(c, 'descTail', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-pe-split': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Body Pre" f={f} set={set} base="bodyPre" segments={[{ key: 'bodyPre' }]} />
          <RichFieldGroup label="Body Bold" f={f} set={set} base="bodyBold" segments={[{ key: 'bodyBold' }]} />
          <RichFieldGroup label="Body Tail" f={f} set={set} base="bodyTail" segments={[{ key: 'bodyTail' }]} />
          <Repeater<string>
            label="Lifecycle chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New step'}
            itemPreview={(c) => c || '(empty)'}
            renderItem={(c, u) => (
              <TextInput label="Chip" value={c ?? ''} onChange={(v) => u(v)} />
            )}
          />
          <ImageField label="Right image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <NumberInput label="Max width (px, 0 = unset)" value={(f.imageMaxWidth as number) ?? 0} onChange={(v) => set('imageMaxWidth', v)} />
          <TextInput
            label="Aspect ratio (e.g. 4/5) — optional, overrides natural image height"
            value={(f.imageAspectRatio as string) ?? ''}
            onChange={(v) => set('imageAspectRatio', v)}
          />
          <Select<ObjectFitValue>
            label="Object-fit (only applies when an aspect ratio is set above)"
            value={(f.imageFit as ObjectFitValue) ?? 'cover'}
            onChange={(v) => set('imageFit', v)}
            options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
          />
        </div>
      );
    }

    case 'slick-pe-impact': {
      type ICard = { title: string; body: string; imageUrl?: string; imageAlt?: string; imageFit?: ObjectFitValue };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ICard>
            label="Impact cards (3)"
            items={(f.cards as ICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Impact', body: 'Body text.', imageUrl: '' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(c, 'body', u)} />
                <ImageField label="Viz image URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <Select<ObjectFitValue>
                  label="Object-fit (viz frame size is fixed by the grid)"
                  value={c.imageFit ?? 'contain'}
                  onChange={(v) => u({ ...c, imageFit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
              </div>
            )}
          />
        </div>
      );
    }


    case 'slick-pe-proof': {
      type ProofCard = { title: string; body: string; value: string; note: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Tail" f={f} set={set} base="headingTail" segments={[{ key: 'headingTail' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ProofCard>
            label="Proof cards"
            items={(f.cards as ProofCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'KPI', body: 'Body text.', value: '0%', note: 'Note text.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(c, 'body', u)} />
                <RichTextInput label="Value (flagged)" {...richItemProps(c, 'value', u)} />
                <RichTextInput label="Note" {...richItemProps(c, 'note', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-pe-outcome-flow': {
      type OFCard = { title: string; desc: string };
      type OFStep = { text: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<OFCard>
            label="Outcome cards (exactly 8, in order)"
            items={(f.cards as OFCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'New outcome', desc: 'Description.' })}
            itemPreview={(c) => c.title || '(empty)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Description" value={c.desc ?? ''} onChange={(v) => u({ ...c, desc: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<OFStep>
            label="Step labels (exactly 4, one per pair of cards)"
            items={(f.steps as OFStep[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ text: 'New step' })}
            itemPreview={(s) => s.text || '(empty)'}
            renderItem={(s, u) => (
              <TextInput label="Text" value={s.text ?? ''} onChange={(v) => u({ ...s, text: v })} />
            )}
          />
        </div>
      );
    }

    case 'slick-rs-hero': {
      type Chip = { valPre: string; valAccent: string; valPost: string; lbl: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero mockup URL" {...imageI18nProps(f, "mockImageUrl", update)} />
          <TextInput label="Hero image alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <ImageSizeControls
            widthKey="mockImageMaxWidth" heightKey="mockImageMaxHeight" aspectRatioKey="mockImageAspectRatio" fitKey="mockImageFit"
            f={f} set={set} defaults={{ width: 1040, height: 380, fit: 'contain' }}
          />
          <RichFieldGroup label="Stat note" f={f} set={set} base="statNote" segments={[{ key: 'statNote' }]} />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', valPost: '', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value (before accent)" {...richItemProps(c, 'valPre', u)} />
                <RichTextInput label="Accent (teal, e.g. +)" {...richItemProps(c, 'valAccent', u)} />
                <RichTextInput label="Value (after accent)" {...richItemProps(c, 'valPost', u)} />
                <RichTextInput label="Label" {...richItemProps(c, 'lbl', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rs-brand-strip': {
      type Logo = { url?: string; label: string; width?: number; height?: number; fit?: ObjectFitValue };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<Logo>
            label="Logo slots"
            items={(f.logos as Logo[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ url: '', label: 'Customer name' })}
            itemPreview={(l) => l.label}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <ImageField label="Logo URL" {...imageI18nProps(l, "url", (p) => u({ ...l, ...p }))} />
                <RichTextInput label="Label / slot text" {...richItemProps(l, 'label', u)} />
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Width (px, 0 = auto)" value={l.width ?? 0} onChange={(v) => u({ ...l, width: v })} />
                  <NumberInput label="Height (px)" value={l.height ?? 44} onChange={(v) => u({ ...l, height: v })} />
                </div>
                <Select<ObjectFitValue>
                  label="Object-fit"
                  value={l.fit ?? 'contain'}
                  onChange={(v) => u({ ...l, fit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rs-problem': {
      type StatCite = { big: string; claim: string; srcName: string; srcUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim text.', srcName: 'Source (Year)', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Big number (red)" {...richItemProps(s, 'big', u)} />
                <RichTextInput label="Claim" {...richItemProps(s, 'claim', u)} />
                <RichTextInput label="Source name" {...richItemProps(s, 'srcName', u)} />
                <TextInput label="Source URL" value={s.srcUrl ?? ''} onChange={(v) => u({ ...s, srcUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rs-compare': {
      type CmpItem = { title: string; body: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Bad column label" f={f} set={set} base="badLabel" segments={[{ key: 'badLabel' }]} />
          <RichFieldGroup label="Good column label" f={f} set={set} base="goodLabel" segments={[{ key: 'goodLabel' }]} />
          <Repeater<CmpItem>
            label="Generic SFA items (bad)"
            items={(f.badItems as CmpItem[]) ?? []}
            onChange={(v) => set('badItems', v)}
            newItem={() => ({ title: 'Problem', body: 'Description.' })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(it, 'body', u)} />
              </div>
            )}
          />
          <Repeater<CmpItem>
            label="Salescode items (good)"
            items={(f.goodItems as CmpItem[]) ?? []}
            onChange={(v) => set('goodItems', v)}
            newItem={() => ({ title: 'Capability', body: 'Description.' })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(it, 'body', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rs-darkpanel':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Body" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <ImageField label="Right image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" heightKey="imageMaxHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ height: 320, fit: 'contain' }}
          />
        </div>
      );

    case 'slick-rs-problemgrid': {
      type ProbCard = { num: string; title: string; bodyPre: string; bodyBold: string; bodyTail: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ProbCard>
            label="Problem cards (6)"
            items={(f.cards as ProbCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ num: '0', title: 'Problem', bodyPre: '', bodyBold: 'Solution', bodyTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(c, 'num', u)} />
                <RichTextInput label="Title (problem)" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (before bold)" {...richItemProps(c, 'bodyPre', u)} />
                <RichTextInput label="Body (bold teal)" {...richItemProps(c, 'bodyBold', u)} />
                <RichTextInput label="Body (after bold)" {...richItemProps(c, 'bodyTail', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rs-capabilities': {
      type Cap = { icon: string; title: string; benefit: string; descPre: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<Cap>
            label="Capability cards (8)"
            items={(f.cards as Cap[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: '⭐', title: 'Capability', benefit: 'Benefit', descPre: '', descBold: 'Bold', descTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (emoji)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Benefit pill" {...richItemProps(c, 'benefit', u)} />
                <RichTextInput label="Desc (before bold)" {...richItemProps(c, 'descPre', u)} />
                <RichTextInput label="Desc (bold)" {...richItemProps(c, 'descBold', u)} />
                <RichTextInput label="Desc (after bold)" {...richItemProps(c, 'descTail', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rs-split': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Body Pre" f={f} set={set} base="bodyPre" segments={[{ key: 'bodyPre' }]} />
          <RichFieldGroup label="Body Bold1" f={f} set={set} base="bodyBold1" segments={[{ key: 'bodyBold1' }]} />
          <RichFieldGroup label="Body Mid" f={f} set={set} base="bodyMid" segments={[{ key: 'bodyMid' }]} />
          <RichFieldGroup label="Body Bold2" f={f} set={set} base="bodyBold2" segments={[{ key: 'bodyBold2' }]} />
          <RichFieldGroup label="Body Tail" f={f} set={set} base="bodyTail" segments={[{ key: 'bodyTail' }]} />
          <Repeater<string>
            label="Feature chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New chip'}
            itemPreview={(c) => c || '(empty)'}
            renderItem={(c, u) => (
              <TextInput label="Chip" value={c ?? ''} onChange={(v) => u(v)} />
            )}
          />
          <ImageField label="Image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" heightKey="imageMaxHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ height: 420, fit: 'contain' }}
          />
        </div>
      );
    }

    case 'slick-rs-impact': {
      type IStat = { v: string; k: string; sub: string };
      type ICard = { title: string; bodyPre: string; bodyBold: string; bodyTail: string; imageUrl?: string; imageAlt?: string; imageFit?: ObjectFitValue; stats: IStat[] };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ICard>
            label="Impact cards (3)"
            items={(f.cards as ICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Impact', bodyPre: '', bodyBold: 'Bold', bodyTail: '.', imageUrl: '', stats: [] })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (before bold)" {...richItemProps(c, 'bodyPre', u)} />
                <RichTextInput label="Body (bold)" {...richItemProps(c, 'bodyBold', u)} />
                <RichTextInput label="Body (after bold)" {...richItemProps(c, 'bodyTail', u)} />
                <ImageField label="Viz image URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <Select<ObjectFitValue>
                  label="Object-fit (viz frame size is fixed by the grid)"
                  value={c.imageFit ?? 'contain'}
                  onChange={(v) => u({ ...c, imageFit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
                <Repeater<IStat>
                  label="Verify stats (2)"
                  items={c.stats ?? []}
                  onChange={(nv) => u({ ...c, stats: nv })}
                  newItem={() => ({ v: '[VERIFY: Vx]', k: 'metric', sub: 'detail' })}
                  itemPreview={(s) => s.k}
                  renderItem={(s, su) => (
                    <div className="space-y-2">
                      <RichTextInput label="Value" {...richItemProps(s, 'v', su)} />
                      <RichTextInput label="Metric" {...richItemProps(s, 'k', su)} />
                      <RichTextInput label="Sub" {...richItemProps(s, 'sub', su)} />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </div>
      );
    }


    case 'slick-sv-hero': {
      type Chip = { valPre: string; valAccent: string; lbl: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle (start)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero mockup URL" {...imageI18nProps(f, "mockImageUrl", update)} />
          <TextInput label="Hero image alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <ImageSizeControls
            widthKey="mockImageMaxWidth" aspectRatioKey="mockImageAspectRatio" fitKey="mockImageFit"
            f={f} set={set} defaults={{ width: 560, fit: 'contain' }} withHeight={false}
          />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value" {...richItemProps(c, 'valPre', u)} />
                <RichTextInput label="Accent (teal suffix, e.g. + % s)" {...richItemProps(c, 'valAccent', u)} />
                <RichTextInput label="Label" {...richItemProps(c, 'lbl', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sv-scale': {
      type Stat = { n: string; l: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle (start)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'n', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'l', u)} />
              </div>
            )}
          />
          <Repeater<string>
            label="Logo image URLs"
            items={(f.logoUrls as string[]) ?? []}
            onChange={(v) => set('logoUrls', v)}
            newItem={() => ''}
            itemPreview={(u) => u || '(empty slot)'}
            renderItem={(u, upd) => (
              <ImageField label="Logo URL" value={u ?? ''} onChange={(v) => upd(v)} />
            )}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Logo max height (px)" value={(f.logoMaxHeight as number) ?? 44} onChange={(v) => set('logoMaxHeight', v)} />
          </div>
          <Select<ObjectFitValue>
            label="Logo object-fit (applies to all logos)"
            value={(f.logoFit as ObjectFitValue) ?? 'contain'}
            onChange={(v) => set('logoFit', v)}
            options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
          />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sv-problem': {
      type StatCite = { big: string; claim: string; srcName: string; srcUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill (coral)" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtitle (start)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim text.', srcName: 'Source (Year)', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Big number (coral)" {...richItemProps(s, 'big', u)} />
                <RichTextInput label="Claim" {...richItemProps(s, 'claim', u)} />
                <RichTextInput label="Source name" {...richItemProps(s, 'srcName', u)} />
                <TextInput label="Source URL" value={s.srcUrl ?? ''} onChange={(v) => u({ ...s, srcUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sv-darkpanel':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Body Pre" f={f} set={set} base="bodyPre" segments={[{ key: 'bodyPre' }]} />
          <RichFieldGroup label="Body Bold1" f={f} set={set} base="bodyBold1" segments={[{ key: 'bodyBold1' }]} />
          <RichFieldGroup label="Body Mid" f={f} set={set} base="bodyMid" segments={[{ key: 'bodyMid' }]} />
          <RichFieldGroup label="Body Bold2" f={f} set={set} base="bodyBold2" segments={[{ key: 'bodyBold2' }]} />
          <RichFieldGroup label="Body Tail" f={f} set={set} base="bodyTail" segments={[{ key: 'bodyTail' }]} />
        </div>
      );

    case 'slick-sv-stages': {
      type Stage = { num: string; title: string; descPre: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<Stage>
            label="Steps (4)"
            items={(f.stages as Stage[]) ?? []}
            onChange={(v) => set('stages', v)}
            newItem={() => ({ num: '0', title: 'Step', descPre: '', descBold: 'Bold', descTail: ' rest.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'num', u)} />
                <RichTextInput label="Title" {...richItemProps(s, 'title', u)} />
                <RichTextInput label="Desc (before bold)" {...richItemProps(s, 'descPre', u)} />
                <RichTextInput label="Desc (bold)" {...richItemProps(s, 'descBold', u)} />
                <RichTextInput label="Desc (after bold)" {...richItemProps(s, 'descTail', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sv-accuracy': {
      type Stat = { n: string; l: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<Stat>
            label="Accuracy stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00%', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'n', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'l', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sv-features': {
      type FCard = { imageUrl?: string; imageAlt?: string; imageFit?: ObjectFitValue; title: string; descPre: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<FCard>
            label="Check cards (6)"
            items={(f.cards as FCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', imageAlt: '', title: 'Check', descPre: '', descBold: 'Bold', descTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail image URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt / placeholder text" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <Select<ObjectFitValue>
                  label="Object-fit (thumbnail frame size is fixed by the grid)"
                  value={c.imageFit ?? 'fill'}
                  onChange={(v) => u({ ...c, imageFit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Desc (before bold)" {...richItemProps(c, 'descPre', u)} />
                <RichTextInput label="Desc (bold)" {...richItemProps(c, 'descBold', u)} />
                <RichTextInput label="Desc (after bold)" {...richItemProps(c, 'descTail', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sv-split': {
      return (
        <div className="space-y-4">
          <Toggle label="Reverse layout (image left)" value={Boolean(f.reverse)} onChange={(v) => set('reverse', v)} />
          <Toggle label="Mint band background" value={Boolean(f.bandMint)} onChange={(v) => set('bandMint', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Body Pre" f={f} set={set} base="bodyPre" segments={[{ key: 'bodyPre' }]} />
          <RichFieldGroup label="Body Bold1" f={f} set={set} base="bodyBold1" segments={[{ key: 'bodyBold1' }]} />
          <RichFieldGroup label="Body Mid" f={f} set={set} base="bodyMid" segments={[{ key: 'bodyMid' }]} />
          <RichFieldGroup label="Body Bold2" f={f} set={set} base="bodyBold2" segments={[{ key: 'bodyBold2' }]} />
          <RichFieldGroup label="Body Tail" f={f} set={set} base="bodyTail" segments={[{ key: 'bodyTail' }]} />
          <Repeater<string>
            label="Chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New chip'}
            itemPreview={(c) => c || '(empty)'}
            renderItem={(c, u) => (
              <TextInput label="Chip" value={c ?? ''} onChange={(v) => u(v)} />
            )}
          />
          <ImageField label="Art image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt / placeholder text" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <NumberInput
            label="Image width (% of column — default 108 intentionally bleeds past the edge)"
            value={(f.imageWidthPercent as number) ?? 108}
            onChange={(v) => set('imageWidthPercent', v)}
          />
          <TextInput
            label="Aspect ratio (e.g. 4/5) — optional, overrides natural image height"
            value={(f.imageAspectRatio as string) ?? ''}
            onChange={(v) => set('imageAspectRatio', v)}
          />
          <Select<ObjectFitValue>
            label="Object-fit (only applies when an aspect ratio is set above)"
            value={(f.imageFit as ObjectFitValue) ?? 'cover'}
            onChange={(v) => set('imageFit', v)}
            options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
          />
        </div>
      );
    }

    case 'slick-sv-humantest': {
      type HtCard = { videoUrl?: string; thumbnail?: string; alt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading (** = teal accent)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<HtCard>
            label="Shorts cards"
            items={(f.cards as HtCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ videoUrl: '', thumbnail: '', alt: '' })}
            itemPreview={(c) => c.alt || c.videoUrl || 'Video'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="YouTube Shorts URL" value={c.videoUrl ?? ''} onChange={(v) => u({ ...c, videoUrl: v })} />
                <ImageField label="Thumbnail (optional)" {...imageI18nProps(c, "thumbnail", (p) => u({ ...c, ...p }))} />
                <TextInput label="Alt text" value={c.alt ?? ''} onChange={(v) => u({ ...c, alt: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <FitSelect label="Thumbnail fit (all cards)" fitKey="thumbnailFit" f={f} set={set} def="cover" />
        </div>
      );
    }

    case 'slick-sv-proof': {
      type PCard = { title: string; bodyPre: string; bodyBold: string; bodyTail: string; statValue: string; statKey: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<PCard>
            label="Proof cards (3)"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Metric', bodyPre: '', bodyBold: 'Bold', bodyTail: '.', statValue: '00%', statKey: 'metric label' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (before bold)" {...richItemProps(c, 'bodyPre', u)} />
                <RichTextInput label="Body (bold)" {...richItemProps(c, 'bodyBold', u)} />
                <RichTextInput label="Body (after bold)" {...richItemProps(c, 'bodyTail', u)} />
                <RichTextInput label="Stat value (or [VERIFY: x])" {...richItemProps(c, 'statValue', u)} />
                <TextInput label="Stat key" value={c.statKey ?? ''} onChange={(v) => u({ ...c, statKey: v })} />
              </div>
            )}
          />
        </div>
      );
    }


    case 'slick-su-hero': {
      type Chip = { valPre: string; valAccent: string; lbl: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Sub" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Phone mockup URL" {...imageI18nProps(f, "mockImageUrl", update)} />
          <TextInput label="Mockup alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <ImageSizeControls
            widthKey="mockImageWidth" aspectRatioKey="mockImageAspectRatio" fitKey="mockImageFit"
            f={f} set={set} defaults={{ width: 330, fit: 'contain' }} withHeight={false}
          />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value" {...richItemProps(c, 'valPre', u)} />
                <RichTextInput label="Accent (teal)" {...richItemProps(c, 'valAccent', u)} />
                <RichTextInput label="Label" {...richItemProps(c, 'lbl', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-su-scale': {
      type Stat = { num: string; lab: string };
      type Logo = { url?: string; label: string; width?: number; height?: number; fit?: ObjectFitValue };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Note" f={f} set={set} base="note" segments={[{ key: 'note' }]} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ num: '00', lab: 'Label' })}
            itemPreview={(s) => s.num}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'num', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'lab', u)} />
              </div>
            )}
          />
          <Repeater<Logo>
            label="Logo slots"
            items={(f.logos as Logo[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ url: '', label: 'Brand' })}
            itemPreview={(l) => l.label}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <ImageField label="Logo URL" {...imageI18nProps(l, "url", (p) => u({ ...l, ...p }))} />
                <RichTextInput label="Label / slot text" {...richItemProps(l, 'label', u)} />
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Max height (px)" value={l.height ?? 52} onChange={(v) => u({ ...l, height: v })} />
                  <NumberInput label="Max width (px)" value={l.width ?? 140} onChange={(v) => u({ ...l, width: v })} />
                </div>
                <Select<ObjectFitValue>
                  label="Object-fit"
                  value={l.fit ?? 'contain'}
                  onChange={(v) => u({ ...l, fit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-su-problem': {
      type Card = { big: string; claim: string; srcName: string; srcUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Kicker Pre" f={f} set={set} base="kickerPre" segments={[{ key: 'kickerPre' }]} />
          <RichFieldGroup label="Kicker Bold" f={f} set={set} base="kickerBold" segments={[{ key: 'kickerBold' }]} />
          <Repeater<Card>
            label="Cited stats (3)"
            items={(f.cards as Card[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ big: '00%', claim: 'Claim.', srcName: 'Source', srcUrl: '' })}
            itemPreview={(c) => c.big}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Big number (red)" {...richItemProps(c, 'big', u)} />
                <RichTextInput label="Claim" {...richItemProps(c, 'claim', u)} />
                <RichTextInput label="Source name" {...richItemProps(c, 'srcName', u)} />
                <TextInput label="Source URL" value={c.srcUrl ?? ''} onChange={(v) => u({ ...c, srcUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-su-lossrail': {
      type Driver = { stat: string; name: string; verify?: string; desc: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Sub Pre" f={f} set={set} base="subPre" segments={[{ key: 'subPre' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="Sub verify tag" f={f} set={set} base="subVerify" segments={[{ key: 'subVerify' }]} />
          <RichFieldGroup label="Keep %" f={f} set={set} base="keepPct" segments={[{ key: 'keepPct' }]} />
          <RichFieldGroup label="Keep label" f={f} set={set} base="keepLabel" segments={[{ key: 'keepLabel' }]} />
          <RichFieldGroup label="Lost %" f={f} set={set} base="lostPct" segments={[{ key: 'lostPct' }]} />
          <RichFieldGroup label="Lost label" f={f} set={set} base="lostLabel" segments={[{ key: 'lostLabel' }]} />
          <RichFieldGroup label="Drivers title" f={f} set={set} base="driversTitle" segments={[{ key: 'driversTitle' }]} />
          <RichFieldGroup label="Note" f={f} set={set} base="note" segments={[{ key: 'note' }]} />
          <Repeater<Driver>
            label="Drivers (4)"
            items={(f.drivers as Driver[]) ?? []}
            onChange={(v) => set('drivers', v)}
            newItem={() => ({ stat: '00%', name: 'Driver', verify: '', desc: 'Description.' })}
            itemPreview={(d) => d.name}
            renderItem={(d, u) => (
              <div className="space-y-2">
                <RichTextInput label="Stat" {...richItemProps(d, 'stat', u)} />
                <RichTextInput label="Name" {...richItemProps(d, 'name', u)} />
                <RichTextInput label="Verify tag (optional)" {...richItemProps(d, 'verify', u)} />
                <RichTextInput label="Description" {...richItemProps(d, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-su-timeline': {
      type Item = { num: string; title: string; linePre: string; lineBold: string; lineTail: string; impN?: string; impK?: string; impNone?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Sub Pre" f={f} set={set} base="subPre" segments={[{ key: 'subPre' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="Proof Pre" f={f} set={set} base="proofPre" segments={[{ key: 'proofPre' }]} />
          <RichFieldGroup label="Proof Bold" f={f} set={set} base="proofBold" segments={[{ key: 'proofBold' }]} />
          <RichFieldGroup label="Proof Tail" f={f} set={set} base="proofTail" segments={[{ key: 'proofTail' }]} />
          <Repeater<Item>
            label="Timeline items (5)"
            items={(f.items as Item[]) ?? []}
            onChange={(v) => set('items', v)}
            newItem={() => ({ num: '0', title: 'Stage', linePre: '', lineBold: 'Bold', lineTail: '.', impNone: 'Note' })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(it, 'num', u)} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Line (before bold)" {...richItemProps(it, 'linePre', u)} />
                <RichTextInput label="Line (bold)" {...richItemProps(it, 'lineBold', u)} />
                <RichTextInput label="Line (after bold)" {...richItemProps(it, 'lineTail', u)} />
                <RichTextInput label="Impact number (blank if none)" {...richItemProps(it, 'impN', u)} />
                <RichTextInput label="Impact key" {...richItemProps(it, 'impK', u)} />
                <RichTextInput label="Impact 'none' note (if no number)" {...richItemProps(it, 'impNone', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-su-engine': {
      type Card = { icon: string; title: string; descPre: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Sub Pre" f={f} set={set} base="subPre" segments={[{ key: 'subPre' }]} />
          <RichFieldGroup label="Sub Bold1" f={f} set={set} base="subBold1" segments={[{ key: 'subBold1' }]} />
          <RichFieldGroup label="Sub Mid" f={f} set={set} base="subMid" segments={[{ key: 'subMid' }]} />
          <RichFieldGroup label="Sub Bold2" f={f} set={set} base="subBold2" segments={[{ key: 'subBold2' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <Repeater<Card>
            label="Feature cards (4)"
            items={(f.cards as Card[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: 'target', title: 'Feature', descPre: '', descBold: 'Bold', descTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (target | tasks | star | bars)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Desc (before bold)" {...richItemProps(c, 'descPre', u)} />
                <RichTextInput label="Desc (bold)" {...richItemProps(c, 'descBold', u)} />
                <RichTextInput label="Desc (after bold)" {...richItemProps(c, 'descTail', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-su-guarantee':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Sub line 1" f={f} set={set} base="subLine1" segments={[{ key: 'subLine1' }]} />
          <RichFieldGroup label="Sub line 2" f={f} set={set} base="subLine2" segments={[{ key: 'subLine2' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );


    case 'slick-mt-hero': {
      type Chip = { valPre: string; valAccent: string; lbl: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Sub Pre" f={f} set={set} base="subPre" segments={[{ key: 'subPre' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero mockup URL" {...imageI18nProps(f, "mockImageUrl", update)} />
          <TextInput label="Hero image alt / placeholder" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '%', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value" {...richItemProps(c, 'valPre', u)} />
                <RichTextInput label="Accent (teal suffix)" {...richItemProps(c, 'valAccent', u)} />
                <RichTextInput label="Label" {...richItemProps(c, 'lbl', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-mt-statbar': {
      type Stat = { n: string; l: string };
      return (
        <div className="space-y-4">
          <Toggle label="Mint band background" value={Boolean(f.bandMint)} onChange={(v) => set('bandMint', v)} />
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subheading / body" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'n', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'l', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-mt-problem': {
      type StatCite = { big: string; claim: string; src: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim text.', src: 'Source' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Big number (coral)" {...richItemProps(s, 'big', u)} />
                <RichTextInput label="Claim" {...richItemProps(s, 'claim', u)} />
                <TextInput label="Source" value={s.src ?? ''} onChange={(v) => u({ ...s, src: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-mt-split': {
      return (
        <div className="space-y-4">
          <Toggle label="Reverse layout (image left)" value={Boolean(f.reverse)} onChange={(v) => set('reverse', v)} />
          <Toggle label="Mint band background" value={Boolean(f.bandMint)} onChange={(v) => set('bandMint', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Tail" f={f} set={set} base="headingTail" segments={[{ key: 'headingTail' }]} />
          <RichFieldGroup label="Body Pre" f={f} set={set} base="bodyPre" segments={[{ key: 'bodyPre' }]} />
          <RichFieldGroup label="Body Bold" f={f} set={set} base="bodyBold" segments={[{ key: 'bodyBold' }]} />
          <RichFieldGroup label="Body Tail" f={f} set={set} base="bodyTail" segments={[{ key: 'bodyTail' }]} />
          <Repeater<string>
            label="Chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New chip'}
            itemPreview={(c) => c || '(empty)'}
            renderItem={(c, u) => (
              <TextInput label="Chip" value={c ?? ''} onChange={(v) => u(v)} />
            )}
          />
          <ImageField label="Art image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt / placeholder" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );
    }

    case 'slick-mt-icards': {
      type ICard = { title: string; body: string; imageUrl?: string; imageAlt?: string; statV: string; statK: string; statSub: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ICard>
            label="Impact cards (3)"
            items={(f.cards as ICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Card', body: 'Body text.', imageUrl: '', imageAlt: '', statV: '00%', statK: 'metric', statSub: 'detail' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(c, 'body', u)} />
                <ImageField label="Viz image URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt / placeholder" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <RichTextInput label="Stat value" {...richItemProps(c, 'statV', u)} />
                <RichTextInput label="Stat key" {...richItemProps(c, 'statK', u)} />
                <RichTextInput label="Stat sub" {...richItemProps(c, 'statSub', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-mt-darktabs': {
      type Tab = { label: string; h3Pre: string; h3Accent: string; body: string; big: string; bigLabel: string; imageUrl?: string; imageAlt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<Tab>
            label="Tabs (4)"
            items={(f.tabs as Tab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'Tab', h3Pre: '', h3Accent: 'accent', body: 'Body.', big: '00%', bigLabel: 'label', imageUrl: '', imageAlt: '' })}
            itemPreview={(t) => t.label}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(t, 'label', u)} />
                <RichTextInput label="Panel heading (pre)" {...richItemProps(t, 'h3Pre', u)} />
                <RichTextInput label="Panel heading accent" {...richItemProps(t, 'h3Accent', u)} />
                <RichTextInput label="Panel body" {...richItemProps(t, 'body', u)} />
                <RichTextInput label="Big number" {...richItemProps(t, 'big', u)} />
                <RichTextInput label="Big number label" {...richItemProps(t, 'bigLabel', u)} />
                <ImageField label="Panel image URL" {...imageI18nProps(t, "imageUrl", (p) => u({ ...t, ...p }))} />
                <TextInput label="Image alt / placeholder" value={t.imageAlt ?? ''} onChange={(v) => u({ ...t, imageAlt: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-mt-darkpanel':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Body Pre" f={f} set={set} base="bodyPre" segments={[{ key: 'bodyPre' }]} />
          <RichFieldGroup label="Body Bold" f={f} set={set} base="bodyBold" segments={[{ key: 'bodyBold' }]} />
          <RichFieldGroup label="Body Tail" f={f} set={set} base="bodyTail" segments={[{ key: 'bodyTail' }]} />
          <Repeater<string>
            label="Chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New chip'}
            itemPreview={(c) => c || '(empty)'}
            renderItem={(c, u) => (
              <TextInput label="Chip" value={c ?? ''} onChange={(v) => u(v)} />
            )}
          />
        </div>
      );

    case 'slick-mt-features': {
      type FCard = { imageUrl?: string; imageAlt?: string; title: string; descPre: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<FCard>
            label="Feature cards (3)"
            items={(f.cards as FCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', imageAlt: '', title: 'Feature', descPre: '', descBold: 'Bold', descTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail image URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt / placeholder" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Desc (before bold)" {...richItemProps(c, 'descPre', u)} />
                <RichTextInput label="Desc (bold)" {...richItemProps(c, 'descBold', u)} />
                <RichTextInput label="Desc (after bold)" {...richItemProps(c, 'descTail', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-mt-proof': {
      type PCard = { title: string; bodyPre: string; bodyBold: string; bodyTail: string; pairV: string; pairK: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<PCard>
            label="Proof cards (3)"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Card', bodyPre: '', bodyBold: 'Bold', bodyTail: '.', pairV: '00%', pairK: 'metric' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (before bold)" {...richItemProps(c, 'bodyPre', u)} />
                <RichTextInput label="Body (bold)" {...richItemProps(c, 'bodyBold', u)} />
                <RichTextInput label="Body (after bold)" {...richItemProps(c, 'bodyTail', u)} />
                <RichTextInput label="Stat value" {...richItemProps(c, 'pairV', u)} />
                <RichTextInput label="Stat key" {...richItemProps(c, 'pairK', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-mt-trust': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<string>
            label="Logo image URLs"
            items={(f.logoUrls as string[]) ?? []}
            onChange={(v) => set('logoUrls', v)}
            newItem={() => ''}
            itemPreview={(u) => u || '(empty slot)'}
            renderItem={(u, upd) => (
              <ImageField label="Logo URL" value={u ?? ''} onChange={(v) => upd(v)} />
            )}
          />
        </div>
      );
    }

    case 'slick-ud-problem': {
      type UPCard = { big?: string; claim?: string; srcLabel?: string; srcUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Tail" f={f} set={set} base="headingTail" segments={[{ key: 'headingTail' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<UPCard>
            label="Stat cards"
            items={(f.cards as UPCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ big: '00%', claim: 'New cited stat', srcLabel: 'Source', srcUrl: '' })}
            itemPreview={(c) => `${c.big ?? ''} — ${c.claim ?? '(empty)'}`}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Big figure" {...richItemProps(c, 'big', u)} />
                <RichTextInput label="Claim" {...richItemProps(c, 'claim', u)} />
                <RichTextInput label="Source label" {...richItemProps(c, 'srcLabel', u)} />
                <TextInput label="Source URL" value={c.srcUrl ?? ''} onChange={(v) => u({ ...c, srcUrl: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Kicker Pre" f={f} set={set} base="kickerPre" segments={[{ key: 'kickerPre' }]} />
          <RichFieldGroup label="Kicker Bold" f={f} set={set} base="kickerBold" segments={[{ key: 'kickerBold' }]} />
        </div>
      );
    }

    case 'slick-ud-timeline': {
      type UTBullet = { lead?: string; rest?: string };
      type UTItem = { num?: string; title?: string; benefit?: string; bullets?: UTBullet[] };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Tail" f={f} set={set} base="headingTail" segments={[{ key: 'headingTail' }]} />
          <RichFieldGroup label="Sub Pre" f={f} set={set} base="subPre" segments={[{ key: 'subPre' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Sub Tail" f={f} set={set} base="subTail" segments={[{ key: 'subTail' }]} />
          <RichFieldGroup label="Proof line ([VERIFY: x] allowed)" f={f} set={set} base="proof" segments={[{ key: 'proof' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<UTItem>
            label="Stages"
            items={(f.items as UTItem[]) ?? []}
            onChange={(v) => set('items', v)}
            newItem={() => ({ num: '0', title: 'New stage', benefit: 'Benefit', bullets: [] })}
            itemPreview={(it) => `${it.num ?? ''}. ${it.title ?? '(stage)'}`}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(it, 'num', u)} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <RichTextInput label="Benefit pill" {...richItemProps(it, 'benefit', u)} />
                <Repeater<UTBullet>
                  label="Bullets"
                  items={it.bullets ?? []}
                  onChange={(v) => u({ ...it, bullets: v })}
                  newItem={() => ({ lead: 'Lead:', rest: ' detail' })}
                  itemPreview={(b) => `${b.lead ?? ''}${b.rest ?? ''}`.trim() || '(bullet)'}
                  renderItem={(b, ub) => (
                    <div className="space-y-2">
                      <RichTextInput label="Lead (bold)" {...richItemProps(b, 'lead', ub)} />
                      <RichTextInput label="Rest" {...richItemProps(b, 'rest', ub)} />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ud-impact': {
      type UICard = { title?: string; benefit?: string; bodyPre?: string; bodyBold?: string; bodyTail?: string; imageUrl?: string; imageAlt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading Tail" f={f} set={set} base="headingTail" segments={[{ key: 'headingTail' }]} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<UICard>
            label="Module cards"
            items={(f.cards as UICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'New module', benefit: 'Benefit', bodyPre: '', bodyBold: '', bodyTail: '', imageUrl: '', imageAlt: '' })}
            itemPreview={(c) => c.title || '(card)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Benefit pill" {...richItemProps(c, 'benefit', u)} />
                <RichTextInput label="Body (before bold)" {...richItemProps(c, 'bodyPre', u)} />
                <RichTextInput label="Body (bold)" {...richItemProps(c, 'bodyBold', u)} />
                <RichTextInput label="Body (tail — [VERIFY: x] allowed)" {...richItemProps(c, 'bodyTail', u)} />
                <ImageField label="Card image" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt / placeholder caption" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <RichFieldGroup label="Note Pre" f={f} set={set} base="notePre" segments={[{ key: 'notePre' }]} />
          <RichFieldGroup label="Note Bold" f={f} set={set} base="noteBold" segments={[{ key: 'noteBold' }]} />
          <RichFieldGroup label="Note Tail" f={f} set={set} base="noteTail" segments={[{ key: 'noteTail' }]} />
        </div>
      );
    }


    case 'slick-sn-hero': {
      type Chip = { valPre: string; valAccent: string; lbl: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Sub" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="Primary CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Phone mockup URL" {...imageI18nProps(f, "mockImageUrl", update)} />
          <TextInput label="Mockup alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <ImageSizeControls
            widthKey="mockImageMaxWidth" aspectRatioKey="mockImageAspectRatio" fitKey="mockImageFit"
            f={f} set={set} defaults={{ width: 480, fit: 'contain' }} withHeight={false}
          />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value" {...richItemProps(c, 'valPre', u)} />
                <RichTextInput label="Accent (teal)" {...richItemProps(c, 'valAccent', u)} />
                <RichTextInput label="Label" {...richItemProps(c, 'lbl', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sn-scale': {
      type Stat = { n: string; l: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'n', u)} />
                <RichTextInput label="Label" {...richItemProps(s, 'l', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sn-problem': {
      type Cite = { big: string; claim: string; srcName: string; srcUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill (red)" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<Cite>
            label="Cited stats (3)"
            items={(f.stats as Cite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim.', srcName: 'Source', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Big number (red)" {...richItemProps(s, 'big', u)} />
                <RichTextInput label="Claim" {...richItemProps(s, 'claim', u)} />
                <RichTextInput label="Source name" {...richItemProps(s, 'srcName', u)} />
                <TextInput label="Source URL" value={s.srcUrl ?? ''} onChange={(v) => u({ ...s, srcUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sn-howitworks': {
      type Step = { num: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <Toggle label="Image on right" value={f.imageRight !== false} onChange={(v) => set('imageRight', v)} />
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <ImageField label="Image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" heightKey="imageMaxHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ height: 640, fit: 'contain' }}
          />
          <Repeater<Step>
            label="Steps (4)"
            items={(f.steps as Step[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ num: '0', title: 'Step', desc: 'Description.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'num', u)} />
                <RichTextInput label="Title" {...richItemProps(s, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(s, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sn-features': {
      type FCard = { imageUrl?: string; imageAlt?: string; imageFit?: ObjectFitValue; title: string; desc: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<FCard>
            label="Feature cards (3)"
            items={(f.cards as FCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', title: 'Feature', desc: 'Description.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <Select<ObjectFitValue>
                  label="Object-fit (thumbnail frame size is fixed by the grid)"
                  value={c.imageFit ?? 'cover'}
                  onChange={(v) => u({ ...c, imageFit: v })}
                  options={OBJECT_FIT_OPTIONS as unknown as { value: ObjectFitValue; label: string }[]}
                />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(c, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sn-spotlight': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Body Bold" f={f} set={set} base="bodyBold" segments={[{ key: 'bodyBold' }]} />
          <RichFieldGroup label="Body Rest" f={f} set={set} base="bodyRest" segments={[{ key: 'bodyRest' }]} />
          <ImageField label="Image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" heightKey="imageMaxHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ height: 640, fit: 'contain' }}
          />
          <Repeater<string>
            label="Chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New chip'}
            itemPreview={(c) => c || '(empty)'}
            renderItem={(c, u) => (
              <TextInput label="Chip" value={c ?? ''} onChange={(v) => u(v)} />
            )}
          />
        </div>
      );
    }

    case 'slick-sn-darkcard':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Body Pre" f={f} set={set} base="bodyPre" segments={[{ key: 'bodyPre' }]} />
          <RichFieldGroup label="Body Bold1" f={f} set={set} base="bodyBold1" segments={[{ key: 'bodyBold1' }]} />
          <RichFieldGroup label="Body Mid" f={f} set={set} base="bodyMid" segments={[{ key: 'bodyMid' }]} />
          <RichFieldGroup label="Body Bold2" f={f} set={set} base="bodyBold2" segments={[{ key: 'bodyBold2' }]} />
          <RichFieldGroup label="Body Tail" f={f} set={set} base="bodyTail" segments={[{ key: 'bodyTail' }]} />
          <ImageField label="Image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ fit: 'contain' }} withHeight={false}
          />
        </div>
      );

    case 'slick-sn-recovery': {
      type Pt = { ic: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <ImageField label="Image URL" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" heightKey="imageMaxHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ height: 640, fit: 'contain' }}
          />
          <Repeater<Pt>
            label="Recovery points (4)"
            items={(f.points as Pt[]) ?? []}
            onChange={(v) => set('points', v)}
            newItem={() => ({ ic: '0', title: 'Scenario', desc: 'Description.' })}
            itemPreview={(p) => p.title}
            renderItem={(p, u) => (
              <div className="space-y-2">
                <RichTextInput label="Icon/number" {...richItemProps(p, 'ic', u)} />
                <RichTextInput label="Title" {...richItemProps(p, 'title', u)} />
                <RichTextInput label="Description" {...richItemProps(p, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sn-proof': {
      type PCard = { title: string; body: string; statValue: string; statKey: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<PCard>
            label="Proof cards (3)"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Outcome', body: 'Description.', statValue: '[Vx]', statKey: 'Metric' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(c, 'body', u)} />
                <RichTextInput label="Stat value (e.g. [V1] or +18%)" {...richItemProps(c, 'statValue', u)} />
                <TextInput label="Stat key" value={c.statKey ?? ''} onChange={(v) => u({ ...c, statKey: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-upi-hero':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading (use ** for teal accent)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="subText" segments={[{ key: 'subText' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaPrimaryLabel" segments={[{ key: 'ctaPrimaryLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaPrimaryUrl as string ?? ''} onChange={(v) => set('ctaPrimaryUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Image" {...imageI18nProps(f, "imageSrc", update)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ width: 800, fit: 'cover' }} withHeight={false}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 1 value" value={f.chip1Val as string ?? ''} onChange={(v) => set('chip1Val', v)} />
          <TextInput label="Chip 1 unit" value={f.chip1Unit as string ?? ''} onChange={(v) => set('chip1Unit', v)} />
          <TextInput label="Chip 1 label" value={f.chip1Lbl as string ?? ''} onChange={(v) => set('chip1Lbl', v)} />
          <TextInput label="Chip 2 value" value={f.chip2Val as string ?? ''} onChange={(v) => set('chip2Val', v)} />
          <TextInput label="Chip 2 unit" value={f.chip2Unit as string ?? ''} onChange={(v) => set('chip2Unit', v)} />
          <TextInput label="Chip 2 label" value={f.chip2Lbl as string ?? ''} onChange={(v) => set('chip2Lbl', v)} />
          <TextInput label="Chip 3 value" value={f.chip3Val as string ?? ''} onChange={(v) => set('chip3Val', v)} />
          <TextInput label="Chip 3 unit" value={f.chip3Unit as string ?? ''} onChange={(v) => set('chip3Unit', v)} />
          <TextInput label="Chip 3 label" value={f.chip3Lbl as string ?? ''} onChange={(v) => set('chip3Lbl', v)} />
          <TextInput label="Chip 4 value" value={f.chip4Val as string ?? ''} onChange={(v) => set('chip4Val', v)} />
          <TextInput label="Chip 4 unit" value={f.chip4Unit as string ?? ''} onChange={(v) => set('chip4Unit', v)} />
          <TextInput label="Chip 4 label" value={f.chip4Lbl as string ?? ''} onChange={(v) => set('chip4Lbl', v)} />
        </div>
      );

    case 'slick-sc-upi-challenge': {
      type Stat = { big: string; claim: string; sourceLabel?: string; sourceUrl?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading (use ** for teal accent)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Body" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <Repeater<Stat>
            label="Stats (3)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '0', claim: 'Description.', sourceLabel: '', sourceUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Big number/text" {...richItemProps(s, 'big', u)} />
                <RichTextInput label="Claim" {...richItemProps(s, 'claim', u)} />
                <RichTextInput label="Source label" {...richItemProps(s, 'sourceLabel', u)} />
                <TextInput label="Source URL" value={s.sourceUrl ?? ''} onChange={(v) => u({ ...s, sourceUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-upi-proof': {
      type PMetric = { value: string; label: string };
      type PCard = { title: string; body: string; metrics?: PMetric[] };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<PCard>
            label="Proof cards"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Metric title', body: 'Body with **bold**.', metrics: [{ value: '[VERIFY: V]', label: 'Label' }] })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (use ** for bold)" {...richItemProps(c, 'body', u)} />
                <Repeater<PMetric>
                  label="Metrics (1–2)"
                  items={c.metrics ?? []}
                  onChange={(v) => u({ ...c, metrics: v })}
                  newItem={() => ({ value: '[VERIFY: V]', label: 'Label' })}
                  itemPreview={(m) => m.label}
                  renderItem={(m, um) => (
                    <div className="space-y-2">
                      <RichTextInput label="Value (use [VERIFY: Vx] for a flag)" {...richItemProps(m, 'value', um)} />
                      <RichTextInput label="Label" {...richItemProps(m, 'label', um)} />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rd-barriers': {
      type Driver = { name: string; desc: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading (** = coral span)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subheading (** for bold)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Drivers title" f={f} set={set} base="driversTitle" segments={[{ key: 'driversTitle' }]} />
          <Repeater<Driver>
            label="Barriers (auto-numbered)"
            items={(f.drivers as Driver[]) ?? []}
            onChange={(v) => set('drivers', v)}
            newItem={() => ({ name: 'Barrier', desc: 'Description.' })}
            itemPreview={(d) => d.name}
            renderItem={(d, u) => (
              <div className="space-y-2">
                <RichTextInput label="Name" {...richItemProps(d, 'name', u)} />
                <RichTextInput label="Description" {...richItemProps(d, 'desc', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rd-showcase': {
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Heading (** = teal span)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <ImageField label="Center image" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt / placeholder" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <Repeater<string>
            label="Floating labels (4: TL, BL, TR, BR)"
            items={(f.labels as string[]) ?? []}
            onChange={(v) => set('labels', v)}
            newItem={() => 'New label'}
            itemPreview={(l) => l || '(empty)'}
            renderItem={(l, u) => <TextInput label="Label" value={l ?? ''} onChange={(v) => u(v)} />}
          />
        </div>
      );
    }

    case 'slick-rd-features': {
      type ECard = { iconKey: string; title: string; body: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading (** = teal span)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subheading (** for bold)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ECard>
            label="Feature cards"
            items={(f.cards as ECard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ iconKey: 'trend', title: 'Feature', body: 'Body with **bold**.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon key (trend, alert, listcheck, refresh, van, clipboard, ledger, phone)" value={c.iconKey ?? ''} onChange={(v) => u({ ...c, iconKey: v })} />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (** bold, [VERIFY: ..] flag)" {...richItemProps(c, 'body', u)} />
              </div>
            )}
          />
          <Repeater<string>
            label="Footer notes (** bold, [VERIFY: ..] flag)"
            items={(f.notes as string[]) ?? []}
            onChange={(v) => set('notes', v)}
            newItem={() => 'New note with [VERIFY: X].'}
            itemPreview={(n) => n.slice(0, 40)}
            renderItem={(n, u) => <Textarea label="Note" value={n ?? ''} onChange={(v) => u(v)} />}
          />
        </div>
      );
    }

    case 'slick-ma-signals-grid': {
      type SItem = { iconKey: string; title: string; bullets: string[]; impact: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading (** = teal accent)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subheading (** for bold)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<SItem>
            label="Cards"
            items={(f.items as SItem[]) ?? []}
            onChange={(v) => set('items', v)}
            newItem={() => ({ iconKey: 'chart', title: 'Layer', bullets: ['**Bullet**'], impact: 'Impact line.' })}
            itemPreview={(i) => i.title}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Icon key (chart, binoculars, cart)" value={it.iconKey ?? ''} onChange={(v) => u({ ...it, iconKey: v })} />
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <Repeater<string>
                  label="Bullets (use ** for bold)"
                  items={it.bullets ?? []}
                  onChange={(v) => u({ ...it, bullets: v })}
                  newItem={() => 'New bullet'}
                  itemPreview={(b) => b || '(empty)'}
                  renderItem={(b, ub) => <TextInput label="Bullet" value={b ?? ''} onChange={(v) => ub(v)} />}
                />
                <RichTextInput label="Impact line" {...richItemProps(it, 'impact', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ma-hero': {
      type Chip = { val: string; unit: string; lbl: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Grad" f={f} set={set} base="headingGrad" segments={[{ key: 'headingGrad' }]} />
          <RichFieldGroup label="Sub" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Sub Bold" f={f} set={set} base="subBold" segments={[{ key: 'subBold' }]} />
          <RichFieldGroup label="CTA label" f={f} set={set} base="ctaLabel" segments={[{ key: 'ctaLabel' }]} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <RichFieldGroup label="Ghost CTA label" f={f} set={set} base="ctaGhostLabel" segments={[{ key: 'ctaGhostLabel' }]} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Phone image" {...imageI18nProps(f, "image", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <ImageSizeControls
            widthKey="imageWidth" heightKey="imageHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ width: 254, height: 363, fit: 'contain' }}
          />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ val: '0', unit: '', lbl: 'Label' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Value" {...richItemProps(c, 'val', u)} />
                <RichTextInput label="Unit (teal)" {...richItemProps(c, 'unit', u)} />
                <RichTextInput label="Label" {...richItemProps(c, 'lbl', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ma-problem': {
      type SCard = { big: string; claim: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <RichFieldGroup label="Kicker (use ** for bold)" f={f} set={set} base="kicker" segments={[{ key: 'kicker' }]} />
          <Repeater<SCard>
            label="Stat cards"
            items={(f.cards as SCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ big: '0%', claim: 'Claim with **bold**.' })}
            itemPreview={(c) => c.big}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Big figure" {...richItemProps(c, 'big', u)} />
                <RichTextInput label="Claim (use ** for bold)" {...richItemProps(c, 'claim', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ma-signals': {
      type SItem = { title: string; bullets: string[]; note: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading (use ** for bold)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<SItem>
            label="Signal layers"
            items={(f.items as SItem[]) ?? []}
            onChange={(v) => set('items', v)}
            newItem={() => ({ title: 'Layer', bullets: ['**Bullet**'], note: 'Note.' })}
            itemPreview={(i) => i.title}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(it, 'title', u)} />
                <Repeater<string>
                  label="Bullets (use ** for bold)"
                  items={it.bullets ?? []}
                  onChange={(v) => u({ ...it, bullets: v })}
                  newItem={() => 'New bullet'}
                  itemPreview={(b) => b || '(empty)'}
                  renderItem={(b, ub) => <TextInput label="Bullet" value={b ?? ''} onChange={(v) => ub(v)} />}
                />
                <RichTextInput label="Note (right side)" {...richItemProps(it, 'note', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ma-decision': {
      type Step = { tabLabel: string; eyebrow: string; title: string; lead: string; note: string; imageUrl?: string; imageAlt?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading (use ** for bold)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<Step>
            label="Steps / tabs"
            items={(f.steps as Step[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ tabLabel: 'Tab', eyebrow: 'Step', title: 'Title', lead: 'Lead with **bold**.', note: 'Note.', imageUrl: '', imageAlt: '' })}
            itemPreview={(s) => s.tabLabel}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Tab label" {...richItemProps(s, 'tabLabel', u)} />
                <RichTextInput label="Eyebrow" {...richItemProps(s, 'eyebrow', u)} />
                <RichTextInput label="Title" {...richItemProps(s, 'title', u)} />
                <RichTextInput label="Lead (use ** for bold)" {...richItemProps(s, 'lead', u)} />
                <RichTextInput label="Note" {...richItemProps(s, 'note', u)} />
                <ImageField label="Panel image" {...imageI18nProps(s, "imageUrl", (p) => u({ ...s, ...p }))} />
                <TextInput label="Image alt / slot text" value={s.imageAlt ?? ''} onChange={(v) => u({ ...s, imageAlt: v })} />
              </div>
            )}
          />
          <ImageSizeControls
            widthKey="imageMaxWidth" heightKey="imageHeight" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ height: 300, fit: 'cover' }}
          />
        </div>
      );
    }

    case 'slick-ma-enterprise': {
      type ECard = { iconKey: string; title: string; body: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Subheading (use ** for bold)" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<ECard>
            label="Cards"
            items={(f.cards as ECard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ iconKey: 'scale', title: 'Title', body: 'Body with **bold**.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon key (scale / users / offline / security)" value={c.iconKey ?? ''} onChange={(v) => u({ ...c, iconKey: v })} />
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (** for bold, [VERIFY: ..] for a flag)" {...richItemProps(c, 'body', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-atk-capabilities':
    case 'slick-aa-capabilities':
    case 'slick-si-capabilities': {
      type SiCapCard = { title: string; body: string; imageUrl?: string; imageAlt?: string; imageSlot?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<SiCapCard>
            label="Capability cards"
            items={(f.cards as SiCapCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Title', body: 'Body with **bold**.', imageUrl: '', imageAlt: '', imageSlot: 'Image slot description' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (use ** for bold)" {...richItemProps(c, 'body', u)} />
                <ImageField label="Image URL (4:3)" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <Textarea label="Image slot placeholder (shown when no image)" value={c.imageSlot ?? ''} onChange={(v) => u({ ...c, imageSlot: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-si-darkpanel':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Paragraph 1 (HTML allowed — links/bold)" f={f} set={set} base="para1" segments={[{ key: 'para1' }]} />
          <RichFieldGroup label="Paragraph 2 (HTML allowed)" f={f} set={set} base="para2" segments={[{ key: 'para2' }]} />
        </div>
      );

    case 'slick-atk-darkpanel':
    case 'slick-ate-darkpanel':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Paragraph 1 (HTML allowed — links/bold)" f={f} set={set} base="para1" segments={[{ key: 'para1' }]} />
          <RichFieldGroup label="Paragraph 2 (HTML allowed)" f={f} set={set} base="para2" segments={[{ key: 'para2' }]} />
        </div>
      );

    case 'slick-atk-proof':
    case 'slick-ate-proof':
    case 'slick-si-proof': {
      type PMetric = { value: string; label: string };
      type PCard = { title: string; body: string; metrics?: PMetric[] };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <Repeater<PCard>
            label="Proof cards"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Metric title', body: 'Body with **bold** and [VERIFY: V].', metrics: [{ value: '[VERIFY: V]', label: 'Label' }] })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (use ** for bold, [VERIFY: Vx] for a flag)" {...richItemProps(c, 'body', u)} />
                <Repeater<PMetric>
                  label="Metrics (1–2)"
                  items={c.metrics ?? []}
                  onChange={(v) => u({ ...c, metrics: v })}
                  newItem={() => ({ value: '[VERIFY: V]', label: 'Label' })}
                  itemPreview={(m) => m.label}
                  renderItem={(m, um) => (
                    <div className="space-y-2">
                      <RichTextInput label="Value (use [VERIFY: Vx] for a flag)" {...richItemProps(m, 'value', um)} />
                      <RichTextInput label="Label" {...richItemProps(m, 'label', um)} />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-si-split':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading Pre" f={f} set={set} base="headingPre" segments={[{ key: 'headingPre' }]} />
          <RichFieldGroup label="Heading Accent" f={f} set={set} base="headingAccent" segments={[{ key: 'headingAccent' }]} />
          <RichFieldGroup label="Heading (post)" f={f} set={set} base="headingPost" segments={[{ key: 'headingPost' }]} />
          <RichFieldGroup label="Paragraph 1 (use ** for bold)" f={f} set={set} base="para1" segments={[{ key: 'para1' }]} />
          <RichFieldGroup label="Paragraph 2 (use ** for bold)" f={f} set={set} base="para2" segments={[{ key: 'para2' }]} />
          <Repeater<string>
            label="Chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New chip'}
            itemPreview={(c) => c || '(empty)'}
            renderItem={(c, u) => <TextInput label="Chip" value={c ?? ''} onChange={(v) => u(v)} />}
          />
          <ImageField label="Image URL (1:1)" {...imageI18nProps(f, "imageUrl", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <Textarea label="Image slot placeholder (shown when no image)" value={f.imageSlot as string ?? ''} onChange={(v) => set('imageSlot', v)} />
          <Toggle label="Reverse layout (image on left)" value={f.reverse as boolean} onChange={(v) => set('reverse', v)} />
        </div>
      );

    case 'slick-aa-split':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading (use ** for teal accent)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Body (use ** for bold)" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <Repeater<string>
            label="Chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New chip'}
            itemPreview={(c) => c || '(empty)'}
            renderItem={(c, u) => <TextInput label="Chip" value={c ?? ''} onChange={(v) => u(v)} />}
          />
          <ImageField label="Image URL" {...imageI18nProps(f, "imageSrc", update)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <Toggle label="Reverse layout (image on left)" value={f.reverse !== false} onChange={(v) => set('reverse', v)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ fit: 'cover' }} withHeight={false}
          />
        </div>
      );

    case 'slick-si-impact': {
      type SiCard = { title: string; body: string; imageUrl?: string; imageAlt?: string; imageSlot?: string; statValue: string; statLabel: string; statBasis?: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Pill" f={f} set={set} base="pill" segments={[{ key: 'pill' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Subtitle" f={f} set={set} base="sub" segments={[{ key: 'sub' }]} />
          <Repeater<SiCard>
            label="Impact cards"
            items={(f.cards as SiCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Title', body: 'Body with **bold**.', imageUrl: '', imageAlt: '', imageSlot: 'Image slot description', statValue: '0%', statLabel: 'Label', statBasis: '[VERIFY: V]' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (use ** for bold)" {...richItemProps(c, 'body', u)} />
                <ImageField label="Image URL" {...imageI18nProps(c, "imageUrl", (p) => u({ ...c, ...p }))} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <Textarea label="Image slot placeholder (shown when no image)" value={c.imageSlot ?? ''} onChange={(v) => u({ ...c, imageSlot: v })} />
                <RichTextInput label="Stat value" {...richItemProps(c, 'statValue', u)} />
                <RichTextInput label="Stat label" {...richItemProps(c, 'statLabel', u)} />
                <RichTextInput label="Basis (use [VERIFY: Vx] for a flag)" {...richItemProps(c, 'statBasis', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-upi-dark':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Paragraph 1 (HTML allowed — links go here)" f={f} set={set} base="para1" segments={[{ key: 'para1' }]} />
          <RichFieldGroup label="Paragraph 2" f={f} set={set} base="para2" segments={[{ key: 'para2' }]} />
          <RichFieldGroup label="Paragraph 3" f={f} set={set} base="para3" segments={[{ key: 'para3' }]} />
        </div>
      );

    case 'slick-sc-upi-how': {
      type Stage = { num: string; title: string; body: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading (use ** for teal accent)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="subText" segments={[{ key: 'subText' }]} />
          <Repeater<Stage>
            label="Stages (4)"
            items={(f.stages as Stage[]) ?? []}
            onChange={(v) => set('stages', v)}
            newItem={() => ({ num: '1', title: 'Stage title', body: 'Stage description.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <RichTextInput label="Number" {...richItemProps(s, 'num', u)} />
                <RichTextInput label="Title" {...richItemProps(s, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(s, 'body', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-upi-suite': {
      type SuiteCard = { title: string; body: string };
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading (use ** for teal accent)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Sub text" f={f} set={set} base="subText" segments={[{ key: 'subText' }]} />
          <Repeater<SuiteCard>
            label="Cards (3)"
            items={(f.cards as SuiteCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Product name', body: 'Description.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body" {...richItemProps(c, 'body', u)} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-upi-split':
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Eyebrow" f={f} set={set} base="eyebrow" segments={[{ key: 'eyebrow' }]} />
          <RichFieldGroup label="Heading (use ** for teal accent)" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Body (HTML allowed for <strong>)" f={f} set={set} base="body" segments={[{ key: 'body' }]} />
          <Repeater<string>
            label="Chips"
            items={(f.chips as string[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => 'New chip'}
            itemPreview={(chip) => chip}
            renderItem={(chip, u) => (
              <TextInput label="Chip text" value={chip} onChange={(v) => u(v)} />
            )}
          />
          <ImageField label="Image" {...imageI18nProps(f, "imageSrc", update)} />
          <ImageSizeControls
            widthKey="imageMaxWidth" aspectRatioKey="imageAspectRatio" fitKey="imageFit"
            f={f} set={set} defaults={{ fit: 'cover' }} withHeight={false}
          />
        </div>
      );

    case 'slick-sc-upi-related': {
      type RelCard = { title: string; body: string; href: string };
      const relCards = (f.cards as RelCard[]) ?? [];
      return (
        <div className="space-y-4">
          <RichFieldGroup label="Badge" f={f} set={set} base="badge" segments={[{ key: 'badge' }]} />
          <RichFieldGroup label="Heading" f={f} set={set} base="heading" segments={[{ key: 'heading' }]} />
          <RichFieldGroup label="Sub-text" f={f} set={set} base="subText" segments={[{ key: 'subText' }]} />
          <Repeater<RelCard>
            label="Cards"
            items={relCards}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Related capability', body: 'Description here.', href: '/' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <RichTextInput label="Title" {...richItemProps(c, 'title', u)} />
                <RichTextInput label="Body (HTML allowed for <strong>)" {...richItemProps(c, 'body', u)} />
                <TextInput label="Link URL" value={c.href} onChange={(v) => u({ ...c, href: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case "layout":
      return <LayoutEditor block={block} update={update} openWidgetPicker={openWidgetPicker} />;
    default:
      return null;
  }
}

export function ContentEditor({ block, update, openWidgetPicker, focusedItem }: Props) {
  const f = block.fields as FieldsOf;
  const set = (k: string, v: unknown) => update({ [k]: v });
  const [openWidgetId, setOpenWidgetId] = useState<string | null>(null);

  const mainFields = renderBlockFields(block, f, set, update, openWidgetPicker, focusedItem);

  if (block.type === "layout") return mainFields;

  const widgets = (f.widgets as Widget[]) ?? [];
  const updateWidget = (id: string, props: Record<string, unknown>) => {
    set("widgets", widgets.map((w) => w.id === id ? { ...w, props } : w));
  };

  return (
    <div className="space-y-4">
      {mainFields}

      {/* Widgets section — any template block can have extra widgets (including Row for horizontal) */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Widgets</div>
        {widgets.length === 0 && (
          <p className="text-xs text-slate-500 py-1 leading-relaxed">
            Drop a widget onto this section or click Add widget. Use <strong className="text-slate-400">Row (horizontal)</strong> to arrange widgets side by side.
          </p>
        )}
        {widgets.map((w) => (
          <WidgetListItem
            key={w.id}
            widget={w}
            isOpen={openWidgetId === w.id}
            onToggle={() => setOpenWidgetId(openWidgetId === w.id ? null : w.id)}
            onDelete={() => set("widgets", widgets.filter((x) => x.id !== w.id))}
            onUpdate={(props) => updateWidget(w.id, props)}
            openWidgetPicker={openWidgetPicker}
          />
        ))}
        <button
          onClick={() => openWidgetPicker(0, (t) => {
            set("widgets", [...widgets, defaultWidget(t)]);
          })}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-md py-2 pb-transition"
        >
          <Plus size={12} /> Add widget
        </button>
      </div>
    </div>
  );
}
