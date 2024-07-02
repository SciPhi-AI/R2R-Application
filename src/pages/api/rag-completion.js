import { r2rClient, DEFAULT_GENERATION_CONFIG } from 'r2r-js';

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

    const kgGenerationConfig = {
      temperature: body.kg_temperature ?? 0.1,
      top_p: body.kg_topP ?? 1.0,
      top_k: body.kg_topK ?? 100,
      max_tokens_to_sample: body.kg_maxTokensToSample ?? 1024,
      stream: body.stream ?? true,
    };

    const ragGenerationConfig = {
      temperature: body.rag_temperature ?? 0.1,
      top_p: body.rag_topP ?? 1.0,
      top_k: body.rag_topK ?? 100,
      max_tokens_to_sample: body.rag_maxTokensToSample ?? 1024,
      stream: body.stream ?? true,
    };

    try {
      const response = await client.rag({
        query: body.query,
        use_vector_search: body.use_vector_search ?? true,
        search_filters: body.search_filters ?? {},
        search_limit: body.searchLimit,
        do_hybrid_search: body.do_hybrid_search ?? false,
        use_kg_search: body.use_kg_search ?? false,
        kg_generation_config: kgGenerationConfig,
        rag_generation_config: ragGenerationConfig,
      });

      if (ragGenerationConfig.stream) {
        // Streaming response
        return new Response(response, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      } else {
        // Non-streaming response
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
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
  } catch (error) {
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
