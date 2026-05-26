export interface BlogPost {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImageAssetId?: string;
  categoryId?: string;
  authorId?: string;
  status: "draft" | "published";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface BlogCategory {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}
