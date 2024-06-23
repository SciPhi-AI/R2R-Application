import url from 'url';
import { R2RClient } from '../../r2r-ts-client/r2rClient';
import {
  R2RRAGRequest,
  VectorSearchSettings,
  KGSearchSettings,
  GenerationConfig,
} from '../../r2r-ts-client/models';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const queryObject = url.parse(req.url, true).query;
  const client = new R2RClient(queryObject.apiUrl);

  const searchFilters = queryObject.searchFilters
    ? JSON.parse(queryObject.searchFilters)
    : {};
  searchFilters['user_id'] = queryObject.userId;

  const generationConfig = {
    temperature: parseFloat(queryObject.temperature) || 0.1,
    top_p: parseFloat(queryObject.topP) || 1,
    top_k: parseInt(queryObject.topK) || 100,
    max_tokens_to_sample: parseInt(queryObject.max_tokens_to_sample) || 1024,
    model: queryObject.model || 'gpt-4-turbo',
    stream: true,
  };

  const vectorSearchSettings = {
    use_vector_search: queryObject.vectorSearch !== 'false',
    search_filters: searchFilters,
    search_limit: parseInt(queryObject.searchLimit) || 10,
    do_hybrid_search: queryObject.hybridSearch === 'true',
  };

  const kgSearchSettings = {
    use_kg_search: queryObject.useKnowledgeGraph === 'true',
    agent_generation_config: generationConfig,
  };

  const ragRequest = {
    query: queryObject.query,
    vector_search_settings: vectorSearchSettings,
    kg_search_settings: kgSearchSettings,
    rag_generation_config: generationConfig,
  };

  try {
    const response = await client.rag(ragRequest);

    if (generationConfig.stream) {
      return new Response(response, {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    } else {
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching data', error);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
