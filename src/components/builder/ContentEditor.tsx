import { useState } from "react";
import { Plus } from "lucide-react";
import {
  ButtonEditor, ColorPicker, ImageField, LinkItemEditor, NumberInput, Repeater, TextInput, Textarea, Toggle,
} from "./fields";
import type { ButtonField, LinkField } from "./defaults";
import type { Block } from "./types";
import { LayoutEditor } from "./LayoutEditor";
import { WidgetListItem } from "./WidgetEditor";
import { defaultWidget, type Widget, type WidgetType } from "./widgets";

type FieldsOf = Record<string, unknown>;

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
    case "nav-simple":
      return (
        <div className="space-y-4">
          <ImageField label="Logo image URL" value={f.logoImage as string} onChange={(v) => set("logoImage", v)} />
          <TextInput label="Logo text" value={f.logoText as string} onChange={(v) => set("logoText", v)} />
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
    case "blog-preview":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <TextInput label="Subtitle" value={f.subtitle as string} onChange={(v) => set("subtitle", v)} />
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
          <TextInput label="Badge text" value={f.badge as string} onChange={(v) => set("badge", v)} />
          <Textarea label="Headline" value={f.headline as string} onChange={(v) => set("headline", v)} />
          <Textarea label="Subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <ButtonEditor label="Primary CTA" value={f.primaryCta as ButtonField} onChange={(v) => set("primaryCta", v)} />
          <ButtonEditor label="Secondary CTA" value={f.secondaryCta as ButtonField} onChange={(v) => set("secondaryCta", v)} />
          <ImageField label="Product image URL (optional)" value={f.image as string} onChange={(v) => set("image", v)} />
        </div>
      );

    case "hero-centered-image":
      return (
        <div className="space-y-4">
          <TextInput label="Badge text" value={f.badge as string} onChange={(v) => set("badge", v)} />
          <Textarea label="Headline" value={f.headline as string} onChange={(v) => set("headline", v)} />
          <Textarea label="Subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <ButtonEditor label="Primary CTA" value={f.primaryCta as ButtonField} onChange={(v) => set("primaryCta", v)} />
          <ButtonEditor label="Secondary CTA" value={f.secondaryCta as ButtonField} onChange={(v) => set("secondaryCta", v)} />
          <ImageField label="Screenshot / product image URL" value={f.image as string} onChange={(v) => set("image", v)} />
        </div>
      );

    case "features-alternating":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Textarea label="Section subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <Repeater<{ tag: string; title: string; description: string; image: string; ctaLabel: string; ctaUrl: string }>
            label="Feature rows"
            items={(f.items as { tag: string; title: string; description: string; image: string; ctaLabel: string; ctaUrl: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ tag: "Feature", title: "New feature", description: "Description here.", image: "", ctaLabel: "Learn more", ctaUrl: "#" })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <TextInput label="Category tag" value={it.tag} onChange={(x) => u({ ...it, tag: x })} />
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
                <ImageField label="Image URL" value={it.image} onChange={(x) => u({ ...it, image: x })} />
                <TextInput label="CTA label" value={it.ctaLabel} onChange={(x) => u({ ...it, ctaLabel: x })} />
                <TextInput label="CTA URL" value={it.ctaUrl} onChange={(x) => u({ ...it, ctaUrl: x })} />
              </>
            )}
          />
        </div>
      );

    case "features-icon-cards":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Textarea label="Section subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <Repeater<{ icon: string; iconBg: string; title: string; description: string }>
            label="Feature cards"
            items={(f.features as { icon: string; iconBg: string; title: string; description: string }[]) ?? []}
            onChange={(v) => set("features", v)}
            newItem={() => ({ icon: "✨", iconBg: "#f1f5f9", title: "New feature", description: "Description here." })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <TextInput label="Icon (emoji)" value={it.icon} onChange={(x) => u({ ...it, icon: x })} />
                <TextInput label="Icon background color" value={it.iconBg} onChange={(x) => u({ ...it, iconBg: x })} />
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
              </>
            )}
          />
        </div>
      );

    case "pricing-modern":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Textarea label="Section subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <Repeater<{ name: string; price: string; period: string; description: string; highlighted: boolean; features: string[]; cta: ButtonField }>
            label="Pricing plans"
            items={(f.plans as { name: string; price: string; period: string; description: string; highlighted: boolean; features: string[]; cta: ButtonField }[]) ?? []}
            onChange={(v) => set("plans", v)}
            newItem={() => ({ name: "Plan", price: "$0", period: "/month", description: "Plan description", highlighted: false, features: ["Feature 1"], cta: { label: "Get started", url: "#", variant: "outline" as const } })}
            itemPreview={(it) => `${it.name} — ${it.price}`}
            renderItem={(it, u) => (
              <>
                <TextInput label="Plan name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <TextInput label="Price" value={it.price} onChange={(x) => u({ ...it, price: x })} />
                <TextInput label="Billing period" value={it.period} onChange={(x) => u({ ...it, period: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
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
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Repeater<{ quote: string; author: string; role: string; company: string; stars: number }>
            label="Testimonials"
            items={(f.items as { quote: string; author: string; role: string; company: string; stars: number }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ quote: "Great product!", author: "Name", role: "Role", company: "Company", stars: 5 })}
            itemPreview={(it) => it.author}
            renderItem={(it, u) => (
              <>
                <Textarea label="Quote" value={it.quote} onChange={(x) => u({ ...it, quote: x })} />
                <TextInput label="Author name" value={it.author} onChange={(x) => u({ ...it, author: x })} />
                <TextInput label="Role" value={it.role} onChange={(x) => u({ ...it, role: x })} />
                <TextInput label="Company" value={it.company} onChange={(x) => u({ ...it, company: x })} />
                <NumberInput label="Stars (1–5)" value={it.stars} onChange={(x) => u({ ...it, stars: Math.min(5, Math.max(1, x)) })} />
              </>
            )}
          />
        </div>
      );

    case "team-grid":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Textarea label="Section subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <Repeater<{ name: string; role: string; avatar: string; linkedin: string }>
            label="Team members"
            items={(f.members as { name: string; role: string; avatar: string; linkedin: string }[]) ?? []}
            onChange={(v) => set("members", v)}
            newItem={() => ({ name: "Name", role: "Role", avatar: "", linkedin: "#" })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <TextInput label="Name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <TextInput label="Role" value={it.role} onChange={(x) => u({ ...it, role: x })} />
                <ImageField label="Avatar image URL" value={it.avatar} onChange={(x) => u({ ...it, avatar: x })} />
                <TextInput label="LinkedIn URL" value={it.linkedin} onChange={(x) => u({ ...it, linkedin: x })} />
              </>
            )}
          />
        </div>
      );

    case "stats-bold":
      return (
        <div className="space-y-4">
          <TextInput label="Section title (optional)" value={f.title as string} onChange={(v) => set("title", v)} />
          <Repeater<{ number: string; suffix: string; label: string }>
            label="Stats"
            items={(f.stats as { number: string; suffix: string; label: string }[]) ?? []}
            onChange={(v) => set("stats", v)}
            newItem={() => ({ number: "100", suffix: "+", label: "Label" })}
            itemPreview={(it) => `${it.number}${it.suffix} ${it.label}`}
            renderItem={(it, u) => (
              <>
                <TextInput label="Number" value={it.number} onChange={(x) => u({ ...it, number: x })} />
                <TextInput label="Suffix (+, %, ★, etc.)" value={it.suffix} onChange={(x) => u({ ...it, suffix: x })} />
                <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
              </>
            )}
          />
        </div>
      );

    case "steps-process":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Textarea label="Section subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <Repeater<{ number: string; title: string; description: string }>
            label="Steps"
            items={(f.steps as { number: string; title: string; description: string }[]) ?? []}
            onChange={(v) => set("steps", v)}
            newItem={() => ({ number: "04", title: "New step", description: "Step description." })}
            itemPreview={(it) => `${it.number} — ${it.title}`}
            renderItem={(it, u) => (
              <>
                <TextInput label="Step number" value={it.number} onChange={(x) => u({ ...it, number: x })} />
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
              </>
            )}
          />
        </div>
      );

    case "cta-banner-gradient":
      return (
        <div className="space-y-4">
          <Textarea label="Headline" value={f.headline as string} onChange={(v) => set("headline", v)} />
          <Textarea label="Subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <ButtonEditor label="Primary CTA" value={f.primaryCta as ButtonField} onChange={(v) => set("primaryCta", v)} />
          <ButtonEditor label="Secondary CTA" value={f.secondaryCta as ButtonField} onChange={(v) => set("secondaryCta", v)} />
        </div>
      );

    case "hero-salescode":
      return (
        <div className="space-y-4">
          <TextInput label="Badge text" value={f.badge as string} onChange={(v) => set("badge", v)} />
          <TextInput label="Title" value={f.title as string} onChange={(v) => set("title", v)} />
          <Textarea label="Description" value={f.description as string} onChange={(v) => set("description", v)} />
          <TextInput label="CTA text" value={f.ctaText as string} onChange={(v) => set("ctaText", v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string} onChange={(v) => set("ctaUrl", v)} />
          <TextInput label="Secondary CTA text" value={(f.ctaSecondaryText as string) ?? ""} onChange={(v) => set("ctaSecondaryText", v)} placeholder="e.g. Watch Demo (leave empty to hide)" />
          <TextInput label="Secondary CTA URL" value={(f.ctaSecondaryUrl as string) ?? ""} onChange={(v) => set("ctaSecondaryUrl", v)} placeholder="e.g. https://youtu.be/..." />
        </div>
      );

    case "impact-salescode":
      return (
        <div className="space-y-4">
          <Textarea label="Title" value={f.title as string} onChange={(v) => set("title", v)} />
          <ImageField label="Video" value={f.videoUrl as string} onChange={(v) => set("videoUrl", v)} />
          <Repeater<{ value: string; suffix: string; description: string }>
            label="Stats"
            items={(f.stats as { value: string; suffix: string; description: string }[]) ?? []}
            onChange={(v) => set("stats", v)}
            newItem={() => ({ value: "0", suffix: "%", description: "Stat description" })}
            itemPreview={(it) => `${it.value}${it.suffix} — ${it.description}`}
            renderItem={(it, u) => (
              <>
                <TextInput label="Value" value={it.value} onChange={(x) => u({ ...it, value: x })} />
                <TextInput label="Suffix (%, x, etc.)" value={it.suffix} onChange={(x) => u({ ...it, suffix: x })} />
                <TextInput label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
              </>
            )}
          />
        </div>
      );

    case "clients-salescode":
      return (
        <div className="space-y-4">
          <TextInput label="Section title" value={f.title as string} onChange={(v) => set("title", v)} />
          <TextInput label="Section ID" value={f.sectionId as string} onChange={(v) => set("sectionId", v)} />
          <p className="text-xs text-slate-400 leading-relaxed">
            Logo images are managed via the Sections admin.
          </p>
        </div>
      );

    case "security-salescode":
      return (
        <div className="space-y-4">
          <TextInput label="Heading" value={f.heading as string} onChange={(v) => set("heading", v)} />
          <Repeater<{ url: string; alt: string }>
            label="Certificates"
            items={(f.certs as { url: string; alt: string }[]) ?? []}
            onChange={(v) => set("certs", v)}
            newItem={() => ({ url: "", alt: "Certificate" })}
            itemPreview={(it) => it.alt}
            renderItem={(it, u) => (
              <>
                <ImageField label="Image" value={it.url} onChange={(x) => u({ ...it, url: x })} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );

    case "experience-video-salescode":
      return (
        <div className="space-y-4">
          <TextInput label="Title" value={f.title as string} onChange={(v) => set("title", v)} />
          <TextInput label="Subtitle (teal, below title)" value={(f.subtitle as string) ?? ""} onChange={(v) => set("subtitle", v)} />
          <ImageField label="Video" value={f.videoUrl as string} onChange={(v) => set("videoUrl", v)} />
        </div>
      );

    case "cta-salescode":
      return (
        <div className="space-y-4">
          <TextInput label="Badge text" value={f.badge as string} onChange={(v) => set("badge", v)} />
          <TextInput label="Heading" value={f.heading as string} onChange={(v) => set("heading", v)} />
          <Textarea label="Subtext" value={f.subtext as string} onChange={(v) => set("subtext", v)} />
          <TextInput label="CTA text" value={f.ctaText as string} onChange={(v) => set("ctaText", v)} />
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
                <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
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
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Headline start" value={f.headlineStart as string ?? ''} onChange={(v) => set('headlineStart', v)} />
          <TextInput label="Headline accent (bold)" value={f.headlineAccent as string ?? ''} onChange={(v) => set('headlineAccent', v)} />
          <TextInput label="Headline end" value={f.headlineEnd as string ?? ''} onChange={(v) => set('headlineEnd', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <TextInput label="Primary CTA label" value={f.primaryCtaLabel as string ?? ''} onChange={(v) => set('primaryCtaLabel', v)} />
          <TextInput label="Primary CTA href" value={f.primaryCtaHref as string ?? ''} onChange={(v) => set('primaryCtaHref', v)} />
          <TextInput label="Secondary CTA label" value={f.secondaryCtaLabel as string ?? ''} onChange={(v) => set('secondaryCtaLabel', v)} />
          <TextInput label="Secondary CTA href" value={f.secondaryCtaHref as string ?? ''} onChange={(v) => set('secondaryCtaHref', v)} />
          <ImageField label="Mockup image URL" value={f.mockupImageUrl as string ?? ''} onChange={(v) => set('mockupImageUrl', v)} />
          <TextInput label="Mockup alt text" value={f.mockupAlt as string ?? ''} onChange={(v) => set('mockupAlt', v)} />
          <TextInput label="Trust label" value={f.trustLabel as string ?? ''} onChange={(v) => set('trustLabel', v)} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Headline top" value={f.headlineTop as string ?? ''} onChange={(v) => set('headlineTop', v)} />
          <TextInput label="Headline accent" value={f.headlineAccent as string ?? ''} onChange={(v) => set('headlineAccent', v)} />
          <TextInput label="Headline bottom" value={f.headlineBottom as string ?? ''} onChange={(v) => set('headlineBottom', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <TextInput label="Primary CTA label" value={f.primaryCtaLabel as string ?? ''} onChange={(v) => set('primaryCtaLabel', v)} />
          <TextInput label="Primary CTA href" value={f.primaryCtaHref as string ?? ''} onChange={(v) => set('primaryCtaHref', v)} />
          <TextInput label="Secondary CTA label" value={f.secondaryCtaLabel as string ?? ''} onChange={(v) => set('secondaryCtaLabel', v)} />
          <ImageField label="Video poster image" value={f.videoPoster as string ?? ''} onChange={(v) => set('videoPoster', v)} />
          <ImageField label="Video (mp4)" value={f.videoSrc as string ?? ''} onChange={(v) => set('videoSrc', v)} />
          <Repeater<{ value: string; label: string }>
            label="Metrics"
            items={(f.metrics as { value: string; label: string }[]) ?? []}
            onChange={(v) => set('metrics', v)}
            newItem={() => ({ value: '10K+', label: 'Users' })}
            itemPreview={(it) => `${it.value} ${it.label}`}
            renderItem={(it, u) => (
              <>
                <TextInput label="Value (e.g. 10K+)" value={it.value} onChange={(x) => u({ ...it, value: x })} />
                <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subheading" value={f.subheading as string ?? ''} onChange={(v) => set('subheading', v)} />
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
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
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
                <TextInput label="Tag chip" value={it.tag} onChange={(x) => u({ ...it, tag: x })} />
                <TextInput label="Headline" value={it.headline} onChange={(x) => u({ ...it, headline: x })} />
                <TextInput label="Headline accent" value={it.headlineAccent} onChange={(x) => u({ ...it, headlineAccent: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
                <TextInput label="CTA label" value={it.ctaLabel} onChange={(x) => u({ ...it, ctaLabel: x })} />
                <TextInput label="CTA href" value={(it as { ctaHref?: string }).ctaHref ?? ''} onChange={(x) => u({ ...it, ctaHref: x })} />
                <ImageField label="Image URL" value={it.imageUrl} onChange={(x) => u({ ...it, imageUrl: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subheading" value={f.subheading as string ?? ''} onChange={(v) => set('subheading', v)} />
          <TextInput label="Currency symbol" value={(f.currency as string) ?? '$'} onChange={(v) => set('currency', v)} />
          <Repeater<{ name: string; description: string; monthlyPrice: number; annualPrice: number; features: string[]; ctaLabel: string; ctaHref: string; highlighted: boolean; badge: string }>
            label="Plans"
            openIndex={focusedItem?.itemKey === 'plans' ? focusedItem.itemIndex : undefined}
            items={(f.plans as { name: string; description: string; monthlyPrice: number; annualPrice: number; features: string[]; ctaLabel: string; ctaHref: string; highlighted: boolean; badge: string }[]) ?? []}
            onChange={(v) => set('plans', v)}
            newItem={() => ({ name: 'New plan', description: 'Plan description.', monthlyPrice: 29, annualPrice: 19, features: ['Feature one', 'Feature two'], ctaLabel: 'Get started', ctaHref: '#', highlighted: false, badge: '' })}
            itemPreview={(it) => `${it.name} — $${it.monthlyPrice}/mo`}
            renderItem={(it, u) => (
              <>
                <TextInput label="Plan name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
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
                <TextInput label="CTA label" value={it.ctaLabel} onChange={(x) => u({ ...it, ctaLabel: x })} />
                <TextInput label="CTA href" value={it.ctaHref} onChange={(x) => u({ ...it, ctaHref: x })} />
                <TextInput label="Badge (e.g. ★ MOST POPULAR)" value={it.badge ?? ''} onChange={(x) => u({ ...it, badge: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Repeater<{ quote: string; name: string; role: string; company: string; avatarUrl: string; rating?: number }>
            label="Testimonials"
            items={(f.testimonials as { quote: string; name: string; role: string; company: string; avatarUrl: string; rating?: number }[]) ?? []}
            onChange={(v) => set('testimonials', v)}
            newItem={() => ({ quote: 'Add your testimonial here.', name: 'Name', role: 'Role', company: 'Company', avatarUrl: '', rating: 5 })}
            itemPreview={(it) => it.name}
            openIndex={focusedItem?.itemKey === 'testimonials' ? focusedItem.itemIndex : undefined}
            renderItem={(it, u) => (
              <>
                <Textarea label="Quote" value={it.quote} onChange={(x) => u({ ...it, quote: x })} />
                <TextInput label="Name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <TextInput label="Role" value={it.role} onChange={(x) => u({ ...it, role: x })} />
                <TextInput label="Company" value={it.company} onChange={(x) => u({ ...it, company: x })} />
                <ImageField label="Avatar URL" value={it.avatarUrl} onChange={(x) => u({ ...it, avatarUrl: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Quote" value={f.quote as string ?? ''} onChange={(v) => set('quote', v)} />
          <TextInput label="Author name" value={f.authorName as string ?? ''} onChange={(v) => set('authorName', v)} />
          <TextInput label="Author role" value={f.authorRole as string ?? ''} onChange={(v) => set('authorRole', v)} />
          <TextInput label="Author company" value={f.authorCompany as string ?? ''} onChange={(v) => set('authorCompany', v)} />
          <ImageField label="Author avatar URL" value={f.authorAvatarUrl as string ?? ''} onChange={(v) => set('authorAvatarUrl', v)} />
          <Repeater<{ name: string; src: string }>
            label="Company logos"
            items={(f.logos as { name: string; src: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ name: 'Company', src: '' })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <TextInput label="Company name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <ImageField label="Logo URL" value={it.src} onChange={(x) => u({ ...it, src: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Description" value={f.description as string ?? ''} onChange={(v) => set('description', v)} />
          <Repeater<{ value: string; suffix: string; label: string }>
            label="Stats"
            items={(f.stats as { value: string; suffix: string; label: string }[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '0', suffix: '+', label: 'Metric' })}
            itemPreview={(it) => `${it.value}${it.suffix} — ${it.label}`}
            openIndex={focusedItem?.itemKey === 'stats' ? focusedItem.itemIndex : undefined}
            renderItem={(it, u) => (
              <>
                <TextInput label="Value" value={it.value} onChange={(x) => u({ ...it, value: x })} />
                <TextInput label="Suffix (e.g. +, %, x)" value={it.suffix ?? ''} onChange={(x) => u({ ...it, suffix: x })} />
                <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subheading" value={f.subheading as string ?? ''} onChange={(v) => set('subheading', v)} />
          <TextInput label="Contact CTA label" value={f.contactCtaLabel as string ?? ''} onChange={(v) => set('contactCtaLabel', v)} />
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
                <TextInput label="Category" value={it.category} onChange={(x) => u({ ...it, category: x })} />
                <TextInput label="Question" value={it.question} onChange={(x) => u({ ...it, question: x })} />
                <Textarea label="Answer" value={it.answer} onChange={(x) => u({ ...it, answer: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtext" value={f.subtext as string ?? ''} onChange={(v) => set('subtext', v)} />
          <TextInput label="Primary CTA label" value={f.primaryCtaLabel as string ?? ''} onChange={(v) => set('primaryCtaLabel', v)} />
          <TextInput label="Primary CTA href" value={f.primaryCtaHref as string ?? ''} onChange={(v) => set('primaryCtaHref', v)} />
          <TextInput label="Secondary CTA label" value={f.secondaryCtaLabel as string ?? ''} onChange={(v) => set('secondaryCtaLabel', v)} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subheading" value={f.subheading as string ?? ''} onChange={(v) => set('subheading', v)} />
          <Repeater<{ name: string; role: string; bio: string; avatarUrl: string; linkedinUrl: string; accent: string }>
            label="Team members"
            openIndex={focusedItem?.itemKey === 'members' ? focusedItem.itemIndex : undefined}
            items={(f.members as { name: string; role: string; bio: string; avatarUrl: string; linkedinUrl: string; accent: string }[]) ?? []}
            onChange={(v) => set('members', v)}
            newItem={() => ({ name: 'Name', role: 'Role', bio: 'Bio here.', avatarUrl: '', linkedinUrl: '#', accent: 'lime' })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <TextInput label="Name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <TextInput label="Role" value={it.role} onChange={(x) => u({ ...it, role: x })} />
                <Textarea label="Bio" value={it.bio} onChange={(x) => u({ ...it, bio: x })} />
                <ImageField label="Avatar URL" value={it.avatarUrl} onChange={(x) => u({ ...it, avatarUrl: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subheading" value={f.subheading as string ?? ''} onChange={(v) => set('subheading', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <Repeater<{ name: string; src: string }>
            label="Integration logos"
            items={(f.logos as { name: string; src: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ name: 'Tool', src: '' })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <TextInput label="Name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <ImageField label="Logo URL" value={it.src} onChange={(x) => u({ ...it, src: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subheading" value={f.subheading as string ?? ''} onChange={(v) => set('subheading', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
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
                <ImageField label="Cover image URL" value={it.coverUrl} onChange={(x) => u({ ...it, coverUrl: x })} />
                <TextInput label="Tag" value={it.tag} onChange={(x) => u({ ...it, tag: x })} />
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Excerpt" value={it.excerpt} onChange={(x) => u({ ...it, excerpt: x })} />
                <TextInput label="Author name" value={it.authorName} onChange={(x) => u({ ...it, authorName: x })} />
                <ImageField label="Author avatar URL" value={(it as { authorAvatarUrl?: string }).authorAvatarUrl ?? ''} onChange={(x) => u({ ...it, authorAvatarUrl: x })} />
                <TextInput label="Read time (e.g. 5 min)" value={(it as { readTime?: string }).readTime ?? ''} onChange={(x) => u({ ...it, readTime: x })} />
                <TextInput label="Date" value={it.date} onChange={(x) => u({ ...it, date: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subheading" value={f.subheading as string ?? ''} onChange={(v) => set('subheading', v)} />
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
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
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
          <TextInput label="Brand name" value={f.brandName as string ?? ''} onChange={(v) => set('brandName', v)} />
          <Textarea label="Tagline" value={f.tagline as string ?? ''} onChange={(v) => set('tagline', v)} />
          <TextInput label="Giant background word" value={f.giantBrandWord as string ?? ''} onChange={(v) => set('giantBrandWord', v)} />
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
                  <TextInput label="Column title" value={col.title} onChange={(v) => onChange({ ...col, title: v })} />
                  <Repeater<{ label: string; href: string }>
                    label="Links"
                    items={col.links}
                    newItem={() => ({ label: 'Link', href: '#' })}
                    itemPreview={(link) => link.label}
                    onChange={(links) => onChange({ ...col, links })}
                    renderItem={(link, onLinkChange) => (
                      <div className="space-y-1">
                        <TextInput label="Label" value={link.label} onChange={(v) => onLinkChange({ ...link, label: v })} />
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
          <TextInput label="Newsletter heading" value={f.newsletterHeading as string ?? ''} onChange={(v) => set('newsletterHeading', v)} />
          <TextInput label="Newsletter subtext" value={f.newsletterSubtext as string ?? ''} onChange={(v) => set('newsletterSubtext', v)} />
          <TextInput label="Newsletter CTA label" value={f.newsletterCtaLabel as string ?? ''} onChange={(v) => set('newsletterCtaLabel', v)} />
          <TextInput label="Newsletter placeholder" value={f.newsletterPlaceholder as string ?? ''} onChange={(v) => set('newsletterPlaceholder', v)} />
          <TextInput label="Copyright" value={f.copyright as string ?? ''} onChange={(v) => set('copyright', v)} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtext" value={f.subtext as string ?? ''} onChange={(v) => set('subtext', v)} />
          <Repeater<{ badgeImage: string; storeUrl: string; deviceLabel: string; qrImage: string; qrLabel: string }>
            label="Stores"
            items={(f.stores as { badgeImage: string; storeUrl: string; deviceLabel: string; qrImage: string; qrLabel: string }[]) ?? []}
            onChange={(v) => set('stores', v)}
            newItem={() => ({ badgeImage: '', storeUrl: '#', deviceLabel: 'Store name', qrImage: '', qrLabel: 'Scan to install' })}
            itemPreview={(it) => it.deviceLabel || 'Store'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Badge image" value={it.badgeImage} onChange={(x) => u({ ...it, badgeImage: x })} />
                <TextInput label="Store URL" value={it.storeUrl} onChange={(x) => u({ ...it, storeUrl: x })} />
                <TextInput label="Device label" value={it.deviceLabel} onChange={(x) => u({ ...it, deviceLabel: x })} />
                <ImageField label="QR code image" value={it.qrImage} onChange={(x) => u({ ...it, qrImage: x })} />
                <TextInput label="QR label" value={it.qrLabel} onChange={(x) => u({ ...it, qrLabel: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-app-showcase':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Tagline (bottom)" value={f.tagline as string ?? ''} onChange={(v) => set('tagline', v)} />
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
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <TextInput label="Subtitle" value={it.subtitle} onChange={(x) => u({ ...it, subtitle: x })} />
                <ImageField label="Phone screenshot" value={it.image} onChange={(x) => u({ ...it, image: x })} />
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
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading color</span>
            <input type="color" value={(f.headingColor as string) || '#FFD700'}
              onChange={(e) => set('headingColor', e.target.value)}
              style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #334155', cursor: 'pointer', background: 'none' }} />
          </div>
          <TextInput label="Subheading" value={f.subheading as string ?? ''} onChange={(v) => set('subheading', v)} />
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
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <ImageField label="Right-side image URL" value={f.image as string ?? ''} onChange={(v) => set('image', v)} />
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
          <TextInput label="Pill prefix" value={f.pillPre as string ?? ''} onChange={(v) => set('pillPre', v)} />
          <TextInput label="Pill bold text" value={f.pillBold as string ?? ''} onChange={(v) => set('pillBold', v)} />
          <TextInput label="Pill suffix" value={f.pillSuffix as string ?? ''} onChange={(v) => set('pillSuffix', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient word" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Sub (before bold)" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Sub bold phrase" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub (after bold)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Center image" value={f.imgCenter as string ?? ''} onChange={(v) => set('imgCenter', v)} />
          <ImageField label="Bottom-left card" value={f.imgBottomLeft as string ?? ''} onChange={(v) => set('imgBottomLeft', v)} />
          <ImageField label="Bottom-right card" value={f.imgBottomRight as string ?? ''} onChange={(v) => set('imgBottomRight', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Floating chips</p>
          <TextInput label="Chip 1 — value" value={f.chip1Val as string ?? ''} onChange={(v) => set('chip1Val', v)} />
          <TextInput label="Chip 1 — unit (teal)" value={f.chip1Unit as string ?? ''} onChange={(v) => set('chip1Unit', v)} />
          <TextInput label="Chip 1 — label" value={f.chip1Lbl as string ?? ''} onChange={(v) => set('chip1Lbl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 2 — value" value={f.chip2Val as string ?? ''} onChange={(v) => set('chip2Val', v)} />
          <TextInput label="Chip 2 — unit (teal)" value={f.chip2Unit as string ?? ''} onChange={(v) => set('chip2Unit', v)} />
          <TextInput label="Chip 2 — label" value={f.chip2Lbl as string ?? ''} onChange={(v) => set('chip2Lbl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 3 — value" value={f.chip3Val as string ?? ''} onChange={(v) => set('chip3Val', v)} />
          <TextInput label="Chip 3 — unit (teal)" value={f.chip3Unit as string ?? ''} onChange={(v) => set('chip3Unit', v)} />
          <TextInput label="Chip 3 — label" value={f.chip3Lbl as string ?? ''} onChange={(v) => set('chip3Lbl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 4 — value" value={f.chip4Val as string ?? ''} onChange={(v) => set('chip4Val', v)} />
          <TextInput label="Chip 4 — unit (teal)" value={f.chip4Unit as string ?? ''} onChange={(v) => set('chip4Unit', v)} />
          <TextInput label="Chip 4 — label" value={f.chip4Lbl as string ?? ''} onChange={(v) => set('chip4Lbl', v)} />
        </div>
      );

    case 'slick-dv-hero':
      return (
        <div className="space-y-4">
          <ImageField label="Logo URL" value={f.logo as string ?? ''} onChange={(v) => set('logo', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Heading</div>
          <TextInput label="Prefix (white)" value={f.headingPrefix as string ?? ''} onChange={(v) => set('headingPrefix', v)} />
          <TextInput label="Accent (teal, wraps naturally)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Last line (white)" value={f.headingLastLine as string ?? ''} onChange={(v) => set('headingLastLine', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Primary CTA label" value={f.ctaPrimaryLabel as string ?? ''} onChange={(v) => set('ctaPrimaryLabel', v)} />
          <TextInput label="Primary CTA href" value={f.ctaPrimaryHref as string ?? ''} onChange={(v) => set('ctaPrimaryHref', v)} />
          <TextInput label="Secondary CTA label" value={f.ctaSecondaryLabel as string ?? ''} onChange={(v) => set('ctaSecondaryLabel', v)} />
          <TextInput label="Demo video URL (embed)" value={f.demoVideoUrl as string ?? ''} onChange={(v) => set('demoVideoUrl', v)} />
          <TextInput label="Google Play URL" value={f.googlePlayUrl as string ?? ''} onChange={(v) => set('googlePlayUrl', v)} />
          <TextInput label="App Store URL" value={f.appStoreUrl as string ?? ''} onChange={(v) => set('appStoreUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Trust stats (e.g. "25+ companies")</div>
          <TextInput label="Stat 1" value={f.stat1Text as string ?? ''} onChange={(v) => set('stat1Text', v)} />
          <TextInput label="Stat 2" value={f.stat2Text as string ?? ''} onChange={(v) => set('stat2Text', v)} />
          <TextInput label="Stat 3" value={f.stat3Text as string ?? ''} onChange={(v) => set('stat3Text', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Phone mockup image URL" value={f.mockupImage as string ?? ''} onChange={(v) => set('mockupImage', v)} />
        </div>
      );

    case 'slick-dv-video-split':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (plain text)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal bold)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Body text" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Video thumbnail URL" value={f.videoThumb as string ?? ''} onChange={(v) => set('videoThumb', v)} />
          <TextInput label="Video caption" value={f.videoLabel as string ?? ''} onChange={(v) => set('videoLabel', v)} />
          <TextInput label="Video embed URL" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
        </div>
      );

    case 'slick-dv-vision':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Vision text (wrap **text** in double asterisks for teal bold)" value={f.visionText as string ?? ''} onChange={(v) => set('visionText', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Stats</div>
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
        </div>
      );

    case 'slick-dv-carousel':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (plain)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ image: string; alt: string; title: string; subtitle: string }>
            label="Carousel cards"
            items={(f.cards as { image: string; alt: string; title: string; subtitle: string }[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ image: '', alt: 'App screenshot', title: '', subtitle: '' })}
            itemPreview={(it) => it.title || it.alt || 'Card'}
            renderItem={(it, u) => (
              <>
                <TextInput label="Card title" value={it.title ?? ''} onChange={(x) => u({ ...it, title: x })} />
                <TextInput label="Card subtitle" value={it.subtitle ?? ''} onChange={(x) => u({ ...it, subtitle: x })} />
                <ImageField label="Screenshot image" value={it.image} onChange={(x) => u({ ...it, image: x })} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-dv-split':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (plain)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Screenshots (auto-advances every 3s)"
            items={(f.slides as string[]) ?? []}
            onChange={(v) => set('slides', v)}
            newItem={() => ''}
            itemPreview={(s) => s || '(empty)'}
            renderItem={(s, u) => <ImageField label="Slide image" value={s} onChange={u} />}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ label: string }>
            label="Feature chips"
            items={(f.features as { label: string }[]) ?? []}
            onChange={(v) => set('features', v)}
            newItem={() => ({ label: 'Feature' })}
            itemPreview={(it) => it.label || 'Feature'}
            renderItem={(it, u) => (
              <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
            )}
          />
        </div>
      );

    case 'slick-dv-agent':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (plain)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal bold)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Body text" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
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
        </div>
      );

    case 'slick-dv-download':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (plain)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Subtext" value={f.subtext as string ?? ''} onChange={(v) => set('subtext', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Android store URL" value={f.androidStoreUrl as string ?? ''} onChange={(v) => set('androidStoreUrl', v)} />
          <ImageField label="Android QR image (optional)" value={f.androidQrUrl as string ?? ''} onChange={(v) => set('androidQrUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="iOS store URL" value={f.iosStoreUrl as string ?? ''} onChange={(v) => set('iosStoreUrl', v)} />
          <ImageField label="iOS QR image (optional)" value={f.iosQrUrl as string ?? ''} onChange={(v) => set('iosQrUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Phone mockup image (right side)" value={f.phoneImage as string ?? ''} onChange={(v) => set('phoneImage', v)} />
        </div>
      );

    case 'slick-dv-who': {
      type WhoCard = { title?: string; description?: string; image?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (plain, underlined)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<WhoCard>
            label="Cards"
            items={(f.cards as WhoCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'New card', description: 'Description here.', image: '' })}
            itemPreview={(c) => c.title || '(empty)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <TextInput label="Description" value={c.description ?? ''} onChange={(v) => u({ ...c, description: v })} />
                <ImageField label="Card image" value={c.image ?? ''} onChange={(v) => u({ ...c, image: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-dv-register':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (plain)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Body text" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
          <TextInput label="Form title" value={f.formTitle as string ?? ''} onChange={(v) => set('formTitle', v)} />
          <TextInput label="Form subtext" value={f.formSubtext as string ?? ''} onChange={(v) => set('formSubtext', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="API endpoint (POST)" value={f.apiEndpoint as string ?? ''} onChange={(v) => set('apiEndpoint', v)} />
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
          <TextInput label="Eyebrow pill" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<PcCard>
            label="Cards"
            items={(f.cards as PcCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Product', description: '', logoText: 'SC', logoColor: '#00C6B1', href: '#' })}
            itemPreview={(c) => c.title || '(untitled)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(x) => u({ ...c, title: x })} />
                <Textarea label="Description" value={c.description ?? ''} onChange={(x) => u({ ...c, description: x })} />
                <TextInput label="Logo image URL" value={c.logoImg ?? ''} onChange={(x) => u({ ...c, logoImg: x })} />
                <TextInput label="Logo alt text" value={c.logoAlt ?? ''} onChange={(x) => u({ ...c, logoAlt: x })} />
                <TextInput label="Logo text (if no image)" value={c.logoText ?? ''} onChange={(x) => u({ ...c, logoText: x })} />
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
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading suffix (bold)" value={f.headingGradient as string ?? ''} onChange={(v) => set('headingGradient', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<PsCard>
            label="Cards (3 slots: IR Recognition · AI Sales Agent · AI Coach)"
            items={(f.cards as PsCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Product', ctaLabel: 'Explore Demo', ctaUrl: '#' })}
            itemPreview={(c) => c.title || '(untitled)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Card title" value={c.title ?? ''} onChange={(x) => u({ ...c, title: x })} />
                <TextInput label="CTA label" value={c.ctaLabel ?? ''} onChange={(x) => u({ ...c, ctaLabel: x })} />
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
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGradient as string ?? ''} onChange={(v) => set('headingGradient', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<AcsCard>
            label="Cards (6 slots, illustrations are hardcoded per slot)"
            items={(f.cards as AcsCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ kicker: 'Category', title: 'Feature Title', copy: '', ctaUrl: '#' })}
            itemPreview={(c) => c.title || c.kicker || '(untitled)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Kicker (category label)" value={c.kicker ?? ''} onChange={(x) => u({ ...c, kicker: x })} />
                <TextInput label="Card title" value={c.title ?? ''} onChange={(x) => u({ ...c, title: x })} />
                <Textarea label="Copy" value={c.copy ?? ''} onChange={(x) => u({ ...c, copy: x })} />
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
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGradient as string ?? ''} onChange={(v) => set('headingGradient', v)} />
          <TextInput label="Heading suffix (optional)" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<TileField>
            label="Integration tiles (up to 12)"
            items={(f.tiles as TileField[]) ?? []}
            onChange={(v) => set('tiles', v)}
            newItem={() => ({ imageUrl: '', alt: 'Integration' })}
            itemPreview={(t) => t.alt || '(unnamed)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <ImageField label="Logo image" value={t.imageUrl ?? ''} onChange={(x) => u({ ...t, imageUrl: x })} />
                <TextInput label="Alt text" value={t.alt ?? ''} onChange={(x) => u({ ...t, alt: x })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sc-trust-metrics': {
      type StatField = { target: number; prefix?: string; suffix: string; label: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGradient as string ?? ''} onChange={(v) => set('headingGradient', v)} />
          <TextInput label="Heading suffix (optional)" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
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
                <TextInput label="Prefix (optional, e.g. $)" value={s.prefix ?? ''} onChange={(x) => u({ ...s, prefix: x })} />
                <TextInput label="Suffix (e.g. +, M+, B+)" value={s.suffix} onChange={(x) => u({ ...s, suffix: x })} />
                <TextInput label="Label" value={s.label} onChange={(x) => u({ ...s, label: x })} />
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
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
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
                <TextInput label="Brand name" value={s.brandName} onChange={(x) => u({ ...s, brandName: x })} />
                <ColorPicker label="Brand color" value={s.brandColor} onChange={(x) => u({ ...s, brandColor: x })} />
                <TextInput label="Category tag" value={s.categoryLabel} onChange={(x) => u({ ...s, categoryLabel: x })} />
                <TextInput label="Card title" value={s.title} onChange={(x) => u({ ...s, title: x })} />
                <Textarea label="Description" value={s.description} onChange={(x) => u({ ...s, description: x })} />
                <TextInput label="Speaker initials" value={s.speakerInitials} onChange={(x) => u({ ...s, speakerInitials: x })} />
                <TextInput label="Speaker name" value={s.speakerName} onChange={(x) => u({ ...s, speakerName: x })} />
                <TextInput label="Speaker role" value={s.speakerRole} onChange={(x) => u({ ...s, speakerRole: x })} />
                <TextInput label="Story URL (optional)" value={s.storyUrl ?? ''} onChange={(x) => u({ ...s, storyUrl: x })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sc-brand-strip': {
      type LogoField = { imageUrl: string; alt: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGradient as string ?? ''} onChange={(v) => set('headingGradient', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <TextInput label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<LogoField>
            label="Logos"
            items={(f.logos as LogoField[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ imageUrl: '', alt: 'Brand name' })}
            itemPreview={(l) => l.alt || '(unnamed)'}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <ImageField label="Logo URL" value={l.imageUrl} onChange={(x) => u({ ...l, imageUrl: x })} />
                <TextInput label="Alt text" value={l.alt} onChange={(x) => u({ ...l, alt: x })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="CTA note" value={f.ctaNote as string ?? ''} onChange={(v) => set('ctaNote', v)} />
        </div>
      );
    }

    case 'slick-sc-impact-stats': {
      type StatField = { value?: string; suffix?: string; label?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading prefix (use \\n for line break)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<StatField>
            label="Stats"
            items={(f.stats as StatField[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '0', suffix: '%', label: 'Label' })}
            itemPreview={(s) => `${s.value ?? ''}${s.suffix ?? ''} — ${s.label ?? ''}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.value ?? ''} onChange={(x) => u({ ...s, value: x })} />
                <TextInput label="Suffix (e.g. %)" value={s.suffix ?? ''} onChange={(x) => u({ ...s, suffix: x })} />
                <TextInput label="Label (use \\n for line break)" value={s.label ?? ''} onChange={(x) => u({ ...s, label: x })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-think-tank': {
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Posts are pulled from the <strong>Featured Blogs</strong> CMS section (same source as the Blogs section). Manage them there.
          </p>
        </div>
      );
    }

    case 'slick-sc-data-safety': {
      type BadgeField = { imageUrl?: string; alt?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Subtitle line 1" value={f.subtitleLine1 as string ?? ''} onChange={(v) => set('subtitleLine1', v)} />
          <TextInput label="Subtitle line 2" value={f.subtitleLine2 as string ?? ''} onChange={(v) => set('subtitleLine2', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<BadgeField>
            label="Certification badges"
            items={(f.badges as BadgeField[]) ?? []}
            onChange={(v) => set('badges', v)}
            newItem={() => ({ imageUrl: '', alt: 'Certification' })}
            itemPreview={(b) => b.alt || '(unnamed)'}
            renderItem={(b, u) => (
              <div className="space-y-2">
                <ImageField label="Badge image" value={b.imageUrl ?? ''} onChange={(x) => u({ ...b, imageUrl: x })} />
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
          <TextInput label="Heading line 1" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading line 2" value={f.headingLine2 as string ?? ''} onChange={(v) => set('headingLine2', v)} />
          <TextInput label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <TextInput label="CTA label (trailing space = gap)" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
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
                <TextInput label="Title" value={c.title ?? ''} onChange={(x) => u({ ...c, title: x })} />
                <TextInput label="Description" value={c.description ?? ''} onChange={(x) => u({ ...c, description: x })} />
                <ImageField label="Thumbnail image" value={c.thumbnailUrl ?? ''} onChange={(x) => u({ ...c, thumbnailUrl: x })} />
                <TextInput label="Video URL (YouTube / mp4)" value={c.videoUrl ?? ''} onChange={(x) => u({ ...c, videoUrl: x })} />
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
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<CardField>
            label="Cards"
            items={(f.cards as CardField[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Module Name', description: '', imageUrl: '', imageAlt: '' })}
            itemPreview={(c) => c.title || '(untitled)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(x) => u({ ...c, title: x })} />
                <TextInput label="Description" value={c.description ?? ''} onChange={(x) => u({ ...c, description: x })} />
                <ImageField label="Screenshot image" value={c.imageUrl ?? ''} onChange={(x) => u({ ...c, imageUrl: x })} />
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
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Featured post</p>
          {(() => {
            const fp = (f.featuredPost as PostField) ?? {};
            const upd = (patch: Partial<PostField>) => set('featuredPost', { ...fp, ...patch });
            return (
              <div className="space-y-2 pl-1 border-l-2 border-slate-700">
                <TextInput label="Badge" value={fp.badge ?? ''} onChange={(v) => upd({ badge: v })} />
                <Textarea label="Title" value={fp.title ?? ''} onChange={(v) => upd({ title: v })} />
                <ImageField label="Image" value={fp.imageUrl ?? ''} onChange={(v) => upd({ imageUrl: v })} />
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
                <TextInput label="Badge" value={p.badge ?? ''} onChange={(v) => u({ ...p, badge: v })} />
                <Textarea label="Title" value={p.title ?? ''} onChange={(v) => u({ ...p, title: v })} />
                <ImageField label="Image" value={p.imageUrl ?? ''} onChange={(v) => u({ ...p, imageUrl: v })} />
                <TextInput label="CTA label" value={p.ctaLabel ?? ''} onChange={(v) => u({ ...p, ctaLabel: v })} />
                <TextInput label="CTA URL" value={p.ctaUrl ?? ''} onChange={(v) => u({ ...p, ctaUrl: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="View all label" value={f.viewAllLabel as string ?? ''} onChange={(v) => set('viewAllLabel', v)} />
          <TextInput label="View all URL" value={f.viewAllUrl as string ?? ''} onChange={(v) => set('viewAllUrl', v)} />
        </div>
      );
    }

    case 'slick-sfa-hero':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix (optional)" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <TextInput label="Subtitle bold part" value={f.subtitleBold as string ?? ''} onChange={(v) => set('subtitleBold', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA button label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Input placeholder" value={f.ctaPlaceholder as string ?? ''} onChange={(v) => set('ctaPlaceholder', v)} />
          <TextInput label="Trust line" value={f.trustText as string ?? ''} onChange={(v) => set('trustText', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Textarea label="Subtitle suffix" value={f.subtitleSuffix as string ?? ''} onChange={(v) => set('subtitleSuffix', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Phone time" value={f.phoneTime as string ?? ''} onChange={(v) => set('phoneTime', v)} />
          <TextInput label="Phone greeting" value={f.phoneGreeting as string ?? ''} onChange={(v) => set('phoneGreeting', v)} />
          <TextInput label="Phone date" value={f.phoneDate as string ?? ''} onChange={(v) => set('phoneDate', v)} />
          <TextInput label="Phone region badge" value={f.phoneRegionBadge as string ?? ''} onChange={(v) => set('phoneRegionBadge', v)} />
          <TextInput label="Phone score card footer" value={f.phoneScoreCardFooter as string ?? ''} onChange={(v) => set('phoneScoreCardFooter', v)} />
          <TextInput label="Phone analytics label" value={f.phoneAnalyticsLabel as string ?? ''} onChange={(v) => set('phoneAnalyticsLabel', v)} />
          <TextInput label="Phone body greeting" value={f.phoneBodyGreeting as string ?? ''} onChange={(v) => set('phoneBodyGreeting', v)} />
          <TextInput label="Phone body sub" value={f.phoneBodySub as string ?? ''} onChange={(v) => set('phoneBodySub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Task 1 badge" value={f.phoneTask1Badge as string ?? ''} onChange={(v) => set('phoneTask1Badge', v)} />
          <TextInput label="Task 1 title" value={f.phoneTask1Title as string ?? ''} onChange={(v) => set('phoneTask1Title', v)} />
          <TextInput label="Task 1 title sub" value={f.phoneTask1TitleSub as string ?? ''} onChange={(v) => set('phoneTask1TitleSub', v)} />
          <TextInput label="Task 1 sub" value={f.phoneTask1Sub as string ?? ''} onChange={(v) => set('phoneTask1Sub', v)} />
          <TextInput label="Task 1 incentive" value={f.phoneTask1Incentive as string ?? ''} onChange={(v) => set('phoneTask1Incentive', v)} />
          <TextInput label="Task 1 ring label" value={f.phoneTask1RingLabel as string ?? ''} onChange={(v) => set('phoneTask1RingLabel', v)} />
          <TextInput label="Task 1 ring sub" value={f.phoneTask1RingSub as string ?? ''} onChange={(v) => set('phoneTask1RingSub', v)} />
          <TextInput label="Task 1 ring value" value={f.phoneTask1RingValue as string ?? ''} onChange={(v) => set('phoneTask1RingValue', v)} />
          <TextInput label="Task 1 ring total" value={String(f.phoneTask1RingTotal ?? '')} onChange={(v) => set('phoneTask1RingTotal', Number(v) || 100)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Task 2 badge" value={f.phoneTask2Badge as string ?? ''} onChange={(v) => set('phoneTask2Badge', v)} />
          <TextInput label="Task 2 title" value={f.phoneTask2Title as string ?? ''} onChange={(v) => set('phoneTask2Title', v)} />
          <TextInput label="Task 2 title sub" value={f.phoneTask2TitleSub as string ?? ''} onChange={(v) => set('phoneTask2TitleSub', v)} />
          <TextInput label="Task 2 sub" value={f.phoneTask2Sub as string ?? ''} onChange={(v) => set('phoneTask2Sub', v)} />
          <TextInput label="Task 2 incentive" value={f.phoneTask2Incentive as string ?? ''} onChange={(v) => set('phoneTask2Incentive', v)} />
          <TextInput label="Task 2 ring label" value={f.phoneTask2RingLabel as string ?? ''} onChange={(v) => set('phoneTask2RingLabel', v)} />
          <TextInput label="Task 2 ring sub" value={f.phoneTask2RingSub as string ?? ''} onChange={(v) => set('phoneTask2RingSub', v)} />
          <TextInput label="Task 2 ring value" value={f.phoneTask2RingValue as string ?? ''} onChange={(v) => set('phoneTask2RingValue', v)} />
          <TextInput label="Task 2 ring total" value={String(f.phoneTask2RingTotal ?? '')} onChange={(v) => set('phoneTask2RingTotal', Number(v) || 60)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Left card 1 title" value={f.cardL1Title as string ?? ''} onChange={(v) => set('cardL1Title', v)} />
          <TextInput label="Left card 1 sub" value={f.cardL1Sub as string ?? ''} onChange={(v) => set('cardL1Sub', v)} />
          <TextInput label="Left card 2 stat" value={f.cardL2Stat as string ?? ''} onChange={(v) => set('cardL2Stat', v)} />
          <TextInput label="Left card 2 title" value={f.cardL2Title as string ?? ''} onChange={(v) => set('cardL2Title', v)} />
          <TextInput label="Left card 2 sub" value={f.cardL2Sub as string ?? ''} onChange={(v) => set('cardL2Sub', v)} />
          <TextInput label="Right card 1 badge" value={f.cardR1Badge as string ?? ''} onChange={(v) => set('cardR1Badge', v)} />
          <TextInput label="Right card 1 body" value={f.cardR1Body as string ?? ''} onChange={(v) => set('cardR1Body', v)} />
          <TextInput label="Right card 1 body highlight" value={f.cardR1BodyHighlight as string ?? ''} onChange={(v) => set('cardR1BodyHighlight', v)} />
          <TextInput label="Right card 2 title" value={f.cardR2Title as string ?? ''} onChange={(v) => set('cardR2Title', v)} />
          <TextInput label="Right card 2 sub" value={f.cardR2Sub as string ?? ''} onChange={(v) => set('cardR2Sub', v)} />
          <TextInput label="Right card 3 stat" value={f.cardR3Stat as string ?? ''} onChange={(v) => set('cardR3Stat', v)} />
          <TextInput label="Right card 3 title" value={f.cardR3Title as string ?? ''} onChange={(v) => set('cardR3Title', v)} />
          <TextInput label="Right card 3 sub" value={f.cardR3Sub as string ?? ''} onChange={(v) => set('cardR3Sub', v)} />
        </div>
      );

    case 'slick-sfa-ai-engine': {
      type AiTab = { label?: string; tag?: string; heading?: string; description?: string; features?: string[]; impactValue?: string; impactLabel?: string; impactSub?: string };
      const aiTabs = (f.tabs as AiTab[]) ?? [];
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix (optional)" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<AiTab>
            label="Tabs"
            items={aiTabs}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', tag: 'AI Feature', heading: 'Feature heading', description: 'Feature description.', features: ['Feature 1'], impactValue: '3%', impactLabel: 'Sales uplift', impactSub: 'Description of impact' })}
            itemPreview={(t) => t.label || '(untitled)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Tab label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
                <TextInput label="Tag badge" value={t.tag ?? ''} onChange={(v) => u({ ...t, tag: v })} />
                <TextInput label="Panel heading" value={t.heading ?? ''} onChange={(v) => u({ ...t, heading: v })} />
                <Textarea label="Description" value={t.description ?? ''} onChange={(v) => u({ ...t, description: v })} />
                <Textarea label="Features (one per line)" value={(t.features ?? []).join('\n')} onChange={(v) => u({ ...t, features: v.split('\n').filter(Boolean) })} />
                <TextInput label="Impact value" value={t.impactValue ?? ''} onChange={(v) => u({ ...t, impactValue: v })} />
                <TextInput label="Impact label" value={t.impactLabel ?? ''} onChange={(v) => u({ ...t, impactLabel: v })} />
                <TextInput label="Impact sub-label" value={t.impactSub ?? ''} onChange={(v) => u({ ...t, impactSub: v })} />
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
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <TextInput label="Refund pill text" value={f.refundText as string ?? ''} onChange={(v) => set('refundText', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Proof section label" value={f.proofLabel as string ?? ''} onChange={(v) => set('proofLabel', v)} />
          <Repeater<ResultField>
            label="Country results"
            items={(f.results as ResultField[]) ?? []}
            onChange={(v) => set('results', v)}
            newItem={() => ({ country: 'Country', value: '0%', label: 'avg sales uplift' })}
            itemPreview={(r) => `${r.country ?? ''} — ${r.value ?? ''}`}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <TextInput label="Country name" value={r.country ?? ''} onChange={(v) => u({ ...r, country: v })} />
                <TextInput label="Uplift value (e.g. 7%)" value={r.value ?? ''} onChange={(v) => u({ ...r, value: v })} />
                <TextInput label="Sub-label" value={r.label ?? ''} onChange={(v) => u({ ...r, label: v })} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Sub (\\n for line break)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    case 'slick-sfa-ai-engine-v2': {
      type AEV2Tab = { label?: string; tag?: string; headingGrad?: string; headingSuffix?: string; description?: string; features?: string[]; impactValue?: string; impactLabel?: string; impactSub?: string; img?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<AEV2Tab>
            label="Tabs"
            items={(f.tabs as AEV2Tab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', tag: 'New Tab', headingGrad: 'Heading ', headingSuffix: 'suffix', description: '', features: [], impactValue: '0%', impactLabel: 'Sales uplift', impactSub: '', img: '' })}
            itemPreview={(t) => t.label || '(unnamed)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Tab label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
                <TextInput label="Tag pill" value={t.tag ?? ''} onChange={(v) => u({ ...t, tag: v })} />
                <TextInput label="Heading (teal part)" value={t.headingGrad ?? ''} onChange={(v) => u({ ...t, headingGrad: v })} />
                <TextInput label="Heading (dark suffix)" value={t.headingSuffix ?? ''} onChange={(v) => u({ ...t, headingSuffix: v })} />
                <Textarea label="Description" value={t.description ?? ''} onChange={(v) => u({ ...t, description: v })} />
                <Textarea label="Features (one per line)" value={(t.features ?? []).join('\n')} onChange={(v) => u({ ...t, features: v.split('\n').filter(Boolean) })} />
                <TextInput label="Impact value" value={t.impactValue ?? ''} onChange={(v) => u({ ...t, impactValue: v })} />
                <TextInput label="Impact label" value={t.impactLabel ?? ''} onChange={(v) => u({ ...t, impactLabel: v })} />
                <TextInput label="Impact sub" value={t.impactSub ?? ''} onChange={(v) => u({ ...t, impactSub: v })} />
                <ImageField label="Tab image (right panel)" value={t.img ?? ''} onChange={(v) => u({ ...t, img: v })} />
              </div>
            )}
          />
        </div>
      );
    }
    case 'slick-sfa-showcase':
      return (
        <div className="space-y-4">
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Sub paragraph (\\n for line break)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Centre image (phone group)" value={f.imgCenter as string ?? ''} onChange={(v) => set('imgCenter', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Label — top left" value={f.labelTL as string ?? ''} onChange={(v) => set('labelTL', v)} />
          <TextInput label="Label — bottom left" value={f.labelBL as string ?? ''} onChange={(v) => set('labelBL', v)} />
          <TextInput label="Label — top right" value={f.labelTR as string ?? ''} onChange={(v) => set('labelTR', v)} />
          <TextInput label="Label — bottom right" value={f.labelBR as string ?? ''} onChange={(v) => set('labelBR', v)} />
        </div>
      );
    case 'slick-sfa-typical': {
      type TypSlide = { imageUrl?: string; imageAlt?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (red)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
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
                <ImageField label="Slide image" value={s.imageUrl ?? ''} onChange={(v) => u({ ...s, imageUrl: v })} />
                <TextInput label="Image alt" value={s.imageAlt ?? ''} onChange={(v) => u({ ...s, imageAlt: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Label — top left" value={f.labelTL as string ?? ''} onChange={(v) => set('labelTL', v)} />
          <TextInput label="Label — bottom left" value={f.labelBL as string ?? ''} onChange={(v) => set('labelBL', v)} />
          <TextInput label="Label — top right" value={f.labelTR as string ?? ''} onChange={(v) => set('labelTR', v)} />
          <TextInput label="Label — bottom right" value={f.labelBR as string ?? ''} onChange={(v) => set('labelBR', v)} />
        </div>
      );
    }
    case 'slick-sfa-revenue-loss':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading line 2 (before gradient)" value={f.headingLine2Pre as string ?? ''} onChange={(v) => set('headingLine2Pre', v)} />
          <TextInput label="Heading gradient text (red)" value={f.headingLine2Grad as string ?? ''} onChange={(v) => set('headingLine2Grad', v)} />
          <Textarea label="Sub paragraph (use \\n for line break)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    case 'slick-sfa-insights': {
      type InsightCard = { name?: string; role?: string; logoImg?: string; logoAlt?: string; logoText?: string; logoColor?: string; thumbnail?: string; videoUrl?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Lead paragraph" value={f.lead as string ?? ''} onChange={(v) => set('lead', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<InsightCard>
            label="Video Cards"
            items={(f.cards as InsightCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ name: 'Speaker Name', role: 'Title\nCompany', logoText: 'Brand', logoColor: '#082B4B', logoImg: '', thumbnail: '', videoUrl: '' })}
            itemPreview={(c) => c.name || c.logoText || '(unnamed)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Name" value={c.name ?? ''} onChange={(v) => u({ ...c, name: v })} />
                <Textarea label="Role (use newline for line break)" value={c.role ?? ''} onChange={(v) => u({ ...c, role: v })} />
                <ImageField label="Logo image" value={c.logoImg ?? ''} onChange={(v) => u({ ...c, logoImg: v })} />
                <TextInput label="Logo alt text" value={c.logoAlt ?? ''} onChange={(v) => u({ ...c, logoAlt: v })} />
                <TextInput label="Logo text (fallback)" value={c.logoText ?? ''} onChange={(v) => u({ ...c, logoText: v })} />
                <ColorPicker label="Logo text color" value={c.logoColor ?? '#082B4B'} onChange={(v) => u({ ...c, logoColor: v })} />
                <ImageField label="Video thumbnail" value={c.thumbnail ?? ''} onChange={(v) => u({ ...c, thumbnail: v })} />
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
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Subtitle text (before bold)" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <TextInput label="Subtitle bold phrase" value={f.subtitleBold as string ?? ''} onChange={(v) => set('subtitleBold', v)} />
          <Textarea label="Subtitle suffix text" value={f.subtitleSuffix as string ?? ''} onChange={(v) => set('subtitleSuffix', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA input placeholder" value={f.ctaPlaceholder as string ?? ''} onChange={(v) => set('ctaPlaceholder', v)} />
          <TextInput label="CTA button label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
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
                <TextInput label="Value (bold, e.g. 3M+)" value={t.value ?? ''} onChange={(v) => u({ ...t, value: v })} />
                <TextInput label="Label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="AI Plan card title" value={f.planTitle as string ?? ''} onChange={(v) => set('planTitle', v)} />
          <TextInput label="AI Plan card subtitle" value={f.planSub as string ?? ''} onChange={(v) => set('planSub', v)} />
          <TextInput label="Plan row 1 — key" value={f.planRow1Key as string ?? ''} onChange={(v) => set('planRow1Key', v)} />
          <TextInput label="Plan row 1 — value" value={f.planRow1Val as string ?? ''} onChange={(v) => set('planRow1Val', v)} />
          <TextInput label="Plan row 2 — key" value={f.planRow2Key as string ?? ''} onChange={(v) => set('planRow2Key', v)} />
          <TextInput label="Plan row 2 — value" value={f.planRow2Val as string ?? ''} onChange={(v) => set('planRow2Val', v)} />
          <TextInput label="Plan row 3 — key" value={f.planRow3Key as string ?? ''} onChange={(v) => set('planRow3Key', v)} />
          <TextInput label="Plan row 3 — value" value={f.planRow3Val as string ?? ''} onChange={(v) => set('planRow3Val', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Agent card name" value={f.agentName as string ?? ''} onChange={(v) => set('agentName', v)} />
          <TextInput label="Agent message (before bold)" value={f.agentMsgPre as string ?? ''} onChange={(v) => set('agentMsgPre', v)} />
          <TextInput label="Agent message bold phrase" value={f.agentMsgBold as string ?? ''} onChange={(v) => set('agentMsgBold', v)} />
          <TextInput label="Agent message (after bold)" value={f.agentMsgPost as string ?? ''} onChange={(v) => set('agentMsgPost', v)} />
        </div>
      );
    }

    case 'slick-dms-hero-v2':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1 prefix" value={f.headingLine1Pre as string ?? ''} onChange={(v) => set('headingLine1Pre', v)} />
          <TextInput label="Heading line 1 gradient word" value={f.headingLine1Grad as string ?? ''} onChange={(v) => set('headingLine1Grad', v)} />
          <TextInput label="Heading line 2" value={f.headingLine2 as string ?? ''} onChange={(v) => set('headingLine2', v)} />
          <Textarea label="Sub (before bold)" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Sub bold phrase" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub (after bold)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Center image (dashboard)" value={f.imgCenter as string ?? ''} onChange={(v) => set('imgCenter', v)} />
          <ImageField label="Left card image" value={f.imgLeft as string ?? ''} onChange={(v) => set('imgLeft', v)} />
          <ImageField label="Right card image" value={f.imgRight as string ?? ''} onChange={(v) => set('imgRight', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Floating chips</p>
          <TextInput label="Chip 1 — value" value={f.chip1Val as string ?? ''} onChange={(v) => set('chip1Val', v)} />
          <TextInput label="Chip 1 — unit (teal)" value={f.chip1Unit as string ?? ''} onChange={(v) => set('chip1Unit', v)} />
          <TextInput label="Chip 1 — label" value={f.chip1Label as string ?? ''} onChange={(v) => set('chip1Label', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 2 — value" value={f.chip2Val as string ?? ''} onChange={(v) => set('chip2Val', v)} />
          <TextInput label="Chip 2 — unit (teal)" value={f.chip2Unit as string ?? ''} onChange={(v) => set('chip2Unit', v)} />
          <TextInput label="Chip 2 — label" value={f.chip2Label as string ?? ''} onChange={(v) => set('chip2Label', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 3 — value" value={f.chip3Val as string ?? ''} onChange={(v) => set('chip3Val', v)} />
          <TextInput label="Chip 3 — unit (teal)" value={f.chip3Unit as string ?? ''} onChange={(v) => set('chip3Unit', v)} />
          <TextInput label="Chip 3 — label" value={f.chip3Label as string ?? ''} onChange={(v) => set('chip3Label', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 4 — value" value={f.chip4Val as string ?? ''} onChange={(v) => set('chip4Val', v)} />
          <TextInput label="Chip 4 — unit (teal)" value={f.chip4Unit as string ?? ''} onChange={(v) => set('chip4Unit', v)} />
          <TextInput label="Chip 4 — label" value={f.chip4Label as string ?? ''} onChange={(v) => set('chip4Label', v)} />
        </div>
      );

    case 'slick-dms-features-v2': {
      type DmsFV2Tab = { label?: string; headingPre?: string; headingGrad?: string; body?: string; bullets?: string[]; statValue?: string; statLabel?: string; statSuffix?: string; img?: string; };
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1 (dark)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading line 2 (gradient)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <TextInput label="Footer text" value={f.footerText as string ?? ''} onChange={(v) => set('footerText', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DmsFV2Tab>
            label="Tabs"
            items={(f.tabs as DmsFV2Tab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', headingPre: 'Panel', headingGrad: 'Title', body: 'Description.', bullets: ['Feature one'], statValue: '0%', statLabel: 'Outcome', statSuffix: 'guaranteed', img: '' })}
            itemPreview={(t) => t.label || '(untitled)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Tab label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
                <TextInput label="Panel heading (dark)" value={t.headingPre ?? ''} onChange={(v) => u({ ...t, headingPre: v })} />
                <TextInput label="Panel heading (gradient)" value={t.headingGrad ?? ''} onChange={(v) => u({ ...t, headingGrad: v })} />
                <Textarea label="Body text" value={t.body ?? ''} onChange={(v) => u({ ...t, body: v })} />
                <Textarea label="Bullets (one per line)" value={(t.bullets ?? []).join('\n')} onChange={(v) => u({ ...t, bullets: v.split('\n').filter(Boolean) })} />
                <TextInput label="Stat value (e.g. 3%)" value={t.statValue ?? ''} onChange={(v) => u({ ...t, statValue: v })} />
                <TextInput label="Stat label" value={t.statLabel ?? ''} onChange={(v) => u({ ...t, statLabel: v })} />
                <TextInput label="Stat suffix" value={t.statSuffix ?? ''} onChange={(v) => u({ ...t, statSuffix: v })} />
                <ImageField label="Tab image" value={t.img ?? ''} onChange={(v) => u({ ...t, img: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-dms-features': {
      type DmsFTab = { label?: string; headingPre?: string; headingGrad?: string; body?: string; bullets?: string[]; statValue?: string; statLabel?: string; statSuffix?: string; img?: string; };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Lede paragraph" value={f.lede as string ?? ''} onChange={(v) => set('lede', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DmsFTab>
            label="Tabs (4 supported)"
            items={(f.tabs as DmsFTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', headingPre: 'Panel', headingGrad: 'Title', body: 'Description.', bullets: ['Feature one'], statValue: '0%', statLabel: 'Outcome', statSuffix: 'guaranteed', img: '' })}
            itemPreview={(t) => t.label || '(untitled)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Tab label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
                <TextInput label="Panel heading (dark)" value={t.headingPre ?? ''} onChange={(v) => u({ ...t, headingPre: v })} />
                <TextInput label="Panel heading (gradient)" value={t.headingGrad ?? ''} onChange={(v) => u({ ...t, headingGrad: v })} />
                <Textarea label="Body text" value={t.body ?? ''} onChange={(v) => u({ ...t, body: v })} />
                <Textarea label="Bullets (one per line)" value={(t.bullets ?? []).join('\n')} onChange={(v) => u({ ...t, bullets: v.split('\n').filter(Boolean) })} />
                <TextInput label="Stat value (e.g. 3%)" value={t.statValue ?? ''} onChange={(v) => u({ ...t, statValue: v })} />
                <TextInput label="Stat label" value={t.statLabel ?? ''} onChange={(v) => u({ ...t, statLabel: v })} />
                <TextInput label="Stat suffix" value={t.statSuffix ?? ''} onChange={(v) => u({ ...t, statSuffix: v })} />
                <ImageField label="Tab image" value={t.img ?? ''} onChange={(v) => u({ ...t, img: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-dms-comparison': {
      type CmpRow = { title?: string; sub?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <TextInput label="Italic subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <ImageField label="Screen image (replaces slider)" value={f.imgScreen as string ?? ''} onChange={(v) => set('imgScreen', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Left panel label (Standard DMS)" value={f.oldLabel as string ?? ''} onChange={(v) => set('oldLabel', v)} />
          <Repeater<CmpRow>
            label="Standard DMS rows"
            items={(f.oldRows as CmpRow[]) ?? []}
            onChange={(v) => set('oldRows', v)}
            newItem={() => ({ title: '', sub: '' })}
            itemPreview={(r) => r.title || '(empty)'}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <TextInput label="Row title" value={r.title ?? ''} onChange={(v) => u({ ...r, title: v })} />
                <TextInput label="Row sub-text" value={r.sub ?? ''} onChange={(v) => u({ ...r, sub: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Right panel label (NextGen DMS)" value={f.newLabel as string ?? ''} onChange={(v) => set('newLabel', v)} />
          <Repeater<CmpRow>
            label="NextGen DMS rows"
            items={(f.newRows as CmpRow[]) ?? []}
            onChange={(v) => set('newRows', v)}
            newItem={() => ({ title: '', sub: '' })}
            itemPreview={(r) => r.title || '(empty)'}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <TextInput label="Row title" value={r.title ?? ''} onChange={(v) => u({ ...r, title: v })} />
                <TextInput label="Row sub-text" value={r.sub ?? ''} onChange={(v) => u({ ...r, sub: v })} />
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
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Lede paragraph" value={f.lede as string ?? ''} onChange={(v) => set('lede', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DmsAgtItem>
            label="Agents (4 supported)"
            items={(f.agents as DmsAgtItem[]) ?? []}
            onChange={(v) => set('agents', v)}
            newItem={() => ({ name: 'New Agent', lede: 'Agent description.', benefits: ['Benefit one.', 'Benefit two.'] })}
            itemPreview={(a) => a.name || '(untitled)'}
            renderItem={(a, u) => (
              <div className="space-y-2">
                <TextInput label="Agent name" value={a.name ?? ''} onChange={(v) => u({ ...a, name: v })} />
                <ImageField label="Agent image (overrides mockup)" value={a.img ?? ''} onChange={(v) => u({ ...a, img: v })} />
                <Textarea label="Short description" value={a.lede ?? ''} onChange={(v) => u({ ...a, lede: v })} />
                <TextInput label="Benefit 1" value={(a.benefits as string[] | undefined)?.[0] ?? ''} onChange={(v) => u({ ...a, benefits: [v, ...((a.benefits as string[] | undefined ?? []).slice(1))] })} />
                <TextInput label="Benefit 2" value={(a.benefits as string[] | undefined)?.[1] ?? ''} onChange={(v) => u({ ...a, benefits: [((a.benefits as string[] | undefined ?? [])[0]) ?? '', v] })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Agent kicker label" value={f.kickerLabel as string ?? ''} onChange={(v) => set('kickerLabel', v)} />
          <TextInput label="Features section label" value={f.featuresLabel as string ?? ''} onChange={(v) => set('featuresLabel', v)} />
          <TextInput label="Benefits section label" value={f.benefitsLabel as string ?? ''} onChange={(v) => set('benefitsLabel', v)} />
        </div>
      );
    }

    case 'slick-dms-faq': {
      type DmsFaqItem = { q?: string; a?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Section heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<DmsFaqItem>
            label="FAQ items"
            items={(f.faqs as DmsFaqItem[]) ?? []}
            onChange={(v) => set('faqs', v)}
            newItem={() => ({ q: 'New question?', a: 'Answer goes here.' })}
            itemPreview={(item) => item.q || '(untitled)'}
            renderItem={(item, u) => (
              <div className="space-y-2">
                <TextInput label="Question" value={item.q ?? ''} onChange={(v) => u({ ...item, q: v })} />
                <Textarea label="Answer" value={item.a ?? ''} onChange={(v) => u({ ...item, a: v })} />
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
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading rest (deep)" value={f.headingRest as string ?? ''} onChange={(v) => set('headingRest', v)} />
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
                <TextInput label="Unit (min / hrs)" value={m.unit ?? ''} onChange={(v) => u({ ...m, unit: v })} />
                <TextInput label="Label" value={m.label ?? ''} onChange={(v) => u({ ...m, label: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-dms-cta':
      return (
        <div className="space-y-4">
          <TextInput label="Pill eyebrow text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1 (white)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading line 2 (teal gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Primary CTA label" value={f.primaryCtaLabel as string ?? ''} onChange={(v) => set('primaryCtaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <TextInput label="Secondary CTA label" value={f.secondaryCtaLabel as string ?? ''} onChange={(v) => set('secondaryCtaLabel', v)} />
          <TextInput label="Secondary CTA URL" value={f.secondaryCtaUrl as string ?? ''} onChange={(v) => set('secondaryCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Trust tagline" value={f.trustText as string ?? ''} onChange={(v) => set('trustText', v)} />
        </div>
      );

    case 'slick-dms-guarantee':
      return (
        <div className="space-y-4">
          <TextInput label="Heading prefix" value={f.titlePre as string ?? ''} onChange={(v) => set('titlePre', v)} />
          <TextInput label="Heading accent (teal)" value={f.titleAccent as string ?? ''} onChange={(v) => set('titleAccent', v)} />
          <Textarea label="Body copy" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Stamp percentage text" value={f.stampPercent as string ?? ''} onChange={(v) => set('stampPercent', v)} />
          <TextInput label="Stamp label text" value={f.stampLabel as string ?? ''} onChange={(v) => set('stampLabel', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA button label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA button URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-dms-integrations-v2':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Main screenshot" value={f.screenshotUrl as string ?? ''} onChange={(v) => set('screenshotUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Floating card 1" value={f.card1Img as string ?? ''} onChange={(v) => set('card1Img', v)} />
          <ImageField label="Floating card 2" value={f.card2Img as string ?? ''} onChange={(v) => set('card2Img', v)} />
        </div>
      );

    case 'slick-dms-integrations':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Lede paragraph" value={f.lede as string ?? ''} onChange={(v) => set('lede', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Integration 1 letter" value={f.integration1Letter as string ?? ''} onChange={(v) => set('integration1Letter', v)} />
          <TextInput label="Integration 1 name" value={f.integration1Name as string ?? ''} onChange={(v) => set('integration1Name', v)} />
          <TextInput label="Integration 1 sub" value={f.integration1Sub as string ?? ''} onChange={(v) => set('integration1Sub', v)} />
          <TextInput label="Integration 2 letter" value={f.integration2Letter as string ?? ''} onChange={(v) => set('integration2Letter', v)} />
          <TextInput label="Integration 2 name" value={f.integration2Name as string ?? ''} onChange={(v) => set('integration2Name', v)} />
          <TextInput label="Integration 2 sub" value={f.integration2Sub as string ?? ''} onChange={(v) => set('integration2Sub', v)} />
          <TextInput label="Sync status text" value={f.syncText as string ?? ''} onChange={(v) => set('syncText', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="KPI 1 label" value={f.kpi1Label as string ?? ''} onChange={(v) => set('kpi1Label', v)} />
          <TextInput label="KPI 1 value" value={f.kpi1Value as string ?? ''} onChange={(v) => set('kpi1Value', v)} />
          <TextInput label="KPI 1 unit" value={f.kpi1Unit as string ?? ''} onChange={(v) => set('kpi1Unit', v)} />
          <TextInput label="KPI 2 label" value={f.kpi2Label as string ?? ''} onChange={(v) => set('kpi2Label', v)} />
          <TextInput label="KPI 2 value" value={f.kpi2Value as string ?? ''} onChange={(v) => set('kpi2Value', v)} />
          <TextInput label="KPI 2 unit" value={f.kpi2Unit as string ?? ''} onChange={(v) => set('kpi2Unit', v)} />
          <TextInput label="KPI 3 label" value={f.kpi3Label as string ?? ''} onChange={(v) => set('kpi3Label', v)} />
          <TextInput label="KPI 3 value" value={f.kpi3Value as string ?? ''} onChange={(v) => set('kpi3Value', v)} />
          <TextInput label="Chart label" value={f.chartLabel as string ?? ''} onChange={(v) => set('chartLabel', v)} />
        </div>
      );

    case 'slick-eb2b-hero':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subheading" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Subheading bold text" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <Textarea label="Subheading tail text" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <TextInput label="Trust text" value={f.trustText as string ?? ''} onChange={(v) => set('trustText', v)} />
        </div>
      );

    case 'slick-eb2b-hero-v2':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading line 2 prefix" value={f.headingIn as string ?? ''} onChange={(v) => set('headingIn', v)} />
          <TextInput label="Heading gradient word" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Subheading bold" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <Textarea label="Subheading tail" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
        </div>
      );

    case 'slick-sfa-hero-v2':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading line 2 prefix" value={f.headingLine2Pre as string ?? ''} onChange={(v) => set('headingLine2Pre', v)} />
          <TextInput label="Heading gradient word" value={f.headingLine2Grad as string ?? ''} onChange={(v) => set('headingLine2Grad', v)} />
          <Textarea label="Subheading normal" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Subheading bold" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Subheading tail" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Left card 1 (top)" value={f.imgCl1 as string ?? ''} onChange={(v) => set('imgCl1', v)} />
          <ImageField label="Left card 2 (middle)" value={f.imgCl2 as string ?? ''} onChange={(v) => set('imgCl2', v)} />
          <ImageField label="Left card 3 (bottom)" value={f.imgCl3 as string ?? ''} onChange={(v) => set('imgCl3', v)} />
          <ImageField label="Centre phone" value={f.imgPhone as string ?? ''} onChange={(v) => set('imgPhone', v)} />
          <ImageField label="Right card 1 (top)" value={f.imgCr1 as string ?? ''} onChange={(v) => set('imgCr1', v)} />
          <ImageField label="Right card 2 (middle)" value={f.imgCr2 as string ?? ''} onChange={(v) => set('imgCr2', v)} />
          <ImageField label="Right card 3 (bottom)" value={f.imgCr3 as string ?? ''} onChange={(v) => set('imgCr3', v)} />
        </div>
      );

    case 'slick-eb2b-scale': {
      type ScaleStat = { num?: string; label?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<ScaleStat>
            label="Stats (4 cards)"
            items={(f.stats as ScaleStat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ num: '0+', label: 'New stat' })}
            itemPreview={(s) => s.label || '(untitled)'}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.num ?? ''} onChange={(v) => u({ ...s, num: v })} />
                <TextInput label="Label" value={s.label ?? ''} onChange={(v) => u({ ...s, label: v })} />
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
                <ImageField label="Logo image (overrides text)" value={it.img ?? ''} onChange={(v) => u({ ...it, img: v })} />
                <TextInput label="Alt text" value={it.alt ?? ''} onChange={(v) => u({ ...it, alt: v })} />
                <TextInput label="Text fallback" value={it.text ?? ''} onChange={(v) => u({ ...it, text: v })} />
                <TextInput label="Sub (optional)" value={it.sub ?? ''} onChange={(v) => u({ ...it, sub: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-eb2b-why':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient 1" value={f.headingGrad1 as string ?? ''} onChange={(v) => set('headingGrad1', v)} />
          <TextInput label="Heading middle" value={f.headingMid as string ?? ''} onChange={(v) => set('headingMid', v)} />
          <TextInput label="Heading gradient 2" value={f.headingGrad2 as string ?? ''} onChange={(v) => set('headingGrad2', v)} />
          <Textarea label="Body copy" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Video URL (YouTube embed or direct)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Video thumbnail" value={f.videoThumb as string ?? ''} onChange={(v) => set('videoThumb', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Media card title" value={f.mediaTitle as string ?? ''} onChange={(v) => set('mediaTitle', v)} />
          <TextInput label="Media card title highlight" value={f.mediaTitleHighlight as string ?? ''} onChange={(v) => set('mediaTitleHighlight', v)} />
          <TextInput label="Media card title suffix" value={f.mediaTitlePost as string ?? ''} onChange={(v) => set('mediaTitlePost', v)} />
          <Repeater<{ n: string; l: string }>
            label="Media stats"
            items={(f.mediaStats as { n: string; l: string }[]) ?? []}
            onChange={(v) => set('mediaStats', v)}
            newItem={() => ({ n: '0+', l: 'Label' })}
            itemPreview={(it) => `${it.n} ${it.l}`}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={it.n ?? ''} onChange={(v) => u({ ...it, n: v })} />
                <TextInput label="Label" value={it.l ?? ''} onChange={(v) => u({ ...it, l: v })} />
              </div>
            )}
          />
          <TextInput label="Media footer brand" value={f.mediaFooterBrand as string ?? ''} onChange={(v) => set('mediaFooterBrand', v)} />
          <TextInput label="Media footer sub" value={f.mediaFooterSub as string ?? ''} onChange={(v) => set('mediaFooterSub', v)} />
        </div>
      );

    case 'slick-eb2b-features':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ title: string; body: string; stat: string; image?: string }>
            label="Features"
            items={(f.features as { title: string; body: string; stat: string; image?: string }[]) ?? []}
            onChange={(v) => set('features', v)}
            newItem={() => ({ title: 'New feature', body: 'Description', stat: '[ Impact stat ]', image: '' })}
            itemPreview={(it) => it.title || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={it.title ?? ''} onChange={(v) => u({ ...it, title: v })} />
                <Textarea label="Body" value={it.body ?? ''} onChange={(v) => u({ ...it, body: v })} />
                <TextInput label="Stat" value={it.stat ?? ''} onChange={(v) => u({ ...it, stat: v })} />
                <ImageField label="Card image (overrides coded mockup)" value={it.image ?? ''} onChange={(v) => u({ ...it, image: v })} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-eb2b-integrations':
      return (
        <div className="space-y-4">
          <TextInput label="Pill badge text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (white part)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <Textarea label="Heading (teal part, use newline to break)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Body copy" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Hub centre text" value={f.hubText as string ?? ''} onChange={(v) => set('hubText', v)} />
          <Repeater<{ label?: string; image?: string }>
            label="Satellite nodes (max 6)"
            items={(f.nodes as { label?: string; image?: string }[]) ?? []}
            onChange={(v) => set('nodes', v)}
            newItem={() => ({ label: '', image: '' })}
            itemPreview={(it) => it.label || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Label (shown if no image)" value={it.label ?? ''} onChange={(v) => u({ ...it, label: v })} />
                <ImageField label="Logo image" value={it.image ?? ''} onChange={(v) => u({ ...it, image: v })} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-eb2b-impact':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow / pill text" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ title: string; body: string; image?: string; metricValue: string; metricLabel: string; metricSub: string; stat: string; statLabel?: string; statSub?: string }>
            label="Cards"
            items={(f.cards as { title: string; body: string; image?: string; metricValue: string; metricLabel: string; metricSub: string; stat: string; statLabel?: string; statSub?: string }[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'New card', body: 'Description', image: '', metricValue: '0%', metricLabel: 'Metric', metricSub: 'context', stat: 'Stat', statLabel: '', statSub: '' })}
            itemPreview={(it) => it.title || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={it.title ?? ''} onChange={(v) => u({ ...it, title: v })} />
                <Textarea label="Body" value={it.body ?? ''} onChange={(v) => u({ ...it, body: v })} />
                <ImageField label="Card image" value={it.image ?? ''} onChange={(v) => u({ ...it, image: v })} />
                <TextInput label="Metric 1 value" value={it.metricValue ?? ''} onChange={(v) => u({ ...it, metricValue: v })} />
                <TextInput label="Metric 1 label" value={it.metricLabel ?? ''} onChange={(v) => u({ ...it, metricLabel: v })} />
                <TextInput label="Metric 1 sub" value={it.metricSub ?? ''} onChange={(v) => u({ ...it, metricSub: v })} />
                <TextInput label="Metric 2 value" value={it.stat ?? ''} onChange={(v) => u({ ...it, stat: v })} />
                <TextInput label="Metric 2 label" value={it.statLabel ?? ''} onChange={(v) => u({ ...it, statLabel: v })} />
                <TextInput label="Metric 2 sub" value={it.statSub ?? ''} onChange={(v) => u({ ...it, statSub: v })} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-eb2b-deployments':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow / pill text" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Body copy" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ value: string; label: string }>
            label="Stats (3 boxes)"
            items={(f.stats as { value: string; label: string }[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '0+', label: 'Metric' })}
            itemPreview={(it) => it.value || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Value" value={it.value ?? ''} onChange={(v) => u({ ...it, value: v })} />
                <TextInput label="Label" value={it.label ?? ''} onChange={(v) => u({ ...it, label: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Right side image" value={f.sectionImg as string ?? ''} onChange={(v) => set('sectionImg', v)} />
        </div>
      );

    case 'slick-eb2b-faq':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ q: string; a: string }>
            label="FAQs"
            items={(f.faqs as { q: string; a: string }[]) ?? []}
            onChange={(v) => set('faqs', v)}
            newItem={() => ({ q: 'New question?', a: 'Answer here.' })}
            itemPreview={(it) => it.q || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Question" value={it.q ?? ''} onChange={(v) => u({ ...it, q: v })} />
                <Textarea label="Answer" value={it.a ?? ''} onChange={(v) => u({ ...it, a: v })} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-contact-hero':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix (dark)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading teal word" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <TextInput label="Sub line 1" value={f.subLine1 as string ?? ''} onChange={(v) => set('subLine1', v)} />
          <TextInput label="Sub line 2 (before bold)" value={f.subLine2Pre as string ?? ''} onChange={(v) => set('subLine2Pre', v)} />
          <TextInput label="Sub line 2 bold" value={f.subLine2Bold as string ?? ''} onChange={(v) => set('subLine2Bold', v)} />
          <TextInput label="Sub line 2 (after bold)" value={f.subLine2Tail as string ?? ''} onChange={(v) => set('subLine2Tail', v)} />
          <TextInput label="Trusted by label" value={f.trustedLabel as string ?? ''} onChange={(v) => set('trustedLabel', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Stat 1 value" value={f.stat1Val as string ?? ''} onChange={(v) => set('stat1Val', v)} />
          <TextInput label="Stat 1 label" value={f.stat1Label as string ?? ''} onChange={(v) => set('stat1Label', v)} />
          <TextInput label="Stat 2 value" value={f.stat2Val as string ?? ''} onChange={(v) => set('stat2Val', v)} />
          <TextInput label="Stat 2 label" value={f.stat2Label as string ?? ''} onChange={(v) => set('stat2Label', v)} />
          <TextInput label="Stat 3 value" value={f.stat3Val as string ?? ''} onChange={(v) => set('stat3Val', v)} />
          <TextInput label="Stat 3 label" value={f.stat3Label as string ?? ''} onChange={(v) => set('stat3Label', v)} />
          <TextInput label="Stat 4 value" value={f.stat4Val as string ?? ''} onChange={(v) => set('stat4Val', v)} />
          <TextInput label="Stat 4 label" value={f.stat4Label as string ?? ''} onChange={(v) => set('stat4Label', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Logo 1" value={f.logo1 as string ?? ''} onChange={(v) => set('logo1', v)} />
          <ImageField label="Logo 2" value={f.logo2 as string ?? ''} onChange={(v) => set('logo2', v)} />
          <ImageField label="Logo 3" value={f.logo3 as string ?? ''} onChange={(v) => set('logo3', v)} />
          <ImageField label="Logo 4" value={f.logo4 as string ?? ''} onChange={(v) => set('logo4', v)} />
          <ImageField label="Logo 5" value={f.logo5 as string ?? ''} onChange={(v) => set('logo5', v)} />
          <ImageField label="Logo 6" value={f.logo6 as string ?? ''} onChange={(v) => set('logo6', v)} />
          <ImageField label="Logo 7" value={f.logo7 as string ?? ''} onChange={(v) => set('logo7', v)} />
          <ImageField label="Logo 8" value={f.logo8 as string ?? ''} onChange={(v) => set('logo8', v)} />
        </div>
      );

    case 'slick-experience-hero':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1 (dark)" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading teal word" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <TextInput label="Heading line 2 suffix (dark)" value={f.headingLine2Mid as string ?? ''} onChange={(v) => set('headingLine2Mid', v)} />
          <TextInput label="Heading line 3 (dark)" value={f.headingLine3 as string ?? ''} onChange={(v) => set('headingLine3', v)} />
          <Textarea label="Sub (before bold)" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Sub bold phrase" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub (after bold)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
        </div>
      );

    case 'slick-experience-video':
      return (
        <div className="space-y-4">
          <TextInput label="Video URL (mp4)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Thumbnail URL (optional)" value={f.thumbnailUrl as string ?? ''} onChange={(v) => set('thumbnailUrl', v)} />
        </div>
      );

    case 'slick-experience-testimonials':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (before accent)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <Repeater<{ thumbnail: string; videoUrl: string; name: string; role: string; company: string; logoUrl: string; logoAlt: string }>
            label="Testimonials"
            items={(f.testimonials as { thumbnail: string; videoUrl: string; name: string; role: string; company: string; logoUrl: string; logoAlt: string }[]) ?? []}
            onChange={(v) => set('testimonials', v)}
            newItem={() => ({ thumbnail: '', videoUrl: '', name: '', role: '', company: '', logoUrl: '', logoAlt: '' })}
            itemPreview={(it) => it.name || 'Testimonial'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Thumbnail URL" value={it.thumbnail} onChange={(x) => u({ ...it, thumbnail: x })} />
                <TextInput label="Video URL (mp4)" value={it.videoUrl} onChange={(x) => u({ ...it, videoUrl: x })} />
                <TextInput label="Name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <TextInput label="Role" value={it.role} onChange={(x) => u({ ...it, role: x })} />
                <TextInput label="Company" value={it.company} onChange={(x) => u({ ...it, company: x })} />
                <ImageField label="Company logo URL" value={it.logoUrl} onChange={(x) => u({ ...it, logoUrl: x })} />
                <TextInput label="Logo alt text" value={it.logoAlt} onChange={(x) => u({ ...it, logoAlt: x })} />
              </>
            )}
          />
          <TextInput label="Logos strip label" value={f.logosLabel as string ?? ''} onChange={(v) => set('logosLabel', v)} />
          <Repeater<{ url: string; alt: string }>
            label="Leader logos"
            items={(f.logos as { url: string; alt: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ url: '', alt: '' })}
            itemPreview={(it) => it.alt || 'Logo'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Logo URL" value={it.url} onChange={(x) => u({ ...it, url: x })} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-experience-topics':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (before accent)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
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
                <Textarea label="Title text" value={it.title} onChange={(x) => u({ ...it, title: x })} />
              </>
            )}
          />
          <TextInput label="CTA label (**bold** supported)" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-exp-two-ways':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (white)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading (teal)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Panel 1 — Immersive Sessions</p>
          <TextInput label="Tab label" value={f.p1Tab as string ?? ''} onChange={(v) => set('p1Tab', v)} />
          <TextInput label="Image 1 URL" value={f.p1Img1 as string ?? ''} onChange={(v) => set('p1Img1', v)} />
          <TextInput label="Image 2 URL" value={f.p1Img2 as string ?? ''} onChange={(v) => set('p1Img2', v)} />
          <TextInput label="Image 3 URL" value={f.p1Img3 as string ?? ''} onChange={(v) => set('p1Img3', v)} />
          <Textarea label="Body text (**bold**=teal)" value={f.p1Body as string ?? ''} onChange={(v) => set('p1Body', v)} />
          <Textarea label="Bullet 1" value={f.p1B1 as string ?? ''} onChange={(v) => set('p1B1', v)} />
          <Textarea label="Bullet 2" value={f.p1B2 as string ?? ''} onChange={(v) => set('p1B2', v)} />
          <Textarea label="Bullet 3" value={f.p1B3 as string ?? ''} onChange={(v) => set('p1B3', v)} />
          <Textarea label="Bullet 4" value={f.p1B4 as string ?? ''} onChange={(v) => set('p1B4', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Panel 2 — Leadership Workshops</p>
          <TextInput label="Tab label" value={f.p2Tab as string ?? ''} onChange={(v) => set('p2Tab', v)} />
          <TextInput label="Image 1 URL" value={f.p2Img1 as string ?? ''} onChange={(v) => set('p2Img1', v)} />
          <TextInput label="Image 2 URL" value={f.p2Img2 as string ?? ''} onChange={(v) => set('p2Img2', v)} />
          <TextInput label="Image 3 URL" value={f.p2Img3 as string ?? ''} onChange={(v) => set('p2Img3', v)} />
          <Textarea label="Body text (**bold**=teal)" value={f.p2Body as string ?? ''} onChange={(v) => set('p2Body', v)} />
          <Textarea label="Bullet 1" value={f.p2B1 as string ?? ''} onChange={(v) => set('p2B1', v)} />
          <Textarea label="Bullet 2" value={f.p2B2 as string ?? ''} onChange={(v) => set('p2B2', v)} />
          <Textarea label="Bullet 3" value={f.p2B3 as string ?? ''} onChange={(v) => set('p2B3', v)} />
          <Textarea label="Bullet 4" value={f.p2B4 as string ?? ''} onChange={(v) => set('p2B4', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label (**bold**=dark)" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-exp-ai-stack':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (white)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading (teal)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix (dark)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading inline teal word" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <TextInput label="Heading line 2 (teal gradient)" value={f.headingLine2 as string ?? ''} onChange={(v) => set('headingLine2', v)} />
          <Textarea label="Sub (before bold)" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Sub bold phrase" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub (after bold)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
        </div>
      );

    case 'slick-careers-life':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (before accent)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <Repeater<{ url: string; alt: string; tall: boolean }>
            label="Photos"
            items={(f.photos as { url: string; alt: string; tall: boolean }[]) ?? []}
            onChange={(v) => set('photos', v)}
            newItem={() => ({ url: '', alt: '', tall: false })}
            itemPreview={(it) => it.alt || 'Photo'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Photo URL" value={it.url} onChange={(x) => u({ ...it, url: x })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading tail" value={f.headingTail as string ?? ''} onChange={(v) => set('headingTail', v)} />
          <Repeater<{ imgUrl: string; imgAlt: string; title: string }>
            label="Awards"
            items={(f.awards as { imgUrl: string; imgAlt: string; title: string }[]) ?? []}
            onChange={(v) => set('awards', v)}
            newItem={() => ({ imgUrl: '', imgAlt: '', title: '' })}
            itemPreview={(it) => it.title || 'Award'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Award image URL" value={it.imgUrl} onChange={(x) => u({ ...it, imgUrl: x })} />
                <TextInput label="Alt text" value={it.imgAlt} onChange={(x) => u({ ...it, imgAlt: x })} />
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-careers-process':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <p className="text-xs text-slate-400">Steps use built-in defaults. To customise, edit the component directly.</p>
        </div>
      );

    case 'slick-careers-expect':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (before accent)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <p className="text-xs text-slate-400">Cards use built-in defaults. To customise, edit the component directly.</p>
        </div>
      );

    case 'slick-careers-culture':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (before accent)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <p className="text-xs text-slate-400">Principle cards use built-in defaults. To customise, edit the component directly.</p>
        </div>
      );

    case 'slick-careers-about':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Body (use **bold** for bold words)" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
        </div>
      );

    case 'slick-careers-hero':
    case 'slick-ab-hero-v2':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1 (dark)" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading line 2 (teal)" value={f.headingLine2 as string ?? ''} onChange={(v) => set('headingLine2', v)} />
          <Textarea label="Sub (before bold)" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Sub bold phrase" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub (after bold)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Stat 1 value" value={f.stat1Val as string ?? ''} onChange={(v) => set('stat1Val', v)} />
          <TextInput label="Stat 1 label" value={f.stat1Label as string ?? ''} onChange={(v) => set('stat1Label', v)} />
          <TextInput label="Stat 2 value" value={f.stat2Val as string ?? ''} onChange={(v) => set('stat2Val', v)} />
          <TextInput label="Stat 2 label" value={f.stat2Label as string ?? ''} onChange={(v) => set('stat2Label', v)} />
          <TextInput label="Stat 3 value" value={f.stat3Val as string ?? ''} onChange={(v) => set('stat3Val', v)} />
          <TextInput label="Stat 3 label" value={f.stat3Label as string ?? ''} onChange={(v) => set('stat3Label', v)} />
          <TextInput label="Stat 4 value" value={f.stat4Val as string ?? ''} onChange={(v) => set('stat4Val', v)} />
          <TextInput label="Stat 4 label" value={f.stat4Label as string ?? ''} onChange={(v) => set('stat4Label', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Brands section label" value={f.brandsLabel as string ?? ''} onChange={(v) => set('brandsLabel', v)} />
          <ImageField label="Logo 1" value={f.logo1 as string ?? ''} onChange={(v) => set('logo1', v)} />
          <ImageField label="Logo 2" value={f.logo2 as string ?? ''} onChange={(v) => set('logo2', v)} />
          <ImageField label="Logo 3" value={f.logo3 as string ?? ''} onChange={(v) => set('logo3', v)} />
          <ImageField label="Logo 4" value={f.logo4 as string ?? ''} onChange={(v) => set('logo4', v)} />
          <ImageField label="Logo 5" value={f.logo5 as string ?? ''} onChange={(v) => set('logo5', v)} />
          <ImageField label="Logo 6" value={f.logo6 as string ?? ''} onChange={(v) => set('logo6', v)} />
          <ImageField label="Logo 7" value={f.logo7 as string ?? ''} onChange={(v) => set('logo7', v)} />
          <ImageField label="Logo 8" value={f.logo8 as string ?? ''} onChange={(v) => set('logo8', v)} />
        </div>
      );

    case 'slick-clients-testimonials':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (dark)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <p className="text-xs text-slate-400">Testimonials use built-in defaults. To customise, edit the component directly.</p>
        </div>
      );

    case 'slick-clients-grid':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (dark)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle (use **bold** for bold)" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <Repeater<{ url: string; alt: string }>
            label="Client logos"
            items={(f.logos as { url: string; alt: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ url: '', alt: '' })}
            itemPreview={(it) => it.alt || 'Logo'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Logo image URL" value={it.url} onChange={(x) => u({ ...it, url: x })} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-clients-hero':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading badge (highlighted word)" value={f.headingBadge as string ?? ''} onChange={(v) => set('headingBadge', v)} />
          <TextInput label="Heading suffix (line 2)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Sub (before bold)" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Sub bold phrase" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub (after bold)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Stat 1 value" value={f.stat1Val as string ?? ''} onChange={(v) => set('stat1Val', v)} />
          <TextInput label="Stat 1 label" value={f.stat1Label as string ?? ''} onChange={(v) => set('stat1Label', v)} />
          <TextInput label="Stat 2 value" value={f.stat2Val as string ?? ''} onChange={(v) => set('stat2Val', v)} />
          <TextInput label="Stat 2 label" value={f.stat2Label as string ?? ''} onChange={(v) => set('stat2Label', v)} />
          <TextInput label="Stat 3 value" value={f.stat3Val as string ?? ''} onChange={(v) => set('stat3Val', v)} />
          <TextInput label="Stat 3 label" value={f.stat3Label as string ?? ''} onChange={(v) => set('stat3Label', v)} />
          <TextInput label="Stat 4 value" value={f.stat4Val as string ?? ''} onChange={(v) => set('stat4Val', v)} />
          <TextInput label="Stat 4 label" value={f.stat4Label as string ?? ''} onChange={(v) => set('stat4Label', v)} />
        </div>
      );

    case 'slick-ab-hero':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
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
              <TextInput label="Label" value={it.label ?? ''} onChange={(v) => u({ ...it, label: v })} />
            )}
          />
        </div>
      );

    case 'slick-ab-mission-vision':
      return (
        <div className="space-y-4">
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Mission row</p>
          <TextInput label="Mission pill" value={f.missionPill as string ?? ''} onChange={(v) => set('missionPill', v)} />
          <TextInput label="Heading prefix (dark)" value={f.missionHeadingPre as string ?? ''} onChange={(v) => set('missionHeadingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.missionHeadingTeal as string ?? ''} onChange={(v) => set('missionHeadingTeal', v)} />
          <TextInput label="Heading suffix (dark)" value={f.missionHeadingTail as string ?? ''} onChange={(v) => set('missionHeadingTail', v)} />
          <Textarea label="Sub text" value={f.missionSub as string ?? ''} onChange={(v) => set('missionSub', v)} />
          <ImageField label="Mission image" value={f.missionImg as string ?? ''} onChange={(v) => set('missionImg', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Vision row</p>
          <TextInput label="Vision pill" value={f.visionPill as string ?? ''} onChange={(v) => set('visionPill', v)} />
          <TextInput label="Heading prefix (dark)" value={f.visionHeadingPre as string ?? ''} onChange={(v) => set('visionHeadingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.visionHeadingTeal as string ?? ''} onChange={(v) => set('visionHeadingTeal', v)} />
          <TextInput label="Heading suffix (dark)" value={f.visionHeadingTail as string ?? ''} onChange={(v) => set('visionHeadingTail', v)} />
          <Textarea label="Sub text" value={f.visionSub as string ?? ''} onChange={(v) => set('visionSub', v)} />
          <ImageField label="Vision image" value={f.visionImg as string ?? ''} onChange={(v) => set('visionImg', v)} />
        </div>
      );

    case 'slick-ab-intro':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Paragraph — alternating normal / bold</p>
          <TextInput label="Text 1 (normal)" value={f.textSeg1 as string ?? ''} onChange={(v) => set('textSeg1', v)} />
          <TextInput label="Text 1 (bold)" value={f.textBold1 as string ?? ''} onChange={(v) => set('textBold1', v)} />
          <TextInput label="Text 2 (normal)" value={f.textSeg2 as string ?? ''} onChange={(v) => set('textSeg2', v)} />
          <Textarea label="Text 2 (bold)" value={f.textBold2 as string ?? ''} onChange={(v) => set('textBold2', v)} />
          <TextInput label="Text 3 (normal)" value={f.textSeg3 as string ?? ''} onChange={(v) => set('textSeg3', v)} />
          <TextInput label="Text 3 (bold)" value={f.textBold3 as string ?? ''} onChange={(v) => set('textBold3', v)} />
          <TextInput label="Text 4 (normal)" value={f.textSeg4 as string ?? ''} onChange={(v) => set('textSeg4', v)} />
          <TextInput label="Text 4 (bold)" value={f.textBold4 as string ?? ''} onChange={(v) => set('textBold4', v)} />
          <TextInput label="Text 5 (normal)" value={f.textSeg5 as string ?? ''} onChange={(v) => set('textSeg5', v)} />
          <TextInput label="Text 5 (bold)" value={f.textBold5 as string ?? ''} onChange={(v) => set('textBold5', v)} />
          <TextInput label="Text 6 (normal)" value={f.textSeg6 as string ?? ''} onChange={(v) => set('textSeg6', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Video poster" value={f.posterUrl as string ?? ''} onChange={(v) => set('posterUrl', v)} />
          <TextInput label="Video URL" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-ab-founder-banner':
      return (
        <div className="space-y-4">
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading bold" value={f.headingBold as string ?? ''} onChange={(v) => set('headingBold', v)} />
          <TextInput label="Heading suffix" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ text: string; cls?: string }>
            label="Logos"
            items={(f.logos as { text: string; cls?: string }[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ text: 'Brand', cls: '' })}
            itemPreview={(it) => it.text || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Text" value={it.text ?? ''} onChange={(v) => u({ ...it, text: v })} />
                <TextInput label="CSS class (optional)" value={it.cls ?? ''} onChange={(v) => u({ ...it, cls: v })} />
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
                <TextInput label="Prefix (optional)" value={it.pre ?? ''} onChange={(v) => u({ ...it, pre: v })} />
                <TextInput label="Number" value={it.n ?? ''} onChange={(v) => u({ ...it, n: v })} />
                <TextInput label="Label" value={it.l ?? ''} onChange={(v) => u({ ...it, l: v })} />
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
                <TextInput label="Number" value={item.num ?? ''} onChange={(v) => update({ ...item, num: v })} />
                <TextInput label="Label" value={item.label ?? ''} onChange={(v) => update({ ...item, label: v })} />
                <TextInput label="Sub-label" value={item.sub ?? ''} onChange={(v) => update({ ...item, sub: v })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-ab-story':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Paragraph 1 (HTML)" value={f.p1 as string ?? ''} onChange={(v) => set('p1', v)} />
          <Textarea label="Paragraph 2 (HTML)" value={f.p2 as string ?? ''} onChange={(v) => set('p2', v)} />
          <Textarea label="Paragraph 3 (HTML)" value={f.p3 as string ?? ''} onChange={(v) => set('p3', v)} />
          <Textarea label="Quote text" value={f.quoteText as string ?? ''} onChange={(v) => set('quoteText', v)} />
          <TextInput label="Quote author name" value={f.quoteAuthorName as string ?? ''} onChange={(v) => set('quoteAuthorName', v)} />
          <TextInput label="Quote author title" value={f.quoteAuthorTitle as string ?? ''} onChange={(v) => set('quoteAuthorTitle', v)} />
          <TextInput label="Author initials" value={f.quoteAuthorInitials as string ?? ''} onChange={(v) => set('quoteAuthorInitials', v)} />
        </div>
      );

    case 'slick-ab-video':
      return (
        <div className="space-y-4">
          <TextInput label="Video URL" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <TextInput label="Aria label" value={f.ariaLabel as string ?? ''} onChange={(v) => set('ariaLabel', v)} />
        </div>
      );

    case 'slick-ab-awards':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
        </div>
      );

    case 'slick-ab-founders-v2':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (dark)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading (teal)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <Textarea label="Sub text" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Founder 1</p>
          <ImageField label="Photo" value={f.f1Photo as string ?? ''} onChange={(v) => set('f1Photo', v)} />
          <TextInput label="Name" value={f.f1Name as string ?? ''} onChange={(v) => set('f1Name', v)} />
          <TextInput label="Role" value={f.f1Role as string ?? ''} onChange={(v) => set('f1Role', v)} />
          <TextInput label="LinkedIn URL" value={f.f1LinkedIn as string ?? ''} onChange={(v) => set('f1LinkedIn', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Founder 2</p>
          <ImageField label="Photo" value={f.f2Photo as string ?? ''} onChange={(v) => set('f2Photo', v)} />
          <TextInput label="Name" value={f.f2Name as string ?? ''} onChange={(v) => set('f2Name', v)} />
          <TextInput label="Role" value={f.f2Role as string ?? ''} onChange={(v) => set('f2Role', v)} />
          <TextInput label="LinkedIn URL" value={f.f2LinkedIn as string ?? ''} onChange={(v) => set('f2LinkedIn', v)} />
        </div>
      );

    case 'slick-ab-founders':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
        </div>
      );

    case 'slick-ab-investors':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Show more label" value={f.toggleMoreLabel as string ?? ''} onChange={(v) => set('toggleMoreLabel', v)} />
          <TextInput label="Show less label" value={f.toggleLessLabel as string ?? ''} onChange={(v) => set('toggleLessLabel', v)} />
          <TextInput label="Biz team section label" value={f.bizTeamLabel as string ?? ''} onChange={(v) => set('bizTeamLabel', v)} />
          <TextInput label="Tech team section label" value={f.techTeamLabel as string ?? ''} onChange={(v) => set('techTeamLabel', v)} />
          <Repeater<{ name: string; role: string; prevRole: string; linkedinUrl?: string }>
            label="Biz team members"
            items={(f.bizTeam as { name: string; role: string; prevRole: string; linkedinUrl?: string }[]) ?? []}
            onChange={(v) => set('bizTeam', v)}
            newItem={() => ({ name: 'Name', role: 'Role', prevRole: 'Prev Role', linkedinUrl: '' })}
            itemPreview={(it) => it.name || '(untitled)'}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Name" value={it.name ?? ''} onChange={(v) => u({ ...it, name: v })} />
                <TextInput label="Role" value={it.role ?? ''} onChange={(v) => u({ ...it, role: v })} />
                <TextInput label="Previous role" value={it.prevRole ?? ''} onChange={(v) => u({ ...it, prevRole: v })} />
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
                <TextInput label="Name" value={it.name ?? ''} onChange={(v) => u({ ...it, name: v })} />
                <TextInput label="Role" value={it.role ?? ''} onChange={(v) => u({ ...it, role: v })} />
                <TextInput label="Previous role" value={it.prevRole ?? ''} onChange={(v) => u({ ...it, prevRole: v })} />
                <TextInput label="LinkedIn URL" value={it.linkedinUrl ?? ''} onChange={(v) => u({ ...it, linkedinUrl: v })} />
              </div>
            )}
          />
        </div>
      );

    case 'slick-ab-investors-v2':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (white part)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading (teal part)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (dark part)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading (teal part)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Tech team label" value={f.techLabel as string ?? ''} onChange={(v) => set('techLabel', v)} />
          <TextInput label="Biz team label" value={f.bizLabel as string ?? ''} onChange={(v) => set('bizLabel', v)} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading part 1 (white)" value={f.headingPart1 as string ?? ''} onChange={(v) => set('headingPart1', v)} />
          <TextInput label="Heading teal part" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <TextInput label="Heading part 2 (white)" value={f.headingPart2 as string ?? ''} onChange={(v) => set('headingPart2', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
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
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-sc-hero-v2':
      return (
        <div className="space-y-4">
          <TextInput label="Pill prefix" value={f.pillPre as string ?? ''} onChange={(v) => set('pillPre', v)} />
          <TextInput label="Pill bold (teal)" value={f.pillBold as string ?? ''} onChange={(v) => set('pillBold', v)} />
          <TextInput label="Pill suffix" value={f.pillSuffix as string ?? ''} onChange={(v) => set('pillSuffix', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Heading line 1" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading line 2 prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading line 2 teal" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Textarea label="Sub (use **text** for bold)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Center image" value={f.imgCenter as string ?? ''} onChange={(v) => set('imgCenter', v)} />
        </div>
      );

    case 'slick-sc-hero-v3':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Heading line 1" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Sub normal text" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Sub bold text" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub tail text" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Center image" value={f.imgCenter as string ?? ''} onChange={(v) => set('imgCenter', v)} />
        </div>
      );

    case 'slick-sc-navbar':
      return (
        <div className="space-y-4">
          <ImageField label="Logo image" value={f.logoSrc as string ?? ''} onChange={(v) => set('logoSrc', v)} />
          <TextInput label="CTA button label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA button URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-sc-footer':
      return (
        <div className="space-y-4">
          <TextInput label="CTA eyebrow" value={f.ctaEyebrow as string ?? ''} onChange={(v) => set('ctaEyebrow', v)} />
          <TextInput label="CTA heading prefix" value={f.ctaHeadingPre as string ?? ''} onChange={(v) => set('ctaHeadingPre', v)} />
          <TextInput label="CTA heading accent" value={f.ctaHeadingGrad as string ?? ''} onChange={(v) => set('ctaHeadingGrad', v)} />
          <TextInput label="CTA heading suffix" value={f.ctaHeadingPost as string ?? ''} onChange={(v) => set('ctaHeadingPost', v)} />
          <Textarea label="CTA subtext" value={f.ctaSub as string ?? ''} onChange={(v) => set('ctaSub', v)} />
          <TextInput label="CTA button label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA button URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Email" value={f.email as string ?? ''} onChange={(v) => set('email', v)} />
          <TextInput label="Phone" value={f.phone as string ?? ''} onChange={(v) => set('phone', v)} />
          <TextInput label="Phone hours" value={f.phoneHours as string ?? ''} onChange={(v) => set('phoneHours', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="LinkedIn URL" value={f.linkedinUrl as string ?? ''} onChange={(v) => set('linkedinUrl', v)} />
          <TextInput label="X / Twitter URL" value={f.xUrl as string ?? ''} onChange={(v) => set('xUrl', v)} />
          <TextInput label="Instagram URL" value={f.instagramUrl as string ?? ''} onChange={(v) => set('instagramUrl', v)} />
          <TextInput label="YouTube URL" value={f.youtubeUrl as string ?? ''} onChange={(v) => set('youtubeUrl', v)} />
          <TextInput label="Facebook URL" value={f.facebookUrl as string ?? ''} onChange={(v) => set('facebookUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Copyright text" value={f.copyright as string ?? ''} onChange={(v) => set('copyright', v)} />
        </div>
      );

    case 'slick-sc-footer-v2':
      return (
        <div className="space-y-4">
          <TextInput label="CTA badge" value={f.ctaBadge as string ?? ''} onChange={(v) => set('ctaBadge', v)} />
          <TextInput label="CTA heading" value={f.ctaHeading as string ?? ''} onChange={(v) => set('ctaHeading', v)} />
          <Textarea label="CTA body" value={f.ctaBody as string ?? ''} onChange={(v) => set('ctaBody', v)} />
          <TextInput label="CTA button label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA button URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Logo URL" value={f.logoSrc as string ?? ''} onChange={(v) => set('logoSrc', v)} />
          <Textarea label="Tagline" value={f.tagline as string ?? ''} onChange={(v) => set('tagline', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Phone" value={f.phone as string ?? ''} onChange={(v) => set('phone', v)} />
          <TextInput label="Phone hours" value={f.phoneHours as string ?? ''} onChange={(v) => set('phoneHours', v)} />
          <TextInput label="Email" value={f.email as string ?? ''} onChange={(v) => set('email', v)} />
          <TextInput label="Email label" value={f.emailLabel as string ?? ''} onChange={(v) => set('emailLabel', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Copyright text" value={f.copyright as string ?? ''} onChange={(v) => set('copyright', v)} />
        </div>
      );

    case 'slick-offices-v2': {
      type OV2 = { city?: string; address?: string; icon?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<OV2>
            label="Offices"
            items={(f.offices as OV2[]) ?? []}
            onChange={(v) => set('offices', v)}
            newItem={() => ({ city: 'CITY', icon: 'dubai', address: 'Address here.' })}
            itemPreview={(o) => o.city || '(empty)'}
            renderItem={(o, u) => (
              <div className="space-y-2">
                <TextInput label="City name (uppercase)" value={o.city ?? ''} onChange={(v) => u({ ...o, city: v })} />
                <TextInput label="Icon (dubai/auckland/mumbai/brazil/mexico/gurgaon)" value={o.icon ?? ''} onChange={(v) => u({ ...o, icon: v })} />
                <TextInput label="Address" value={o.address ?? ''} onChange={(v) => u({ ...o, address: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-offices':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading line 1" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading line 2 prefix" value={f.headingLine2Pre as string ?? ''} onChange={(v) => set('headingLine2Pre', v)} />
          <TextInput label="Heading line 2 gradient" value={f.headingLine2Grad as string ?? ''} onChange={(v) => set('headingLine2Grad', v)} />
          <TextInput label="LinkedIn URL" value={f.linkedinUrl as string ?? ''} onChange={(v) => set('linkedinUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Get directions link label" value={f.directionsLabel as string ?? ''} onChange={(v) => set('directionsLabel', v)} />
          <TextInput label="LinkedIn section title" value={f.linkedinTitle as string ?? ''} onChange={(v) => set('linkedinTitle', v)} />
          <Textarea label="LinkedIn section description" value={f.linkedinDesc as string ?? ''} onChange={(v) => set('linkedinDesc', v)} />
          <TextInput label="LinkedIn link label" value={f.linkedinLinkLabel as string ?? ''} onChange={(v) => set('linkedinLinkLabel', v)} />
        </div>
      );

    case 'slick-lets-talk':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Sub text" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Sub bold/gradient text" value={f.subCode as string ?? ''} onChange={(v) => set('subCode', v)} />
          <TextInput label="Sub suffix text" value={f.subSuffix as string ?? ''} onChange={(v) => set('subSuffix', v)} />
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
          <TextInput label="Final card eyebrow" value={f.finalEyebrow as string ?? ''} onChange={(v) => set('finalEyebrow', v)} />
          <TextInput label="Final card title" value={f.finalTitle as string ?? ''} onChange={(v) => set('finalTitle', v)} />
          <Textarea label="Final card description" value={f.finalDesc as string ?? ''} onChange={(v) => set('finalDesc', v)} />
        </div>
      );

    case 'slick-sc-contact-hs':
      return (
        <div className="space-y-4">
          <TextInput label="HubSpot Portal ID" value={f.portalId as string ?? ''} onChange={(v) => set('portalId', v)} />
          <TextInput label="HubSpot Form ID (GUID)" value={f.formId as string ?? ''} onChange={(v) => set('formId', v)} />
          <TextInput label="HubSpot Region (e.g. na1, eu1)" value={f.region as string ?? ''} onChange={(v) => set('region', v)} />
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (gradient)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Lede" value={f.lede as string ?? ''} onChange={(v) => set('lede', v)} />
          <TextInput label="Card title" value={f.cardTitle as string ?? ''} onChange={(v) => set('cardTitle', v)} />
          <Textarea label="Card subtitle" value={f.cardSub as string ?? ''} onChange={(v) => set('cardSub', v)} />
        </div>
      );

    case 'slick-contact':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Lede text" value={f.lede as string ?? ''} onChange={(v) => set('lede', v)} />
          <TextInput label="Email" value={f.email as string ?? ''} onChange={(v) => set('email', v)} />
          <TextInput label="Phone" value={f.phone as string ?? ''} onChange={(v) => set('phone', v)} />
          <TextInput label="HQ" value={f.hq as string ?? ''} onChange={(v) => set('hq', v)} />
          <TextInput label="Regional offices" value={f.regionalOffices as string ?? ''} onChange={(v) => set('regionalOffices', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Form title" value={f.formTitle as string ?? ''} onChange={(v) => set('formTitle', v)} />
          <Textarea label="Form sub" value={f.formSub as string ?? ''} onChange={(v) => set('formSub', v)} />
          <TextInput label="Submit button label" value={f.submitLabel as string ?? ''} onChange={(v) => set('submitLabel', v)} />
          <TextInput label="Success message" value={f.successMessage as string ?? ''} onChange={(v) => set('successMessage', v)} />
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
          <TextInput label="Demo card title" value={f.demoTitle as string ?? ''} onChange={(v) => set('demoTitle', v)} />
          <Textarea label="Demo card sub" value={f.demoSub as string ?? ''} onChange={(v) => set('demoSub', v)} />
          <TextInput label="Contact rail heading" value={f.contactTitle as string ?? ''} onChange={(v) => set('contactTitle', v)} />
        </div>
      );

    case 'slick-sc-video-showcase':
      return (
        <div className="space-y-4">
          <TextInput label="Badge text" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (gradient)" value={f.headingGradient as string ?? ''} onChange={(v) => set('headingGradient', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Subtitle normal text" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Subtitle bold text" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Subtitle tail text" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Thumbnail image" value={f.thumbnailUrl as string ?? ''} onChange={(v) => set('thumbnailUrl', v)} />
          <TextInput label="Video URL (.mp4 / YouTube / Vimeo)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label (prefix)" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-scai-vision-security': {
      type SecBadge = { image?: string; alt?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (white)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
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
                <ImageField label="Badge image" value={b.image ?? ''} onChange={(v) => u({ ...b, image: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-vision-results': {
      type ResultStat = { label?: string; value?: string; desc?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (dark)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<ResultStat>
            label="Stat cards"
            items={(f.stats as ResultStat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ label: 'Increase', value: '1x', desc: 'New metric' })}
            itemPreview={(s) => `${s.value ?? ''} — ${s.desc ?? '(empty)'}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Card label (e.g. Increase)" value={s.label ?? ''} onChange={(v) => u({ ...s, label: v })} />
                <TextInput label="Value (e.g. 2x)" value={s.value ?? ''} onChange={(v) => u({ ...s, value: v })} />
                <TextInput label="Description" value={s.desc ?? ''} onChange={(v) => u({ ...s, desc: v })} />
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
          <TextInput label="Eyebrow (badge)" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SBItem>
            label="Stats"
            items={(f.stats as SBItem[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '0x', label: 'New metric' })}
            itemPreview={(s) => `${s.value ?? ''} — ${s.label ?? '(empty)'}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Value (e.g. 95%+)" value={s.value ?? ''} onChange={(v) => u({ ...s, value: v })} />
                <TextInput label="Label" value={s.label ?? ''} onChange={(v) => u({ ...s, label: v })} />
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
          <TextInput label="Eyebrow (badge)" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<MTab>
            label="Tabs"
            items={(f.tabs as MTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New tab', headingPre: 'Heading ', headingAccent: 'accent', body: '', bigValue: '0x', bigLabel: '', rows: [], imageUrl: '', imageAlt: '' })}
            itemPreview={(t) => t.label || '(tab)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Tab label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
                <TextInput label="Panel heading prefix" value={t.headingPre ?? ''} onChange={(v) => u({ ...t, headingPre: v })} />
                <TextInput label="Panel heading accent (teal)" value={t.headingAccent ?? ''} onChange={(v) => u({ ...t, headingAccent: v })} />
                <Textarea label="Body" value={t.body ?? ''} onChange={(v) => u({ ...t, body: v })} />
                <TextInput label="Big value (e.g. 95%+)" value={t.bigValue ?? ''} onChange={(v) => u({ ...t, bigValue: v })} />
                <TextInput label="Big value label" value={t.bigLabel ?? ''} onChange={(v) => u({ ...t, bigLabel: v })} />
                <ImageField label="Panel image" value={t.imageUrl ?? ''} onChange={(v) => u({ ...t, imageUrl: v })} />
                <TextInput label="Image alt / placeholder caption" value={t.imageAlt ?? ''} onChange={(v) => u({ ...t, imageAlt: v })} />
                <Repeater<MRow>
                  label="Rows"
                  items={t.rows ?? []}
                  onChange={(v) => u({ ...t, rows: v })}
                  newItem={() => ({ kPre: '', kHl: 'highlight', kPost: '', v: '' })}
                  itemPreview={(r) => `${r.kPre ?? ''}${r.kHl ?? ''}${r.kPost ?? ''}`.trim() || '(row)'}
                  renderItem={(r, ur) => (
                    <div className="space-y-2">
                      <TextInput label="Label — before highlight" value={r.kPre ?? ''} onChange={(v) => ur({ ...r, kPre: v })} />
                      <TextInput label="Label — highlighted (teal)" value={r.kHl ?? ''} onChange={(v) => ur({ ...r, kHl: v })} />
                      <TextInput label="Label — after highlight" value={r.kPost ?? ''} onChange={(v) => ur({ ...r, kPost: v })} />
                      <TextInput label="Sub value" value={r.v ?? ''} onChange={(v) => ur({ ...r, v: v })} />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-vision-showcase': {
      type SVSCard = { title?: string; sub?: string; accuracy?: string; img?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix (dark)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SVSCard>
            label="Cards"
            items={(f.cards as SVSCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Store Type', sub: '0 SKUs detected', accuracy: '0%', img: '' })}
            itemPreview={(c) => c.title || '(card)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <TextInput label="Sub (e.g. 28 SKUs detected)" value={c.sub ?? ''} onChange={(v) => u({ ...c, sub: v })} />
                <TextInput label="Accuracy badge (e.g. 89%)" value={c.accuracy ?? ''} onChange={(v) => u({ ...c, accuracy: v })} />
                <ImageField label="Card image" value={c.img ?? ''} onChange={(v) => u({ ...c, img: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Textarea label="Feature strip (one per line)" value={(f.features as string[] ?? []).join('\n')} onChange={(v) => set('features', v.split('\n').filter(Boolean))} />
        </div>
      );
    }

    case 'slick-scai-vision-channels': {
      type SVCRow = { badge?: string; headingPre?: string; headingGrad?: string; headingSuffix?: string; body?: string; tags?: string[]; img?: string; imgRight?: boolean };
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1 (dark)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading line 2 (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
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
                <TextInput label="Badge label" value={r.badge ?? ''} onChange={(v) => u({ ...r, badge: v })} />
                <TextInput label="Heading prefix (dark)" value={r.headingPre ?? ''} onChange={(v) => u({ ...r, headingPre: v })} />
                <TextInput label="Heading gradient (teal)" value={r.headingGrad ?? ''} onChange={(v) => u({ ...r, headingGrad: v })} />
                <TextInput label="Heading suffix (dark)" value={r.headingSuffix ?? ''} onChange={(v) => u({ ...r, headingSuffix: v })} />
                <Textarea label="Body text" value={r.body ?? ''} onChange={(v) => u({ ...r, body: v })} />
                <Textarea label="Tags (one per line)" value={(r.tags ?? []).join('\n')} onChange={(v) => u({ ...r, tags: v.split('\n').filter(Boolean) })} />
                <ImageField label="Row image" value={r.img ?? ''} onChange={(v) => u({ ...r, img: v })} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                  <input type="checkbox" checked={r.imgRight !== false} onChange={(e) => u({ ...r, imgRight: e.target.checked })} />
                  Image on right (uncheck = image on left)
                </label>
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-vision-performance': {
      type SVPMetric = { boldWord?: string; label?: string; value?: string };
      type SVPTab = { label?: string; headingGrad1?: string; headingMid?: string; headingGrad2?: string; headingSuffix?: string; body?: string; bigStat?: string; bigStatLabel?: string; metrics?: SVPMetric[] };
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix (white)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SVPTab>
            label="Tabs"
            items={(f.tabs as SVPTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', headingGrad1: 'SCAI', headingMid: ' delivers ', headingGrad2: 'results', headingSuffix: '', body: '', bigStat: '0', bigStatLabel: 'Key Metric', metrics: [] })}
            itemPreview={(t) => t.label || '(unnamed)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Tab label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
                <TextInput label="Heading teal word 1" value={t.headingGrad1 ?? ''} onChange={(v) => u({ ...t, headingGrad1: v })} />
                <TextInput label="Heading middle text" value={t.headingMid ?? ''} onChange={(v) => u({ ...t, headingMid: v })} />
                <TextInput label="Heading teal word 2" value={t.headingGrad2 ?? ''} onChange={(v) => u({ ...t, headingGrad2: v })} />
                <TextInput label="Heading suffix (white)" value={t.headingSuffix ?? ''} onChange={(v) => u({ ...t, headingSuffix: v })} />
                <Textarea label="Body text" value={t.body ?? ''} onChange={(v) => u({ ...t, body: v })} />
                <TextInput label="Big stat" value={t.bigStat ?? ''} onChange={(v) => u({ ...t, bigStat: v })} />
                <TextInput label="Big stat label" value={t.bigStatLabel ?? ''} onChange={(v) => u({ ...t, bigStatLabel: v })} />
                <Repeater<SVPMetric>
                  label="Metrics"
                  items={t.metrics ?? []}
                  onChange={(m) => u({ ...t, metrics: m })}
                  newItem={() => ({ boldWord: 'Metric', label: 'label', value: 'value' })}
                  itemPreview={(m) => m.boldWord || '(metric)'}
                  renderItem={(m, um) => (
                    <div className="space-y-1">
                      <TextInput label="Bold word (teal)" value={m.boldWord ?? ''} onChange={(v) => um({ ...m, boldWord: v })} />
                      <TextInput label="Label (white)" value={m.label ?? ''} onChange={(v) => um({ ...m, label: v })} />
                      <TextInput label="Value (grey)" value={m.value ?? ''} onChange={(v) => um({ ...m, value: v })} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1 (dark)" value={f.headingPre1 as string ?? ''} onChange={(v) => set('headingPre1', v)} />
          <TextInput label="Heading line 2 prefix (dark)" value={f.headingPre2 as string ?? ''} onChange={(v) => set('headingPre2', v)} />
          <TextInput label="Heading gradient (red)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle (\\n for line break)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Donut centre value" value={f.donutCenter as string ?? ''} onChange={(v) => set('donutCenter', v)} />
          <TextInput label="Donut centre label" value={f.donutLabel as string ?? ''} onChange={(v) => set('donutLabel', v)} />
          <TextInput label="Loss percent (number)" value={String(f.lossPercent ?? 25)} onChange={(v) => set('lossPercent', Number(v) || 25)} />
          <TextInput label="Legend — capture label" value={f.captureLabel as string ?? ''} onChange={(v) => set('captureLabel', v)} />
          <TextInput label="Legend — loss label" value={f.lossLabel as string ?? ''} onChange={(v) => set('lossLabel', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SVRLStat>
            label="Stat rows"
            items={(f.stats as SVRLStat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ stat: '0%', label: 'description', badge: '-0%', icon: 'alert' })}
            itemPreview={(s) => s.stat || '(unnamed)'}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Stat value" value={s.stat ?? ''} onChange={(v) => u({ ...s, stat: v })} />
                <TextInput label="Label" value={s.label ?? ''} onChange={(v) => u({ ...s, label: v })} />
                <TextInput label="Badge text" value={s.badge ?? ''} onChange={(v) => u({ ...s, badge: v })} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1 (dark)" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix (dark)" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SCAIVACard>
            label="Cards"
            items={(f.cards as SCAIVACard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Feature', description: '', img: '' })}
            itemPreview={(c) => c.title || '(unnamed)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Description" value={c.description ?? ''} onChange={(v) => u({ ...c, description: v })} />
                <ImageField label="Card image" value={c.img ?? ''} onChange={(v) => u({ ...c, img: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-vision-insights': {
      type SCAIVITab = { label?: string; tag?: string; headingGrad?: string; headingSuffix?: string; body?: string; bullets?: string[]; whyHeading?: string; whyPre?: string; whyBold?: string; whyTail?: string; img?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix (line 1)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (line 1)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading prefix (line 2)" value={f.headingPre2 as string ?? ''} onChange={(v) => set('headingPre2', v)} />
          <TextInput label="Heading gradient (line 2)" value={f.headingGrad2 as string ?? ''} onChange={(v) => set('headingGrad2', v)} />
          <Textarea label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<SCAIVITab>
            label="Tabs"
            items={(f.tabs as SCAIVITab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'New Tab', tag: 'Dashboard', headingGrad: 'Feature ', headingSuffix: 'That Drives Results', body: '', bullets: [], whyHeading: 'Why SCAI is Different?', whyPre: '', whyBold: '', whyTail: '', img: '' })}
            itemPreview={(t) => t.label || '(unnamed)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Tab label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
                <TextInput label="Tag badge" value={t.tag ?? ''} onChange={(v) => u({ ...t, tag: v })} />
                <TextInput label="Heading (teal part)" value={t.headingGrad ?? ''} onChange={(v) => u({ ...t, headingGrad: v })} />
                <TextInput label="Heading (dark suffix)" value={t.headingSuffix ?? ''} onChange={(v) => u({ ...t, headingSuffix: v })} />
                <Textarea label="Body text" value={t.body ?? ''} onChange={(v) => u({ ...t, body: v })} />
                <Textarea label="Bullets (one per line)" value={(t.bullets ?? []).join('\n')} onChange={(v) => u({ ...t, bullets: v.split('\n').filter(Boolean) })} />
                <TextInput label="Why heading" value={t.whyHeading ?? ''} onChange={(v) => u({ ...t, whyHeading: v })} />
                <TextInput label="Why — text before bold" value={t.whyPre ?? ''} onChange={(v) => u({ ...t, whyPre: v })} />
                <TextInput label="Why — bold text" value={t.whyBold ?? ''} onChange={(v) => u({ ...t, whyBold: v })} />
                <TextInput label="Why — text after bold" value={t.whyTail ?? ''} onChange={(v) => u({ ...t, whyTail: v })} />
                <ImageField label="Tab image (right panel)" value={t.img ?? ''} onChange={(v) => u({ ...t, img: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-vision-hero':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Sub — before first bold" value={f.subPre as string ?? ''} onChange={(v) => set('subPre', v)} />
          <TextInput label="Sub — bold 1" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub — middle text" value={f.subMid as string ?? ''} onChange={(v) => set('subMid', v)} />
          <TextInput label="Sub — bold 2" value={f.subBold2 as string ?? ''} onChange={(v) => set('subBold2', v)} />
          <TextInput label="Sub — tail text" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Centre phone" value={f.imgPhone as string ?? ''} onChange={(v) => set('imgPhone', v)} />
          <ImageField label="Bottom-left card (Share of Shelf)" value={f.imgBottomLeft as string ?? ''} onChange={(v) => set('imgBottomLeft', v)} />
          <ImageField label="Bottom-right card (Task completed)" value={f.imgBottomRight as string ?? ''} onChange={(v) => set('imgBottomRight', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Floating chips</p>
          <TextInput label="Chip 1 — value" value={f.chip1Val as string ?? ''} onChange={(v) => set('chip1Val', v)} />
          <TextInput label="Chip 1 — unit (teal)" value={f.chip1Unit as string ?? ''} onChange={(v) => set('chip1Unit', v)} />
          <TextInput label="Chip 1 — label" value={f.chip1Lbl as string ?? ''} onChange={(v) => set('chip1Lbl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 2 — value" value={f.chip2Val as string ?? ''} onChange={(v) => set('chip2Val', v)} />
          <TextInput label="Chip 2 — unit (teal)" value={f.chip2Unit as string ?? ''} onChange={(v) => set('chip2Unit', v)} />
          <TextInput label="Chip 2 — label" value={f.chip2Lbl as string ?? ''} onChange={(v) => set('chip2Lbl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 3 — value" value={f.chip3Val as string ?? ''} onChange={(v) => set('chip3Val', v)} />
          <TextInput label="Chip 3 — unit (teal)" value={f.chip3Unit as string ?? ''} onChange={(v) => set('chip3Unit', v)} />
          <TextInput label="Chip 3 — label" value={f.chip3Lbl as string ?? ''} onChange={(v) => set('chip3Lbl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chip 4 — value" value={f.chip4Val as string ?? ''} onChange={(v) => set('chip4Val', v)} />
          <TextInput label="Chip 4 — unit (teal)" value={f.chip4Unit as string ?? ''} onChange={(v) => set('chip4Unit', v)} />
          <TextInput label="Chip 4 — label" value={f.chip4Lbl as string ?? ''} onChange={(v) => set('chip4Lbl', v)} />
        </div>
      );

    case 'slick-scai-whatsapp-agent': {
      type WABullet = { text: string; highlight?: string };
      type WALang = { label: string; flag: string; thumbnailUrl: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading white" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Tagline accent (teal)" value={f.taglineAccent as string ?? ''} onChange={(v) => set('taglineAccent', v)} />
          <TextInput label="Tagline rest" value={f.taglineRest as string ?? ''} onChange={(v) => set('taglineRest', v)} />
          <TextInput label="Primary CTA label" value={f.primaryCtaLabel as string ?? ''} onChange={(v) => set('primaryCtaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ghostCtaLabel as string ?? ''} onChange={(v) => set('ghostCtaLabel', v)} />
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
                <TextInput label="Text" value={b.text} onChange={(v) => u({ ...b, text: v })} />
                <TextInput label="Highlight (teal)" value={b.highlight ?? ''} onChange={(v) => u({ ...b, highlight: v })} />
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
                <TextInput label="Flag emoji" value={l.flag} onChange={(v) => u({ ...l, flag: v })} />
                <TextInput label="Label" value={l.label} onChange={(v) => u({ ...l, label: v })} />
                <ImageField label="Thumbnail" value={l.thumbnailUrl} onChange={(v) => u({ ...l, thumbnailUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-global-showcase': {
      type GSPanel = { thumbnailUrl: string; alt: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading (white)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<GSPanel>
            label="Video panels"
            items={(f.panels as GSPanel[]) ?? []}
            onChange={(v) => set('panels', v)}
            newItem={() => ({ thumbnailUrl: '', alt: 'Showcase panel' })}
            itemPreview={(p) => p.alt || '(empty)'}
            renderItem={(p, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail" value={p.thumbnailUrl} onChange={(v) => u({ ...p, thumbnailUrl: v })} />
                <TextInput label="Alt text" value={p.alt} onChange={(v) => u({ ...p, alt: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-human-test': {
      type HTClip = { thumbnailUrl: string };
      type HTMetric = { label: string; labelBold: string; value: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading accent 1 (teal)" value={f.headingAccent1 as string ?? ''} onChange={(v) => set('headingAccent1', v)} />
          <TextInput label="Heading middle (white)" value={f.headingMid as string ?? ''} onChange={(v) => set('headingMid', v)} />
          <TextInput label="Heading accent 2 (teal)" value={f.headingAccent2 as string ?? ''} onChange={(v) => set('headingAccent2', v)} />
          <TextInput label="Subheading" value={f.subheading as string ?? ''} onChange={(v) => set('subheading', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Human test %" value={f.humanTestPercent as string ?? ''} onChange={(v) => set('humanTestPercent', v)} />
          <TextInput label="Stat desc (normal)" value={f.statDescNormal as string ?? ''} onChange={(v) => set('statDescNormal', v)} />
          <TextInput label="Stat desc (bold)" value={f.statDescBold as string ?? ''} onChange={(v) => set('statDescBold', v)} />
          <TextInput label="Stat desc (italic teal)" value={f.statDescItalicAccent as string ?? ''} onChange={(v) => set('statDescItalicAccent', v)} />
          <TextInput label="Primary CTA label" value={f.primaryCtaLabel as string ?? ''} onChange={(v) => set('primaryCtaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<HTClip>
            label="Video clips"
            items={(f.clips as HTClip[]) ?? []}
            onChange={(v) => set('clips', v)}
            newItem={() => ({ thumbnailUrl: '' })}
            itemPreview={(c) => c.thumbnailUrl ? 'Clip (has thumbnail)' : 'Clip (placeholder)'}
            renderItem={(c, u) => (
              <ImageField label="Thumbnail" value={c.thumbnailUrl} onChange={(v) => u({ ...c, thumbnailUrl: v })} />
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
                <TextInput label="Label prefix" value={m.label} onChange={(v) => u({ ...m, label: v })} />
                <TextInput label="Label bold" value={m.labelBold} onChange={(v) => u({ ...m, labelBold: v })} />
                <TextInput label="Value" value={m.value} onChange={(v) => u({ ...m, value: v })} />
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
          <TextInput label="Heading (white)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Primary CTA label" value={f.primaryCtaLabel as string ?? ''} onChange={(v) => set('primaryCtaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ghostCtaLabel as string ?? ''} onChange={(v) => set('ghostCtaLabel', v)} />
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
                <TextInput label="Label" value={c.label} onChange={(v) => u({ ...c, label: v })} />
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
          <TextInput label="Heading prefix (white)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading middle (white)" value={f.headingMid as string ?? ''} onChange={(v) => set('headingMid', v)} />
          <TextInput label="Heading bold (white bold)" value={f.headingBold as string ?? ''} onChange={(v) => set('headingBold', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Primary CTA label" value={f.primaryCtaLabel as string ?? ''} onChange={(v) => set('primaryCtaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ghostCtaLabel as string ?? ''} onChange={(v) => set('ghostCtaLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ghostCtaUrl as string ?? ''} onChange={(v) => set('ghostCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Video thumbnail" value={f.thumbnailUrl as string ?? ''} onChange={(v) => set('thumbnailUrl', v)} />
          <TextInput label="Video caption" value={f.videoCaption as string ?? ''} onChange={(v) => set('videoCaption', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<QGStep>
            label="Steps"
            items={(f.steps as QGStep[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ label: 'STEP 4', title: 'New step' })}
            itemPreview={(s) => s.title || '(empty)'}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Step label" value={s.label} onChange={(v) => u({ ...s, label: v })} />
                <TextInput label="Step title" value={s.title} onChange={(v) => u({ ...s, title: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-scai-revenue': {
      type RLMetricField = { value: string; label: string; impact: string; icon: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading line 1 (white)" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading accent (red)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
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
                <TextInput label="Value" value={m.value} onChange={(v) => u({ ...m, value: v })} />
                <TextInput label="Label" value={m.label} onChange={(v) => u({ ...m, label: v })} />
                <TextInput label="Impact" value={m.impact} onChange={(v) => u({ ...m, impact: v })} />
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
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading rest (white)" value={f.headingRest as string ?? ''} onChange={(v) => set('headingRest', v)} />
          <TextInput label="Subtext" value={f.subtext as string ?? ''} onChange={(v) => set('subtext', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<PilotMetricField>
            label="Metric cards"
            items={(f.metrics as PilotMetricField[]) ?? []}
            onChange={(v) => set('metrics', v)}
            newItem={() => ({ value: '0%', label: 'New Metric', comparison: 'vs —', comparedTo: 'with Human', icon: 'callPickup' })}
            itemPreview={(m) => m.label || '(empty)'}
            renderItem={(m, u) => (
              <div className="space-y-2">
                <TextInput label="Value" value={m.value} onChange={(v) => u({ ...m, value: v })} />
                <TextInput label="Label" value={m.label} onChange={(v) => u({ ...m, label: v })} />
                <TextInput label="Comparison" value={m.comparison} onChange={(v) => u({ ...m, comparison: v })} />
                <TextInput label="Compared to" value={m.comparedTo} onChange={(v) => u({ ...m, comparedTo: v })} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (white)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading (teal)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <Textarea label="Sub text" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <ImageField label="Diagram image" value={f.diagramImg as string ?? ''} onChange={(v) => set('diagramImg', v)} />
        </div>
      );

    case 'slick-scai-why':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (white)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading (teal)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <Textarea label="Sub text" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 1 — Left tall (Ultra-Configurable Agents)</p>
          <TextInput label="Title" value={f.c1Title as string ?? ''} onChange={(v) => set('c1Title', v)} />
          <Textarea label="Body" value={f.c1Body as string ?? ''} onChange={(v) => set('c1Body', v)} />
          <ImageField label="Agent image" value={f.c1Image as string ?? ''} onChange={(v) => set('c1Image', v)} />
          <TextInput label="Caption (teal line)" value={f.c1Caption as string ?? ''} onChange={(v) => set('c1Caption', v)} />
          <TextInput label="Caption (bold line)" value={f.c1CaptionSub as string ?? ''} onChange={(v) => set('c1CaptionSub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 2 — Middle top (Instant Multi-Channel)</p>
          <TextInput label="Title" value={f.c2Title as string ?? ''} onChange={(v) => set('c2Title', v)} />
          <TextInput label="Body (before bold)" value={f.c2BodyPre as string ?? ''} onChange={(v) => set('c2BodyPre', v)} />
          <TextInput label="Body (bold)" value={f.c2BodyBold as string ?? ''} onChange={(v) => set('c2BodyBold', v)} />
          <TextInput label="Body (after bold)" value={f.c2BodyPost as string ?? ''} onChange={(v) => set('c2BodyPost', v)} />
          <ImageField label="Side image" value={f.c2Image as string ?? ''} onChange={(v) => set('c2Image', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Banner — Agentic AI CTA</p>
          <Textarea label="Heading text" value={f.bannerPre as string ?? ''} onChange={(v) => set('bannerPre', v)} />
          <TextInput label="Big teal text (e.g. AGENTIC AI)" value={f.bannerBold3 as string ?? ''} onChange={(v) => set('bannerBold3', v)} />
          <TextInput label="CTA button label" value={f.bannerCtaLabel as string ?? ''} onChange={(v) => set('bannerCtaLabel', v)} />
          <TextInput label="CTA button URL" value={f.bannerCtaUrl as string ?? ''} onChange={(v) => set('bannerCtaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 3 — Middle bottom (Train Fast)</p>
          <TextInput label="Title" value={f.c3Title as string ?? ''} onChange={(v) => set('c3Title', v)} />
          <TextInput label="Body (before bold)" value={f.c3BodyPre as string ?? ''} onChange={(v) => set('c3BodyPre', v)} />
          <TextInput label="Body (bold)" value={f.c3BodyBold as string ?? ''} onChange={(v) => set('c3BodyBold', v)} />
          <TextInput label="Body (after bold)" value={f.c3BodyPost as string ?? ''} onChange={(v) => set('c3BodyPost', v)} />
          <ImageField label="Side image" value={f.c3Image as string ?? ''} onChange={(v) => set('c3Image', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 4 — Right top (Embedded in RTM)</p>
          <TextInput label="Title" value={f.c4Title as string ?? ''} onChange={(v) => set('c4Title', v)} />
          <Textarea label="Body" value={f.c4Body as string ?? ''} onChange={(v) => set('c4Body', v)} />
          <ImageField label="Image" value={f.c4Image as string ?? ''} onChange={(v) => set('c4Image', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Card 5 — Right bottom (AI Agents)</p>
          <TextInput label="Title" value={f.c5Title as string ?? ''} onChange={(v) => set('c5Title', v)} />
          <Textarea label="Body" value={f.c5Body as string ?? ''} onChange={(v) => set('c5Body', v)} />
          <ImageField label="Visual image" value={f.c5Image as string ?? ''} onChange={(v) => set('c5Image', v)} />
        </div>
      );

    case 'slick-scai-video-showcase':
      return (
        <div className="space-y-4">
          <TextInput label="Video URL" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Thumbnail" value={f.posterUrl as string ?? ''} onChange={(v) => set('posterUrl', v)} />
        </div>
      );

    case 'slick-scai-agents':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (white)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading (teal)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <Textarea label="Sub text" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          {([1,2,3,4,5,6,7,8] as const).map(n => (
            <div key={n}>
              <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px' }}>Agent {n}</p>
              <ImageField label={`Agent ${n} avatar`} value={f[`a${n}Img`] as string ?? ''} onChange={(v) => set(`a${n}Img`, v)} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (white part)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading (teal part)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <Textarea label="Sub text" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Section image" value={f.sectionImg as string ?? ''} onChange={(v) => set('sectionImg', v)} />
        </div>
      );

    case 'slick-scai-hero-v2':
      return (
        <div className="space-y-4">
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading line 1 (dark)" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading line 2 (teal)" value={f.headingLine2 as string ?? ''} onChange={(v) => set('headingLine2', v)} />
          <Textarea label="Sub (before bold)" value={f.subNormal as string ?? ''} onChange={(v) => set('subNormal', v)} />
          <TextInput label="Sub bold phrase" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <Textarea label="Sub (after bold)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Promo (normal text)" value={f.promoNormal as string ?? ''} onChange={(v) => set('promoNormal', v)} />
          <TextInput label="Promo (teal highlight)" value={f.promoTeal as string ?? ''} onChange={(v) => set('promoTeal', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Center agent image" value={f.imgCenter as string ?? ''} onChange={(v) => set('imgCenter', v)} />
          <ImageField label="Left UI screenshot" value={f.imgLeft as string ?? ''} onChange={(v) => set('imgLeft', v)} />
          <ImageField label="Right UI screenshot" value={f.imgRight as string ?? ''} onChange={(v) => set('imgRight', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Card 1 value (top-left)" value={f.c1Val as string ?? ''} onChange={(v) => set('c1Val', v)} />
          <TextInput label="Card 1 label" value={f.c1Lbl as string ?? ''} onChange={(v) => set('c1Lbl', v)} />
          <TextInput label="Card 2 value (top-right)" value={f.c2Val as string ?? ''} onChange={(v) => set('c2Val', v)} />
          <TextInput label="Card 2 label" value={f.c2Lbl as string ?? ''} onChange={(v) => set('c2Lbl', v)} />
          <TextInput label="Card 3 value (bottom-left)" value={f.c3Val as string ?? ''} onChange={(v) => set('c3Val', v)} />
          <TextInput label="Card 3 label" value={f.c3Lbl as string ?? ''} onChange={(v) => set('c3Lbl', v)} />
          <TextInput label="Card 4 value (bottom-right)" value={f.c4Val as string ?? ''} onChange={(v) => set('c4Val', v)} />
          <TextInput label="Card 4 label" value={f.c4Lbl as string ?? ''} onChange={(v) => set('c4Lbl', v)} />
        </div>
      );

    case 'slick-scai-hero':
      return (
        <div className="space-y-4">
          <TextInput label="Heading line 1" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Badge label" value={f.badgeLabel as string ?? ''} onChange={(v) => set('badgeLabel', v)} />
          <TextInput label="Body bold opener" value={f.bodyBold as string ?? ''} onChange={(v) => set('bodyBold', v)} />
          <TextInput label="Body text" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
          <TextInput label="Primary CTA label" value={f.primaryCtaLabel as string ?? ''} onChange={(v) => set('primaryCtaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.primaryCtaUrl as string ?? ''} onChange={(v) => set('primaryCtaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ghostCtaLabel as string ?? ''} onChange={(v) => set('ghostCtaLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ghostCtaUrl as string ?? ''} onChange={(v) => set('ghostCtaUrl', v)} />
          <TextInput label="Credits label" value={f.creditsLabel as string ?? ''} onChange={(v) => set('creditsLabel', v)} />
          <TextInput label="Credits highlight (teal)" value={f.creditsHighlight as string ?? ''} onChange={(v) => set('creditsHighlight', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Avatar caption — accent (teal)" value={f.avatarCaptionAccent as string ?? ''} onChange={(v) => set('avatarCaptionAccent', v)} />
          <TextInput label="Avatar caption — main (white bold)" value={f.avatarCaptionMain as string ?? ''} onChange={(v) => set('avatarCaptionMain', v)} />
          <TextInput label="Avatar caption — suffix (thin)" value={f.avatarCaptionSuffix as string ?? ''} onChange={(v) => set('avatarCaptionSuffix', v)} />
          <TextInput label="Avatar caption — danger (red)" value={f.avatarCaptionDanger as string ?? ''} onChange={(v) => set('avatarCaptionDanger', v)} />
          <ImageField label="Avatar image" value={f.avatarUrl as string ?? ''} onChange={(v) => set('avatarUrl', v)} />
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
          <TextInput label="Hero subheading" value={f.heroSub as string ?? ''} onChange={(v) => set('heroSub', v)} />
          <TextInput label="Effective date" value={f.effectiveDate as string ?? ''} onChange={(v) => set('effectiveDate', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA eyebrow" value={f.ctaEyebrow as string ?? ''} onChange={(v) => set('ctaEyebrow', v)} />
          <TextInput label="CTA heading" value={f.ctaHeading as string ?? ''} onChange={(v) => set('ctaHeading', v)} />
          <TextInput label="CTA subheading" value={f.ctaSub as string ?? ''} onChange={(v) => set('ctaSub', v)} />
          <TextInput label="CTA button label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA button URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );

    case 'slick-sc-platform-grid': {
      const CARD_NAMES = [
        'AI Native SFA for Urban','AI Native SFA for Rural','AI Native Supervisor App','AI Native Manager App',
        'AI Native DMS for Urban','AI Native DMS for Rural','AI Native eB2B','AI Native Delivery App',
        'AI Native IR for MT','AI Native IR for GT','AI Native IR for eB2B',
        'SCAI – AI Sales Agent','AI Sales Coach','AI Analyst','AI Promo Co-Pilot',
        'AI Promo Engine','AI Target Engine','AI Task Engine','Travel Expense','Sales Incentive','New Outlets',
        'UPI Payments','WhatsApp','Digital Wallet',
      ];
      const cardUrls = (f.cardUrls as Record<string, string>) ?? {};
      const setCardUrl = (name: string, url: string) => {
        set('cardUrls', { ...cardUrls, [name]: url });
      };
      return (
        <div className="space-y-4">
          <TextInput label="Badge text" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Heading (plain)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Subheading" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Footer pre-text" value={f.ctaPreText as string ?? ''} onChange={(v) => set('ctaPreText', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs text-slate-500 font-medium">Card URLs</p>
          {CARD_NAMES.map(name => (
            <TextInput
              key={name}
              label={name}
              value={cardUrls[name] ?? ''}
              onChange={(v) => setCardUrl(name, v)}
            />
          ))}
        </div>
      );
    }

    case 'slick-conclave-hero': {
      return (
        <div className="space-y-4">
          <ImageField label="Branding image (logo + heading as one image)" value={f.brandingImageSrc as string ?? ''} onChange={(v) => set('brandingImageSrc', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Date" value={f.date as string ?? ''} onChange={(v) => set('date', v)} />
          <TextInput label="Venue" value={f.venue as string ?? ''} onChange={(v) => set('venue', v)} />
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
          <TextInput label="Heading part 1" value={f.heading1 as string ?? ''} onChange={(v) => set('heading1', v)} />
          <TextInput label="Heading part 2 (teal)" value={f.heading2 as string ?? ''} onChange={(v) => set('heading2', v)} />
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
          <TextInput label="Section heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Agenda image" value={f.agendaImage as string ?? ''} onChange={(v) => set('agendaImage', v)} />
        </div>
      );

    case 'slick-conclave-stats': {
      type Stat = { value: string; label: string; sublabel?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow line 1" value={f.eyebrow1 as string ?? ''} onChange={(v) => set('eyebrow1', v)} />
          <TextInput label="Eyebrow line 2 (teal)" value={f.eyebrow2 as string ?? ''} onChange={(v) => set('eyebrow2', v)} />
          <ImageField label="Banner image (full-width)" value={f.bannerImage as string ?? ''} onChange={(v) => set('bannerImage', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<Stat>
            label="Stats"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ value: '10+', label: 'Leaders', sublabel: '' })}
            itemPreview={(s) => `${s.value} ${s.label}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Value" value={s.value ?? ''} onChange={(v) => u({ ...s, value: v })} />
                <TextInput label="Label" value={s.label ?? ''} onChange={(v) => u({ ...s, label: v })} />
                <TextInput label="Sublabel" value={s.sublabel ?? ''} onChange={(v) => u({ ...s, sublabel: v })} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading pre" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading teal" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<Card>
            label="Cards"
            items={(f.cards as Card[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ image: '', captionBold: '', captionRest: '' })}
            itemPreview={(c) => c.captionBold || 'Card'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Image" value={c.image ?? ''} onChange={(v) => u({ ...c, image: v })} />
                <TextInput label="Caption bold" value={c.captionBold ?? ''} onChange={(v) => u({ ...c, captionBold: v })} />
                <TextInput label="Caption rest" value={c.captionRest ?? ''} onChange={(v) => u({ ...c, captionRest: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sc-saudi-platform': {
      return (
        <div className="space-y-4">
          <TextInput label="YouTube URL (overrides image)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Section image (full-width)" value={f.imageSrc as string ?? ''} onChange={(v) => set('imageSrc', v)} />
          <TextInput label="CTA label (HTML ok)" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sc-saudi-video': {
      return (
        <div className="space-y-4">
          <TextInput label="YouTube URL (overrides image)" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <ImageField label="Fallback image" value={f.imageSrc as string ?? ''} onChange={(v) => set('imageSrc', v)} />
          <TextInput label="CTA label (HTML ok)" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sc-saudi-products': {
      type ProductItem = { pill?: string; headingWhite?: string; headingTeal?: string; description?: string; features?: Array<{ label: string; text: string }>; ctaLabel?: string; ctaHref?: string; imageSrc?: string; };
      type FeatureItem = { label: string; text: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow pill" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (white part)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading (teal part)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<ProductItem>
            label="Products"
            items={(f.products as ProductItem[]) ?? []}
            onChange={(v) => set('products', v)}
            newItem={() => ({ pill: '', headingWhite: 'AI Native', headingTeal: 'Product', description: '', features: [], ctaLabel: 'Know More', ctaHref: '#', imageSrc: '' })}
            itemPreview={(p) => `${p.headingWhite ?? ''} ${p.headingTeal ?? ''}`.trim() || '(empty)'}
            renderItem={(p, u) => (
              <div className="space-y-3">
                <TextInput label="Pill tag" value={p.pill ?? ''} onChange={(v) => u({ ...p, pill: v })} />
                <TextInput label="Heading (white)" value={p.headingWhite ?? ''} onChange={(v) => u({ ...p, headingWhite: v })} />
                <TextInput label="Heading (teal)" value={p.headingTeal ?? ''} onChange={(v) => u({ ...p, headingTeal: v })} />
                <Textarea label="Description" value={p.description ?? ''} onChange={(v) => u({ ...p, description: v })} />
                <Repeater<FeatureItem>
                  label="Features"
                  items={p.features ?? []}
                  onChange={(v) => u({ ...p, features: v })}
                  newItem={() => ({ label: 'Feature', text: '' })}
                  itemPreview={(feat) => feat.label || '(empty)'}
                  renderItem={(feat, uf) => (
                    <div className="space-y-2">
                      <TextInput label="Bold label" value={feat.label ?? ''} onChange={(v) => uf({ ...feat, label: v })} />
                      <Textarea label="Description" value={feat.text ?? ''} onChange={(v) => uf({ ...feat, text: v })} />
                    </div>
                  )}
                />
                <TextInput label="CTA label" value={p.ctaLabel ?? ''} onChange={(v) => u({ ...p, ctaLabel: v })} />
                <TextInput label="CTA URL" value={p.ctaHref ?? ''} onChange={(v) => u({ ...p, ctaHref: v })} />
                <ImageField label="Product image" value={p.imageSrc ?? ''} onChange={(v) => u({ ...p, imageSrc: v })} />
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
          <TextInput label="Pill text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading (white)" value={f.headingWhite as string ?? ''} onChange={(v) => set('headingWhite', v)} />
          <TextInput label="Heading (teal)" value={f.headingTeal as string ?? ''} onChange={(v) => set('headingTeal', v)} />
          <TextInput label="Sub text" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<Card>
            label="Cards"
            items={(f.cards as Card[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ image: '' })}
            itemPreview={(_, i) => `Card ${i + 1}`}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Image" value={c.image ?? ''} onChange={(v) => u({ ...c, image: v })} />
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
          <ImageField label="Logo" value={f.logoSrc as string ?? ''} onChange={(v) => set('logoSrc', v)} />
          <TextInput label="Eyebrow text" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading English" value={f.headingEn as string ?? ''} onChange={(v) => set('headingEn', v)} />
          <TextInput label="Heading Arabic" value={f.headingAr as string ?? ''} onChange={(v) => set('headingAr', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <p className="text-xs text-slate-500">Person photos (4 — 2 left, 2 right)</p>
          {[0, 1, 2, 3].map(i => (
            <ImageField key={i} label={`Photo ${i + 1}`} value={((f.photos as string[]) ?? [])[i] ?? ''} onChange={(v) => { const arr = [...((f.photos as string[]) ?? ['','','',''])]; arr[i] = v; set('photos', arr); }} />
          ))}
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ImageField label="Map image (optional)" value={f.mapSrc as string ?? ''} onChange={(v) => set('mapSrc', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Stat value" value={f.statValue as string ?? ''} onChange={(v) => set('statValue', v)} />
          <TextInput label="Stat label" value={f.statLabel as string ?? ''} onChange={(v) => set('statLabel', v)} />
          <Textarea label="Stat description" value={f.statDesc as string ?? ''} onChange={(v) => set('statDesc', v)} />
          <TextInput label="Stat highlight (teal)" value={f.statHighlight as string ?? ''} onChange={(v) => set('statHighlight', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<RoleItem>
            label="Team roles"
            items={(f.roles as RoleItem[]) ?? []}
            onChange={(v) => set('roles', v)}
            newItem={() => ({ title: 'Role Title', subtitle: 'Native Arabic/English Speaker' })}
            itemPreview={(r) => r.title || '(empty)'}
            renderItem={(r, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={r.title ?? ''} onChange={(v) => u({ ...r, title: v })} />
                <TextInput label="Subtitle" value={r.subtitle ?? ''} onChange={(v) => u({ ...r, subtitle: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Language card title" value={f.langTitle as string ?? ''} onChange={(v) => set('langTitle', v)} />
          <Textarea label="Language card body" value={f.langBody as string ?? ''} onChange={(v) => set('langBody', v)} />
          <ImageField label="Language card image" value={f.langImageSrc as string ?? ''} onChange={(v) => set('langImageSrc', v)} />
          <TextInput label="ZATCA card title" value={f.zatcaTitle as string ?? ''} onChange={(v) => set('zatcaTitle', v)} />
          <Textarea label="ZATCA card body" value={f.zatcaBody as string ?? ''} onChange={(v) => set('zatcaBody', v)} />
          <ImageField label="ZATCA card image" value={f.zatcaImageSrc as string ?? ''} onChange={(v) => set('zatcaImageSrc', v)} />
          <TextInput label="Channel card title" value={f.channelTitle as string ?? ''} onChange={(v) => set('channelTitle', v)} />
          <Textarea label="Channel card body" value={f.channelBody as string ?? ''} onChange={(v) => set('channelBody', v)} />
          <ImageField label="Channel card image" value={f.channelImageSrc as string ?? ''} onChange={(v) => set('channelImageSrc', v)} />
          <ImageField label="Roles section image (replaces map + roles)" value={f.rolesImageSrc as string ?? ''} onChange={(v) => set('rolesImageSrc', v)} />
          <ImageField label="Bottom right image" value={f.bottomImageSrc as string ?? ''} onChange={(v) => set('bottomImageSrc', v)} />
        </div>
      );
    }

    case 'slick-conclave-guests': {
      return (
        <div className="space-y-4">
          <TextInput label="Heading part 1" value={f.heading1 as string ?? ''} onChange={(v) => set('heading1', v)} />
          <TextInput label="Heading part 2 (teal)" value={f.heading2 as string ?? ''} onChange={(v) => set('heading2', v)} />
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
          <TextInput label="Heading line 1" value={f.heading1 as string ?? ''} onChange={(v) => set('heading1', v)} />
          <TextInput label="Heading line 2 (teal)" value={f.heading2 as string ?? ''} onChange={(v) => set('heading2', v)} />
          <TextInput label="Date" value={f.date as string ?? ''} onChange={(v) => set('date', v)} />
          <TextInput label="Venue" value={f.venue as string ?? ''} onChange={(v) => set('venue', v)} />
          <TextInput label="Form heading line 1 (teal)" value={f.formHeading1 as string ?? ''} onChange={(v) => set('formHeading1', v)} />
          <TextInput label="Form heading line 2 (white)" value={f.formHeading2 as string ?? ''} onChange={(v) => set('formHeading2', v)} />
          <TextInput label="Submit button label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Form endpoint URL" value={f.formEndpoint as string ?? ''} onChange={(v) => set('formEndpoint', v)} />
        </div>
      );

    case 'slick-ac-hero':
      return (
        <div className="space-y-4">
          <TextInput label="Pill (bold prefix)" value={f.pillPre as string ?? ''} onChange={(v) => set('pillPre', v)} />
          <TextInput label="Pill (rest)" value={f.pillPost as string ?? ''} onChange={(v) => set('pillPost', v)} />
          <TextInput label="Heading line 1" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading line 2 (teal gradient)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle (start)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Subtitle (bold/white middle)" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Subtitle (tail)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero screenshot URL" value={f.heroImageUrl as string ?? ''} onChange={(v) => set('heroImageUrl', v)} />
          <TextInput label="Hero image alt" value={f.heroImageAlt as string ?? ''} onChange={(v) => set('heroImageAlt', v)} />
        </div>
      );

    case 'slick-ac-how-it-works': {
      type HiwStep = { title: string; desc: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <ImageField label="Center circle photo URL" value={f.centerImageUrl as string ?? ''} onChange={(v) => set('centerImageUrl', v)} />
          <Repeater<HiwStep>
            label="Steps (3)"
            items={(f.steps as HiwStep[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ title: 'STEP', desc: 'Step description.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Title (e.g. SETUP)" value={s.title ?? ''} onChange={(v) => u({ ...s, title: v })} />
                <Textarea label="Description" value={s.desc ?? ''} onChange={(v) => u({ ...s, desc: v })} />
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
          <TextInput label="Badge (red)" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading red word 1" value={f.headingRed1 as string ?? ''} onChange={(v) => set('headingRed1', v)} />
          <TextInput label="Heading (mid)" value={f.headingMid as string ?? ''} onChange={(v) => set('headingMid', v)} />
          <TextInput label="Heading red word 2" value={f.headingRed2 as string ?? ''} onChange={(v) => set('headingRed2', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<ProbCard>
            label="Problem cards (5)"
            items={(f.cards as ProbCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: 'head', title: 'Problem' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (head / msg / eye / target / chart)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
              </div>
            )}
          />
          <TextInput label="Stat number (e.g. 3–8% Sales Lost)" value={f.statNum as string ?? ''} onChange={(v) => set('statNum', v)} />
          <Textarea label="Stat caption (start)" value={f.statPre as string ?? ''} onChange={(v) => set('statPre', v)} />
          <TextInput label="Stat caption (bold end)" value={f.statBold as string ?? ''} onChange={(v) => set('statBold', v)} />
        </div>
      );
    }

    case 'slick-ac-capabilities': {
      type CapCard = { icon: string; title: string; desc: string; highlight?: boolean };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<CapCard>
            label="Capability cards (6)"
            items={(f.cards as CapCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: 'spark', title: 'Feature', desc: 'Feature description.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (refresh / head / target / msg / chart / spark)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Description" value={c.desc ?? ''} onChange={(v) => u({ ...c, desc: v })} />
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
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Repeater<Stat>
            label="Stats (4 columns)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ num: '0', unit: '%', label: 'Stat label' })}
            itemPreview={(s) => `${s.num}${s.unit}`}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.num ?? ''} onChange={(v) => u({ ...s, num: v })} />
                <TextInput label="Unit (%, min, /7…)" value={s.unit ?? ''} onChange={(v) => u({ ...s, unit: v })} />
                <Textarea label="Label (use line break for 2 lines)" value={s.label ?? ''} onChange={(v) => u({ ...s, label: v })} />
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
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<ExecCard>
            label="Cards (5)"
            items={(f.cards as ExecCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: 'apps', title: 'Card', desc: 'Card description.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (apps / box / phone / clock / user)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Description" value={c.desc ?? ''} onChange={(v) => u({ ...c, desc: v })} />
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
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<PitchTab>
            label="Tabs (4) — phone mockup"
            items={(f.tabs as PitchTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ icon: 'eye', title: 'Tab', desc: 'Tab description.', imageUrl: '' })}
            itemPreview={(t) => t.title}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (eye / head / mic / msg)" value={t.icon ?? ''} onChange={(v) => u({ ...t, icon: v })} />
                <TextInput label="Title" value={t.title ?? ''} onChange={(v) => u({ ...t, title: v })} />
                <Textarea label="Description" value={t.desc ?? ''} onChange={(v) => u({ ...t, desc: v })} />
                <ImageField label="Phone screen image URL" value={t.imageUrl ?? ''} onChange={(v) => u({ ...t, imageUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-scenario': {
      type ScTab = { icon: string; title: string; desc: string; imageUrl?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<ScTab>
            label="Tabs (3) — phone mockup"
            items={(f.tabs as ScTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ icon: 'bolt', title: 'Scenario', desc: 'Scenario description.', imageUrl: '' })}
            itemPreview={(t) => t.title}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (bolt / chart / mic)" value={t.icon ?? ''} onChange={(v) => u({ ...t, icon: v })} />
                <TextInput label="Title" value={t.title ?? ''} onChange={(v) => u({ ...t, title: v })} />
                <Textarea label="Description" value={t.desc ?? ''} onChange={(v) => u({ ...t, desc: v })} />
                <ImageField label="Phone screen image URL" value={t.imageUrl ?? ''} onChange={(v) => u({ ...t, imageUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-launch': {
      type LaunchStep = { icon: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Repeater<LaunchStep>
            label="Steps (3)"
            items={(f.steps as LaunchStep[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ icon: 'rocket', title: 'Step', desc: 'Step description.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (users / database / rocket)" value={s.icon ?? ''} onChange={(v) => u({ ...s, icon: v })} />
                <TextInput label="Title" value={s.title ?? ''} onChange={(v) => u({ ...s, title: v })} />
                <Textarea label="Description" value={s.desc ?? ''} onChange={(v) => u({ ...s, desc: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-objections':
      return (
        <div className="space-y-4">
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <TextInput label="Teal lead line" value={f.tealLine as string ?? ''} onChange={(v) => set('tealLine', v)} />
          <Textarea label="Body paragraph" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
          <ImageField label="Right image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );

    case 'slick-ac-backend': {
      type BeTab = { title: string; desc: string; imageUrl?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<BeTab>
            label="Tabs (3) — wide image"
            items={(f.tabs as BeTab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ title: 'Role', desc: 'Role description.', imageUrl: '' })}
            itemPreview={(t) => t.title}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={t.title ?? ''} onChange={(v) => u({ ...t, title: v })} />
                <Textarea label="Description" value={t.desc ?? ''} onChange={(v) => u({ ...t, desc: v })} />
                <ImageField label="View image URL" value={t.imageUrl ?? ''} onChange={(v) => u({ ...t, imageUrl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-ac-brand-strip': {
      type Logo = { imageUrl?: string; alt?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Label" value={f.label as string ?? ''} onChange={(v) => set('label', v)} />
          <NumberInput label="Scroll speed (seconds)" value={(f.speedSeconds as number) ?? 30} onChange={(v) => set('speedSeconds', v)} />
          <Repeater<Logo>
            label="Logos"
            items={(f.logos as Logo[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ imageUrl: '', alt: 'Logo' })}
            itemPreview={(l) => l.alt || l.imageUrl || '(empty)'}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <ImageField label="Logo image URL" value={l.imageUrl ?? ''} onChange={(v) => u({ ...l, imageUrl: v })} />
                <TextInput label="Alt / placeholder" value={l.alt ?? ''} onChange={(v) => u({ ...l, alt: v })} />
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
          <TextInput label="Badge (with shield)" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading line 1 (pre)" value={f.headingLine1Pre as string ?? ''} onChange={(v) => set('headingLine1Pre', v)} />
          <TextInput label="Heading line 1 (teal)" value={f.headingLine1Grad as string ?? ''} onChange={(v) => set('headingLine1Grad', v)} />
          <TextInput label="Heading line 2 (pre)" value={f.headingLine2Pre as string ?? ''} onChange={(v) => set('headingLine2Pre', v)} />
          <TextInput label="Heading line 2 (teal)" value={f.headingLine2Grad as string ?? ''} onChange={(v) => set('headingLine2Grad', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Email placeholder" value={f.emailPlaceholder as string ?? ''} onChange={(v) => set('emailPlaceholder', v)} />
          <TextInput label="CTA button label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <Repeater<CheckItem>
            label="Check bullets (3)"
            items={(f.checks as CheckItem[]) ?? []}
            onChange={(v) => set('checks', v)}
            newItem={() => ({ text: 'Benefit text' })}
            itemPreview={(c) => c.text}
            renderItem={(c, u) => (
              <TextInput label="Text" value={c.text ?? ''} onChange={(v) => u({ ...c, text: v })} />
            )}
          />
        </div>
      );
    }


    case 'slick-da-hero': {
      type Chip = { val: string; lbl: string };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle (start)" value={f.subPre as string ?? ''} onChange={(v) => set('subPre', v)} />
          <TextInput label="Subtitle (bold/white middle)" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Subtitle (tail)" value={f.subPost as string ?? ''} onChange={(v) => set('subPost', v)} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero screenshot URL" value={f.mockImageUrl as string ?? ''} onChange={(v) => set('mockImageUrl', v)} />
          <TextInput label="Hero image alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ val: '[V]', lbl: 'Metric label' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Value (or [Vx] placeholder)" value={c.val ?? ''} onChange={(v) => u({ ...c, val: v })} />
                <TextInput label="Label" value={c.lbl ?? ''} onChange={(v) => u({ ...c, lbl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-brand-strip': {
      type Logo = { url?: string; label?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<Logo>
            label="Logos"
            items={(f.logos as Logo[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ url: '', label: 'Customer' })}
            itemPreview={(l) => l.label || l.url || '(empty)'}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <ImageField label="Logo image URL" value={l.url ?? ''} onChange={(v) => u({ ...l, url: v })} />
                <TextInput label="Label / alt" value={l.label ?? ''} onChange={(v) => u({ ...l, label: v })} />
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
          <TextInput label="Badge (red)" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (red)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ label: 'Label', big: '00%', claim: 'Claim text.', srcName: 'Source (Year)', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Label (uppercase)" value={s.label ?? ''} onChange={(v) => u({ ...s, label: v })} />
                <TextInput label="Big number" value={s.big ?? ''} onChange={(v) => u({ ...s, big: v })} />
                <Textarea label="Claim" value={s.claim ?? ''} onChange={(v) => u({ ...s, claim: v })} />
                <TextInput label="Source name" value={s.srcName ?? ''} onChange={(v) => u({ ...s, srcName: v })} />
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
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Body" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
          <ImageField label="Right image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );

    case 'slick-da-workflow': {
      type FlowItem = { li1Bold: string; li1: string; li2Bold: string; li2: string };
      type Step = { num: string; title: string; benefit: string; items: FlowItem };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<Step>
            label="Steps (4)"
            items={(f.steps as Step[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ num: '0X', title: 'Step', benefit: 'Benefit', items: { li1Bold: 'Bold:', li1: ' rest.', li2Bold: 'Bold:', li2: ' rest.' } })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.num ?? ''} onChange={(v) => u({ ...s, num: v })} />
                <TextInput label="Title" value={s.title ?? ''} onChange={(v) => u({ ...s, title: v })} />
                <TextInput label="Benefit pill" value={s.benefit ?? ''} onChange={(v) => u({ ...s, benefit: v })} />
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
      type CapCard = { imageUrl?: string; imageAlt?: string; title: string; benefit: string; descPre?: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<CapCard>
            label="Capability cards (8)"
            items={(f.cards as CapCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', title: 'Capability', benefit: 'Benefit', descPre: '', descBold: 'Bold', descTail: ' rest.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail image URL" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <TextInput label="Benefit pill" value={c.benefit ?? ''} onChange={(v) => u({ ...c, benefit: v })} />
                <TextInput label="Desc (before bold)" value={c.descPre ?? ''} onChange={(v) => u({ ...c, descPre: v })} />
                <TextInput label="Desc (bold)" value={c.descBold ?? ''} onChange={(v) => u({ ...c, descBold: v })} />
                <TextInput label="Desc (after bold)" value={c.descTail ?? ''} onChange={(v) => u({ ...c, descTail: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-split': {
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Body (start)" value={f.bodyPre as string ?? ''} onChange={(v) => set('bodyPre', v)} />
          <TextInput label="Body bold 1" value={f.bodyBold1 as string ?? ''} onChange={(v) => set('bodyBold1', v)} />
          <Textarea label="Body (middle)" value={f.bodyMid as string ?? ''} onChange={(v) => set('bodyMid', v)} />
          <TextInput label="Body bold 2" value={f.bodyBold2 as string ?? ''} onChange={(v) => set('bodyBold2', v)} />
          <TextInput label="Body (tail)" value={f.bodyTail as string ?? ''} onChange={(v) => set('bodyTail', v)} />
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
          <ImageField label="Right image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );
    }

    case 'slick-da-impact': {
      type IStat = { v: string; k: string; sub: string };
      type ICard = { title: string; bodyPre: string; bodyBold: string; bodyTail: string; imageUrl?: string; stats: IStat[] };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<ICard>
            label="Impact cards (3)"
            items={(f.cards as ICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Impact', bodyPre: 'Text ', bodyBold: 'bold', bodyTail: '.', imageUrl: '', stats: [ { v: '00%', k: 'metric', sub: 'note' }, { v: '00%', k: 'metric', sub: 'note' } ] })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body (before bold)" value={c.bodyPre ?? ''} onChange={(v) => u({ ...c, bodyPre: v })} />
                <TextInput label="Body (bold)" value={c.bodyBold ?? ''} onChange={(v) => u({ ...c, bodyBold: v })} />
                <TextInput label="Body (after bold)" value={c.bodyTail ?? ''} onChange={(v) => u({ ...c, bodyTail: v })} />
                <ImageField label="Viz image URL" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <Repeater<IStat>
                  label="Stats (2)"
                  items={c.stats ?? []}
                  onChange={(sv) => u({ ...c, stats: sv })}
                  newItem={() => ({ v: '00%', k: 'metric', sub: 'note' })}
                  itemPreview={(s) => s.k}
                  renderItem={(s, su) => (
                    <div className="space-y-2">
                      <TextInput label="Value (or [VERIFY: x])" value={s.v ?? ''} onChange={(v) => su({ ...s, v })} />
                      <TextInput label="Key" value={s.k ?? ''} onChange={(v) => su({ ...s, k: v })} />
                      <TextInput label="Sub-note" value={s.sub ?? ''} onChange={(v) => su({ ...s, sub: v })} />
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
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Repeater<PCard>
            label="Proof cards (3)"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Proof', bodyPre: 'Text.', bodyBold: '', bodyTail: '', v: '00', k: 'metric' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body (before bold)" value={c.bodyPre ?? ''} onChange={(v) => u({ ...c, bodyPre: v })} />
                <TextInput label="Body (bold, optional)" value={c.bodyBold ?? ''} onChange={(v) => u({ ...c, bodyBold: v })} />
                <TextInput label="Body (after bold)" value={c.bodyTail ?? ''} onChange={(v) => u({ ...c, bodyTail: v })} />
                <TextInput label="Value (or [VERIFY: x])" value={c.v ?? ''} onChange={(v) => u({ ...c, v })} />
                <TextInput label="Key" value={c.k ?? ''} onChange={(v) => u({ ...c, k: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-da-cta':
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );


    case 'slick-pe-hero': {
      type Chip = { valPre: string; valAccent: string; valPost: string; lbl: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero mockup URL" value={f.mockImageUrl as string ?? ''} onChange={(v) => set('mockImageUrl', v)} />
          <TextInput label="Hero image alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', valPost: '', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Value (before accent)" value={c.valPre ?? ''} onChange={(v) => u({ ...c, valPre: v })} />
                <TextInput label="Accent (teal, e.g. + or arrow)" value={c.valAccent ?? ''} onChange={(v) => u({ ...c, valAccent: v })} />
                <TextInput label="Value (after accent)" value={c.valPost ?? ''} onChange={(v) => u({ ...c, valPost: v })} />
                <TextInput label="Label" value={c.lbl ?? ''} onChange={(v) => u({ ...c, lbl: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.n ?? ''} onChange={(v) => u({ ...s, n: v })} />
                <TextInput label="Label" value={s.l ?? ''} onChange={(v) => u({ ...s, l: v })} />
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
          <TextInput label="Pill (coral)" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (coral)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim text.', srcName: 'Source (Year)', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Big number (coral)" value={s.big ?? ''} onChange={(v) => u({ ...s, big: v })} />
                <Textarea label="Claim" value={s.claim ?? ''} onChange={(v) => u({ ...s, claim: v })} />
                <TextInput label="Source name" value={s.srcName ?? ''} onChange={(v) => u({ ...s, srcName: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Body (start)" value={f.bodyPre as string ?? ''} onChange={(v) => set('bodyPre', v)} />
          <TextInput label="Body bold 1" value={f.bodyBold1 as string ?? ''} onChange={(v) => set('bodyBold1', v)} />
          <Textarea label="Body (middle)" value={f.bodyMid as string ?? ''} onChange={(v) => set('bodyMid', v)} />
          <TextInput label="Body bold 2" value={f.bodyBold2 as string ?? ''} onChange={(v) => set('bodyBold2', v)} />
          <TextInput label="Body (tail)" value={f.bodyTail as string ?? ''} onChange={(v) => set('bodyTail', v)} />
          <ImageField label="Right image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );

    case 'slick-pe-stages': {
      type Stage = { num: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<Stage>
            label="Steps (4)"
            items={(f.stages as Stage[]) ?? []}
            onChange={(v) => set('stages', v)}
            newItem={() => ({ num: '0', title: 'Step', desc: 'Step description.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.num ?? ''} onChange={(v) => u({ ...s, num: v })} />
                <TextInput label="Title" value={s.title ?? ''} onChange={(v) => u({ ...s, title: v })} />
                <Textarea label="Description" value={s.desc ?? ''} onChange={(v) => u({ ...s, desc: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-pe-capabilities': {
      type FCard = { imageUrl?: string; imageAlt?: string; title: string; descPre?: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<FCard>
            label="Capability cards (6)"
            items={(f.cards as FCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', title: 'Capability', descPre: '', descBold: 'Bold', descTail: ' rest.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail image URL" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <TextInput label="Desc (before bold)" value={c.descPre ?? ''} onChange={(v) => u({ ...c, descPre: v })} />
                <TextInput label="Desc (bold)" value={c.descBold ?? ''} onChange={(v) => u({ ...c, descBold: v })} />
                <TextInput label="Desc (after bold)" value={c.descTail ?? ''} onChange={(v) => u({ ...c, descTail: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-pe-split': {
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Body (before bold)" value={f.bodyPre as string ?? ''} onChange={(v) => set('bodyPre', v)} />
          <TextInput label="Body (bold)" value={f.bodyBold as string ?? ''} onChange={(v) => set('bodyBold', v)} />
          <Textarea label="Body (after bold)" value={f.bodyTail as string ?? ''} onChange={(v) => set('bodyTail', v)} />
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
          <ImageField label="Right image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );
    }

    case 'slick-pe-impact': {
      type ICard = { title: string; body: string; imageUrl?: string; imageAlt?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<ICard>
            label="Impact cards (3)"
            items={(f.cards as ICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Impact', body: 'Body text.', imageUrl: '' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body" value={c.body ?? ''} onChange={(v) => u({ ...c, body: v })} />
                <ImageField label="Viz image URL" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (tail)" value={f.headingTail as string ?? ''} onChange={(v) => set('headingTail', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<ProofCard>
            label="Proof cards"
            items={(f.cards as ProofCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'KPI', body: 'Body text.', value: '0%', note: 'Note text.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body" value={c.body ?? ''} onChange={(v) => u({ ...c, body: v })} />
                <TextInput label="Value (flagged)" value={c.value ?? ''} onChange={(v) => u({ ...c, value: v })} />
                <Textarea label="Note" value={c.note ?? ''} onChange={(v) => u({ ...c, note: v })} />
              </div>
            )}
          />
        </div>
      );
    }


    case 'slick-rs-hero': {
      type Chip = { valPre: string; valAccent: string; valPost: string; lbl: string };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero mockup URL" value={f.mockImageUrl as string ?? ''} onChange={(v) => set('mockImageUrl', v)} />
          <TextInput label="Hero image alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <TextInput label="Stat note" value={f.statNote as string ?? ''} onChange={(v) => set('statNote', v)} />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', valPost: '', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Value (before accent)" value={c.valPre ?? ''} onChange={(v) => u({ ...c, valPre: v })} />
                <TextInput label="Accent (teal, e.g. +)" value={c.valAccent ?? ''} onChange={(v) => u({ ...c, valAccent: v })} />
                <TextInput label="Value (after accent)" value={c.valPost ?? ''} onChange={(v) => u({ ...c, valPost: v })} />
                <TextInput label="Label" value={c.lbl ?? ''} onChange={(v) => u({ ...c, lbl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rs-brand-strip': {
      type Logo = { url?: string; label: string };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<Logo>
            label="Logo slots"
            items={(f.logos as Logo[]) ?? []}
            onChange={(v) => set('logos', v)}
            newItem={() => ({ url: '', label: 'Customer name' })}
            itemPreview={(l) => l.label}
            renderItem={(l, u) => (
              <div className="space-y-2">
                <ImageField label="Logo URL" value={l.url ?? ''} onChange={(v) => u({ ...l, url: v })} />
                <TextInput label="Label / slot text" value={l.label ?? ''} onChange={(v) => u({ ...l, label: v })} />
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
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (red)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim text.', srcName: 'Source (Year)', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Big number (red)" value={s.big ?? ''} onChange={(v) => u({ ...s, big: v })} />
                <Textarea label="Claim" value={s.claim ?? ''} onChange={(v) => u({ ...s, claim: v })} />
                <TextInput label="Source name" value={s.srcName ?? ''} onChange={(v) => u({ ...s, srcName: v })} />
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
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Bad column label" value={f.badLabel as string ?? ''} onChange={(v) => set('badLabel', v)} />
          <TextInput label="Good column label" value={f.goodLabel as string ?? ''} onChange={(v) => set('goodLabel', v)} />
          <Repeater<CmpItem>
            label="Generic SFA items (bad)"
            items={(f.badItems as CmpItem[]) ?? []}
            onChange={(v) => set('badItems', v)}
            newItem={() => ({ title: 'Problem', body: 'Description.' })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={it.title ?? ''} onChange={(v) => u({ ...it, title: v })} />
                <Textarea label="Body" value={it.body ?? ''} onChange={(v) => u({ ...it, body: v })} />
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
                <TextInput label="Title" value={it.title ?? ''} onChange={(v) => u({ ...it, title: v })} />
                <Textarea label="Body" value={it.body ?? ''} onChange={(v) => u({ ...it, body: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rs-darkpanel':
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Body" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
          <ImageField label="Right image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );

    case 'slick-rs-problemgrid': {
      type ProbCard = { num: string; title: string; bodyPre: string; bodyBold: string; bodyTail: string };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<ProbCard>
            label="Problem cards (6)"
            items={(f.cards as ProbCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ num: '0', title: 'Problem', bodyPre: '', bodyBold: 'Solution', bodyTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={c.num ?? ''} onChange={(v) => u({ ...c, num: v })} />
                <TextInput label="Title (problem)" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body (before bold)" value={c.bodyPre ?? ''} onChange={(v) => u({ ...c, bodyPre: v })} />
                <TextInput label="Body (bold teal)" value={c.bodyBold ?? ''} onChange={(v) => u({ ...c, bodyBold: v })} />
                <Textarea label="Body (after bold)" value={c.bodyTail ?? ''} onChange={(v) => u({ ...c, bodyTail: v })} />
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
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<Cap>
            label="Capability cards (8)"
            items={(f.cards as Cap[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: '⭐', title: 'Capability', benefit: 'Benefit', descPre: '', descBold: 'Bold', descTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (emoji)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <TextInput label="Benefit pill" value={c.benefit ?? ''} onChange={(v) => u({ ...c, benefit: v })} />
                <TextInput label="Desc (before bold)" value={c.descPre ?? ''} onChange={(v) => u({ ...c, descPre: v })} />
                <TextInput label="Desc (bold)" value={c.descBold ?? ''} onChange={(v) => u({ ...c, descBold: v })} />
                <TextInput label="Desc (after bold)" value={c.descTail ?? ''} onChange={(v) => u({ ...c, descTail: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-rs-split': {
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Body (start)" value={f.bodyPre as string ?? ''} onChange={(v) => set('bodyPre', v)} />
          <TextInput label="Body bold 1" value={f.bodyBold1 as string ?? ''} onChange={(v) => set('bodyBold1', v)} />
          <Textarea label="Body (middle)" value={f.bodyMid as string ?? ''} onChange={(v) => set('bodyMid', v)} />
          <TextInput label="Body bold 2" value={f.bodyBold2 as string ?? ''} onChange={(v) => set('bodyBold2', v)} />
          <TextInput label="Body (tail)" value={f.bodyTail as string ?? ''} onChange={(v) => set('bodyTail', v)} />
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
          <ImageField label="Image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );
    }

    case 'slick-rs-impact': {
      type IStat = { v: string; k: string; sub: string };
      type ICard = { title: string; bodyPre: string; bodyBold: string; bodyTail: string; imageUrl?: string; imageAlt?: string; stats: IStat[] };
      return (
        <div className="space-y-4">
          <TextInput label="Badge" value={f.badge as string ?? ''} onChange={(v) => set('badge', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<ICard>
            label="Impact cards (3)"
            items={(f.cards as ICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Impact', bodyPre: '', bodyBold: 'Bold', bodyTail: '.', imageUrl: '', stats: [] })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body (before bold)" value={c.bodyPre ?? ''} onChange={(v) => u({ ...c, bodyPre: v })} />
                <TextInput label="Body (bold)" value={c.bodyBold ?? ''} onChange={(v) => u({ ...c, bodyBold: v })} />
                <Textarea label="Body (after bold)" value={c.bodyTail ?? ''} onChange={(v) => u({ ...c, bodyTail: v })} />
                <ImageField label="Viz image URL" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <Repeater<IStat>
                  label="Verify stats (2)"
                  items={c.stats ?? []}
                  onChange={(nv) => u({ ...c, stats: nv })}
                  newItem={() => ({ v: '[VERIFY: Vx]', k: 'metric', sub: 'detail' })}
                  itemPreview={(s) => s.k}
                  renderItem={(s, su) => (
                    <div className="space-y-2">
                      <TextInput label="Value" value={s.v ?? ''} onChange={(nv) => su({ ...s, v: nv })} />
                      <TextInput label="Metric" value={s.k ?? ''} onChange={(nv) => su({ ...s, k: nv })} />
                      <TextInput label="Sub" value={s.sub ?? ''} onChange={(nv) => su({ ...s, sub: nv })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading line 1" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading line 2 (teal accent)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle (start)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Subtitle bold" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <Textarea label="Subtitle (tail)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero mockup URL" value={f.mockImageUrl as string ?? ''} onChange={(v) => set('mockImageUrl', v)} />
          <TextInput label="Hero image alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Value" value={c.valPre ?? ''} onChange={(v) => u({ ...c, valPre: v })} />
                <TextInput label="Accent (teal suffix, e.g. + % s)" value={c.valAccent ?? ''} onChange={(v) => u({ ...c, valAccent: v })} />
                <TextInput label="Label" value={c.lbl ?? ''} onChange={(v) => u({ ...c, lbl: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle (start)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Subtitle bold" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <Textarea label="Subtitle (tail)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.n ?? ''} onChange={(v) => u({ ...s, n: v })} />
                <TextInput label="Label" value={s.l ?? ''} onChange={(v) => u({ ...s, l: v })} />
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
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );
    }

    case 'slick-sv-problem': {
      type StatCite = { big: string; claim: string; srcName: string; srcUrl?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill (coral)" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Subtitle (start)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Subtitle bold" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <Textarea label="Subtitle (tail)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim text.', srcName: 'Source (Year)', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Big number (coral)" value={s.big ?? ''} onChange={(v) => u({ ...s, big: v })} />
                <Textarea label="Claim" value={s.claim ?? ''} onChange={(v) => u({ ...s, claim: v })} />
                <TextInput label="Source name" value={s.srcName ?? ''} onChange={(v) => u({ ...s, srcName: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Body (start)" value={f.bodyPre as string ?? ''} onChange={(v) => set('bodyPre', v)} />
          <TextInput label="Body bold 1" value={f.bodyBold1 as string ?? ''} onChange={(v) => set('bodyBold1', v)} />
          <Textarea label="Body (middle)" value={f.bodyMid as string ?? ''} onChange={(v) => set('bodyMid', v)} />
          <TextInput label="Body bold 2" value={f.bodyBold2 as string ?? ''} onChange={(v) => set('bodyBold2', v)} />
          <TextInput label="Body (tail)" value={f.bodyTail as string ?? ''} onChange={(v) => set('bodyTail', v)} />
        </div>
      );

    case 'slick-sv-stages': {
      type Stage = { num: string; title: string; descPre: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<Stage>
            label="Steps (4)"
            items={(f.stages as Stage[]) ?? []}
            onChange={(v) => set('stages', v)}
            newItem={() => ({ num: '0', title: 'Step', descPre: '', descBold: 'Bold', descTail: ' rest.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.num ?? ''} onChange={(v) => u({ ...s, num: v })} />
                <TextInput label="Title" value={s.title ?? ''} onChange={(v) => u({ ...s, title: v })} />
                <Textarea label="Desc (before bold)" value={s.descPre ?? ''} onChange={(v) => u({ ...s, descPre: v })} />
                <TextInput label="Desc (bold)" value={s.descBold ?? ''} onChange={(v) => u({ ...s, descBold: v })} />
                <Textarea label="Desc (after bold)" value={s.descTail ?? ''} onChange={(v) => u({ ...s, descTail: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<Stat>
            label="Accuracy stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00%', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.n ?? ''} onChange={(v) => u({ ...s, n: v })} />
                <TextInput label="Label" value={s.l ?? ''} onChange={(v) => u({ ...s, l: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sv-features': {
      type FCard = { imageUrl?: string; imageAlt?: string; title: string; descPre: string; descBold: string; descTail: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<FCard>
            label="Check cards (6)"
            items={(f.cards as FCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', imageAlt: '', title: 'Check', descPre: '', descBold: 'Bold', descTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail image URL" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Image alt / placeholder text" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Desc (before bold)" value={c.descPre ?? ''} onChange={(v) => u({ ...c, descPre: v })} />
                <TextInput label="Desc (bold)" value={c.descBold ?? ''} onChange={(v) => u({ ...c, descBold: v })} />
                <Textarea label="Desc (after bold)" value={c.descTail ?? ''} onChange={(v) => u({ ...c, descTail: v })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Body (start)" value={f.bodyPre as string ?? ''} onChange={(v) => set('bodyPre', v)} />
          <TextInput label="Body bold 1" value={f.bodyBold1 as string ?? ''} onChange={(v) => set('bodyBold1', v)} />
          <Textarea label="Body (middle)" value={f.bodyMid as string ?? ''} onChange={(v) => set('bodyMid', v)} />
          <TextInput label="Body bold 2" value={f.bodyBold2 as string ?? ''} onChange={(v) => set('bodyBold2', v)} />
          <TextInput label="Body (tail)" value={f.bodyTail as string ?? ''} onChange={(v) => set('bodyTail', v)} />
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
          <ImageField label="Art image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt / placeholder text" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );
    }

    case 'slick-sv-proof': {
      type PCard = { title: string; bodyPre: string; bodyBold: string; bodyTail: string; statValue: string; statKey: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<PCard>
            label="Proof cards (3)"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Metric', bodyPre: '', bodyBold: 'Bold', bodyTail: '.', statValue: '00%', statKey: 'metric label' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body (before bold)" value={c.bodyPre ?? ''} onChange={(v) => u({ ...c, bodyPre: v })} />
                <TextInput label="Body (bold)" value={c.bodyBold ?? ''} onChange={(v) => u({ ...c, bodyBold: v })} />
                <Textarea label="Body (after bold)" value={c.bodyTail ?? ''} onChange={(v) => u({ ...c, bodyTail: v })} />
                <TextInput label="Stat value (or [VERIFY: x])" value={c.statValue ?? ''} onChange={(v) => u({ ...c, statValue: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal, new line)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle (before bold)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Subtitle (bold end)" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Phone mockup URL" value={f.mockImageUrl as string ?? ''} onChange={(v) => set('mockImageUrl', v)} />
          <TextInput label="Mockup alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Value" value={c.valPre ?? ''} onChange={(v) => u({ ...c, valPre: v })} />
                <TextInput label="Accent (teal)" value={c.valAccent ?? ''} onChange={(v) => u({ ...c, valAccent: v })} />
                <TextInput label="Label" value={c.lbl ?? ''} onChange={(v) => u({ ...c, lbl: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-su-scale': {
      type Stat = { num: string; lab: string };
      type Logo = { url?: string; label: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <TextInput label="Note" value={f.note as string ?? ''} onChange={(v) => set('note', v)} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ num: '00', lab: 'Label' })}
            itemPreview={(s) => s.num}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.num ?? ''} onChange={(v) => u({ ...s, num: v })} />
                <TextInput label="Label" value={s.lab ?? ''} onChange={(v) => u({ ...s, lab: v })} />
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
                <ImageField label="Logo URL" value={l.url ?? ''} onChange={(v) => u({ ...l, url: v })} />
                <TextInput label="Label / slot text" value={l.label ?? ''} onChange={(v) => u({ ...l, label: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (red)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Kicker (before bold)" value={f.kickerPre as string ?? ''} onChange={(v) => set('kickerPre', v)} />
          <TextInput label="Kicker (bold)" value={f.kickerBold as string ?? ''} onChange={(v) => set('kickerBold', v)} />
          <Repeater<Card>
            label="Cited stats (3)"
            items={(f.cards as Card[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ big: '00%', claim: 'Claim.', srcName: 'Source', srcUrl: '' })}
            itemPreview={(c) => c.big}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Big number (red)" value={c.big ?? ''} onChange={(v) => u({ ...c, big: v })} />
                <Textarea label="Claim" value={c.claim ?? ''} onChange={(v) => u({ ...c, claim: v })} />
                <TextInput label="Source name" value={c.srcName ?? ''} onChange={(v) => u({ ...c, srcName: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (red)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Sub (before bold)" value={f.subPre as string ?? ''} onChange={(v) => set('subPre', v)} />
          <TextInput label="Sub (bold)" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub (after bold)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <TextInput label="Sub verify tag" value={f.subVerify as string ?? ''} onChange={(v) => set('subVerify', v)} />
          <TextInput label="Keep %" value={f.keepPct as string ?? ''} onChange={(v) => set('keepPct', v)} />
          <TextInput label="Keep label" value={f.keepLabel as string ?? ''} onChange={(v) => set('keepLabel', v)} />
          <TextInput label="Lost %" value={f.lostPct as string ?? ''} onChange={(v) => set('lostPct', v)} />
          <TextInput label="Lost label" value={f.lostLabel as string ?? ''} onChange={(v) => set('lostLabel', v)} />
          <TextInput label="Drivers title" value={f.driversTitle as string ?? ''} onChange={(v) => set('driversTitle', v)} />
          <Textarea label="Note" value={f.note as string ?? ''} onChange={(v) => set('note', v)} />
          <Repeater<Driver>
            label="Drivers (4)"
            items={(f.drivers as Driver[]) ?? []}
            onChange={(v) => set('drivers', v)}
            newItem={() => ({ stat: '00%', name: 'Driver', verify: '', desc: 'Description.' })}
            itemPreview={(d) => d.name}
            renderItem={(d, u) => (
              <div className="space-y-2">
                <TextInput label="Stat" value={d.stat ?? ''} onChange={(v) => u({ ...d, stat: v })} />
                <TextInput label="Name" value={d.name ?? ''} onChange={(v) => u({ ...d, name: v })} />
                <TextInput label="Verify tag (optional)" value={d.verify ?? ''} onChange={(v) => u({ ...d, verify: v })} />
                <Textarea label="Description" value={d.desc ?? ''} onChange={(v) => u({ ...d, desc: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Sub (before bold)" value={f.subPre as string ?? ''} onChange={(v) => set('subPre', v)} />
          <TextInput label="Sub (bold)" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Sub (after bold)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <TextInput label="Proof (before bold)" value={f.proofPre as string ?? ''} onChange={(v) => set('proofPre', v)} />
          <TextInput label="Proof (bold)" value={f.proofBold as string ?? ''} onChange={(v) => set('proofBold', v)} />
          <TextInput label="Proof (after bold)" value={f.proofTail as string ?? ''} onChange={(v) => set('proofTail', v)} />
          <Repeater<Item>
            label="Timeline items (5)"
            items={(f.items as Item[]) ?? []}
            onChange={(v) => set('items', v)}
            newItem={() => ({ num: '0', title: 'Stage', linePre: '', lineBold: 'Bold', lineTail: '.', impNone: 'Note' })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={it.num ?? ''} onChange={(v) => u({ ...it, num: v })} />
                <TextInput label="Title" value={it.title ?? ''} onChange={(v) => u({ ...it, title: v })} />
                <Textarea label="Line (before bold)" value={it.linePre ?? ''} onChange={(v) => u({ ...it, linePre: v })} />
                <TextInput label="Line (bold)" value={it.lineBold ?? ''} onChange={(v) => u({ ...it, lineBold: v })} />
                <TextInput label="Line (after bold)" value={it.lineTail ?? ''} onChange={(v) => u({ ...it, lineTail: v })} />
                <TextInput label="Impact number (blank if none)" value={it.impN ?? ''} onChange={(v) => u({ ...it, impN: v })} />
                <TextInput label="Impact key" value={it.impK ?? ''} onChange={(v) => u({ ...it, impK: v })} />
                <TextInput label="Impact 'none' note (if no number)" value={it.impNone ?? ''} onChange={(v) => u({ ...it, impNone: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Sub (before bold 1)" value={f.subPre as string ?? ''} onChange={(v) => set('subPre', v)} />
          <TextInput label="Sub bold 1" value={f.subBold1 as string ?? ''} onChange={(v) => set('subBold1', v)} />
          <TextInput label="Sub (middle)" value={f.subMid as string ?? ''} onChange={(v) => set('subMid', v)} />
          <TextInput label="Sub bold 2" value={f.subBold2 as string ?? ''} onChange={(v) => set('subBold2', v)} />
          <TextInput label="Sub (tail)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <Repeater<Card>
            label="Feature cards (4)"
            items={(f.cards as Card[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: 'target', title: 'Feature', descPre: '', descBold: 'Bold', descTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Icon (target | tasks | star | bars)" value={c.icon ?? ''} onChange={(v) => u({ ...c, icon: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <TextInput label="Desc (before bold)" value={c.descPre ?? ''} onChange={(v) => u({ ...c, descPre: v })} />
                <TextInput label="Desc (bold)" value={c.descBold ?? ''} onChange={(v) => u({ ...c, descBold: v })} />
                <TextInput label="Desc (after bold)" value={c.descTail ?? ''} onChange={(v) => u({ ...c, descTail: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-su-guarantee':
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Sub line 1" value={f.subLine1 as string ?? ''} onChange={(v) => set('subLine1', v)} />
          <Textarea label="Sub line 2" value={f.subLine2 as string ?? ''} onChange={(v) => set('subLine2', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
        </div>
      );


    case 'slick-mt-hero': {
      type Chip = { valPre: string; valAccent: string; lbl: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle (start)" value={f.subPre as string ?? ''} onChange={(v) => set('subPre', v)} />
          <TextInput label="Subtitle bold" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <Textarea label="Subtitle (tail)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Hero mockup URL" value={f.mockImageUrl as string ?? ''} onChange={(v) => set('mockImageUrl', v)} />
          <TextInput label="Hero image alt / placeholder" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '%', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Value" value={c.valPre ?? ''} onChange={(v) => u({ ...c, valPre: v })} />
                <TextInput label="Accent (teal suffix)" value={c.valAccent ?? ''} onChange={(v) => u({ ...c, valAccent: v })} />
                <TextInput label="Label" value={c.lbl ?? ''} onChange={(v) => u({ ...c, lbl: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.n ?? ''} onChange={(v) => u({ ...s, n: v })} />
                <TextInput label="Label" value={s.l ?? ''} onChange={(v) => u({ ...s, l: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<StatCite>
            label="Cited stats (3)"
            items={(f.stats as StatCite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim text.', src: 'Source' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Big number (coral)" value={s.big ?? ''} onChange={(v) => u({ ...s, big: v })} />
                <Textarea label="Claim" value={s.claim ?? ''} onChange={(v) => u({ ...s, claim: v })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (tail)" value={f.headingTail as string ?? ''} onChange={(v) => set('headingTail', v)} />
          <Textarea label="Body (before bold)" value={f.bodyPre as string ?? ''} onChange={(v) => set('bodyPre', v)} />
          <TextInput label="Body (bold)" value={f.bodyBold as string ?? ''} onChange={(v) => set('bodyBold', v)} />
          <Textarea label="Body (after bold)" value={f.bodyTail as string ?? ''} onChange={(v) => set('bodyTail', v)} />
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
          <ImageField label="Art image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt / placeholder" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );
    }

    case 'slick-mt-icards': {
      type ICard = { title: string; body: string; imageUrl?: string; imageAlt?: string; statV: string; statK: string; statSub: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<ICard>
            label="Impact cards (3)"
            items={(f.cards as ICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Card', body: 'Body text.', imageUrl: '', imageAlt: '', statV: '00%', statK: 'metric', statSub: 'detail' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body" value={c.body ?? ''} onChange={(v) => u({ ...c, body: v })} />
                <ImageField label="Viz image URL" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Image alt / placeholder" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <TextInput label="Stat value" value={c.statV ?? ''} onChange={(v) => u({ ...c, statV: v })} />
                <TextInput label="Stat key" value={c.statK ?? ''} onChange={(v) => u({ ...c, statK: v })} />
                <TextInput label="Stat sub" value={c.statSub ?? ''} onChange={(v) => u({ ...c, statSub: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal, new line)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<Tab>
            label="Tabs (4)"
            items={(f.tabs as Tab[]) ?? []}
            onChange={(v) => set('tabs', v)}
            newItem={() => ({ label: 'Tab', h3Pre: '', h3Accent: 'accent', body: 'Body.', big: '00%', bigLabel: 'label', imageUrl: '', imageAlt: '' })}
            itemPreview={(t) => t.label}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Tab label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
                <TextInput label="Panel heading (pre)" value={t.h3Pre ?? ''} onChange={(v) => u({ ...t, h3Pre: v })} />
                <TextInput label="Panel heading accent" value={t.h3Accent ?? ''} onChange={(v) => u({ ...t, h3Accent: v })} />
                <Textarea label="Panel body" value={t.body ?? ''} onChange={(v) => u({ ...t, body: v })} />
                <TextInput label="Big number" value={t.big ?? ''} onChange={(v) => u({ ...t, big: v })} />
                <TextInput label="Big number label" value={t.bigLabel ?? ''} onChange={(v) => u({ ...t, bigLabel: v })} />
                <ImageField label="Panel image URL" value={t.imageUrl ?? ''} onChange={(v) => u({ ...t, imageUrl: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Body (before bold)" value={f.bodyPre as string ?? ''} onChange={(v) => set('bodyPre', v)} />
          <Textarea label="Body (bold)" value={f.bodyBold as string ?? ''} onChange={(v) => set('bodyBold', v)} />
          <Textarea label="Body (after bold)" value={f.bodyTail as string ?? ''} onChange={(v) => set('bodyTail', v)} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<FCard>
            label="Feature cards (3)"
            items={(f.cards as FCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', imageAlt: '', title: 'Feature', descPre: '', descBold: 'Bold', descTail: '.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail image URL" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Image alt / placeholder" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Desc (before bold)" value={c.descPre ?? ''} onChange={(v) => u({ ...c, descPre: v })} />
                <TextInput label="Desc (bold)" value={c.descBold ?? ''} onChange={(v) => u({ ...c, descBold: v })} />
                <Textarea label="Desc (after bold)" value={c.descTail ?? ''} onChange={(v) => u({ ...c, descTail: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<PCard>
            label="Proof cards (3)"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Card', bodyPre: '', bodyBold: 'Bold', bodyTail: '.', pairV: '00%', pairK: 'metric' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body (before bold)" value={c.bodyPre ?? ''} onChange={(v) => u({ ...c, bodyPre: v })} />
                <TextInput label="Body (bold)" value={c.bodyBold ?? ''} onChange={(v) => u({ ...c, bodyBold: v })} />
                <Textarea label="Body (after bold)" value={c.bodyTail ?? ''} onChange={(v) => u({ ...c, bodyTail: v })} />
                <TextInput label="Stat value" value={c.pairV ?? ''} onChange={(v) => u({ ...c, pairV: v })} />
                <TextInput label="Stat key" value={c.pairK ?? ''} onChange={(v) => u({ ...c, pairK: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-mt-trust': {
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (coral)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (tail)" value={f.headingTail as string ?? ''} onChange={(v) => set('headingTail', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<UPCard>
            label="Stat cards"
            items={(f.cards as UPCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ big: '00%', claim: 'New cited stat', srcLabel: 'Source', srcUrl: '' })}
            itemPreview={(c) => `${c.big ?? ''} — ${c.claim ?? '(empty)'}`}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Big figure" value={c.big ?? ''} onChange={(v) => u({ ...c, big: v })} />
                <Textarea label="Claim" value={c.claim ?? ''} onChange={(v) => u({ ...c, claim: v })} />
                <TextInput label="Source label" value={c.srcLabel ?? ''} onChange={(v) => u({ ...c, srcLabel: v })} />
                <TextInput label="Source URL" value={c.srcUrl ?? ''} onChange={(v) => u({ ...c, srcUrl: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Textarea label="Kicker (before bold)" value={f.kickerPre as string ?? ''} onChange={(v) => set('kickerPre', v)} />
          <TextInput label="Kicker (bold end)" value={f.kickerBold as string ?? ''} onChange={(v) => set('kickerBold', v)} />
        </div>
      );
    }

    case 'slick-ud-timeline': {
      type UTBullet = { lead?: string; rest?: string };
      type UTItem = { num?: string; title?: string; benefit?: string; bullets?: UTBullet[] };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (tail)" value={f.headingTail as string ?? ''} onChange={(v) => set('headingTail', v)} />
          <TextInput label="Subtitle (pre)" value={f.subPre as string ?? ''} onChange={(v) => set('subPre', v)} />
          <TextInput label="Subtitle (bold)" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <Textarea label="Subtitle (tail — [VERIFY: x] allowed)" value={f.subTail as string ?? ''} onChange={(v) => set('subTail', v)} />
          <Textarea label="Proof line ([VERIFY: x] allowed)" value={f.proof as string ?? ''} onChange={(v) => set('proof', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<UTItem>
            label="Stages"
            items={(f.items as UTItem[]) ?? []}
            onChange={(v) => set('items', v)}
            newItem={() => ({ num: '0', title: 'New stage', benefit: 'Benefit', bullets: [] })}
            itemPreview={(it) => `${it.num ?? ''}. ${it.title ?? '(stage)'}`}
            renderItem={(it, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={it.num ?? ''} onChange={(v) => u({ ...it, num: v })} />
                <TextInput label="Title" value={it.title ?? ''} onChange={(v) => u({ ...it, title: v })} />
                <TextInput label="Benefit pill" value={it.benefit ?? ''} onChange={(v) => u({ ...it, benefit: v })} />
                <Repeater<UTBullet>
                  label="Bullets"
                  items={it.bullets ?? []}
                  onChange={(v) => u({ ...it, bullets: v })}
                  newItem={() => ({ lead: 'Lead:', rest: ' detail' })}
                  itemPreview={(b) => `${b.lead ?? ''}${b.rest ?? ''}`.trim() || '(bullet)'}
                  renderItem={(b, ub) => (
                    <div className="space-y-2">
                      <TextInput label="Lead (bold)" value={b.lead ?? ''} onChange={(v) => ub({ ...b, lead: v })} />
                      <Textarea label="Rest" value={b.rest ?? ''} onChange={(v) => ub({ ...b, rest: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (tail)" value={f.headingTail as string ?? ''} onChange={(v) => set('headingTail', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<UICard>
            label="Module cards"
            items={(f.cards as UICard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'New module', benefit: 'Benefit', bodyPre: '', bodyBold: '', bodyTail: '', imageUrl: '', imageAlt: '' })}
            itemPreview={(c) => c.title || '(card)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <TextInput label="Benefit pill" value={c.benefit ?? ''} onChange={(v) => u({ ...c, benefit: v })} />
                <Textarea label="Body (before bold)" value={c.bodyPre ?? ''} onChange={(v) => u({ ...c, bodyPre: v })} />
                <TextInput label="Body (bold)" value={c.bodyBold ?? ''} onChange={(v) => u({ ...c, bodyBold: v })} />
                <Textarea label="Body (tail — [VERIFY: x] allowed)" value={c.bodyTail ?? ''} onChange={(v) => u({ ...c, bodyTail: v })} />
                <ImageField label="Card image" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Image alt / placeholder caption" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
              </div>
            )}
          />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Textarea label="Footer note (before bold)" value={f.notePre as string ?? ''} onChange={(v) => set('notePre', v)} />
          <TextInput label="Footer note (bold)" value={f.noteBold as string ?? ''} onChange={(v) => set('noteBold', v)} />
          <Textarea label="Footer note (tail)" value={f.noteTail as string ?? ''} onChange={(v) => set('noteTail', v)} />
        </div>
      );
    }


    case 'slick-sn-hero': {
      type Chip = { valPre: string; valAccent: string; lbl: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <Textarea label="Subtitle (before bold)" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="Subtitle (bold end)" value={f.subBold as string ?? ''} onChange={(v) => set('subBold', v)} />
          <TextInput label="Primary CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Primary CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <ImageField label="Phone mockup URL" value={f.mockImageUrl as string ?? ''} onChange={(v) => set('mockImageUrl', v)} />
          <TextInput label="Mockup alt" value={f.mockImageAlt as string ?? ''} onChange={(v) => set('mockImageAlt', v)} />
          <Repeater<Chip>
            label="Floating chips (4)"
            items={(f.chips as Chip[]) ?? []}
            onChange={(v) => set('chips', v)}
            newItem={() => ({ valPre: '00', valAccent: '+', lbl: 'Metric' })}
            itemPreview={(c) => c.lbl}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Value" value={c.valPre ?? ''} onChange={(v) => u({ ...c, valPre: v })} />
                <TextInput label="Accent (teal)" value={c.valAccent ?? ''} onChange={(v) => u({ ...c, valAccent: v })} />
                <TextInput label="Label" value={c.lbl ?? ''} onChange={(v) => u({ ...c, lbl: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<Stat>
            label="Stats (4)"
            items={(f.stats as Stat[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ n: '00', l: 'Label' })}
            itemPreview={(s) => s.n}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.n ?? ''} onChange={(v) => u({ ...s, n: v })} />
                <TextInput label="Label" value={s.l ?? ''} onChange={(v) => u({ ...s, l: v })} />
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
          <TextInput label="Pill (red)" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (red)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <Repeater<Cite>
            label="Cited stats (3)"
            items={(f.stats as Cite[]) ?? []}
            onChange={(v) => set('stats', v)}
            newItem={() => ({ big: '00%', claim: 'Claim.', srcName: 'Source', srcUrl: '' })}
            itemPreview={(s) => s.big}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Big number (red)" value={s.big ?? ''} onChange={(v) => u({ ...s, big: v })} />
                <Textarea label="Claim" value={s.claim ?? ''} onChange={(v) => u({ ...s, claim: v })} />
                <TextInput label="Source name" value={s.srcName ?? ''} onChange={(v) => u({ ...s, srcName: v })} />
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
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <ImageField label="Image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <Repeater<Step>
            label="Steps (4)"
            items={(f.steps as Step[]) ?? []}
            onChange={(v) => set('steps', v)}
            newItem={() => ({ num: '0', title: 'Step', desc: 'Description.' })}
            itemPreview={(s) => s.title}
            renderItem={(s, u) => (
              <div className="space-y-2">
                <TextInput label="Number" value={s.num ?? ''} onChange={(v) => u({ ...s, num: v })} />
                <TextInput label="Title" value={s.title ?? ''} onChange={(v) => u({ ...s, title: v })} />
                <Textarea label="Description" value={s.desc ?? ''} onChange={(v) => u({ ...s, desc: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sn-features': {
      type FCard = { imageUrl?: string; imageAlt?: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<FCard>
            label="Feature cards (3)"
            items={(f.cards as FCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ imageUrl: '', title: 'Feature', desc: 'Description.' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Thumbnail URL" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Image alt" value={c.imageAlt ?? ''} onChange={(v) => u({ ...c, imageAlt: v })} />
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Description" value={c.desc ?? ''} onChange={(v) => u({ ...c, desc: v })} />
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-sn-spotlight': {
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <TextInput label="Body (bold lead)" value={f.bodyBold as string ?? ''} onChange={(v) => set('bodyBold', v)} />
          <Textarea label="Body (rest)" value={f.bodyRest as string ?? ''} onChange={(v) => set('bodyRest', v)} />
          <ImageField label="Image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Textarea label="Body (before bold 1)" value={f.bodyPre as string ?? ''} onChange={(v) => set('bodyPre', v)} />
          <TextInput label="Body bold 1" value={f.bodyBold1 as string ?? ''} onChange={(v) => set('bodyBold1', v)} />
          <Textarea label="Body (middle)" value={f.bodyMid as string ?? ''} onChange={(v) => set('bodyMid', v)} />
          <TextInput label="Body bold 2" value={f.bodyBold2 as string ?? ''} onChange={(v) => set('bodyBold2', v)} />
          <TextInput label="Body (tail)" value={f.bodyTail as string ?? ''} onChange={(v) => set('bodyTail', v)} />
          <ImageField label="Image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
        </div>
      );

    case 'slick-sn-recovery': {
      type Pt = { ic: string; title: string; desc: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (pre)" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Heading (post)" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtitle" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <ImageField label="Image URL" value={f.imageUrl as string ?? ''} onChange={(v) => set('imageUrl', v)} />
          <TextInput label="Image alt" value={f.imageAlt as string ?? ''} onChange={(v) => set('imageAlt', v)} />
          <Repeater<Pt>
            label="Recovery points (4)"
            items={(f.points as Pt[]) ?? []}
            onChange={(v) => set('points', v)}
            newItem={() => ({ ic: '0', title: 'Scenario', desc: 'Description.' })}
            itemPreview={(p) => p.title}
            renderItem={(p, u) => (
              <div className="space-y-2">
                <TextInput label="Icon/number" value={p.ic ?? ''} onChange={(v) => u({ ...p, ic: v })} />
                <TextInput label="Title" value={p.title ?? ''} onChange={(v) => u({ ...p, title: v })} />
                <Textarea label="Description" value={p.desc ?? ''} onChange={(v) => u({ ...p, desc: v })} />
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
          <TextInput label="Pill" value={f.pill as string ?? ''} onChange={(v) => set('pill', v)} />
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <Repeater<PCard>
            label="Proof cards (3)"
            items={(f.cards as PCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ title: 'Outcome', body: 'Description.', statValue: '[Vx]', statKey: 'Metric' })}
            itemPreview={(c) => c.title}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Body" value={c.body ?? ''} onChange={(v) => u({ ...c, body: v })} />
                <TextInput label="Stat value (e.g. [V1] or +18%)" value={c.statValue ?? ''} onChange={(v) => u({ ...c, statValue: v })} />
                <TextInput label="Stat key" value={c.statKey ?? ''} onChange={(v) => u({ ...c, statKey: v })} />
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
