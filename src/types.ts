export type Pipeline = {
  deploymentUrl: string;
};
export interface Document {
  id: string;
  text: string;
  metadata: any;
}

export type TagColor = 'rose' | 'amber' | 'emerald' | 'zinc' | 'indigo' | 'sky';
