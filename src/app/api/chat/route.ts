import { NextResponse } from "next/server";
import { createOpenAIClient, getResponseModel } from "@/lib/openai";
import { retrieveContext } from "@/lib/rag/retrieve-context";

const NO_ANSWER_FALLBACK = "I don’t have enough information to answer that.";

type ChatRequestBody = {
  message?: unknown;
};

function formatContext(
  chunks: Awaited<ReturnType<typeof retrieveContext>>["chunks"],
) {
  return chunks
    .map(
      (chunk, index) =>
        [
          `Source ${index + 1}`,
          `ID: ${chunk.id}`,
          `Title: ${chunk.title}`,
          `Category: ${chunk.category}`,
          `URL: ${chunk.url}`,
          `Keywords: ${chunk.keywords.join(", ")}`,
          `Content: ${chunk.content}`,
        ].join("\n"),
    )
    .join("\n\n");
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 },
    );
  }

  if (message.length > 500) {
    return NextResponse.json(
      { error: "Message must be 500 characters or fewer." },
      { status: 400 },
    );
  }

  const { chunks, sources } = await retrieveContext(message);

  if (chunks.length === 0) {
    return NextResponse.json({
      answer: NO_ANSWER_FALLBACK,
      sources: [],
    });
  }

  const openai = createOpenAIClient();
  const response = await openai.responses.create({
    model: getResponseModel(),
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `You are Freeman's portfolio assistant.

Your role is to help visitors understand Freeman's background, engineering approach, projects, technical skills, and professional experience.

Your goal is not simply to answer questions, but to communicate Freeman's work clearly, accurately, and confidently while remaining grounded in the portfolio information you are given.

When answering:

- Answer naturally, as if speaking with someone exploring Freeman's portfolio.
- Lead with the answer instead of unnecessary caveats.
- Highlight relevant strengths, engineering decisions, and evidence from the portfolio whenever appropriate.
- Connect related information across multiple portfolio entries when it helps answer the question.
- For evaluative questions (for example, "Would he be a good hire?" or "What is he strongest at?"), form a reasonable professional judgement based only on the available portfolio information and explain the reasoning.
- It is acceptable to summarize, compare, synthesize, and draw reasonable conclusions from multiple pieces of information.
- Distinguish clearly between facts stated in the portfolio and reasonable inferences.
- If something cannot be determined from the available information, say so naturally without mentioning "context", "retrieval", or internal implementation details.

Never:
- invent projects, employers, achievements, metrics, or technologies
- exaggerate claims
- use outside knowledge about Freeman
- present speculation as fact

Communication style:

- Professional.
- Helpful.
- Confident without overselling.
- Conversational.
- Concise by default, but expand when the question deserves a deeper answer.
- Avoid unnecessary disclaimers.
- Avoid phrases like "the context says", "based on the provided context", or "retrieved information".

Remember that this chatbot represents Freeman publicly. Every answer should help a visitor understand who he is, what he has built, how he thinks, and where he can provide value, while remaining truthful and evidence-based.`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Portfolio information:\n\n${formatContext(chunks)}\n\nUser question:\n${message}`,
          },
        ],
      },
    ],
  });

  return NextResponse.json({
    answer: response.output_text || NO_ANSWER_FALLBACK,
    sources,
  });
}
