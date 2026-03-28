import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ base: './content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(5),
    description: z.string().min(20),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['backlog', 'research', 'draft', 'review', 'approved', 'scheduled', 'published'])
  })
});

export const collections = {
  posts
};
