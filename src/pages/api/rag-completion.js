import { r2rClient } from 'r2r-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url, `http://${req.headers.get('host')}`);
  const queryObject = Object.fromEntries(url.searchParams);
  const client = new r2rClient(queryObject.apiUrl);

  const searchFilters = {}; //  user_id: queryObject.userId };

  const generationConfig = {
    temperature: parseFloat(queryObject.temperature) || 0.1,
    top_p: parseFloat(queryObject.topP) || 1,
    top_k: parseInt(queryObject.topK) || 100,
    max_tokens_to_sample: parseInt(queryObject.maxTokensToSample) || 1024,
    model: queryObject.model || 'gpt-4-turbo',
    stream: true,
  };

  try {
    const response = await client.rag(
      queryObject.query,
      queryObject.vectorSearch === 'true',
      searchFilters,
      parseInt(queryObject.searchLimit) || 10,
      queryObject.hybridSearch === 'true',
      queryObject.useKnowledgeGraph === 'true',
      generationConfig,
      generationConfig
    );

    if (generationConfig.stream) {
      return new Response(response, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    } else {
      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching data', error);
    return new Response(
      JSON.stringify({
        error: 'Error fetching data',
        message: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
