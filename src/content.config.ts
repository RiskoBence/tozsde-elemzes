import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Napi elemzések: content/elemzesek/YYYY-MM-DD-<valami>.md
 * Frontmatter nem kötelező; ha van, ezek a mezők elsőbbséget kapnak a markdownból kiolvasott értékkel szemben.
 */
const elemzesek = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './content/elemzesek',
    generateId: ({ entry }) => entry.replace(/\.md$/i, ''),
  }),
  schema: z
    .object({
      cim: z.string().optional(),
      dontes: z.string().optional(),
      bias: z.string().optional(),
      eloszures: z.string().optional(),
      ablak: z.string().optional(),
    })
    .passthrough(),
});

export const collections = { elemzesek };
