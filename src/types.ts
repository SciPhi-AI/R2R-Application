export type Pipeline = {
  deploymentUrl: string;
};
export interface Document {
  id: string;
  text: string;
  metadata: any;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  isStreaming?: boolean;
  sources?: string | null;
}

export interface Source {
  title: string;
  snippet: string;
  id: string;
  score: number;
  link: string;
  isFamilyFriendly: boolean;
  displayUrl: string;
  deepLinks: { snippet: string; name: string; url: string }[];
  dateLastCrawled: string;
  cachedPageUrl: string;
  language: string;
  primaryImageOfPage?: {
    thumbnailUrl: string;
    width: number;
    height: number;
    imageId: string;
  };
  isNavigational: boolean;
  metadata: any;
}

export type TagColor = 'rose' | 'amber' | 'emerald' | 'zinc' | 'indigo' | 'sky';
