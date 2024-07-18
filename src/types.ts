export type Pipeline = {
  pipelineName: string;
  deploymentUrl: string;
  pipelineId: string;
};
export interface Document {
  id: string;
  text: string;
  metadata: any;
}

export interface DocumentFilterCriteria {
  sort: 'title' | 'date';
  order: 'asc' | 'desc';
}

export interface DocumentInfoType {
  document_id: string;
  user_id: string;
  title: string;
  version: string;
  updated_at: string;
  size_in_bytes: number;
  metadata: any;
}

export type TagColor = 'rose' | 'amber' | 'emerald' | 'zinc' | 'indigo' | 'sky';
