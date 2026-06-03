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
          <Repeater<{ tag: string; headline: string; headlineAccent: string; description: string; ctaLabel: string; ctaHref: string; imageUrl: string }>
            label="Rows"
            items={(f.rows as { tag: string; headline: string; headlineAccent: string; description: string; ctaLabel: string; ctaHref: string; imageUrl: string }[]) ?? []}
            onChange={(v) => set('rows', v)}
            newItem={() => ({ tag: 'NEW', headline: 'New', headlineAccent: 'feature', description: 'Description.', ctaLabel: 'Learn more →', ctaHref: '#', imageUrl: '' })}
            itemPreview={(it) => `${it.tag}: ${it.headline}`}
            renderItem={(it, u) => (
              <>
                <TextInput label="Tag chip" value={it.tag} onChange={(x) => u({ ...it, tag: x })} />
                <TextInput label="Headline" value={it.headline} onChange={(x) => u({ ...it, headline: x })} />
                <TextInput label="Headline accent" value={it.headlineAccent} onChange={(x) => u({ ...it, headlineAccent: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
                <TextInput label="CTA label" value={it.ctaLabel} onChange={(x) => u({ ...it, ctaLabel: x })} />
                <ImageField label="Image URL" value={it.imageUrl} onChange={(x) => u({ ...it, imageUrl: x })} />
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
          <Repeater<{ name: string; description: string; monthlyPrice: number; annualPrice: number; ctaLabel: string; ctaHref: string; highlighted: boolean; badge: string }>
            label="Plans"
            items={(f.plans as { name: string; description: string; monthlyPrice: number; annualPrice: number; ctaLabel: string; ctaHref: string; highlighted: boolean; badge: string }[]) ?? []}
            onChange={(v) => set('plans', v)}
            newItem={() => ({ name: 'New plan', description: 'Plan description.', monthlyPrice: 0, annualPrice: 0, ctaLabel: 'Get started', ctaHref: '#', highlighted: false, badge: '' })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <TextInput label="Plan name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
                <TextInput label="CTA label" value={it.ctaLabel} onChange={(x) => u({ ...it, ctaLabel: x })} />
                <TextInput label="CTA href" value={it.ctaHref} onChange={(x) => u({ ...it, ctaHref: x })} />
                <TextInput label="Badge (e.g. Most popular)" value={it.badge ?? ''} onChange={(x) => u({ ...it, badge: x })} />
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
          <Repeater<{ quote: string; name: string; role: string; company: string; avatarUrl: string }>
            label="Testimonials"
            items={(f.testimonials as { quote: string; name: string; role: string; company: string; avatarUrl: string }[]) ?? []}
            onChange={(v) => set('testimonials', v)}
            newItem={() => ({ quote: 'Add your testimonial here.', name: 'Name', role: 'Role', company: 'Company', avatarUrl: '' })}
            itemPreview={(it) => it.name}
            renderItem={(it, u) => (
              <>
                <Textarea label="Quote" value={it.quote} onChange={(x) => u({ ...it, quote: x })} />
                <TextInput label="Name" value={it.name} onChange={(x) => u({ ...it, name: x })} />
                <TextInput label="Role" value={it.role} onChange={(x) => u({ ...it, role: x })} />
                <TextInput label="Company" value={it.company} onChange={(x) => u({ ...it, company: x })} />
                <ImageField label="Avatar URL" value={it.avatarUrl} onChange={(x) => u({ ...it, avatarUrl: x })} />
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
          <Repeater<{ category: string; question: string; answer: string }>
            label="FAQ items"
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
          <Repeater<{ coverUrl: string; tag: string; title: string; excerpt: string; authorName: string; date: string; href: string }>
            label="Blog posts"
            items={(f.posts as { coverUrl: string; tag: string; title: string; excerpt: string; authorName: string; date: string; href: string }[]) ?? []}
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
          <TextInput label="Copyright" value={f.copyright as string ?? ''} onChange={(v) => set('copyright', v)} />
          <TextInput label="Accent color (override buttons/highlights)" value={(f.accentColor as string) ?? ''} onChange={(v) => set('accentColor', v)} />
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
