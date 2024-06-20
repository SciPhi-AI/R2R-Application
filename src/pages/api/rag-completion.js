import url from 'url';

import { R2RClient } from '../../r2r-js-client/r2rClient';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const queryObject = url.parse(req.url, true).query;
  const client = new R2RClient(queryObject.apiUrl);
  const message = queryObject.query;
  const searchFilters = queryObject.searchFilters
    ? JSON.parse(queryObject.searchFilters)
    : {};
  searchFilters['user_id'] = queryObject.userId;
  const searchLimit = queryObject.searchLimit
    ? parseInt(queryObject.searchLimit)
    : 10;

  //TODO: Move defaults to constants
  const temperature = queryObject.temperature
    ? parseFloat(queryObject.temperature)
    : 0.1;
  const topP = queryObject.topP ? parseFloat(queryObject.topP) : 1;
  const topK = queryObject.topK ? parseInt(queryObject.topK) : 100;
  const max_tokens_to_sample = queryObject.max_tokens_to_sample
    ? parseInt(queryObject.max_tokens_to_sample)
    : 1024;
  const model = queryObject.model || 'gpt-4-turbo';
  const streaming = true;

  const doHybridSearch = queryObject.hybridSearch
    ? queryObject.hybridSearch === 'true'
    : false;
  const vectorSearch = queryObject.vectorSearch
    ? queryObject.vectorSearch === 'true'
    : false;
  const useKnowledgeGraph = queryObject.useKnowledgeGraph
    ? queryObject.useKnowledgeGraph === 'true'
    : false;

  const generationConfig = {
    temperature: temperature,
    top_p: topP,
    top_k: topK,
    max_tokens_to_sample: max_tokens_to_sample,
    model: model,
    stream: streaming,
  };

  console.log('generationConfig', generationConfig);

  try {
    if (streaming) {
      const responseStream = await client.rag(
        message,
        vectorSearch,
        searchFilters,
        searchLimit,
        doHybridSearch,
        useKnowledgeGraph,
        generationConfig, // TODO: Need to add ability to set a KG config that differs from the generation config
        generationConfig
      );

      const readableStream = new ReadableStream({
        async start(controller) {
          const reader = responseStream.getReader();

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                break;
              }
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const response = await client.rag(
        message,
        vectorSearch,
        searchFilters,
        searchLimit,
        doHybridSearch,
        useKnowledgeGraph,
        generationConfig, // TODO: Need to add ability to set a KG config that differs from the generation config
        generationConfig
      );
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
