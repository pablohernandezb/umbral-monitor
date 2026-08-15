import type { LucideIcon } from 'lucide-react'
import {
  Feather,
  Shield,
  HeartHandshake,
  Scale,
  Gavel,
  Landmark,
  Building2,
  Users,
  Newspaper,
  Swords,
  Vote,
  ScrollText,
  Eye,
  TrendingUp,
  ShieldAlert,
  Globe,
  HandHeart,
  ArrowLeftRight,
  ClipboardCheck,
  LogOut,
  LogIn,
  ShieldCheck,
  Siren,
  Radar,
  Building,
  Flag,
  Handshake,
  Megaphone,
  Heart,
  RadioTower,
  Plane,
  Banknote,
  Coins,
  Briefcase,
  SearchCheck,
  GraduationCap,
  ClipboardList,
  SquareCheckBig,
  CalendarCheck,
} from 'lucide-react'

/** Pillar key -> icon (§3 of the spec). */
export const PILLAR_ICONS: Record<string, LucideIcon> = {
  freedoms: Feather,
  security: Shield,
  humanRights: HeartHandshake,
  transitionalJustice: Scale,
  justice: Gavel,
  institutions: Landmark,
  governance: Building2,
  civilSociety: Users,
  information: Newspaper,
  politicalCompetition: Swords,
  elections: Vote,
  electoralJustice: ScrollText,
  observation: Eye,
  economy: TrendingUp,
  antiCorruption: ShieldAlert,
  internationalRelations: Globe,
  humanitarian: HandHeart,
  powerTransfer: ArrowLeftRight,
  evaluation: ClipboardCheck,
}

/**
 * Actor key -> icon (§3b of the spec). Overlaps are intentional: all
 * "international *" actors share Globe, observation-related actors share Eye,
 * care-oriented actors share heart glyphs.
 */
export const ACTOR_ICONS: Record<string, LucideIcon> = {
  government: Landmark,
  transitionalGovernment: Landmark,
  outgoingGovernment: LogOut,
  incomingGovernment: LogIn,
  judiciary: Scale,
  prosecutor: Gavel,
  comptroller: ClipboardCheck,
  armedForces: Shield,
  securityForces: ShieldCheck,
  police: Siren,
  securityAgencies: Radar,
  legislature: Building2,
  assembly: Building,
  cne: Vote,
  electoralJusticeBody: ScrollText,
  parties: Flag,
  politicalActors: Users,
  agreementParties: Handshake,
  negotiatingParties: Handshake,
  opposition: Megaphone,
  civilSociety: HeartHandshake,
  victims: Heart,
  hrBodies: HandHeart,
  media: Newspaper,
  telecomAuthority: RadioTower,
  foreignMinistry: Plane,
  centralBank: Banknote,
  multilaterals: Coins,
  privateSector: Briefcase,
  specializedOrgs: SearchCheck,
  experts: GraduationCap,
  observers: Eye,
  internationalObservation: Eye,
  un: Globe,
  internationalOrgs: Globe,
  internationalActors: Globe,
  internationalBodies: Globe,
  internationalCommunity: Globe,
  internationalAssistance: HeartHandshake,
  independentCommission: ClipboardList,
}

/**
 * Countdown milestone id -> icon. Keyed by TransitionMilestone.id from
 * data/transition-milestones.ts (the 3 calendar countdowns), NOT the 6
 * roadmap milestones in transition-phases.ts.
 *
 * `Handshake` is intentionally shared with the negotiatingParties/
 * agreementParties actor chips — same concept, so the overlap reads as
 * consistent rather than ambiguous.
 */
export const MILESTONE_ICONS: Record<string, LucideIcon> = {
  usMidterms: SquareCheckBig,
  negotiationEnd: Handshake,
  transitionEnd: CalendarCheck,
}
