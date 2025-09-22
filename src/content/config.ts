import { defineCollection, z } from 'astro:content';

const materiCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subject: z.string(),
    grade: z.string(),
    publishedAt: z.string()
  })
});

const profilCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number().optional()
  })
});

export const collections = {
  materi: materiCollection,
  profil: profilCollection
};
