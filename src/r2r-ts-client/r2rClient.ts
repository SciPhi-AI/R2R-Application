import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import posthog from 'posthog-js';

import { feature } from './feature';
import {
  R2RUpdatePromptRequest,
  R2RIngestDocumentsRequest,
  R2RIngestFilesRequest,
  R2RUpdateDocumentsRequest,
  R2RSearchRequest,
  R2RRAGRequest,
  R2RDeleteRequest,
  R2RAnalyticsRequest,
  R2RUsersOverviewRequest,
  R2RDocumentsOverviewRequest,
  R2RDocumentChunksRequest,
  R2RLogsRequest,
} from './models';

export class R2RClient {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;

  constructor(baseURL: string, prefix: string = '/v1') {
    this.baseUrl = `${baseURL}${prefix}`;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      transformRequest: [
        (data) => {
          if (typeof data === 'string') {
            return data;
          }
          return JSON.stringify(data);
        },
      ],
    });
  }

  async healthCheck(): Promise<any> {
    const response = await this.axiosInstance.get('/health');
    return response.data;
  }

  //TODO: This isn't implemented in the dashboard yet
  //NOQA
  @feature('updatePrompt')
  async updatePrompt(request: R2RUpdatePromptRequest): Promise<any> {
    const response = await this.axiosInstance.post('/update_prompt', request);
    return response.data;
  }

  //NOQA
  @feature('ingestDocuments')
  async ingestDocuments(request: R2RIngestDocumentsRequest): Promise<any> {
    const response = await this.axiosInstance.post(
      '/ingest_documents',
      request
    );
    return response.data;
  }

  @feature('ingestFiles')
  async ingestFiles(
    files: File[],
    request: R2RIngestFilesRequest
  ): Promise<any> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    Object.entries(request).forEach(([key, value]) => {
      formData.append(key, JSON.stringify(value));
    });

    const response = await this.axiosInstance.post('/ingest_files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [
        (data, headers) => {
          delete headers['Content-Type'];
          return data;
        },
      ],
    });
    return response.data;
  }

  //NOQA
  @feature('updateDocuments')
  async updateDocuments(request: R2RUpdateDocumentsRequest): Promise<any> {
    const response = await this.axiosInstance.post(
      '/update_documents',
      request
    );
    return response.data;
  }

  @feature('updateFiles')
  async updateFiles(
    files: File[],
    documentIds: string[],
    metadatas?: Record<string, any>[]
  ): Promise<any> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('document_ids', JSON.stringify(documentIds));

    if (metadatas) {
      formData.append('metadatas', JSON.stringify(metadatas));
    }

    const response = await this.axiosInstance.post('/update_files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [
        (data, headers) => {
          delete headers['Content-Type'];
          return data;
        },
      ],
    });
    return response.data;
  }

  //NOQA
  @feature('search')
  async search(request: R2RSearchRequest): Promise<any> {
    const response = await this.axiosInstance.post('/search', request);
    return response.data;
  }

  @feature('rag')
  async rag(request: R2RRAGRequest): Promise<any> {
    if (request.rag_generation_config?.stream) {
      return this.streamRag(request);
    } else {
      const response = await this.axiosInstance.post(
        '/rag',
        JSON.stringify(request)
      );
      return response.data;
    }
  }

  @feature('streamingRag')
  private async streamRag(request: R2RRAGRequest): Promise<any> {
    const response = await this.axiosInstance.post(
      '/rag',
      JSON.stringify(request),
      {
        responseType: 'stream',
      }
    );
    return response.data;
  }

  @feature('delete')
  async delete(request: R2RDeleteRequest): Promise<any> {
    const response = await this.axiosInstance({
      method: 'delete',
      url: '/delete',
      data: {
        keys: request.keys,
        values: request.values,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  }

  @feature('logs')
  async logs(request: R2RLogsRequest): Promise<any> {
    const payload = {
      ...request,
      log_type_filter:
        request.log_type_filter === undefined ? null : request.log_type_filter,
      max_runs_requested: request.max_runs_requested || 100,
    };

    const response = await this.axiosInstance.post('/logs', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  @feature('appSettings')
  async appSettings(): Promise<any> {
    const response = await this.axiosInstance.get('/app_settings');
    return response.data;
  }

  @feature('analytics')
  async analytics(request: R2RAnalyticsRequest): Promise<any> {
    const response = await this.axiosInstance.post('/analytics', request, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    posthog.capture('TSClient', { requestType: 'analytics success' });
    return response.data;
  }

  // TODO: This isn't implemented in the dashboard yet
  //NOQA
  @feature('usersOverview')
  async usersOverview(request: R2RUsersOverviewRequest): Promise<any> {
    const response = await this.axiosInstance.get('/users_overview', {
      params: request,
    });
    return response.data;
  }

  @feature('documentsOverview')
  async documentsOverview(request: R2RDocumentsOverviewRequest): Promise<any> {
    const response = await this.axiosInstance.post(
      '/documents_overview',
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  @feature('documentChunks')
  async documentChunks(request: R2RDocumentChunksRequest): Promise<any> {
    const response = await this.axiosInstance.post(
      '/document_chunks',
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    posthog.capture('TSClient', { requestType: 'documentChunks success' });
    return response.data;
  }
}

export default R2RClient;
