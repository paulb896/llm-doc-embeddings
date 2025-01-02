import { FastifyInstance } from "fastify";
import { getVectorStore } from "../../utils/getVectorStore";
import { getAllFiles } from "../../utils/getAllFiles";
import { getSemanticChunkedText } from "../../utils/getSemanticChunkedText";
import { getChunkedText } from "../../utils/getChunkedText";
import { createEmbedding } from "../../utils/createEmbedding";

const USE_SEMANTIC_CHUNKING = process.env.USE_SEMANTIC_CHUNKING === "true";
const getChunks = USE_SEMANTIC_CHUNKING ? getSemanticChunkedText : getChunkedText;

const ROUTE_SCHEMA = {
  schema: {
    description: 'Index all of the documents in the docs directory',
    tags: ['indexer'],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', description: 'Success of the indexing operation' }
        }
      }
    }
  }
};

export const indexDocsRoute = async (server: FastifyInstance) => {
  server.get(
    '/index-docs',
    ROUTE_SCHEMA,
    async () => {
      const vectorStore = getVectorStore();
      await vectorStore.connect();
      await vectorStore.createTables();
      await vectorStore.createIndex();

      const allFiles = await getAllFiles('docs');

      for (const file of allFiles) {
        const docChunks = await getChunks(file);

        for (const chunk of docChunks) {
          chunk.embedding = await createEmbedding(chunk.content);
        }

        await vectorStore.upsert(docChunks);
      }

      await vectorStore.disconnect();
    }
  );
}