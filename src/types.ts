export type Pipeline = {
  id: number;
  name: string;
  github_url: string;
  status: string;
  deployment: {
    id: number;
    uri: string;
    create_time: string;
    update_time: string;
    creator: string;
    generation: string;
    last_modifier: string;
    uid: string;
    name: string;
    error: string | null;
  };
};
export interface Document {
  id: string;
  text: string;
  metadata: any;
}

export type TagColor = 'rose' | 'amber' | 'emerald' | 'zinc' | 'indigo' | 'sky';
