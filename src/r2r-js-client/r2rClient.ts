import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

function defaultSerializer(obj: any): any {
  if (obj instanceof uuidv4) {
    return obj.toString();
  }
  // if (obj instanceof DocumentType) {
  //   return obj.value;
  // }
  if (obj instanceof Uint8Array) {
    throw new TypeError('Bytes serialization is not yet supported.');
  }
  throw new TypeError(`Type ${typeof obj} not serializable.`);
}

function createQueryString(params: Record<string, any>): string {
  return Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join('&');
}

export class R2RClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async updatePrompt(
    name: string,
    template?: string,
    inputTypes?: Record<string, string>
  ): Promise<any> {
    const url = `${this.baseUrl}/update_prompt`;
    const data = {
      name,
      template,
      input_types: inputTypes,
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, defaultSerializer),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  }

  async ingestDocuments(documents: Record<string, any>[]): Promise<any> {
    const url = `${this.baseUrl}/ingest_documents`;
    const data = { documents };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, defaultSerializer),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  }

  async ingestFiles(
    metadatas: Record<string, any>[] | null,
    files: File[],
    ids?: string[] | null,
    userIds?: string[] | null
  ): Promise<any> {
    const url = `${this.baseUrl}/ingest_files`;
    const formData = new FormData();
    console.log('metadatas = ', metadatas);
    console.log('userIds = ', userIds);

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('metadatas', JSON.stringify(metadatas || null));

    if (ids !== undefined && ids !== null) {
      formData.append('ids', JSON.stringify(ids));
    } else {
      formData.append('ids', JSON.stringify(null));
    }

    if (userIds !== undefined && userIds !== null) {
      formData.append('user_ids', JSON.stringify(userIds));
    } else {
      formData.append('user_ids', JSON.stringify(null));
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const responseJson = await response.json();
      throw new Error(responseJson.detail);
    }

    return response.json();
  }

  async updateDocuments(documents: Record<string, any>[]): Promise<any> {
    const url = `${this.baseUrl}/update_documents`;
    const data = { documents };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, defaultSerializer),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  }

  async updateFiles(
    metadatas: Record<string, any>[] | null,
    files: File[],
    ids: string[],
    userIds?: string[] | null
  ): Promise<any> {
    const url = `${this.baseUrl}/update_files`;
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('metadatas', JSON.stringify(metadatas || null));
    formData.append('ids', JSON.stringify(ids));

    if (userIds !== undefined && userIds !== null) {
      formData.append('user_ids', JSON.stringify(userIds));
    } else {
      formData.append('user_ids', JSON.stringify(null));
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const responseJson = await response.json();
      throw new Error(responseJson.detail);
    }

    return response.json();
  }

  async search(
    query: string,
    searchFilters: Record<string, any> = {},
    searchLimit: number = 10
  ): Promise<any> {
    const url = `${this.baseUrl}/search`;
    const data = {
      query,
      search_filters: JSON.stringify(searchFilters),
      search_limit: searchLimit,
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  }

  async rag(
    message: string,
    searchFilters: Record<string, any> = {},
    searchLimit: number = 10,
    generationConfig: Record<string, any> = {},
    streaming: boolean = false
  ): Promise<any> {
    const url = `${this.baseUrl}/rag`;
    const data = {
      message,
      search_filters: JSON.stringify(searchFilters),
      search_limit: searchLimit,
      streaming,
      rag_generation_config: JSON.stringify(generationConfig),
    };

    if (streaming) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              if (reader) {
                const { done, value } = await reader.read();
                if (done) {
                  controller.close();
                  break;
                }
                controller.enqueue(value);
              }
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return stream;
    } else {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return response.json();
    }
  }

  async delete(
    keys: string[],
    values: (boolean | number | string)[]
  ): Promise<any> {
    const url = `${this.baseUrl}/delete`;
    const data = { keys, values };
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  }

  async getLogs(logTypeFilter?: string): Promise<any> {
    const params: Record<string, any> = {};
    if (logTypeFilter) params.log_type_filter = logTypeFilter;

    const queryString = createQueryString(params);
    const url = `${this.baseUrl}/logs${queryString ? '?' + queryString : ''}`;
    console.log('url = ', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const logs = await response.json();

    function parseLogs(logs: any) {
      return logs.results.map((run: any) => {
        const parsedEntries = run.entries.map((entry: any) => {
          let parsedValue;
          try {
            parsedValue = JSON.parse(entry.value);
          } catch (e) {
            parsedValue = entry.value; // Keep as string if JSON parsing fails
          }

          // Format search results if present
          if (entry.key === 'search_results' && Array.isArray(parsedValue)) {
            parsedValue = parsedValue.map((result: any) => {
              let parsedResult;
              try {
                parsedResult = JSON.parse(result);
              } catch (e) {
                parsedResult = result; // Keep as string if JSON parsing fails
              }
              return parsedResult;
            });
          }

          return { key: entry.key, value: parsedValue };
        });
        return {
          run_id: run.run_id,
          run_type: run.run_type,
          entries: parsedEntries,
        };
      });
    }

    return parseLogs(logs);
  }

  async getDocumentsInfo(
    documentIds?: string[] | null,
    userIds?: string[] | null
  ): Promise<any> {
    console.log(`${this.baseUrl}`);
    const url = new URL(`${this.baseUrl}/documents_info`);
    const params: any = {};

    // if (documentIds) params.document_ids = documentIds.join(',');
    // if (userIds) params.user_ids = userIds.join(',');
    if (documentIds && Array.isArray(documentIds)) {
      params.document_ids = documentIds.join(',');
    }
    if (userIds && Array.isArray(userIds)) {
      params.user_ids = userIds.join(',');
    }

    // Append parameters to URL
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key])
    );

    console.log('getting documents info from url = ', url.toString());
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    console.log('response = ', response);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }

  async getUsersStats(userIds?: string[] | null): Promise<any> {
    const params: Record<string, any> = {};
    if (userIds) params.user_ids = userIds.join(',');

    const queryString = createQueryString(params);
    const url = `${this.baseUrl}/users_stats${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }

  async getAppSettings(): Promise<any> {
    const url = `${this.baseUrl}/app_settings`;
    const response = await fetch(url, {
      method: 'GET',
    });

    console.log('getAppSettings response = ', response);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  }

  generateRunId() {
    return uuidv4();
  }

  generateIdFromLabel(label: string) {
    const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    return uuidv5(label, NAMESPACE_DNS);
  }
}
