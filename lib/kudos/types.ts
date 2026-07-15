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

export type KudosCard = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isAnonymous: boolean;
  anonymousDisplayName: string | null;
  sender: Profile | null;
  recipient: Profile;
  hashtags: Hashtag[];
  images: { path: string }[];
  heartCount: number;
  likedByMe: boolean;
  senderReceivedCount: number | null;
  recipientReceivedCount: number;
};

export type SpotlightNode = {
  senderId: string;
  fullName: string | null;
  avatarUrl: string | null;
  sentCount: number;
  lastSentAt: string;
  lastKudosId: string;
};

/** One "{name} received a kudos" event — the activity ticker's data source,
 *  decoupled from `SpotlightNode` (sender-grouped) since the ticker is about
 *  the RECIPIENT of each individual kudos, not the sender aggregate. */
export type SpotlightActivityItem = {
  kudosId: string;
  recipientId: string;
  fullName: string | null;
  receivedAt: string;
};

export type SpotlightData = {
  totalKudos: number;
  nodes: SpotlightNode[];
  recentActivity: SpotlightActivityItem[];
};

export type KudosStats = {
  received: number;
  sent: number;
  hearts: number;
};

export type KudosFilters = {
  hashtagId: number | null;
  department: string | null;
};
