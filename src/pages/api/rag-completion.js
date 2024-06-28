import { r2rClient } from 'r2r-js';

const DEFAULT_CONFIG = {
  temperature: 0.1,
  top_p: 1,
  top_k: 100,
  max_tokens_to_sample: 1024,
  model: 'gpt-4-turbo',
  search_limit: 10,
};

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();

    if (!body.query || !body.apiUrl) {
      throw new Error('Missing required fields: query and apiUrl');
    }

    const client = new r2rClient(body.apiUrl);

    const searchFilters = {};

    const generationConfig = {
      temperature: parseFloat(body.temperature) || DEFAULT_CONFIG.temperature,
      top_p: parseFloat(body.topP) || DEFAULT_CONFIG.top_p,
      top_k: parseInt(body.topK) || DEFAULT_CONFIG.top_k,
      max_tokens_to_sample:
        parseInt(body.maxTokensToSample) || DEFAULT_CONFIG.max_tokens_to_sample,
      model: body.model || DEFAULT_CONFIG.model,
      stream: true,
    };

    const response = await client.rag(
      body.query,
      body.vectorSearch ?? true,
      searchFilters,
      parseInt(body.searchLimit) || DEFAULT_CONFIG.search_limit,
      body.hybridSearch ?? false,
      body.useKnowledgeGraph ?? false,
      generationConfig,
      generationConfig
    );

    if (generationConfig.stream) {
      return new Response(response, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
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
    console.error('Error processing request:', error);

    return new Response(
      JSON.stringify({
        error: 'Error processing request',
        message: error.message,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
