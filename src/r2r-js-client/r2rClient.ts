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
    name: string = "default_system",
    template?: string,
    inputTypes?: Record<string, string>
  ): Promise<any> {
    const url = `${this.baseUrl}/v1/update_prompt`;
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

  async ingestDocuments(
    documents: Record<string, any>[],
    versions?: string[]
  ): Promise<any> {
    const url = `${this.baseUrl}/v1/ingest_documents`;
    const data = { documents, versions };
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
    files: File[],
    metadatas?: Record<string, any>[] | null,
    documentIds?: string[] | null,
    userIds?: string[] | null,
    versions?: string[] | null,
    skipDocumentInfo: boolean = false
  ): Promise<any> {
    const url = `${this.baseUrl}/v1/ingest_files`;
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('metadatas', JSON.stringify(metadatas || null));
    formData.append('document_ids', JSON.stringify(documentIds || null));
    formData.append('user_ids', JSON.stringify(userIds || null));
    formData.append('versions', JSON.stringify(versions || null));
    formData.append('skip_document_info', JSON.stringify(skipDocumentInfo));

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

  async updateDocuments(
    documents: Record<string, any>[],
    versions?: string[],
    metadatas?: Record<string, any>[]
  ): Promise<any> {
    const url = `${this.baseUrl}/v1/update_documents`;
    const data = { documents, versions, metadatas };
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
    files: File[],
    documentIds: string[],
    metadatas?: Record<string, any>[]
  ): Promise<any> {
    const url = `${this.baseUrl}/v1/update_files`;
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('document_ids', JSON.stringify(documentIds));
    formData.append('metadatas', JSON.stringify(metadatas || null));

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
    useVectorSearch: boolean = true,
    searchFilters: Record<string, any> = {},
    searchLimit: number = 10,
    doHybridSearch: boolean = false,
    useKg: boolean = false,
    kgAgentGenerationConfig?: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}/v1/search`;
    const data = {
      query,
      vector_settings: {
        use_vector_search: useVectorSearch,
        search_filters: searchFilters,
        search_limit: searchLimit,
        do_hybrid_search: doHybridSearch,
      },
      kg_settings: {
        use_kg: useKg,
        agent_generation_config: kgAgentGenerationConfig,
      },
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
    query: string,
    useVectorSearch: boolean = true,
    searchFilters: Record<string, any> = {},
    searchLimit: number = 10,
    doHybridSearch: boolean = false,
    useKg: boolean = false,
    kgAgentGenerationConfig?: Record<string, any>,
    ragGenerationConfig?: Record<string, any>
  ): Promise<any> {
    console.log('Got into the rag function');
    const url = `${this.baseUrl}/v1/rag`;

    const data = {
      query,
      vector_settings: {
        use_vector_search: useVectorSearch,
        search_filters: searchFilters,
        search_limit: searchLimit,
        do_hybrid_search: doHybridSearch,
      },
      kg_settings: {
        use_kg: useKg,
        agent_generation_config: kgAgentGenerationConfig,
      },
      rag_generation_config: ragGenerationConfig,
    };
    console.log('data = ', data);

    if (ragGenerationConfig?.stream) {
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
      return new ReadableStream({
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
    const url = `${this.baseUrl}/v1/delete`;
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
    if (logTypeFilter) {
      params.log_type_filter = logTypeFilter;
    }

    const queryString = createQueryString(params);
    const url = `${this.baseUrl}/v1/logs${queryString ? '?' + queryString : ''}`;

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
    const url = new URL(`${this.baseUrl}/v1/documents_info`);
    const params: any = {};

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
      method: 'POST',
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

  async getDocumentChunks(documentId: string): Promise<any> {
    const url = `${this.baseUrl}/v1/document_chunks?document_id=${documentId}`;
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

  async getAnalytics(
    filterCriteria: Record<string, any>,
    analysisTypes: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}/v1/analytics`;
    const data: Record<string, any> = {
      filter_criteria: {
        filters: filterCriteria,
      },
      analysis_types: {
        analysis_types: analysisTypes,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          `Error occurred while calling analytics API. Status Code: ${response.status}, Error Message: ${errorMessage}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error(
          `Error occurred while calling analytics API. ${error.message}`
        );
      }
      throw error;
    }
  }

  async getUsersStats(userIds?: string[] | null): Promise<any> {
    const params: Record<string, any> = {};
    if (userIds) {
      params.user_ids = userIds.join(',');
    }

    const queryString = createQueryString(params);
    const url = `${this.baseUrl}/v1/users_stats${queryString ? '?' + queryString : ''}`;

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
    const url = `${this.baseUrl}/v1/app_settings`;
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
