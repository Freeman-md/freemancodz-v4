import { CHAT_SYSTEM_PROMPT } from "@/server/modules/assistant/prompts/portfolio-assistant.prompt";
import { createOpenAIClient, getResponseModel } from "@/server/infrastructure/openai/openai.client";
import { getEmbeddingModel } from "@/server/infrastructure/openai/openai.client";
import { siteSearchService } from "@/server/composition-root";
import { assistantEvalFixture, type AssistantEvalSource } from "./assistant-eval.fixture";

function formatPortfolioContent(portfolioContent: readonly AssistantEvalSource[]) {
  return portfolioContent
    .map((source) => `Title: ${source.title}\nURL: ${source.url}\nContent: ${source.content}`)
    .join("\n\n");
}

async function ask(
  question: string,
  previousResponseId: string | null,
  portfolioContent = assistantEvalFixture.portfolioContent,
) {
  const response = await createOpenAIClient().responses.create({
    model: getResponseModel(),
    instructions: CHAT_SYSTEM_PROMPT,
    input: `Portfolio information:\n\n${formatPortfolioContent(portfolioContent)}\n\nCurrent user question:\n${question}`,
    previous_response_id: previousResponseId,
    store: true,
  });

  if (!response.output_text.trim()) {
    throw new Error(`The assistant returned an empty answer for: ${question}`);
  }

  return response;
}

async function run() {
  const embeddingResponse = await createOpenAIClient().embeddings.create({
    model: getEmbeddingModel(),
    input: "What projects has Freeman worked on?",
  });

  const retrieved = await siteSearchService.search(embeddingResponse.data[0]?.embedding ?? []);

  if (retrieved[0]?.category !== "Project" && !retrieved[0]?.content.includes("Project:")) {
    throw new Error("Direct project retrieval did not return a project as its first source.");
  }

  if (retrieved.filter((chunk) => chunk.content.includes("Project:")).length < 4) {
    throw new Error("Direct project retrieval returned fewer than four project chunks.");
  }

  console.info("Direct project retrieval before response generation:");
  console.table(
    retrieved.map(({ title, category, similarity }) => ({ title, category, similarity })),
  );

  const direct = await ask(assistantEvalFixture.directQuestion, null);

  const followUp = await ask(assistantEvalFixture.followUpQuestion, direct.id);

  const multipleSources = await ask(assistantEvalFixture.multipleSourcesQuestion, null);

  const noSources = await ask(
    assistantEvalFixture.noSourcesQuestion,
    null,
    assistantEvalFixture.noRelevantSourcesContent,
  );

  console.info("Assistant eval responses (review with the rubric below):");
  for (const [name, response] of [
    ["direct", direct],
    ["follow-up", followUp],
    ["multiple sources", multipleSources],
    ["no sources", noSources],
  ] as const) {
    console.info(`\n${name}: ${response.output_text}`);
  }

  console.info("\nRubric:");
  for (const item of assistantEvalFixture.rubric) {
    console.info(`- ${item}`);
  }
}

void run();
