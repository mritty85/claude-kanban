export type TaskStatus = 'ideation' | 'backlog' | 'planning' | 'implementing' | 'uat' | 'done';

export type TaskTag = 'new-functionality' | 'feature-enhancement' | 'bug' | 'refactor' | 'devops';

export interface AcceptanceCriterion {
  text: string;
  checked: boolean;
}

export interface Task {
  id: string;
  filename: string;
  status: TaskStatus;
  priority: number;
  title: string;
  description: string;
  tags: TaskTag[];
  acceptanceCriteria: AcceptanceCriterion[];
  notes: string;
}

export interface TaskFormData {
  title: string;
  status: TaskStatus;
  description: string;
  tags: TaskTag[];
  acceptanceCriteria: AcceptanceCriterion[];
  notes: string;
}

export const STATUSES: TaskStatus[] = ['ideation', 'planning', 'backlog', 'implementing', 'uat', 'done'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'ideation': 'Ideation',
  'backlog': 'Backlog',
  'planning': 'Planning',
  'implementing': 'Implementing',
  'uat': 'UAT',
  'done': 'Done'
};

export const TAGS: TaskTag[] = ['new-functionality', 'feature-enhancement', 'bug', 'refactor', 'devops'];

export const TAG_LABELS: Record<TaskTag, string> = {
  'new-functionality': 'New Feature',
  'feature-enhancement': 'Enhancement',
  'bug': 'Bug',
  'refactor': 'Refactor',
  'devops': 'DevOps'
};

// Project types for multi-project support
export interface Project {
  id: string;
  name: string;
  path: string;
  lastAccessed: string;
  boardName?: string;
}

export interface ProjectFormData {
  name: string;
  path: string;
  createTasksDir?: boolean;
}

export interface PathValidation {
  valid: boolean;
  error?: string;
  canCreate?: boolean;
  tasksDir?: string;
  created?: boolean;
}
