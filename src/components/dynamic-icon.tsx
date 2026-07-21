import {
  Code2,
  Binary,
  Network,
  Server,
  LayoutTemplate,
  BrainCircuit,
  MessagesSquare,
  PenLine,
  BookOpen,
  Dumbbell,
  Wallet,
  Footprints,
  Sprout,
  ShieldCheck,
  Wrench,
  Crown,
  Flame,
  CalendarCheck,
  Trophy,
  Zap,
  Rocket,
  Brain,
  Sparkles,
  CheckCheck,
  Briefcase,
  HeartPulse,
  Users,
  Utensils,
  Moon,
  User,
  Circle,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated icon registry for skill and achievement metadata, which store icon
 * names as strings. Falls back to a neutral icon for unknown names.
 */
const ICONS: Record<string, LucideIcon> = {
  Code2,
  Binary,
  Network,
  Server,
  LayoutTemplate,
  BrainCircuit,
  MessagesSquare,
  PenLine,
  BookOpen,
  Dumbbell,
  Wallet,
  Footprints,
  Sprout,
  ShieldCheck,
  Wrench,
  Crown,
  Flame,
  CalendarCheck,
  Trophy,
  Zap,
  Rocket,
  Brain,
  Sparkles,
  CheckCheck,
  Briefcase,
  HeartPulse,
  Users,
  Utensils,
  Moon,
  User,
};

export function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Circle;
  return <Icon className={className} />;
}
