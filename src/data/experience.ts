export type Experience = {
  title: string;
  company: string;
  dates: string;
  location?: string;
  focus: string;
  category: string;
};

export const experiences: Experience[] = [
  {
    title: "Pay4Me / WithRadius",
    company: "Commercial fintech product team",
    dates: "2022 - 2023",
    category: "Fintech",
    focus:
      "Frontend product delivery across payments, collaboration with engineering and product stakeholders, and production-facing commercial work.",
  },
  {
    title: "Hippodrome Casino",
    company: "Gaming Operations Specialist",
    dates: "2023 - Present",
    category: "Gaming",
    focus:
      "Accuracy, pace, compliance, customer handling, and calm decision-making in a high-volume operational environment.",
  },
  {
    title: "MSc Computer Science",
    company: "Current academic direction",
    dates: "In Progress",
    category: "Academic",
    focus:
      "Research into AI-assisted reliability, observability, and self-healing backend operations systems.",
  },
];
