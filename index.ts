import fastify from 'fastify';
import { getVectorStore } from './utils/getVectorStore';
import { generateResponse } from './utils/generateResponse';
import { VectorStore } from './utils/vectorstore';

const server = fastify({
  logger: true
});

let vectorStore: VectorStore;
const getInitializedVectorStore = async () => {
  if (vectorStore) {
    return vectorStore;
  }

  vectorStore = getVectorStore();

  await vectorStore.connect();

  return vectorStore;
}

server.get('/ai-search', async (request, reply) => {
  // @ts-ignore
  const searchText = request.query?.searchText;
  if (!searchText) {
    reply.code(400);

    return "Please provide the searchText as a query parameter.";
  }

  // @ts-ignore
  const dbResultLimit = parseInt(request.query?.dbResultLimit, 10) || 3;

  const initializedVectorStore = await getInitializedVectorStore();
  const results = await initializedVectorStore.search(searchText, dbResultLimit);
  const context = Array.isArray(results) ? results : [results];

  try {
    const response = await generateResponse(searchText, context);

    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    reply.code(500);

    return 'Error generating response';
  }
});

const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
