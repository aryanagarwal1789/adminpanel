import {
  ButtonEditor, ImageField, LinkItemEditor, Repeater, TextInput, Textarea, Toggle,
} from "./fields";
import type { ButtonField, LinkField } from "./defaults";
import type { Block } from "./types";
import { LayoutEditor } from "./LayoutEditor";

type FieldsOf = Record<string, unknown>;

interface Props {
  block: Block;
  update: (patch: FieldsOf) => void;
}

const newLink = (): LinkField => ({ label: "New link", url: "#" });
const linkPreview = (l: LinkField) => l.label;

export function ContentEditor({ block, update }: Props) {
  const f = block.fields as FieldsOf;
  const set = (k: string, v: unknown) => update({ [k]: v });

  switch (block.type) {
    case "nav-simple":
      return (
        <div className="space-y-4">
          <ImageField label="Logo image URL" value={f.logoImage as string} onChange={(v) => set("logoImage", v)} />
          <TextInput label="Logo text" value={f.logoText as string} onChange={(v) => set("logoText", v)} />
          <ButtonEditor label="CTA button" value={f.cta as ButtonField} onChange={(v) => set("cta", v)} />
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
          <ImageField label="Logo image URL" value={f.logoImage as string} onChange={(v) => set("logoImage", v)} />
          <TextInput label="Logo text" value={f.logoText as string} onChange={(v) => set("logoText", v)} />
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
          <ImageField label="Logo image URL" value={f.logoImage as string} onChange={(v) => set("logoImage", v)} />
          <TextInput label="Logo text" value={f.logoText as string} onChange={(v) => set("logoText", v)} />
          <TextInput label="Copyright text" value={f.copyright as string} onChange={(v) => set("copyright", v)} />
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
          <ImageField label="Logo image URL" value={f.logoImage as string} onChange={(v) => set("logoImage", v)} />
          <TextInput label="Logo text" value={f.logoText as string} onChange={(v) => set("logoText", v)} />
          <Textarea label="Tagline" value={f.tagline as string} onChange={(v) => set("tagline", v)} />
          <TextInput label="Copyright text" value={f.copyright as string} onChange={(v) => set("copyright", v)} />
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
          <TextInput label="Headline" value={f.headline as string} onChange={(v) => set("headline", v)} />
          <Textarea label="Subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <ButtonEditor label="Primary CTA" value={f.primaryCta as ButtonField} onChange={(v) => set("primaryCta", v)} />
          <ButtonEditor label="Secondary CTA" value={f.secondaryCta as ButtonField} onChange={(v) => set("secondaryCta", v)} />
          <ImageField label="Background image URL" value={f.bgImage as string} onChange={(v) => set("bgImage", v)} />
        </div>
      );
    case "hero-split":
      return (
        <div className="space-y-4">
          <TextInput label="Headline" value={f.headline as string} onChange={(v) => set("headline", v)} />
          <Textarea label="Subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <ButtonEditor label="CTA" value={f.cta as ButtonField} onChange={(v) => set("cta", v)} />
          <ImageField label="Image URL" value={f.image as string} onChange={(v) => set("image", v)} />
          <Toggle label="Image on right" value={f.imageRight as boolean} onChange={(v) => set("imageRight", v)} />
        </div>
      );
    case "features-3col":
    case "features-4col":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Textarea label="Section subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <Repeater<{ icon: string; title: string; description: string }>
            label="Features"
            items={(f.features as { icon: string; title: string; description: string }[]) ?? []}
            onChange={(v) => set("features", v)}
            newItem={() => ({ icon: "✨", title: "New feature", description: "Description" })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <TextInput label="Icon (emoji)" value={it.icon} onChange={(x) => u({ ...it, icon: x })} />
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
              </>
            )}
          />
        </div>
      );
    case "text-image":
      return (
        <div className="space-y-4">
          <TextInput label="Headline" value={f.headline as string} onChange={(v) => set("headline", v)} />
          <Textarea label="Subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <ImageField label="Image URL" value={f.image as string} onChange={(v) => set("image", v)} />
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
                <TextInput label="Number" value={it.number} onChange={(x) => u({ ...it, number: x })} />
                <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
                <TextInput label="Prefix (optional)" value={it.prefix} onChange={(x) => u({ ...it, prefix: x })} />
                <TextInput label="Suffix (optional)" value={it.suffix} onChange={(x) => u({ ...it, suffix: x })} />
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
                <Textarea label="Quote" value={it.quote} onChange={(x) => u({ ...it, quote: x })} />
                <TextInput label="Author name" value={it.author} onChange={(x) => u({ ...it, author: x })} />
                <TextInput label="Role / company" value={it.role} onChange={(x) => u({ ...it, role: x })} />
                <ImageField label="Avatar URL" value={it.avatar} onChange={(x) => u({ ...it, avatar: x })} />
              </>
            )}
          />
        </div>
      );
    case "logo-grid":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Repeater<{ src: string; alt: string }>
            label="Logos"
            items={(f.logos as { src: string; alt: string }[]) ?? []}
            onChange={(v) => set("logos", v)}
            newItem={() => ({ src: "", alt: "Logo" })}
            itemPreview={(it) => it.alt}
            renderItem={(it, u) => (
              <>
                <ImageField label="Logo image URL" value={it.src} onChange={(x) => u({ ...it, src: x })} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );
    case "cta-banner":
      return (
        <div className="space-y-4">
          <TextInput label="Headline" value={f.headline as string} onChange={(v) => set("headline", v)} />
          <Textarea label="Subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <ButtonEditor label="Button" value={f.button as ButtonField} onChange={(v) => set("button", v)} />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Repeater<{ question: string; answer: string }>
            label="FAQ items"
            items={(f.items as { question: string; answer: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ question: "New question?", answer: "Answer." })}
            itemPreview={(it) => it.question}
            renderItem={(it, u) => (
              <>
                <TextInput label="Question" value={it.question} onChange={(x) => u({ ...it, question: x })} />
                <Textarea label="Answer" value={it.answer} onChange={(x) => u({ ...it, answer: x })} />
              </>
            )}
          />
        </div>
      );
    case "layout":
      return <LayoutEditor block={block} update={update} />;
    default:
      return null;
  }
}
