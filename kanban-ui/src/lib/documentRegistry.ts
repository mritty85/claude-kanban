import { FileText, ClipboardList, Map, Bot, Rocket, FolderTree, Database } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DocumentDefinition {
  slug: string;
  label: string;
  icon: LucideIcon;
  panelTitle: string;
  placeholder: string;
  loadingText: string;
  alwaysShow: boolean;
  sseMatchPatterns: string[];
}

export const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  {
    slug: 'notes',
    label: 'Notes',
    icon: FileText,
    panelTitle: 'Project Notes',
    placeholder: 'Write your project notes here...',
    loadingText: 'Loading notes...',
    alwaysShow: true,
    sseMatchPatterns: ['notes.md']
  },
  {
    slug: 'roadmap',
    label: 'Roadmap',
    icon: Map,
    panelTitle: 'Roadmap',
    placeholder: 'Write your project roadmap here...',
    loadingText: 'Loading roadmap...',
    alwaysShow: true,
    sseMatchPatterns: ['roadmap.md']
  },
  {
    slug: 'prd',
    label: 'PRD',
    icon: ClipboardList,
    panelTitle: 'PRD',
    placeholder: 'Write your product requirements document here...',
    loadingText: 'Loading PRD...',
    alwaysShow: true,
    sseMatchPatterns: ['prd.md']
  },
  {
    slug: 'claude',
    label: 'CLAUDE.md',
    icon: Bot,
    panelTitle: 'CLAUDE.md',
    placeholder: 'Write your Claude Code instructions here...',
    loadingText: 'Loading CLAUDE.md...',
    alwaysShow: false,
    sseMatchPatterns: ['claude.md']
  },
  {
    slug: 'deployment',
    label: 'Deployment',
    icon: Rocket,
    panelTitle: 'Deployment',
    placeholder: 'Write your deployment documentation here...',
    loadingText: 'Loading deployment docs...',
    alwaysShow: false,
    sseMatchPatterns: ['deployment.md']
  },
  {
    slug: 'structure',
    label: 'Structure',
    icon: FolderTree,
    panelTitle: 'Structure',
    placeholder: 'Write your project structure documentation here...',
    loadingText: 'Loading structure docs...',
    alwaysShow: false,
    sseMatchPatterns: ['structure.md']
  },
  {
    slug: 'schema',
    label: 'Schema',
    icon: Database,
    panelTitle: 'Schema',
    placeholder: 'Write your schema documentation here...',
    loadingText: 'Loading schema docs...',
    alwaysShow: false,
    sseMatchPatterns: ['schema.md']
  }
];

export function getDocDef(slug: string): DocumentDefinition | undefined {
  return DOCUMENT_DEFINITIONS.find(d => d.slug === slug);
}
