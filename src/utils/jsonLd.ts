import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from '@/consts';

interface BlogPostingInput {
  title: string;
  description: string;
  imageURL: string;
  canonicalURL: string;
  publishedTime: Date;
  modifiedTime?: Date;
}

export function buildBlogPostingJsonLd(input: BlogPostingInput) {
  const { title, description, imageURL, canonicalURL, publishedTime, modifiedTime } = input;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: imageURL,
    url: canonicalURL,
    datePublished: publishedTime.toISOString(),
    dateModified: (modifiedTime ?? publishedTime).toISOString(),
    author: {
      '@type': 'Person',
      name: SITE_TITLE,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_TITLE,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalURL,
    },
  };
}

export function buildBreadcrumbJsonLd(articleTitle: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: SITE_URL + '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'ブログ記事一覧',
        item: SITE_URL + '/blog/',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: articleTitle,
      },
    ],
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: SITE_URL,
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    inLanguage: 'ja',
  };
}
