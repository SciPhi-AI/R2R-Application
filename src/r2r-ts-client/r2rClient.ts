import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import posthog from 'posthog-js';

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
  async updatePrompt(request: R2RUpdatePromptRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/update_prompt', request);
      posthog.capture('TSClient', { 'updatePrompt success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'updatePrompt error': error.message,
        });
      } else {
        posthog.capture('TSClient Update Prompt Error', {
          error: 'An unknown error occurred in updatePrompt',
        });
      }
      throw error;
    }
  }

  //NOQA
  async ingestDocuments(request: R2RIngestDocumentsRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        '/ingest_documents',
        request
      );
      posthog.capture('TSClient', { 'ingestDocuments success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'ingestDocuments error': error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in ingestDocuments',
        });
      }
      throw error;
    }
  }

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

    try {
      const response = await this.axiosInstance.post(
        '/ingest_files',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: [
            (data, headers) => {
              delete headers['Content-Type'];
              return data;
            },
          ],
        }
      );
      posthog.capture('TSClient', { 'ingestFiles success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'ingestFiles error': error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in ingestFiles',
        });
      }
      throw error;
    }
  }

  //NOQA
  async updateDocuments(request: R2RUpdateDocumentsRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        '/update_documents',
        request
      );
      posthog.capture('TSClient', { 'updateDocuments success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'updateDocuments error': error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in updateDocuments',
        });
      }
      throw error;
    }
  }

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

    try {
      const response = await this.axiosInstance.post(
        '/update_files',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: [
            (data, headers) => {
              delete headers['Content-Type'];
              return data;
            },
          ],
        }
      );
      posthog.capture('TSClient', { 'updateFiles success': null });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'updateFiles error': error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in updateFiles',
        });
      }
      throw error;
    }
  }

  //NOQA
  async search(request: R2RSearchRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/search', request);
      posthog.capture('TSClient', { 'saerch success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', { 'search error': error.message });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in search',
        });
      }
      throw error;
    }
  }

  async rag(request: R2RRAGRequest): Promise<any> {
    try {
      if (request.rag_generation_config?.stream) {
        return this.streamRag(request);
      } else {
        const response = await this.axiosInstance.post(
          '/rag',
          JSON.stringify(request)
        );
        posthog.capture('TSClient', { 'rag success': request });
        return response.data;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', { 'rag error': error.message });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in rag',
        });
      }
      throw error;
    }
  }

  private async streamRag(request: R2RRAGRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        '/rag',
        JSON.stringify(request),
        {
          responseType: 'stream',
        }
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'streamingRag error': error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in streamingRag',
        });
      }
      throw error;
    }
  }

  async delete(request: R2RDeleteRequest): Promise<any> {
    try {
      const response = await this.axiosInstance({
        method: 'delete',
        url: '/delete',
        data: {
          keys: request.keys,
          values: request.values,
        },
        headers: { 'Content-Type': 'application/json' },
      });
      posthog.capture('TSClient', { 'delete success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', { 'delete error': error.message });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in delete',
        });
      }
      throw error;
    }
  }

  async logs(request: R2RLogsRequest): Promise<any> {
    try {
      const payload = {
        ...request,
        log_type_filter:
          request.log_type_filter === undefined
            ? null
            : request.log_type_filter,
        max_runs_requested: request.max_runs_requested || 100,
      };

      const response = await this.axiosInstance.post('/logs', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      posthog.capture('TSClient', { 'logs success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', { 'logs error': error.message });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in logs',
        });
      }
      throw error;
    }
  }

  async appSettings(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/app_settings');
      posthog.capture('TSClient', { 'appSettings success': null });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'appSettings error': error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in appSettings',
        });
      }
      throw error;
    }
  }

  async analytics(request: R2RAnalyticsRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/analytics', request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      posthog.capture('TSClient', { 'analytics success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', { 'analytics error': error.message });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in analytics',
        });
      }
      throw error;
    }
  }

  // TODO: This isn't implemented in the dashboard yet
  //NOQA
  async usersOverview(request: R2RUsersOverviewRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/users_overview', {
        params: request,
      });
      posthog.capture('TSClient', { 'usersOverview success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'usersOverview error': error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in usersOverview',
        });
      }
      throw error;
    }
  }

  async documentsOverview(request: R2RDocumentsOverviewRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        '/documents_overview',
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      posthog.capture('TSClient', { 'documentsOverview success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'documentsOvervuew error': error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in documentsOverview',
        });
      }
      throw error;
    }
  }

  async documentChunks(request: R2RDocumentChunksRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        '/document_chunks',
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      posthog.capture('TSClient', { 'documentChunks success': request });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          'documentChunks error': error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          error: 'An unknown error occurred in documentChunks',
        });
      }
      throw error;
    }
  }
}

export default R2RClient;
