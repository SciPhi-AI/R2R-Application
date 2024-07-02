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
    console.log('Received request body:', JSON.stringify(body, null, 2));

    if (!body.query || !body.apiUrl) {
      throw new Error('Missing required fields: query and apiUrl');
    }

    const client = new r2rClient(body.apiUrl);
    console.log('Created r2rClient with apiUrl:', body.apiUrl);

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

    console.log(
      'Generation config:',
      JSON.stringify(generationConfig, null, 2)
    );

    let response;
    try {
      console.log(
        'Calling client.rag with params:',
        JSON.stringify(
          {
            query: body.query,
            vectorSearch: body.vectorSearch ?? true,
            searchFilters,
            searchLimit: parseInt(body.searchLimit) || DEFAULT_SEARCH_LIMIT,
            hybridSearch: body.hybridSearch ?? false,
            useKnowledgeGraph: body.useKnowledgeGraph ?? false,
            kgGenerationConfig: generationConfig,
            ragGenerationConfig: generationConfig,
          },
          null,
          2
        )
      );

      response = await client.rag(
        body.query,
        body.vectorSearch ?? true,
        searchFilters,
        parseInt(body.searchLimit) || DEFAULT_SEARCH_LIMIT,
        body.hybridSearch ?? false,
        body.useKnowledgeGraph ?? false,
        generationConfig, // for knowledge graph
        generationConfig // for RAG
      );

      console.log('Response received from client.rag');
    } catch (error) {
      console.error('Error in client.rag:', error);
      return new Response(
        JSON.stringify({
          error: 'Error processing request',
          message: error.message,
          stack: error.stack,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Only proceed if we have a valid response
    if (response) {
      console.log('Processing response');
      if (generationConfig.stream) {
        console.log('Returning streaming response');
        return new Response(response, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        });
      } else {
        console.log('Returning JSON response');
        return new Response(JSON.stringify(response), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      }
    } else {
      console.error('No response received from client.rag');
      return new Response(
        JSON.stringify({
          error: 'Error processing request',
          message: 'No response received from client.rag',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
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
