import { createClient, type MicroCMSListResponse } from 'microcms-js-sdk';

export interface MicroCMSBlogPost {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;
}

export type MicroCMSBlogListResponse = MicroCMSListResponse<{ title: string }>;

export function createBlogClient(serviceDomain: string, apiKey: string) {
  return createClient({ serviceDomain, apiKey });
}

export async function fetchBlogList(client: ReturnType<typeof createBlogClient>) {
  return client.get<MicroCMSBlogListResponse>({ endpoint: 'blog' });
}

export async function fetchBlogEntry(client: ReturnType<typeof createBlogClient>, id: string) {
  return client.get<MicroCMSBlogPost>({ endpoint: 'blog', contentId: id });
}
