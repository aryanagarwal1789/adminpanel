import { useState } from "react";
import { Plus } from "lucide-react";
import {
  ButtonEditor, ImageField, LinkItemEditor, NumberInput, Repeater, TextInput, Textarea, Toggle,
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
}

const newLink = (): LinkField => ({ label: "New link", url: "#" });
const linkPreview = (l: LinkField) => l.label;

function renderBlockFields(
  block: Block,
  f: FieldsOf,
  set: (k: string, v: unknown) => void,
  update: (patch: FieldsOf) => void,
  openWidgetPicker: Props["openWidgetPicker"],
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
        </div>
      );

    case "impact-salescode":
      return (
        <div className="space-y-4">
          <Textarea label="Title" value={f.title as string} onChange={(v) => set("title", v)} />
          <TextInput label="Video URL" value={f.videoUrl as string} onChange={(v) => set("videoUrl", v)} />
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
                <TextInput label="Image URL" value={it.url} onChange={(x) => u({ ...it, url: x })} />
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
          <TextInput label="Video URL" value={f.videoUrl as string} onChange={(v) => set("videoUrl", v)} />
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

    case "layout":
      return <LayoutEditor block={block} update={update} openWidgetPicker={openWidgetPicker} />;
    default:
      return null;
  }
}

export function ContentEditor({ block, update, openWidgetPicker }: Props) {
  const f = block.fields as FieldsOf;
  const set = (k: string, v: unknown) => update({ [k]: v });
  const [openWidgetId, setOpenWidgetId] = useState<string | null>(null);

  const mainFields = renderBlockFields(block, f, set, update, openWidgetPicker);

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
