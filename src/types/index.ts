export type Post = {
  id: string;
  slug: string;
  body: string;
  collection: string;
  data: {
    title: string;
    description: string;
    publishDate: Date;
  };
};

export type PostList = Post[];
