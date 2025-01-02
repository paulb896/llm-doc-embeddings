import 'dotenv/config'
import { createEmbedding } from "./utils/createEmbedding";
import { getChunkedText } from "./utils/getChunkedText";
import { getSemanticChunkedText } from "./utils/getSemanticChunkedText";
import { getVectorStore } from "./utils/getVectorStore";
import { getFileAsString } from './utils/getFileAsString';
import { saveFileToDatabase } from './utils/saveFileToDatabase';
import { getDocumentStore } from './utils/getDocumentStore';

const USE_SEMANTIC_CHUNKING = process.env.USE_SEMANTIC_CHUNKING === "true";
const getChunks = USE_SEMANTIC_CHUNKING ? getSemanticChunkedText : getChunkedText;

const main = async () => {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Please provide the file path as an argument.");
    process.exit(1);
  }

  const pgClient = getDocumentStore();
  await pgClient.connect();

  const vectorStore = getVectorStore();
  await vectorStore.connect();
  await vectorStore.createTables();
  await vectorStore.createIndex();

  const fileContent = await getFileAsString(filePath);

  const fileBuffer = Buffer.from(fileContent, 'utf-8');
  await saveFileToDatabase(pgClient, filePath, fileBuffer);
  await pgClient.end();

  const docChunks = await getChunks(fileContent, filePath);
  for (const chunk of docChunks) {
    chunk.embedding = await createEmbedding(chunk.content);
  }

  await vectorStore.upsert(docChunks);

  await vectorStore.disconnect();
};

main().catch(console.error);
