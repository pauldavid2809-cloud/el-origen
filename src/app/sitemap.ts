import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://el-origen-two.vercel.app";

  let tastingUrls: MetadataRoute.Sitemap = [];
  try {
    const tastings = await db.getTastings();
    tastingUrls = tastings.map((t) => ({
      url: `${baseUrl}/catas/${t.slug || t.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: {
        languages: {
          es: `${baseUrl}/catas/${t.slug || t.id}`,
          en: `${baseUrl}/catas/${t.slug || t.id}`,
        },
      },
    }));
  } catch {
    // fallback if db error
  }

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
      alternates: {
        languages: {
          es: baseUrl,
          en: baseUrl,
        },
      },
    },
    {
      url: `${baseUrl}/catas`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.95,
      alternates: {
        languages: {
          es: `${baseUrl}/catas`,
          en: `${baseUrl}/catas`,
        },
      },
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          es: `${baseUrl}/nosotros`,
          en: `${baseUrl}/nosotros`,
        },
      },
    },
    {
      url: `${baseUrl}/privadas`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.85,
      alternates: {
        languages: {
          es: `${baseUrl}/privadas`,
          en: `${baseUrl}/privadas`,
        },
      },
    },
    {
      url: `${baseUrl}/cata-en-vivo/tok-demo-1234`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];

  return [...staticUrls, ...tastingUrls];
}
