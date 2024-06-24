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
      posthog.capture('TSClient', { requestType: 'updatePrompt success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'updatePrompt',
          requestTypeError: 'updatePrompt error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'updatePrompt',
          requestTypeError: 'updatePrompt error',
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
      posthog.capture('TSClient', { requestType: 'ingestDocuments success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'ingestDocuments',
          requestTypeError: 'ingestDocuments error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'ingestDocuments',
          requestTypeError: 'ingestDocuments error',
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
      posthog.capture('TSClient', { requestType: 'ingestFiles success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'ingestFiles',
          requestTypeError: 'ingestFiles error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'ingestFiles',
          requestTypeError: 'ingestFiles error',
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
      posthog.capture('TSClient', { requestType: 'updateDocuments success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'updateDocuments',
          requestTypeError: 'updateDocuments error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'updateDocuments',
          requestTypeError: 'updateDocuments error',
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
      posthog.capture('TSClient', { requestType: 'updateFiles success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'updateFiles',
          requestTypeError: 'updateFiles error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'updateFiles',
          requestTypeError: 'updateFiles error',
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
      posthog.capture('TSClient', { requestType: 'search success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'search',
          requestTypeError: 'search error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'search',
          requestTypeError: 'search error',
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
        posthog.capture('TSClient', { requestType: 'rag success' });
        return response.data;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'rag',
          requestTypeError: 'rag error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'rag',
          requestTypeError: 'rag error',
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
          requestType: 'streamingRag',
          requestTypeError: 'streamingRag error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'streamingRag',
          requestTypeError: 'streamingRag error',
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
      posthog.capture('TSClient', { requestType: 'delete success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'delete',
          requestTypeError: 'delete error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'delete',
          requestTypeError: 'delete error',
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
      posthog.capture('TSClient', { requestType: 'logs success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'logs',
          requestTypeError: 'logs error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'logs',
          requestTypeError: 'logs error',
          error: 'An unknown error occurred in logs',
        });
      }
      throw error;
    }
  }

  async appSettings(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/app_settings');
      posthog.capture('TSClient', { requestType: 'appSettings success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'appSettings',
          requestTypeError: 'appSettings error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'appSettings',
          requestTypeError: 'appSettings error',
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
      posthog.capture('TSClient', { requestType: 'analytics success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'analytics',
          requestTypeError: 'analytics error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'analytics',
          requestTypeError: 'analytics error',
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
      posthog.capture('TSClient', { requestType: 'usersOverview success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'usersOverview',
          requestTypeError: 'usersOverview error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'usersOverview',
          requestTypeError: 'usersOverview error',
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
      posthog.capture('TSClient', { requestType: 'documentsOverview success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'documentsOverview',
          requestTypeError: 'documentsOverview error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'documentsOverview',
          requestTypeError: 'documentsOverview error',
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
      posthog.capture('TSClient', { requestType: 'documentChunks success' });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClientError', {
          requestType: 'documentChunks',
          requestTypeError: 'documentChunks error',
          error: error.message,
        });
      } else {
        posthog.capture('TSClientError', {
          requestType: 'documentChunks',
          requestTypeError: 'documentChunks error',
          error: 'An unknown error occurred in documentChunks',
        });
      }
    }
  }
}

export default R2RClient;
