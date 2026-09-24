import {
  Award,
  Clock,
  Coffee,
  Compass,
  Globe,
  GraduationCap,
  HeartPulse,
  Home,
  Lightbulb,
  Rocket,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Icon names storable in the site config (functions cannot live in localStorage). */
export const iconMap = {
  compass: Compass,
  users: Users,
  sparkles: Sparkles,
  graduation: GraduationCap,
  wallet: Wallet,
  heart: HeartPulse,
  home: Home,
  rocket: Rocket,
  target: Target,
  shield: Shield,
  globe: Globe,
  award: Award,
  clock: Clock,
  coffee: Coffee,
  trending: TrendingUp,
  lightbulb: Lightbulb,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconMap;

export const iconNames = Object.keys(iconMap) as IconName[];

export function getIcon(name: string): LucideIcon {
  return iconMap[name as IconName] ?? Sparkles;
}
