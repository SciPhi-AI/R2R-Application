import { r2rClient, DEFAULT_GENERATION_CONFIG } from 'r2r-js';

export const config = {
  runtime: 'edge',
};

const DEFAULT_SEARCH_LIMIT = 10;

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
      ...DEFAULT_GENERATION_CONFIG,
      temperature:
        parseFloat(body.temperature) ?? DEFAULT_GENERATION_CONFIG.temperature,
      top_p: parseFloat(body.topP) ?? DEFAULT_GENERATION_CONFIG.top_p,
      top_k: parseInt(body.topK) ?? DEFAULT_GENERATION_CONFIG.top_k,
      max_tokens_to_sample:
        parseInt(body.maxTokensToSample) ??
        DEFAULT_GENERATION_CONFIG.max_tokens_to_sample,
      model: body.model || DEFAULT_GENERATION_CONFIG.model,
      stream: body.stream ?? DEFAULT_GENERATION_CONFIG.stream,
    };

    const response = await client.rag(
      body.query,
      body.vectorSearch ?? true,
      searchFilters,
      parseInt(body.searchLimit) || DEFAULT_SEARCH_LIMIT,
      body.hybridSearch ?? false,
      body.useKnowledgeGraph ?? false,
      generationConfig, // for knowledge graph
      generationConfig // for RAG
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
