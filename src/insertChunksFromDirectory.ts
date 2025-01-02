import 'dotenv/config'
import { createEmbedding } from "./utils/createEmbedding";
import { getVectorStore } from "./utils/getVectorStore";
import { getAllFiles } from './utils/getAllFiles';
import { getSemanticChunkedText } from './utils/getSemanticChunkedText';
import { getChunkedText } from './utils/getChunkedText';
import { getFileAsString } from './utils/getFileAsString';
import { getDocumentStore } from './utils/getDocumentStore';
import { saveFileToDatabase } from './utils/saveFileToDatabase';

const USE_SEMANTIC_CHUNKING = process.env.USE_SEMANTIC_CHUNKING === "true";
const getChunks = USE_SEMANTIC_CHUNKING ? getSemanticChunkedText : getChunkedText;

const main = async () => {
  const directoryPath = process.argv[2];

  if (!directoryPath) {
    console.error("Please provide the docs directory path as an argument.");
    process.exit(1);
  }

  const pgClient = getDocumentStore();
  await pgClient.connect();

  const vectorStore = getVectorStore();
  await vectorStore.connect();
  await vectorStore.createTables();
  await vectorStore.createIndex();

  const allFiles = await getAllFiles(directoryPath);

  for (const file of allFiles) {
    const fileContent = await getFileAsString(file);

    const fileBuffer = Buffer.from(fileContent, 'utf-8');
    await saveFileToDatabase(pgClient, file, fileBuffer);

    const docChunks = await getChunks(fileContent, file);
    for (const chunk of docChunks) {
      chunk.embedding = await createEmbedding(chunk.content);
    }

    await vectorStore.upsert(docChunks);
  }

  await pgClient.end();
  await vectorStore.disconnect();
};

main().catch(console.error);
