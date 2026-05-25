import {
  ButtonEditor, ColorPicker, ImageField, NumberInput, Repeater, Select,
  Slider, TextInput, Textarea, Toggle,
} from "./fields";
import type { ButtonField } from "./defaults";
import { EDITABLE_TYPES, type Widget } from "./widgets";

type Align = "left" | "center" | "right";
type Variant = ButtonField["variant"];

const ALIGN_OPTS: { value: Align; label: string }[] = [
  { value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" },
];
const LEVEL_OPTS = [
  { value: "h1", label: "H1" }, { value: "h2", label: "H2" }, { value: "h3", label: "H3" }, { value: "h4", label: "H4" },
] as const;
const SIZE_OPTS = [
  { value: "sm", label: "Small" }, { value: "base", label: "Base" }, { value: "lg", label: "Large" },
] as const;
const VARIANT_OPTS: { value: Variant; label: string }[] = [
  { value: "primary", label: "Primary" }, { value: "secondary", label: "Secondary" },
  { value: "outline", label: "Outline" }, { value: "ghost", label: "Ghost" },
];

export function WidgetEditor({ widget, update }: { widget: Widget; update: (props: Record<string, unknown>) => void }) {
  const p = widget.props;
  const set = (k: string, v: unknown) => update({ ...p, [k]: v });

  if (!EDITABLE_TYPES.has(widget.type)) {
    return <div className="text-xs text-slate-400">No properties available — this widget is a placeholder.</div>;
  }

  switch (widget.type) {
    case "heading":
    case "section-heading":
    case "section-header":
      return (
        <div className="space-y-3">
          <TextInput label="Text" value={p.text as string} onChange={(v) => set("text", v)} />
          <Select label="Level" value={(p.level as "h1") || "h2"} onChange={(v) => set("level", v)} options={LEVEL_OPTS as unknown as { value: "h1"; label: string }[]} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
        </div>
      );
    case "paragraph":
    case "text":
    case "rich-text":
      return (
        <div className="space-y-3">
          <Textarea label="Text" rows={4} value={p.text as string} onChange={(v) => set("text", v)} />
          <Select label="Size" value={(p.size as "base") || "base"} onChange={(v) => set("size", v)} options={SIZE_OPTS as unknown as { value: "base"; label: string }[]} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <ImageField label="Source URL" value={p.src as string} onChange={(v) => set("src", v)} />
          <TextInput label="Alt text" value={p.alt as string} onChange={(v) => set("alt", v)} />
          <NumberInput label="Width %" value={p.width as number} onChange={(v) => set("width", v)} />
          <NumberInput label="Border radius" value={p.radius as number} onChange={(v) => set("radius", v)} />
        </div>
      );
    case "button":
      return (
        <div className="space-y-3">
          <TextInput label="Label" value={p.label as string} onChange={(v) => set("label", v)} />
          <TextInput label="URL" value={p.url as string} onChange={(v) => set("url", v)} />
          <Select label="Variant" value={(p.variant as Variant) || "primary"} onChange={(v) => set("variant", v)} options={VARIANT_OPTS} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <Toggle label="Full width" value={p.fullWidth as boolean} onChange={(v) => set("fullWidth", v)} />
        </div>
      );
    case "divider":
      return (
        <div className="space-y-3">
          <Select label="Style" value={(p.style as "solid") || "solid"} onChange={(v) => set("style", v)} options={[{ value: "solid", label: "Solid" }, { value: "dashed", label: "Dashed" }, { value: "dotted", label: "Dotted" }] as { value: "solid"; label: string }[]} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
          <NumberInput label="Thickness (px)" value={p.thickness as number} onChange={(v) => set("thickness", v)} />
        </div>
      );
    case "spacer":
      return (
        <div className="space-y-3">
          <Slider label="Height (px)" min={8} max={200} value={p.height as number} onChange={(v) => set("height", v)} />
        </div>
      );
    case "icon":
      return (
        <div className="space-y-3">
          <TextInput label="Icon (emoji or name)" value={p.icon as string} onChange={(v) => set("icon", v)} />
          <NumberInput label="Size (px)" value={p.size as number} onChange={(v) => set("size", v)} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
        </div>
      );
    case "card":
      return (
        <div className="space-y-3">
          <TextInput label="Title" value={p.title as string} onChange={(v) => set("title", v)} />
          <Textarea label="Description" value={p.description as string} onChange={(v) => set("description", v)} />
          <ImageField label="Image URL" value={p.image as string} onChange={(v) => set("image", v)} />
          <TextInput label="Button label" value={p.buttonLabel as string} onChange={(v) => set("buttonLabel", v)} />
          <TextInput label="Button URL" value={p.buttonUrl as string} onChange={(v) => set("buttonUrl", v)} />
        </div>
      );
    case "video":
    case "video-embed":
      return (
        <div className="space-y-3">
          <TextInput label="Embed URL (YouTube or Vimeo)" value={p.url as string} onChange={(v) => set("url", v)} />
          <Select label="Aspect ratio" value={(p.aspect as "16:9") || "16:9"} onChange={(v) => set("aspect", v)} options={[{ value: "16:9", label: "16:9" }, { value: "4:3", label: "4:3" }, { value: "1:1", label: "1:1" }] as { value: "16:9"; label: string }[]} />
        </div>
      );
    case "form":
      return (
        <div className="space-y-3">
          <TextInput label="Form name" value={p.name as string} onChange={(v) => set("name", v)} />
          <TextInput label="Submit button label" value={p.submitLabel as string} onChange={(v) => set("submitLabel", v)} />
        </div>
      );
    case "list":
      return (
        <div className="space-y-3">
          <Repeater<{ text: string }>
            label="Items"
            items={(p.items as { text: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ text: "New item" })}
            itemPreview={(it) => it.text}
            renderItem={(it, u) => <TextInput label="Text" value={it.text} onChange={(x) => u({ ...it, text: x })} />}
          />
          <Select label="Style" value={(p.style as "bullet") || "bullet"} onChange={(v) => set("style", v)} options={[{ value: "bullet", label: "Bullet" }, { value: "numbered", label: "Numbered" }, { value: "none", label: "None" }] as { value: "bullet"; label: string }[]} />
        </div>
      );
    case "accordion":
      return (
        <div className="space-y-3">
          <Repeater<{ title: string; body: string }>
            label="Items"
            items={(p.items as { title: string; body: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ title: "New section", body: "Body" })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Body" value={it.body} onChange={(x) => u({ ...it, body: x })} />
              </>
            )}
          />
          <Toggle label="Allow multiple open" value={p.allowMultiple as boolean} onChange={(v) => set("allowMultiple", v)} />
        </div>
      );
    case "pricing-card":
      return (
        <div className="space-y-3">
          <TextInput label="Plan name" value={p.plan as string} onChange={(v) => set("plan", v)} />
          <TextInput label="Price" value={p.price as string} onChange={(v) => set("price", v)} />
          <Select label="Period" value={(p.period as "/mo") || "/mo"} onChange={(v) => set("period", v)} options={[{ value: "/mo", label: "Per month" }, { value: "/yr", label: "Per year" }, { value: "one-time", label: "One-time" }] as { value: "/mo"; label: string }[]} />
          <Repeater<{ text: string }>
            label="Features"
            items={(p.features as { text: string }[]) ?? []}
            onChange={(v) => set("features", v)}
            newItem={() => ({ text: "New feature" })}
            itemPreview={(it) => it.text}
            renderItem={(it, u) => <TextInput label="Feature text" value={it.text} onChange={(x) => u({ ...it, text: x })} />}
          />
          <ButtonEditor label="CTA button" value={p.cta as ButtonField} onChange={(v) => set("cta", v)} />
          <Toggle label="Highlighted" value={p.highlighted as boolean} onChange={(v) => set("highlighted", v)} />
        </div>
      );
    case "metrics":
      return (
        <Repeater<{ number: string; label: string; description: string }>
          label="Metrics"
          items={(p.items as { number: string; label: string; description: string }[]) ?? []}
          onChange={(v) => set("items", v)}
          newItem={() => ({ number: "0", label: "Label", description: "" })}
          itemPreview={(it) => `${it.number} ${it.label}`}
          renderItem={(it, u) => (
            <>
              <TextInput label="Number" value={it.number} onChange={(x) => u({ ...it, number: x })} />
              <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
              <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
            </>
          )}
        />
      );
    case "image-grid":
      return (
        <div className="space-y-3">
          <Repeater<{ src: string; alt: string }>
            label="Images"
            items={(p.images as { src: string; alt: string }[]) ?? []}
            onChange={(v) => set("images", v)}
            newItem={() => ({ src: "", alt: "" })}
            itemPreview={(it) => it.alt || "Image"}
            renderItem={(it, u) => (
              <>
                <ImageField label="URL" value={it.src} onChange={(x) => u({ ...it, src: x })} />
                <TextInput label="Alt" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
          <Select label="Columns" value={(p.columns as "3") || "3"} onChange={(v) => set("columns", v)} options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }] as { value: "3"; label: string }[]} />
        </div>
      );
    case "testimonial-slider":
      return (
        <Repeater<{ quote: string; author: string; role: string; avatar: string }>
          label="Testimonials"
          items={(p.items as { quote: string; author: string; role: string; avatar: string }[]) ?? []}
          onChange={(v) => set("items", v)}
          newItem={() => ({ quote: "Great!", author: "Name", role: "Role", avatar: "" })}
          itemPreview={(it) => it.author}
          renderItem={(it, u) => (
            <>
              <Textarea label="Quote" value={it.quote} onChange={(x) => u({ ...it, quote: x })} />
              <TextInput label="Author" value={it.author} onChange={(x) => u({ ...it, author: x })} />
              <TextInput label="Role" value={it.role} onChange={(x) => u({ ...it, role: x })} />
              <ImageField label="Avatar URL" value={it.avatar} onChange={(x) => u({ ...it, avatar: x })} />
            </>
          )}
        />
      );
    case "feature-list":
      return (
        <Repeater<{ icon: string; text: string }>
          label="Items"
          items={(p.items as { icon: string; text: string }[]) ?? []}
          onChange={(v) => set("items", v)}
          newItem={() => ({ icon: "✓", text: "New feature" })}
          itemPreview={(it) => it.text}
          renderItem={(it, u) => (
            <>
              <TextInput label="Icon (emoji)" value={it.icon} onChange={(x) => u({ ...it, icon: x })} />
              <TextInput label="Text" value={it.text} onChange={(x) => u({ ...it, text: x })} />
            </>
          )}
        />
      );
    case "logo":
      return (
        <div className="space-y-3">
          <ImageField label="Image URL" value={p.src as string} onChange={(v) => set("src", v)} />
          <TextInput label="Alt text" value={p.alt as string} onChange={(v) => set("alt", v)} />
          <TextInput label="Link URL" value={p.link as string} onChange={(v) => set("link", v)} />
          <NumberInput label="Width (px)" value={p.width as number} onChange={(v) => set("width", v)} />
        </div>
      );
    default:
      return null;
  }
}
