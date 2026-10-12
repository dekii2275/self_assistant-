export type Priority = 'p1' | 'p2' | 'p3' | 'p4';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type RecurrenceRule = 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  is_completed: boolean;
  due_date?: string | null;
  estimated_minutes?: number | null;
  actual_minutes: number;
  recurrence_rule?: RecurrenceRule | null;
  tags?: string | null;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  due_date?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  recurrence_rule?: RecurrenceRule | null;
  tags?: string;
  subtask_titles?: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  is_completed?: boolean;
  due_date?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  recurrence_rule?: RecurrenceRule | null;
  tags?: string;
}

export interface Goal {
  id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface GoalCreateInput {
  title: string;
}
