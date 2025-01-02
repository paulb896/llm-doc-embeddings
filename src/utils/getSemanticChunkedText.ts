import { v4 as uuidv4 } from "uuid";
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

export const getSemanticChunkedText = async (textFilePath: string): Promise<TextChunk[]> => {
  console.log(`Text file path: ${textFilePath}`);

  const loader = new TextLoader(textFilePath);
  const documents = await loader.load();
  const fullText = documents[0].pageContent;


  const chunks: TextChunk[] = [];
  // @ts-ignore
  const { chunkit } = await import("semantic-chunking");
  const results = await chunkit([
    {
      document_name: textFilePath,
      document_text: fullText
    }
  ], {
    maxTokens: 500
  });

  let currentLine = 1; 
  for (const chunk of results) {
    const lines = chunk.text.split("\n");
    const startLine = currentLine;
    const endLine = startLine + lines.length - 1;

    chunks.push({
      id: uuidv4(),
      content: chunk.text,
      metadata: { type: 'paragraph' },
      path: textFilePath,
      startLine,
      endLine,
    });

    currentLine = endLine + 1;
  }

  return chunks;
};
