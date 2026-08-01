import { createHash } from "node:crypto";
import type { IndexDocument } from "../mappers/source-document.mapper";

const MAX_CHUNK_CHARACTERS = 1_200;

const INDEX_FORMAT_VERSION = "search-index-v2";

export type PreparedSiteChunk = {
  id: string;
  sourceType: IndexDocument["sourceType"];
  sourceId: string;
  chunkIndex: number;
  title: string;
  category: string;
  url: string;
  keywords: string[];
  content: string;
  embeddingInput: string;
  contentHash: string;
};

function splitOversizedParagraph(paragraph: string): string[] {
  const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph];

  const pieces: string[] = [];

  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > MAX_CHUNK_CHARACTERS) {
      const words = sentence.trim().split(/\s+/);

      for (const word of words) {
        if (word.length > MAX_CHUNK_CHARACTERS) {
          if (current) {
            pieces.push(current);
            current = "";
          }

          for (let start = 0; start < word.length; start += MAX_CHUNK_CHARACTERS) {
            pieces.push(word.slice(start, start + MAX_CHUNK_CHARACTERS));
          }

          continue;
        }

        if (current && current.length + word.length + 1 > MAX_CHUNK_CHARACTERS) {
          pieces.push(current);
          current = "";
        }

        current = current ? `${current} ${word}` : word;
      }
    } else if (current && current.length + sentence.length + 1 > MAX_CHUNK_CHARACTERS) {
      pieces.push(current);
      current = sentence.trim();
    } else {
      current = current ? `${current} ${sentence.trim()}` : sentence.trim();
    }
  }

  if (current) {
    pieces.push(current);
  }

  return pieces;
}

export function chunkText(paragraphs: string[]): string[] {
  const chunks: string[] = [];

  let current = "";

  for (const raw of paragraphs) {
    const paragraph = raw.trim();

    if (!paragraph) {
      continue;
    }

    const parts =
      paragraph.length > MAX_CHUNK_CHARACTERS ? splitOversizedParagraph(paragraph) : [paragraph];

    for (const part of parts) {
      if (current && current.length + part.length + 2 > MAX_CHUNK_CHARACTERS) {
        chunks.push(current);
        current = part;
      } else {
        current = current ? `${current}\n\n${part}` : part;
      }
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export function prepareSiteChunks(document: IndexDocument): PreparedSiteChunk[] {
  const keywords = [
    ...new Set(document.keywords.map((keyword) => keyword.trim()).filter(Boolean)),
  ].sort();

  return chunkText(document.paragraphs).map((content, chunkIndex) => {
    const embeddingInput = [
      `Record type: ${document.sourceType}`,
      `Title: ${document.title}`,
      `Category: ${document.category}`,
      `Keywords: ${keywords.join(", ")}`,
      `Content: ${content}`,
    ].join("\n");

    const contentHash = createHash("sha256")
      .update(`${INDEX_FORMAT_VERSION}\n${embeddingInput}`)
      .digest("hex");

    return {
      id: `${document.sourceType}:${document.sourceId}:${chunkIndex}`,
      sourceType: document.sourceType,
      sourceId: document.sourceId,
      chunkIndex,
      title: document.title,
      category: document.category,
      url: document.url,
      keywords,
      content,
      embeddingInput,
      contentHash,
    };
  });
}
