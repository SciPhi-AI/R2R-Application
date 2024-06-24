import { UUID } from 'crypto';

export enum DocumentType {
  CSV = 'csv',
  DOCX = 'docx',
  HTML = 'html',
  JSON = 'json',
  MD = 'md',
  PDF = 'pdf',
  PPTX = 'pptx',
  TXT = 'txt',
  XLSX = 'xlsx',
  GIF = 'gif',
  PNG = 'png',
  JPG = 'jpg',
  JPEG = 'jpeg',
  SVG = 'svg',
  MP3 = 'mp3',
  MP4 = 'mp4',
}

export type DataType = string | Uint8Array;

export interface GenerationConfig {
  // RAG Configuration
  temperature?: number;
  setTemperature?: (value: number) => void;
  top_p?: number;
  setTopP?: (value: number) => void;
  top_k?: number;
  setTop_k?: (value: number) => void;
  max_tokens_to_sample?: number;
  setMax_tokens_to_sample?: (value: number) => void;
  model?: string;
  setModel?: (value: string) => void;
  stream?: boolean;
  setStream?: (value: boolean) => void;
  functions?: Array<Record<string, any>> | null;
  setFunctions?: (value: Array<Record<string, any>> | null) => void;
  skip_special_tokens?: boolean;
  setSkipSpecialTokens?: (value: boolean) => void;
  stop_token?: string | null;
  setStopToken?: (value: string | null) => void;
  num_beams?: number;
  setNumBeams?: (value: number) => void;
  do_sample?: boolean;
  setDoSample?: (value: boolean) => void;
  generate_with_chat?: boolean;
  setGenerateWithChat?: (value: boolean) => void;
  add_generation_kwargs?: Record<string, any>;
  setAddGenerationKwargs?: (value: Record<string, any>) => void;
  api_base?: string | null;
  setApiBase?: (value: string | null) => void;

  // Knowledge Graph Configuration
  kg_temperature?: number;
  setKgTemperature?: (value: number) => void;
  kg_top_p?: number;
  setKgTopP?: (value: number) => void;
  kg_top_k?: number;
  setKgTop_k?: (value: number) => void;
  kg_max_tokens_to_sample?: number;
  setKgMax_tokens_to_sample?: (value: number) => void;
}

export interface VectorSearchSettings {
  use_vector_search: boolean;
  search_filters?: Record<string, any>;
  search_limit: number;
  do_hybrid_search: boolean;
}

export interface KGSearchSettings {
  use_kg: boolean;
  agent_generation_config?: GenerationConfig | null;
}

export interface Document {
  // Define the properties of Document
}

export interface R2RUpdatePromptRequest {
  name: string;
  template?: string;
  input_types?: Record<string, string>;
}

export interface R2RIngestDocumentsRequest {
  documents: Document[];
  versions?: string[];
}

export interface R2RUpdateDocumentsRequest {
  documents: Document[];
  versions?: string[];
  metadatas?: Record<string, any>[];
}

export interface R2RIngestFilesRequest {
  metadatas?: Record<string, any>[];
  document_ids?: string[];
  user_ids?: (string | null)[];
  versions?: string[];
  skip_document_info?: boolean;
}

export interface R2RUpdateFilesRequest {
  metadatas?: Record<string, any>[];
  document_ids?: string[];
}

export interface R2RSearchRequest {
  query: string;
  vector_search_settings: VectorSearchSettings;
  kg_search_settings: KGSearchSettings;
}

export interface R2RRAGRequest {
  query: string;
  vector_search_settings: VectorSearchSettings;
  kg_search_settings: KGSearchSettings;
  rag_generation_config?: GenerationConfig | null;
}

export interface R2RDeleteRequest {
  keys: string[];
  values: (boolean | number | string)[];
}

export interface FilterCriteria {
  filters?: { [key: string]: string };
}

export interface AnalysisTypes {
  analysis_types?: { [key: string]: string[] };
}

export interface R2RAnalyticsRequest {
  filter_criteria: FilterCriteria;
  analysis_types: AnalysisTypes;
}

export interface R2RUsersOverviewRequest {
  user_ids?: UUID[];
}

export interface R2RDocumentsOverviewRequest {
  document_ids?: UUID[];
  user_ids?: UUID[];
}

export interface R2RDocumentChunksRequest {
  document_id: string;
}

export interface R2RLogsRequest {
  log_type_filter?: string;
  max_runs_requested?: number;
}
