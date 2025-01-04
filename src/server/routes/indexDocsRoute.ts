import { FastifyInstance } from "fastify";
import { getVectorStore } from "../../utils/getVectorStore";
import { getAllFiles } from "../../utils/getAllFiles";
import { getSemanticChunkedText } from "../../utils/getSemanticChunkedText";
import { getChunkedText } from "../../utils/getChunkedText";
import { createEmbedding } from "../../utils/createEmbedding";
import { getDocumentStore } from "../../utils/getDocumentStore";
import { getFileAsString } from "../../utils/getFileAsString";
import { saveFileToDatabase } from "../../utils/saveFileToDatabase";

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
      const pgClient = getDocumentStore();
      await pgClient.connect();

      const vectorStore = getVectorStore();
      await vectorStore.connect();
      await vectorStore.createTables();
      await vectorStore.createIndex();

      const allFiles = await getAllFiles('docs');

      for (const file of allFiles) {
        const fileContent = await getFileAsString(file);

        const fileBuffer = Buffer.from(fileContent, 'utf-8');
        await saveFileToDatabase(pgClient, file, fileBuffer);

        const docChunks = await getChunks(file);

        for (const chunk of docChunks) {
          chunk.embedding = await createEmbedding(chunk.content);
        }

        await vectorStore.upsert(docChunks);
      }

      await pgClient.end();
      await vectorStore.disconnect();
    }
  );
}