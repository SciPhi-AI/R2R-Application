export type Pipeline = {
  pipelineId: string;
  pipelineName: string;
  deploymentUrl: string;
};

export interface Document {
  id: string;
  text: string;
  metadata: any;
}

export type TagColor = 'rose' | 'amber' | 'emerald' | 'zinc' | 'indigo' | 'sky';
