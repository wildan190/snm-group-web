import type { PageData } from "@/types/pageTypes";

type SiteLike = {
  companyName?: string;
  description?: string;
};

type SeoMeta = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  schema?: Record<string, unknown> | null;
};

function upsertMetaTag(attr: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function upsertJsonLd(schema: Record<string, unknown> | null | undefined) {
  const id = "app-jsonld";
  const existing = document.getElementById(id);
  if (!schema) {
    if (existing) existing.remove();
    return;
  }

  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

function toAbsoluteUrl(input?: string): string | undefined {
  if (!input) return undefined;
  try {
    return new URL(input, window.location.origin).toString();
  } catch {
    return undefined;
  }
}

function parseCustomJson(input?: string): Record<string, unknown> | null {
  if (!input?.trim()) return null;
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function buildSchema(
  page: PageData,
  site: SiteLike,
  canonical: string,
  ogImage?: string,
): Record<string, unknown> | null {
  const custom = parseCustomJson(page.schemaCustomJson);
  const siteName = site.companyName || "Website";
  const pageName = page.seoTitle || page.title || siteName;
  const pageDescription = page.seoDescription || site.description || "";

  if (page.schemaType === "organization") {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: window.location.origin,
      logo: ogImage,
      description: site.description || pageDescription,
      ...custom,
    };
  }

  if (page.schemaType === "website") {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: window.location.origin,
      description: site.description || pageDescription,
      ...custom,
    };
  }

  if (page.schemaType === "product") {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: pageName,
      description: pageDescription,
      image: ogImage ? [ogImage] : undefined,
      brand: { "@type": "Brand", name: siteName },
      url: canonical,
      ...custom,
    };
  }

  if (page.schemaType === "aboutus") {
    return {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: pageName,
      description: pageDescription,
      url: canonical,
      about: {
        "@type": "Organization",
        name: siteName,
      },
      ...custom,
    };
  }

  return null;
}

export function applySeo(meta: SeoMeta) {
  document.title = meta.title;
  upsertMetaTag("name", "description", meta.description);
  upsertMetaTag("property", "og:title", meta.ogTitle);
  upsertMetaTag("property", "og:description", meta.ogDescription);
  upsertMetaTag("property", "og:type", "website");
  upsertMetaTag("property", "og:url", meta.canonical);
  upsertMetaTag("name", "twitter:card", meta.ogImage ? "summary_large_image" : "summary");
  upsertMetaTag("name", "twitter:title", meta.ogTitle);
  upsertMetaTag("name", "twitter:description", meta.ogDescription);
  
  if (meta.ogImage) {
    upsertMetaTag("property", "og:image", meta.ogImage);
    upsertMetaTag("name", "twitter:image", meta.ogImage);
  } else {
    // If no specific image, we could potentially remove the tag or use a site-wide placeholder.
    // However, applySeoFromPage will now ensure a fallback exists.
    const existingOg = document.head.querySelector("meta[property='og:image']");
    const existingTw = document.head.querySelector("meta[name='twitter:image']");
    if (existingOg) existingOg.remove();
    if (existingTw) existingTw.remove();
  }
  
  upsertCanonical(meta.canonical);
  upsertJsonLd(meta.schema);
}

export function applySeoFromPage(
  page: PageData,
  site: SiteLike,
  pathName: string,
  fallbackImage?: string,
) {
  const title = page.seoTitle?.trim() || page.title?.trim() || site.companyName || "Website";
  const description = page.seoDescription?.trim() || site.description || "";
  const canonical = toAbsoluteUrl(page.canonicalUrl) || new URL(pathName, window.location.origin).toString();
  const ogTitle = page.ogTitle?.trim() || title;
  const ogDescription = page.ogDescription?.trim() || description;
  
  // page.ogImageUrl is now populated as absolute URL by the backend if ogImageAssetId is set
  let ogImage = toAbsoluteUrl(page.ogImageUrl) || toAbsoluteUrl(fallbackImage);
  
  const schema = buildSchema(page, site, canonical, ogImage);

  applySeo({
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    schema,
  });
}
