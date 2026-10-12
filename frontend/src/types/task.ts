export type Priority = 'p1' | 'p2' | 'p3' | 'p4';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  is_completed: boolean;
  due_date?: string | null;
  estimated_minutes?: number | null;
  tags?: string | null;
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
  tags?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  is_completed?: boolean;
  due_date?: string;
  estimated_minutes?: number;
  tags?: string;
}
