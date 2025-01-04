import { FastifyInstance } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import { getDocumentStore } from "../../utils/getDocumentStore";
import { getVectorStore } from "../../utils/getVectorStore";
import { getSemanticChunkedText } from "../../utils/getSemanticChunkedText";
import { getChunkedText } from "../../utils/getChunkedText";
import { createEmbedding } from "../../utils/createEmbedding";
import { createDocumentsTable } from "../../utils/createDocumentsTable";
import { saveFileToDatabase } from "../../utils/saveFileToDatabase";

const USE_SEMANTIC_CHUNKING = process.env.USE_SEMANTIC_CHUNKING === "true";
const getChunks = USE_SEMANTIC_CHUNKING ? getSemanticChunkedText : getChunkedText;

const ROUTE_SCHEMA = {
  schema: {
    consumes: ["multipart/form-data"],
    description: "Upload a document",
    summary: "Uploads a document to the server",
    tags: ['documents'],
  },
};

async function processChunks(fileContent: string, fileName: string) {
  const vectorStore = getVectorStore();
  await vectorStore.connect();
  await vectorStore.createTables();
  await vectorStore.createIndex();

  const docChunks = await getChunks(fileContent, fileName);
  for (const chunk of docChunks) {
    chunk.embedding = await createEmbedding(chunk.content);
  }

  await vectorStore.upsert(docChunks);
  await vectorStore.disconnect();
}

export const documentUploadRoute = (server: FastifyInstance) => {
  server.post("/upload", ROUTE_SCHEMA, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      reply.code(400);
      return "No file uploaded.";
    }

    const pgClient = getDocumentStore();
    try {
      await pgClient.connect();
      await createDocumentsTable(pgClient);

      const file: MultipartFile = data;
      const fileBuffer = await file.toBuffer();
      const fileName = file.filename;

      await saveFileToDatabase(pgClient, fileName, fileBuffer);

      const fileContent = fileBuffer.toString("utf-8");
      await processChunks(fileContent, fileName);

      return { message: "File uploaded successfully" };
    } catch (error) {
      console.error("Error uploading file:", error);
      reply.code(500);
      return "Error uploading file";
    } finally {
      await pgClient.end();
    }
  });
};