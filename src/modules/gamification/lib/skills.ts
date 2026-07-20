/**
 * Skill tree definitions. Each skill levels independently using the same
 * leveling curve as the character. Client-safe (no server imports).
 */

export type SkillCategory =
  | "Technical"
  | "Wellbeing"
  | "Personal"
  | "Finance";

export type SkillDefinition = {
  id: string;
  name: string;
  category: SkillCategory;
  /** lucide-react icon name, resolved on the client. */
  icon: string;
  description: string;
};

export const SKILLS: SkillDefinition[] = [
  {
    id: "programming",
    name: "Programming",
    category: "Technical",
    icon: "Code2",
    description: "General software engineering craft.",
  },
  {
    id: "dsa",
    name: "DSA",
    category: "Technical",
    icon: "Binary",
    description: "Data structures & algorithms.",
  },
  {
    id: "system-design",
    name: "System Design",
    category: "Technical",
    icon: "Network",
    description: "Designing scalable systems.",
  },
  {
    id: "backend",
    name: "Backend",
    category: "Technical",
    icon: "Server",
    description: "APIs, databases, infrastructure.",
  },
  {
    id: "frontend",
    name: "Frontend",
    category: "Technical",
    icon: "LayoutTemplate",
    description: "UI, UX, and web platform.",
  },
  {
    id: "ai-ml",
    name: "AI / ML",
    category: "Technical",
    icon: "BrainCircuit",
    description: "Machine learning and AI systems.",
  },
  {
    id: "communication",
    name: "Communication",
    category: "Personal",
    icon: "MessagesSquare",
    description: "Speaking, writing, and collaboration.",
  },
  {
    id: "writing",
    name: "Writing",
    category: "Personal",
    icon: "PenLine",
    description: "Clear, persuasive writing.",
  },
  {
    id: "reading",
    name: "Reading",
    category: "Personal",
    icon: "BookOpen",
    description: "Books, articles, and study.",
  },
  {
    id: "fitness",
    name: "Fitness",
    category: "Wellbeing",
    icon: "Dumbbell",
    description: "Exercise, strength, and health.",
  },
  {
    id: "finance",
    name: "Finance",
    category: "Finance",
    icon: "Wallet",
    description: "Budgeting, saving, and investing.",
  },
];

export const SKILL_IDS = SKILLS.map((s) => s.id);

export function getSkill(id: string): SkillDefinition | undefined {
  return SKILLS.find((s) => s.id === id);
}
