import axios, { AxiosInstance } from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import { UUID } from 'crypto';
import {
  R2RUpdatePromptRequest,
  R2RIngestDocumentsRequest,
  R2RIngestFilesRequest,
  R2RUpdateDocumentsRequest,
  R2RUpdateFilesRequest,
  R2RSearchRequest,
  R2RRAGRequest,
  R2RDeleteRequest,
  R2RAnalyticsRequest,
  R2RUsersOverviewRequest,
  R2RDocumentsOverviewRequest,
  R2RDocumentChunksRequest,
  R2RLogsRequest,
  GenerationConfig,
} from './models';

export class R2RClient {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;

  constructor(baseURL: string, prefix: string = '/v1') {
    this.baseUrl = `${baseURL}${prefix}`;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      transformRequest: [
        (data, headers) => {
          return JSON.stringify(data);
        },
      ],
    });
  }

  //NOQA
  async updatePrompt(request: R2RUpdatePromptRequest): Promise<any> {
    const response = await this.axiosInstance.post('/update_prompt', request);
    return response.data;
  }

  //NOQA
  async ingestDocuments(request: R2RIngestDocumentsRequest): Promise<any> {
    const response = await this.axiosInstance.post(
      '/ingest_documents',
      request
    );
    return response.data;
  }

  //NOQA
  // async ingestFiles(request: R2RIngestFilesRequest, filePaths: string[]): Promise<any> {
  //   const formData = new FormData();

  //   filePaths.forEach((filePath) => {
  //     formData.append('files', fs.createReadStream(filePath));
  //   });

  //   Object.entries(request).forEach(([key, value]) => {
  //     formData.append(key, JSON.stringify(value));
  //   });

  //   const response = await this.axiosInstance.post('/ingest_files', formData, {
  //     headers: formData.getHeaders(),
  //   });
  //   return response.data;
  // }

  //NOQA
  async updateDocuments(request: R2RUpdateDocumentsRequest): Promise<any> {
    const response = await this.axiosInstance.post(
      '/update_documents',
      request
    );
    return response.data;
  }

  //NOQA
  // async updateFiles(request: R2RUpdateFilesRequest, files: string[]): Promise<any> {
  //   const formData = new FormData();

  //   files.forEach((file) => {
  //     formData.append('files', fs.createReadStream(file));
  //   });

  //   Object.entries(request).forEach(([key, value]) => {
  //     formData.append(key, JSON.stringify(value));
  //   });

  //   const response = await this.axiosInstance.post('/update_files', formData, {
  //     headers: formData.getHeaders(),
  //   });
  //   return response.data;
  // }

  //NOQA
  async search(request: R2RSearchRequest): Promise<any> {
    const response = await this.axiosInstance.post('/search', request);
    return response.data;
  }

  //NOQA
  async rag(request: R2RRAGRequest): Promise<any> {
    if (request.rag_generation_config?.stream) {
      return this.streamRag(request);
    } else {
      const response = await this.axiosInstance.post('/rag', request);
      return response.data;
    }
  }

  //NOQA
  private async *streamRag(
    request: R2RRAGRequest
  ): AsyncGenerator<string, void, unknown> {
    const response = await this.axiosInstance.post('/rag', request, {
      responseType: 'stream',
    });

    for await (const chunk of response.data) {
      yield chunk.toString();
    }
  }

  //NOQA
  async delete(request: R2RDeleteRequest): Promise<any> {
    const response = await this.axiosInstance.delete('/delete', {
      data: request,
    });
    return response.data;
  }

  //NOQA
  async logs(): Promise<any> {
    try {
      // const params: R2RLogsRequest = {
      //   max_runs_requested: maxRunsRequested
      // };
      // if (logTypeFilter !== undefined) {
      //   params.log_type_filter = logTypeFilter;
      // }

      // console.log('Request params:', params);

      const response = await this.axiosInstance.get('/logs');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          'Error response:',
          JSON.stringify(error.response.data, null, 2)
        );
      }
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  async appSettings(): Promise<any> {
    const response = await this.axiosInstance.get('/app_settings');
    return response.data;
  }

  async analytics(request: R2RAnalyticsRequest): Promise<any> {
    const response = await this.axiosInstance.post('/analytics', request);
    return response.data;
  }

  //NOQA
  async usersOverview(request: R2RUsersOverviewRequest): Promise<any> {
    const response = await this.axiosInstance.get('/users_overview', {
      params: request,
    });
    return response.data;
  }

  //NOQA
  async documentsOverview(
    documentIds?: UUID[],
    userIds?: UUID[]
  ): Promise<any> {
    const request: R2RDocumentsOverviewRequest = {
      document_ids: documentIds,
      user_ids: userIds,
    };

    const response = await this.axiosInstance.request({
      url: '/documents_overview',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      data: request, // This sends the data in the body
      // This allows Axios to send a body with a GET request
      transformRequest: [
        (data, headers) => {
          return JSON.stringify(data);
        },
      ],
    });

    return response.data;
  }

  //NOQA
  async documentChunks(request: R2RDocumentChunksRequest): Promise<any> {
    const response = await this.axiosInstance.post('/document_chunks', request);
    return response.data;
  }
}

export default R2RClient;
