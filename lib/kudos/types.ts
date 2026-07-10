export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  department: string;
};

export type Hashtag = {
  id: number;
  name: string;
};

export type CreateKudosInput = {
  recipientId: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  anonymousDisplayName: string | null;
  hashtagIds: number[];
  imagePaths: string[];
  mentionedProfileIds: string[];
};
