import { v4 as uuidv4 } from 'uuid';

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

export class AnalysisTypes {
  analysis_types?: Record<string, string[]>;

  constructor(data: Partial<AnalysisTypes>) {
    this.analysis_types = data.analysis_types;
  }

  static generateBarChartData(logs: any[], key: string): any {
    const chartData: {
      labels: string[];
      datasets: { label: string; data: number[] }[];
    } = { labels: [], datasets: [] };
    const valueCounts: Record<string, number> = {};

    for (const log of logs) {
      if ('entries' in log) {
        for (const entry of log.entries) {
          if (entry.key === key) {
            valueCounts[entry.value] = (valueCounts[entry.value] || 0) + 1;
          }
        }
      } else if ('key' in log && log.key === key) {
        valueCounts[log.value] = (valueCounts[log.value] || 0) + 1;
      }
    }

    for (const [value, count] of Object.entries(valueCounts)) {
      chartData.labels.push(value);
      chartData.datasets.push({ label: key, data: [count] });
    }

    return chartData;
  }
}

export class FilterCriteria {
  filters?: Record<string, string>;

  constructor(data: Partial<FilterCriteria>) {
    this.filters = data.filters;
  }
}

export class GenerationConfig {
  temperature: number = 0.1;
  top_p: number = 1.0;
  top_k: number = 100;
  max_tokens_to_sample: number = 1024;
  model: string = 'gpt-4o';
  stream: boolean = false;
  functions?: Record<string, any>[];
  skip_special_tokens: boolean = false;
  stop_token?: string;
  num_beams: number = 1;
  do_sample: boolean = true;
  generate_with_chat: boolean = false;
  add_generation_kwargs?: Record<string, any>;
  api_base?: string;

  constructor(data: Partial<GenerationConfig>) {
    Object.assign(this, data);
  }
}

export class Document {
  id: string = uuidv4();
  type: DocumentType;
  data: DataType;
  metadata: Record<string, any>;

  constructor(data: Partial<Document>) {
    this.id = data.id || uuidv4();
    this.type = data.type!;
    this.data = data.data!;
    this.metadata = data.metadata || {};
    Object.assign(this, data);
  }

  encodeData(): void {
    if (this.data instanceof Uint8Array) {
      this.data = Buffer.from(this.data).toString('base64');
    }
    this.id = this.id.toString();
    for (const [key, value] of Object.entries(this.metadata)) {
      if (
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value
        )
      ) {
        this.metadata[key] = value.toString();
      }
    }
  }

  decodeData(): void {
    if (typeof this.data === 'string') {
      try {
        this.data = new Uint8Array(Buffer.from(this.data, 'base64'));
      } catch (e) {
        throw new Error(`Failed to decode data: ${e}`);
      }
    }
    for (const [key, value] of Object.entries(this.metadata)) {
      if (
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value
        )
      ) {
        this.metadata[key] = value; // Keep it as a string
      }
    }
  }
}

export class VectorSearchSettings {
  use_vector_search: boolean;
  search_filters: Record<string, any>;
  search_limit: number;
  do_hybrid_search: boolean;

  constructor(data: Partial<VectorSearchSettings>) {
    this.use_vector_search = data.use_vector_search ?? true;
    this.search_filters = data.search_filters ?? {};
    this.search_limit = data.search_limit ?? 10;
    this.do_hybrid_search = data.do_hybrid_search ?? false;
  }
}

export class KGSearchSettings {
  use_kg: boolean;
  agent_generation_config?: GenerationConfig;

  constructor(data: Partial<KGSearchSettings>) {
    this.use_kg = data.use_kg ?? false;
    this.agent_generation_config = data.agent_generation_config;
  }
}

export class R2RUpdatePromptRequest {
  name: string;
  template?: string;
  input_types: Record<string, string>;

  constructor(data: Partial<R2RUpdatePromptRequest>) {
    this.name = data.name!;
    this.template = data.template;
    this.input_types = data.input_types ?? {};
  }
}

export class R2RIngestDocumentsRequest {
  documents: Document[];
  versions?: string[];

  constructor(data: Partial<R2RIngestDocumentsRequest>) {
    this.documents = data.documents!;
    this.versions = data.versions;
  }
}

export class R2RUpdateDocumentsRequest {
  documents: Document[];
  versions?: string[];
  metadatas?: Record<string, any>[];

  constructor(data: Partial<R2RUpdateDocumentsRequest>) {
    this.documents = data.documents!;
    this.versions = data.versions;
    this.metadatas = data.metadatas;
  }
}

export class R2RIngestFilesRequest {
  metadatas?: Record<string, any>[];
  document_ids?: string[];
  user_ids?: (string | null)[];
  versions?: string[];
  skip_document_info?: boolean;

  constructor(data: Partial<R2RIngestFilesRequest>) {
    this.metadatas = data.metadatas;
    this.document_ids = data.document_ids;
    this.user_ids = data.user_ids;
    this.versions = data.versions;
    this.skip_document_info = data.skip_document_info;
  }
}

export class R2RUpdateFilesRequest {
  metadatas?: Record<string, any>[];
  document_ids?: string[];

  constructor(data: Partial<R2RUpdateFilesRequest>) {
    this.metadatas = data.metadatas;
    this.document_ids = data.document_ids;
  }
}

export class R2RSearchRequest {
  query: string;
  vector_search_settings: VectorSearchSettings;
  kg_search_settings: KGSearchSettings;

  constructor(data: Partial<R2RSearchRequest>) {
    this.query = data.query!;
    this.vector_search_settings = data.vector_search_settings!;
    this.kg_search_settings = data.kg_search_settings!;
  }
}

export class R2RRAGRequest {
  query: string;
  vector_search_settings: VectorSearchSettings;
  kg_search_settings: KGSearchSettings;
  rag_generation_config?: GenerationConfig;

  constructor(data: Partial<R2RRAGRequest>) {
    this.query = data.query!;
    this.vector_search_settings = data.vector_search_settings!;
    this.kg_search_settings = data.kg_search_settings!;
    this.rag_generation_config = data.rag_generation_config;
  }
}

export class R2RDeleteRequest {
  keys: string[];
  values: (boolean | number | string)[];

  constructor(data: Partial<R2RDeleteRequest>) {
    this.keys = data.keys!;
    this.values = data.values!;
  }
}

export class R2RAnalyticsRequest {
  filter_criteria: FilterCriteria;
  analysis_types: AnalysisTypes;

  constructor(data: Partial<R2RAnalyticsRequest>) {
    this.filter_criteria = data.filter_criteria!;
    this.analysis_types = data.analysis_types!;
  }
}

export class R2RUsersStatsRequest {
  user_ids?: string[];

  constructor(data: Partial<R2RUsersStatsRequest>) {
    this.user_ids = data.user_ids;
  }
}

export class R2RDocumentsInfoRequest {
  document_ids?: string[];
  user_ids?: string[];

  constructor(data: {
    document_ids?: string[] | null;
    user_ids?: string[] | null;
  }) {
    this.document_ids = data.document_ids || undefined;
    this.user_ids = data.user_ids || undefined;
  }
}

export class R2RDocumentChunksRequest {
  document_id: string;

  constructor(data: Partial<R2RDocumentChunksRequest>) {
    this.document_id = data.document_id!;
  }
}
