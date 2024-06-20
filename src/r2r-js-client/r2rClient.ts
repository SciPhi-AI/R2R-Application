import axios, { AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

import {
  GenerationConfig,
  KGSearchSettings,
  VectorSearchSettings,
  R2RUpdatePromptRequest,
  R2RIngestDocumentsRequest,
  R2RIngestFilesRequest,
  R2RUpdateDocumentsRequest,
  R2RUpdateFilesRequest,
  R2RSearchRequest,
  R2RRAGRequest,
  R2RDeleteRequest,
  R2RAnalyticsRequest,
  R2RUsersStatsRequest,
  R2RDocumentsInfoRequest,
  R2RDocumentChunksRequest,
} from './models';

export class R2RClient {
  private baseUrl: string;
  private prefix: string;

  constructor(baseUrl: string, prefix: string = "/v1") {
    this.baseUrl = baseUrl;
    this.prefix = prefix;
  }

  async updatePrompt(
    name: string = "default_system",
    template?: string,
    inputTypes?: Record<string, string>
  ): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/update_prompt`;
    const request = new R2RUpdatePromptRequest({ name, template, input_types: inputTypes });
    const response = await axios.post(url, request);
    return response.data;
  }

  async ingestDocuments(
    documents: any[],
    versions?: string[]
  ): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/ingest_documents`;
    const request = new R2RIngestDocumentsRequest({ documents, versions });
    const response = await axios.post(url, request);
    return response.data;
  }

  async ingestFiles(
    filePaths: string[],
    metadatas?: any[],
    documentIds?: string[],
    userIds?: string[],
    versions?: string[],
    skipDocumentInfo?: boolean
  ): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/ingest_files`;
    const formData = new FormData();

    filePaths.forEach((file, index) => {
      formData.append('files', file);
    });

    const request = new R2RIngestFilesRequest({
      metadatas,
      document_ids: documentIds,
      user_ids: userIds,
      versions,
      skip_document_info: skipDocumentInfo,
    });

    Object.entries(request).forEach(([key, value]) => {
      formData.append(key, JSON.stringify(value));
    });

    const response = await axios.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async updateDocuments(
    documents: any[],
    versions?: string[],
    metadatas?: any[]
  ): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/update_documents`;
    const request = new R2RUpdateDocumentsRequest({ documents, versions, metadatas });
    const response = await axios.post(url, request);
    return response.data;
  }

  async updateFiles(
    files: string[],
    documentIds: string[],
    metadatas?: any[]
  ): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/update_files`;
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append('files', file);
    });

    const request = new R2RUpdateFilesRequest({
      metadatas,
      document_ids: documentIds,
    });

    formData.append('request', JSON.stringify(request));

    const response = await axios.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async search(
    query: string,
    useVectorSearch: boolean = true,
    searchFilters: Record<string, any> = {},
    searchLimit: number = 10,
    doHybridSearch: boolean = false,
    useKg: boolean = false,
    kgAgentGenerationConfig?: GenerationConfig
  ): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/search`;
    const request = new R2RSearchRequest({
      query,
      vector_search_settings: new VectorSearchSettings({
        use_vector_search: useVectorSearch,
        search_filters: searchFilters,
        search_limit: searchLimit,
        do_hybrid_search: doHybridSearch,
      }),
      kg_search_settings: new KGSearchSettings({
        use_kg: useKg,
        agent_generation_config: kgAgentGenerationConfig,
      }),
    });
    const response = await axios.post(url, request);
    return response.data;
  }

  async rag(
    query: string,
    useVectorSearch: boolean = true,
    searchFilters: Record<string, any> = {},
    searchLimit: number = 10,
    doHybridSearch: boolean = false,
    useKg: boolean = false,
    kgAgentGenerationConfig?: GenerationConfig,
    ragGenerationConfig?: GenerationConfig
  ): Promise<any> {
    console.log('rag_generation_config = ', ragGenerationConfig);
    const request = new R2RRAGRequest({
      query,
      vector_search_settings: new VectorSearchSettings({
        use_vector_search: useVectorSearch,
        search_filters: searchFilters,
        search_limit: searchLimit,
        do_hybrid_search: doHybridSearch,
      }),
      kg_search_settings: new KGSearchSettings({
        use_kg: useKg,
        agent_generation_config: kgAgentGenerationConfig,
      }),
      rag_generation_config: ragGenerationConfig,
    });

    if (ragGenerationConfig?.stream) {
      return this.streamRag(request);
    } else {
      const url = `${this.baseUrl}${this.prefix}/rag`;
      const response = await axios.post(url, request);
      return response.data;
    }
  }

  private async streamRag(ragRequest: R2RRAGRequest): Promise<ReadableStream<string>> {
    const url = `${this.baseUrl}${this.prefix}/rag`;
    const response = await axios.post(url, ragRequest, { responseType: 'stream' });
    return new ReadableStream({
      async start(controller) {
        response.data.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk.toString());
        });
        response.data.on('end', () => {
          controller.close();
        });
        response.data.on('error', (err: Error) => {
          controller.error(err);
        });
      }
    });
  }

  async delete(keys: string[], values: (boolean | number | string)[]): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/delete`;
    const request = new R2RDeleteRequest({ keys, values });
    const response = await axios.delete(url, { data: request });
    return response.data;
  }

  async logs(logTypeFilter?: string): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/logs`;
    const params: Record<string, string> = {};
    if (logTypeFilter) {
      params.log_type_filter = logTypeFilter;
    }
    const response = await axios.get(url, { params });
    return response.data;
  }

  async appSettings(): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/app_settings`;
    const response = await axios.get(url);
    return response.data;
  }

  async analytics(filterCriteria: any, analysisTypes: any): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/analytics`;
    const request = new R2RAnalyticsRequest({ filter_criteria: filterCriteria, analysis_types: analysisTypes });
    const response = await axios.post(url, request);
    return response.data;
  }

  async usersStats(userIds?: string[]): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/users_stats`;
    const request = new R2RUsersStatsRequest({
      user_ids: userIds
    });
    const response = await axios.get(url, { data: request });
    return response.data;
  }

  async getDocumentsInfo(documentIds?: string[] | null, userIds?: string[] | null): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/documents_info`;
    const request = new R2RDocumentsInfoRequest({
      document_ids: documentIds || undefined,
      user_ids: userIds || undefined,
    });
    const response = await axios.get(url, { data: request });
    return response.data;
  }

  async documentChunks(documentId: string): Promise<any> {
    const url = `${this.baseUrl}${this.prefix}/document_chunks`;
    const request = new R2RDocumentChunksRequest({ document_id: documentId });
    const response = await axios.post(url, request);
    return response.data;
  }
}

export default R2RClient;