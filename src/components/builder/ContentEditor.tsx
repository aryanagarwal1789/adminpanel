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
          <TextInput label="Heading accent (teal bold)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Bottom captions (separated by ·)</div>
          <TextInput label="Caption 1" value={f.cap1 as string ?? ''} onChange={(v) => set('cap1', v)} />
          <TextInput label="Caption 2" value={f.cap2 as string ?? ''} onChange={(v) => set('cap2', v)} />
          <TextInput label="Caption 3" value={f.cap3 as string ?? ''} onChange={(v) => set('cap3', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<{ image: string; alt: string }>
            label="Screenshot cards"
            items={(f.cards as { image: string; alt: string }[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ image: '', alt: 'App screenshot' })}
            itemPreview={(it) => it.alt || 'Screenshot'}
            renderItem={(it, u) => (
              <>
                <ImageField label="Screenshot image URL" value={it.image} onChange={(x) => u({ ...it, image: x })} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
        </div>
      );

    case 'slick-dv-agent':
    case 'slick-dv-split':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (plain)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal bold)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <TextInput label="Body text" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA href" value={f.ctaHref as string ?? ''} onChange={(v) => set('ctaHref', v)} />
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Layout</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => set('reversed', false)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', background: !(f.reversed as boolean) ? '#0ea5e9' : '#1e293b', color: '#f1f5f9', fontSize: 12, cursor: 'pointer' }}>Text left</button>
              <button onClick={() => set('reversed', true)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', background: (f.reversed as boolean) ? '#0ea5e9' : '#1e293b', color: '#f1f5f9', fontSize: 12, cursor: 'pointer' }}>Text right</button>
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Heading accent position</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => set('accentFirst', false)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', background: !(f.accentFirst as boolean) ? '#0ea5e9' : '#1e293b', color: '#f1f5f9', fontSize: 12, cursor: 'pointer' }}>Plain → Teal</button>
              <button onClick={() => set('accentFirst', true)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', background: (f.accentFirst as boolean) ? '#0ea5e9' : '#1e293b', color: '#f1f5f9', fontSize: 12, cursor: 'pointer' }}>Teal → Plain</button>
            </div>
          </div>
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
        </div>
      );

    case 'slick-dv-who': {
      type WhoCard = { icon?: string; title?: string; description?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading (plain)" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Heading accent (teal)" value={f.headingAccent as string ?? ''} onChange={(v) => set('headingAccent', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<WhoCard>
            label="Cards"
            items={(f.cards as WhoCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ icon: 'brands', title: 'New card', description: 'Description here.' })}
            itemPreview={(c) => c.title || '(empty)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <TextInput label="Title" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <TextInput label="Description" value={c.description ?? ''} onChange={(v) => u({ ...c, description: v })} />
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Icon</span>
                  <div className="grid grid-cols-2 gap-1">
                    {(['brands','distributors','retailers','apps'] as const).map(k => (
                      <button key={k} onClick={() => u({ ...c, icon: k })} style={{ padding: '5px 8px', borderRadius: 5, border: '1px solid #334155', background: c.icon === k ? '#0ea5e9' : '#1e293b', color: '#f1f5f9', fontSize: 11, cursor: 'pointer', textTransform: 'capitalize' }}>{k}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      );
    }

    case 'slick-dv-register':
      return (
        <div className="space-y-4">
          <TextInput label="Heading" value={f.heading as string ?? ''} onChange={(v) => set('heading', v)} />
          <TextInput label="Body text" value={f.body as string ?? ''} onChange={(v) => set('body', v)} />
          <TextInput label="Form title" value={f.formTitle as string ?? ''} onChange={(v) => set('formTitle', v)} />
          <TextInput label="Form subtext" value={f.formSubtext as string ?? ''} onChange={(v) => set('formSubtext', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="Privacy URL" value={f.privacyUrl as string ?? ''} onChange={(v) => set('privacyUrl', v)} />
          <TextInput label="API endpoint (POST)" value={f.apiEndpoint as string ?? ''} onChange={(v) => set('apiEndpoint', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<string>
            label="Rotating words (teal)"
            items={(f.rotatorWords as string[]) ?? []}
            onChange={(v) => set('rotatorWords', v)}
            newItem={() => 'New word'}
            itemPreview={(s) => s || '(empty)'}
            renderItem={(s, u) => <TextInput label="Word" value={s} onChange={u} />}
          />
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
        </div>
      );

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

    case 'slick-sfa-insights': {
      type InsightCard = { logoText?: string; logoSub?: string; logoColor?: string; logoItalic?: boolean; imageUrl?: string; title?: string; detail?: string; brand?: string };
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient (teal)" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <Textarea label="Lead paragraph" value={f.lead as string ?? ''} onChange={(v) => set('lead', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <Repeater<InsightCard>
            label="Cards"
            items={(f.cards as InsightCard[]) ?? []}
            onChange={(v) => set('cards', v)}
            newItem={() => ({ logoText: 'Brand', logoSub: '', logoColor: '#082B4B', logoItalic: false, imageUrl: '', title: 'Insight headline', detail: 'Insight detail text here.', brand: 'Brand Name' })}
            itemPreview={(c) => c.brand || c.logoText || '(unnamed)'}
            renderItem={(c, u) => (
              <div className="space-y-2">
                <ImageField label="Logo image (overrides text)" value={c.imageUrl ?? ''} onChange={(v) => u({ ...c, imageUrl: v })} />
                <TextInput label="Logo text (fallback)" value={c.logoText ?? ''} onChange={(v) => u({ ...c, logoText: v })} />
                <TextInput label="Logo sub-text" value={c.logoSub ?? ''} onChange={(v) => u({ ...c, logoSub: v })} />
                <ColorPicker label="Logo text color" value={c.logoColor ?? '#082B4B'} onChange={(v) => u({ ...c, logoColor: v })} />
                <TextInput label="Front headline" value={c.title ?? ''} onChange={(v) => u({ ...c, title: v })} />
                <Textarea label="Back detail text" value={c.detail ?? ''} onChange={(v) => u({ ...c, detail: v })} />
                <TextInput label="Back brand name" value={c.brand ?? ''} onChange={(v) => u({ ...c, brand: v })} />
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

    case 'slick-dms-features': {
      type DmsFTab = { label?: string; panelPre?: string; panelAccent?: string; panelLede?: string; bandText?: string; ctaLabel?: string; ctaUrl?: string; };
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
            newItem={() => ({ label: 'New Tab', panelPre: 'Panel', panelAccent: 'Title', panelLede: 'Description.', bandText: 'Outcome claim.', ctaLabel: 'Get a demo', ctaUrl: '/contact-us/' })}
            itemPreview={(t) => t.label || '(untitled)'}
            renderItem={(t, u) => (
              <div className="space-y-2">
                <TextInput label="Tab label" value={t.label ?? ''} onChange={(v) => u({ ...t, label: v })} />
                <TextInput label="Panel title prefix" value={t.panelPre ?? ''} onChange={(v) => u({ ...t, panelPre: v })} />
                <TextInput label="Panel title accent" value={t.panelAccent ?? ''} onChange={(v) => u({ ...t, panelAccent: v })} />
                <TextInput label="Panel description" value={t.panelLede ?? ''} onChange={(v) => u({ ...t, panelLede: v })} />
                <TextInput label="Outcome band text" value={t.bandText ?? ''} onChange={(v) => u({ ...t, bandText: v })} />
                <TextInput label="CTA label" value={t.ctaLabel ?? ''} onChange={(v) => u({ ...t, ctaLabel: v })} />
                <TextInput label="CTA URL" value={t.ctaUrl ?? ''} onChange={(v) => u({ ...t, ctaUrl: v })} />
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
      type DmsAgtItem = { name?: string; lede?: string; benefits?: string[] };
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
                <Textarea label="Short description" value={a.lede ?? ''} onChange={(v) => u({ ...a, lede: v })} />
                <TextInput label="Benefit 1" value={(a.benefits as string[] | undefined)?.[0] ?? ''} onChange={(v) => u({ ...a, benefits: [v, ...((a.benefits as string[] | undefined ?? []).slice(1))] })} />
                <TextInput label="Benefit 2" value={(a.benefits as string[] | undefined)?.[1] ?? ''} onChange={(v) => u({ ...a, benefits: [((a.benefits as string[] | undefined ?? [])[0]) ?? '', v] })} />
              </div>
            )}
          />
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

    case 'slick-dms-guarantee':
      return (
        <div className="space-y-4">
          <TextInput label="Heading" value={f.title as string ?? ''} onChange={(v) => set('title', v)} />
          <Textarea label="Body copy" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
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
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="Ghost CTA label" value={f.ctaGhostLabel as string ?? ''} onChange={(v) => set('ctaGhostLabel', v)} />
          <TextInput label="Ghost CTA URL" value={f.ctaGhostUrl as string ?? ''} onChange={(v) => set('ctaGhostUrl', v)} />
          <TextInput label="Trust text" value={f.trustText as string ?? ''} onChange={(v) => set('trustText', v)} />
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
        </div>
      );

    case 'slick-eb2b-features':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
        </div>
      );

    case 'slick-eb2b-integrations':
      return (
        <div className="space-y-4">
          <TextInput label="Pill badge text" value={f.pillText as string ?? ''} onChange={(v) => set('pillText', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Body copy" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
        </div>
      );

    case 'slick-eb2b-impact':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
        </div>
      );

    case 'slick-eb2b-deployments':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient" value={f.headingGrad as string ?? ''} onChange={(v) => set('headingGrad', v)} />
          <Textarea label="Body copy" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
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
        </div>
      );

    case 'slick-ab-founder-banner':
      return (
        <div className="space-y-4">
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading bold" value={f.headingBold as string ?? ''} onChange={(v) => set('headingBold', v)} />
          <TextInput label="Heading suffix" value={f.headingPost as string ?? ''} onChange={(v) => set('headingPost', v)} />
          <Textarea label="Subtext" value={f.sub as string ?? ''} onChange={(v) => set('sub', v)} />
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

    case 'slick-sc-navbar':
      return (
        <div className="space-y-4">
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

    case 'slick-offices':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow" value={f.eyebrow as string ?? ''} onChange={(v) => set('eyebrow', v)} />
          <TextInput label="Heading line 1" value={f.headingLine1 as string ?? ''} onChange={(v) => set('headingLine1', v)} />
          <TextInput label="Heading line 2 prefix" value={f.headingLine2Pre as string ?? ''} onChange={(v) => set('headingLine2Pre', v)} />
          <TextInput label="Heading line 2 gradient" value={f.headingLine2Grad as string ?? ''} onChange={(v) => set('headingLine2Grad', v)} />
          <TextInput label="LinkedIn URL" value={f.linkedinUrl as string ?? ''} onChange={(v) => set('linkedinUrl', v)} />
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
        </div>
      );

    case 'slick-sc-video-showcase':
      return (
        <div className="space-y-4">
          <TextInput label="Eyebrow label" value={f.eyebrowLabel as string ?? ''} onChange={(v) => set('eyebrowLabel', v)} />
          <TextInput label="Heading prefix" value={f.headingPre as string ?? ''} onChange={(v) => set('headingPre', v)} />
          <TextInput label="Heading gradient word(s)" value={f.headingGradient as string ?? ''} onChange={(v) => set('headingGradient', v)} />
          <TextInput label="Heading suffix" value={f.headingSuffix as string ?? ''} onChange={(v) => set('headingSuffix', v)} />
          <TextInput label="Subtitle" value={f.subtitle as string ?? ''} onChange={(v) => set('subtitle', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="Chrome bar label" value={f.barLabel as string ?? ''} onChange={(v) => set('barLabel', v)} />
          <TextInput label="Screen caption" value={f.caption as string ?? ''} onChange={(v) => set('caption', v)} />
          <ImageField label="Thumbnail (poster image)" value={f.thumbnailUrl as string ?? ''} onChange={(v) => set('thumbnailUrl', v)} />
          <TextInput label="Video URL (.mp4 / Vimeo / YouTube embed) — clears placeholder" value={f.videoUrl as string ?? ''} onChange={(v) => set('videoUrl', v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <TextInput label="CTA label" value={f.ctaLabel as string ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <TextInput label="CTA URL" value={f.ctaUrl as string ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <TextInput label="CTA note" value={f.ctaNote as string ?? ''} onChange={(v) => set('ctaNote', v)} />
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
