import { v4 as uuidv4 } from "uuid";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader } from "langchain/document_loaders/fs/text";

interface TextChunk {
  id: string;
  content: string;
  metadata: {
    type: "paragraph" | "heading" | "list_item" | "other";
    headingLevel?: number;
  };
  path: string;
  startLine: number;
  endLine: number;
  embedding?: number[];
}

export const getChunkedText = async (textFilePath: string): Promise<TextChunk[]> => {
  console.log(`Text file path: ${textFilePath}`);

  const loader = new TextLoader(textFilePath);
  const documents = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
    separators: ["\n\n", "\n", "```", "/*", "*/", "//", " ", ""],
    keepSeparator: true
  });

  const chunks: TextChunk[] = [];
  const langchainChunks = await textSplitter.splitDocuments(documents);

  let currentLine = 1;
  langchainChunks.forEach((chunk, index) => {
    const lines = chunk.pageContent.split("\n");
    const startLine = currentLine;
    const endLine = startLine + lines.length - 1;

    // Type detection logic
    let type: TextChunk["metadata"]["type"] = "other";
    const firstLine = lines[0].trim();

    if (firstLine.match(/^#+\s/)) {
      type = "heading";
    } else if (firstLine.match(/^[\-\*]\s/)) {
      type = "list_item";
    } else if (firstLine.length > 0) {
      type = "paragraph";
    }

    chunks.push({
      id: uuidv4(),
      content: chunk.pageContent,
      metadata: { type },
      path: textFilePath,
      startLine,
      endLine,
    });

    currentLine = endLine + 1;
  });

  return chunks;
};