export type Portal = "cokeworld" | "platform" | "experience";

export const PORTALS: { value: Portal; label: string; subtitle: string }[] = [
  {
    value: "cokeworld",
    label: "Coke",
    subtitle: "Colours and marketplace banner for the Coke platform portal",
  },
  { value: "platform", label: "Platform", subtitle: "Marketplace banner for the platform portal" },
  {
    value: "experience",
    label: "Experience",
    subtitle: "Marketplace banner for the experience portal",
  },
];

// The backend requires both colours for every portal; non-Coke portals fall back to these.
export const TEAL_ACCENT = "#0D9488";
export const TEAL_ACCENT_DARK = "#0F766E";

export interface BannerForm {
  enabled: boolean;
  image: string;
  headline: string;
  highlights: string[];
  tagline: string;
}

export interface PortalBranding {
  accent: string;
  accentDark: string;
  banner?: {
    enabled?: boolean;
    image?: string;
    headline?: string;
    highlights?: string[];
    tagline?: string;
  };
}

export function buildBrandingPayload(
  portal: Portal,
  formColours: { accent: string; accentDark: string },
  stored: { accent?: string; accentDark?: string } | null | undefined,
  b: BannerForm,
): PortalBranding {
  const coke = portal === "cokeworld";
  return {
    accent: coke ? formColours.accent : stored?.accent || TEAL_ACCENT,
    accentDark: coke ? formColours.accentDark : stored?.accentDark || TEAL_ACCENT_DARK,
    banner: {
      enabled: b.enabled,
      ...(b.image && { image: b.image }),
      ...(b.headline.trim() && { headline: b.headline.trim() }),
      ...(b.highlights.some((h) => h.trim()) && {
        highlights: b.highlights.map((h) => h.trim()).filter(Boolean),
      }),
      ...(b.tagline.trim() && { tagline: b.tagline.trim() }),
    },
  };
}

// Save replaces the whole stored object, so only allow it once the selected portal's branding has loaded.
export function canSaveBranding(s: {
  loading: boolean;
  loadError: boolean;
  loadedPortal: Portal | null;
  selectedPortal: Portal;
}): boolean {
  return !s.loading && !s.loadError && s.loadedPortal === s.selectedPortal;
}
