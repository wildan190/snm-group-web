export type PageBlock =
  | {
      type: "hero";
      title: string;
      subtitle: string;
      content: string;
      layout?: "centered" | "left" | "right" | "background";
      backgroundImageAssetId?: string;
      imageAssetId?: string;
      ctaText?: string;
      ctaUrl?: string;
      id: number;
    }
  | {
      type: "text";
      title: string;
      content: string;
      id: number;
    }
  | {
      type: "image";
      caption: string;
      imageAssetId: string;
      id: number;
    }
  | {
      type: "columns";
      title: string;
      columns: { 
        columnTitle?: string;
        blocks: PageBlock[];
      }[];
      id: number;
    }
  | {
      type: "gallery";
      title: string;
      description?: string;
      images: { assetId: string; caption: string }[];
      id: number;
    }
  | {
      type: "product";
      title: string;
      description?: string;
      productIds: string[];
      id: number;
    }
  | {
      type: "btn";
      title: string;
      buttonText: string;
      buttonUrl: string;
      id: number;
    }
  | {
      type: "faq";
      title: string;
      items: { question: string; answer: string }[];
      id: number;
    }
  | {
      type: "form";
      title: string;
      subtitle: string;
      formTargetEmail?: string;
      id: number;
    }
  | {
      type: "carousel";
      title?: string;
      slides: {
        imageAssetId: string;
        title: string;
        subtitle: string;
        ctaText?: string;
        ctaUrl?: string;
      }[];
      id: number;
    }
  | {
      type: "cta-section";
      title: string;
      content: string;
      buttonText: string;
      buttonUrl: string;
      backgroundImageAssetId?: string;
      id: number;
    }
  | {
      type: "maps";
      title?: string;
      description?: string;
      mapEmbedCode: string;
      id: number;
    }
  | {
      type: "split-content";
      title: string;
      content: string;
      imageAssetId: string;
      layout: "left" | "right";
      id: number;
    }
  | {
      type: "whatsapp-float";
      phoneNumber: string;
      message?: string;
      label?: string;
      id: number;
    };

export interface PageData {
  _id?: string;
  title: string;
  slug: string;
  seoTitle?: string;
  seoDescription: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  schemaType?: "none" | "organization" | "website" | "product" | "aboutus";
  schemaCustomJson?: string;
  pageStatus?: "draft" | "published";
  isHomepage?: boolean;
  blocks: PageBlock[];
}

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price?: string;
  imageAssetId?: string;
};

export type Asset = {
  _id: string;
  originalName: string;
  mimetype: string;
  url: string;
};