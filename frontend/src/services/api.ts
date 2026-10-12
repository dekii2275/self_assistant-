import axios from 'axios';
import type { Task, TaskCreateInput, TaskUpdateInput, Subtask, Goal } from '../types/task';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8974/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const taskApi = {
  async getTasks(params?: {
    status?: string;
    priority?: string;
    is_completed?: boolean;
    search?: string;
  }): Promise<Task[]> {
    const res = await apiClient.get<Task[]>('/tasks', { params });
    return res.data;
  },

  async getTask(id: number): Promise<Task> {
    const res = await apiClient.get<Task>(`/tasks/${id}`);
    return res.data;
  },

  async createTask(data: TaskCreateInput): Promise<Task> {
    const res = await apiClient.post<Task>('/tasks', data);
    return res.data;
  },

  async updateTask(id: number, data: TaskUpdateInput): Promise<Task> {
    const res = await apiClient.put<Task>(`/tasks/${id}`, data);
    return res.data;
  },

  async toggleTask(id: number): Promise<Task> {
    const res = await apiClient.patch<Task>(`/tasks/${id}/toggle`);
    return res.data;
  },

  async deleteTask(id: number): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  // -------------------------------------------------------------
  // Subtasks API
  // -------------------------------------------------------------
  async addSubtask(taskId: number, title: string): Promise<Subtask> {
    const res = await apiClient.post<Subtask>(`/tasks/${taskId}/subtasks`, { title });
    return res.data;
  },

  async toggleSubtask(taskId: number, subtaskId: number): Promise<Subtask> {
    const res = await apiClient.patch<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
    return res.data;
  },

  async deleteSubtask(taskId: number, subtaskId: number): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  },

  // -------------------------------------------------------------
  // Pomodoro API
  // -------------------------------------------------------------
  async logPomodoro(taskId: number, minutes: number = 25): Promise<Task> {
    const res = await apiClient.post<Task>(`/tasks/${taskId}/pomodoro-log`, { minutes });
    return res.data;
  },

  async checkHealth(): Promise<{ status: string; database: string }> {
    const res = await apiClient.get<{ status: string; database: string }>('/health');
    return res.data;
  },
};

export const goalApi = {
  async getGoals(): Promise<Goal[]> {
    const res = await apiClient.get<Goal[]>('/goals');
    return res.data;
  },

  async createGoal(title: string): Promise<Goal> {
    const res = await apiClient.post<Goal>('/goals', { title });
    return res.data;
  },

  async toggleGoal(id: number): Promise<Goal> {
    const res = await apiClient.patch<Goal>(`/goals/${id}/toggle`);
    return res.data;
  },

  async deleteGoal(id: number): Promise<void> {
    await apiClient.delete(`/goals/${id}`);
  },
};
