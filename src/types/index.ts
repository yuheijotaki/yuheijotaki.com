export type Post = {
  id: string;
  slug: string;
  body: string;
  collection: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    draft?: boolean;
  };
};

export type PostList = Post[];
