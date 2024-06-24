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
      posthog.capture('TSClient Update Prompt Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Update Prompt Error', {
          error: error.message,
        });
      } else {
        posthog.capture('TSClient Update Prompt Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Ingest Documents Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Ingest Documents Error', {
          error: error.message,
        });
      } else {
        posthog.capture('TSClient Ingest Documents Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Ingest Files Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Ingest Files Error', {
          error: error.message,
        });
      } else {
        posthog.capture('TSClient Ingest Files Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Update Documents Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Update Documents Error', {
          error: error.message,
        });
      } else {
        posthog.capture('TSClient Update Documents Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Update Files Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Update Files Error', {
          error: error.message,
        });
      } else {
        posthog.capture('TSClient Update Files Error', {
          error: 'An unknown error occurred',
        });
      }
      throw error;
    }
  }

  //NOQA
  async search(request: R2RSearchRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/search', request);
      posthog.capture('TSClient Search Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Search Error', { error: error.message });
      } else {
        posthog.capture('TSClient Search Error', {
          error: 'An unknown error occurred',
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
        posthog.capture('TSClient RAG Success');
        return response.data;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient RAG Error', { error: error.message });
      } else {
        posthog.capture('TSClient RAG Error', {
          error: 'An unknown error occurred',
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
        posthog.capture('TSClient RAG Error', { error: error.message });
      } else {
        posthog.capture('TSClient RAG Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Delete Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Delete Error', { error: error.message });
      } else {
        posthog.capture('TSClient Delete Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Logs Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Logs Error', { error: error.message });
      } else {
        posthog.capture('TSClient Logs Error', {
          error: 'An unknown error occurred',
        });
      }
      throw error;
    }
  }

  async appSettings(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/app_settings');
      posthog.capture('TSClient App Settings');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient App Settings Error', {
          error: error.message,
        });
      } else {
        posthog.capture('TSClient App Settings Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Analytics Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Analytics Error', { error: error.message });
      } else {
        posthog.capture('TSClient Analytics Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Users Overview Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Users Overview Error', {
          error: error.message,
        });
      } else {
        posthog.capture('TSClient Users Overview Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Documents Overview Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Documents Overview Error', {
          error: error.message,
        });
      } else {
        posthog.capture('TSClient Documents Overview Error', {
          error: 'An unknown error occurred',
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
      posthog.capture('TSClient Document Chunks Success');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        posthog.capture('TSClient Document Chunks Error', {
          error: error.message,
        });
      } else {
        posthog.capture('TSClient Document Chunks Error', {
          error: 'An unknown error occurred',
        });
      }
      throw error;
    }
  }
}

export default R2RClient;
