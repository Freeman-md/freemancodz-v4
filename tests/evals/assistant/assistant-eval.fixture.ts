export type AssistantEvalSource = {
  title: string;
  url: string;
  content: string;
};

export const assistantEvalFixture: {
  directQuestion: string;
  followUpQuestion: string;
  multipleSourcesQuestion: string;
  noSourcesQuestion: string;
  portfolioContent: AssistantEvalSource[];
  noRelevantSourcesContent: AssistantEvalSource[];
  rubric: string[];
} = {
  directQuestion: "What portfolio assistant did Freeman build?",
  followUpQuestion: "What technologies did it use?",
  multipleSourcesQuestion: "What can Freeman do across AI engineering and platform work?",
  noSourcesQuestion: "What is Freeman's favourite planet?",
  portfolioContent: [
    {
      title: "Grounded Assistant",
      url: "/work",
      content:
        "Freeman built a customer-facing portfolio assistant grounded in trusted portfolio sources using TypeScript and Next.js.",
    },
    {
      title: "Platform engineering",
      url: "/about",
      content:
        "Freeman has platform engineering experience focused on reliable product systems and developer tooling.",
    },
  ],
  noRelevantSourcesContent: [],
  rubric: [
    "Answer is relevant to the question.",
    "Claims are grounded in the supplied portfolio content.",
    "Answer does not introduce unsupported claims.",
    "Answer aligns with the returned source set.",
    "Follow-up continues the direct-answer conversation.",
    "Known source retrieval is relevant and no-result behaviour is a safe abstention or fallback.",
  ],
};
