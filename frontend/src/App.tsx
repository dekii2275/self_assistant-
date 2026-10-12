import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar, type MainNavView } from './components/Sidebar';
import { Header } from './components/Header';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { KanbanBoard } from './components/KanbanBoard';
import { QuickAddModal } from './components/QuickAddModal';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { PomodoroTimer } from './components/PomodoroTimer';
import { OverviewView } from './components/OverviewView';
import { WeeklyTimetable } from './components/WeeklyTimetable';
import { taskApi } from './services/api';
import type { Task, TaskCreateInput, TaskUpdateInput, Priority, Subtask } from './types/task';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Layout & Navigation State
  const [currentView, setCurrentView] = useState<MainNavView>('overview');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLayout, setActiveLayout] = useState<'list' | 'kanban'>('list');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Modals & Drawers
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaultPriority, setQuickAddDefaultPriority] = useState<Priority>('p3');
  const [quickAddDefaultDueDate, setQuickAddDefaultDueDate] = useState<string | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Pomodoro Focus Timer State
  const [pomodoroActiveTask, setPomodoroActiveTask] = useState<Task | null>(null);

  // Connection check
  const checkConnection = useCallback(async () => {
    try {
      await taskApi.checkHealth();
      setIsBackendOnline(true);
      setErrorNotice(null);
    } catch {
      setIsBackendOnline(false);
      setErrorNotice(
        'Không thể kết nối đến Backend (Port 8974). Vui lòng đảm bảo Docker Compose đang chạy.'
      );
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await taskApi.getTasks();
      setTasks(data);
      setIsBackendOnline(true);
      setErrorNotice(null);
    } catch {
      await checkConnection();
    } finally {
      setIsLoading(false);
    }
  }, [checkConnection]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [fetchTasks, checkConnection]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // CRUD Handlers
  const handleAddTask = async (newTaskData: TaskCreateInput) => {
    try {
      const created = await taskApi.createTask(newTaskData);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Lỗi khi tạo công việc. Vui lòng kiểm tra kết nối API!');
    }
  };

  const handleUpdateTask = async (id: number, updateData: TaskUpdateInput) => {
    try {
      const updated = await taskApi.updateTask(id, updateData);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (editingTask?.id === id) {
        setEditingTask(updated);
      }
      if (pomodoroActiveTask?.id === id) {
        setPomodoroActiveTask(updated);
      }
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Lỗi khi cập nhật công việc!');
    }
  };

  const handleToggleTask = async (id: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              is_completed: !t.is_completed,
              status: !t.is_completed ? 'done' : 'todo',
            }
          : t
      )
    );

    try {
      const updated = await taskApi.toggleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (editingTask?.id === id) {
        setEditingTask(updated);
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      await fetchTasks();
    }
  };

  const handleDeleteTask = async (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (editingTask?.id === id) {
      setEditingTask(null);
    }
    if (pomodoroActiveTask?.id === id) {
      setPomodoroActiveTask(null);
    }

    try {
      await taskApi.deleteTask(id);
    } catch (err) {
      console.error('Error deleting task:', err);
      await fetchTasks();
    }
  };

  // Subtasks Handlers
  const handleAddSubtask = async (taskId: number, title: string): Promise<Subtask | void> => {
    try {
      const created = await taskApi.addSubtask(taskId, title);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...(t.subtasks || []), created] }
            : t
        )
      );
      if (editingTask?.id === taskId) {
        setEditingTask((prev) =>
          prev ? { ...prev, subtasks: [...(prev.subtasks || []), created] } : null
        );
      }
      return created;
    } catch (err) {
      console.error('Error adding subtask:', err);
      alert('Lỗi khi thêm bước con!');
    }
  };

  const handleToggleSubtask = async (taskId: number, subtaskId: number): Promise<Subtask | void> => {
    try {
      const toggled = await taskApi.toggleSubtask(taskId, subtaskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((st) => (st.id === subtaskId ? toggled : st)),
              }
            : t
        )
      );
      if (editingTask?.id === taskId) {
        setEditingTask((prev) =>
          prev
            ? {
                ...prev,
                subtasks: prev.subtasks.map((st) => (st.id === subtaskId ? toggled : st)),
              }
            : null
        );
      }
      return toggled;
    } catch (err) {
      console.error('Error toggling subtask:', err);
    }
  };

  const handleDeleteSubtask = async (taskId: number, subtaskId: number): Promise<void> => {
    try {
      await taskApi.deleteSubtask(taskId, subtaskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) }
            : t
        )
      );
      if (editingTask?.id === taskId) {
        setEditingTask((prev) =>
          prev ? { ...prev, subtasks: prev.subtasks.filter((st) => st.id !== subtaskId) } : null
        );
      }
    } catch (err) {
      console.error('Error deleting subtask:', err);
    }
  };

  // Pomodoro Focus Handlers
  const handleLogPomodoro = async (taskId: number, minutes: number) => {
    try {
      const updated = await taskApi.logPomodoro(taskId, minutes);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (editingTask?.id === taskId) {
        setEditingTask(updated);
      }
      if (pomodoroActiveTask?.id === taskId) {
        setPomodoroActiveTask(updated);
      }
    } catch (err) {
      console.error('Error logging pomodoro:', err);
    }
  };

  // Filter Tasks by View, Tag, Search, and Calendar Date
  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return tasks.filter((t) => {
      // Calendar date filter (if selected from calendar)
      if (selectedCalendarDate) {
        if (!t.due_date || !t.due_date.startsWith(selectedCalendarDate)) return false;
      }

      // Tag filter override
      if (selectedTag) {
        if (!t.tags || !t.tags.includes(selectedTag)) return false;
      } else {
        // Navigation View filter
        if (currentView === 'today') {
          if (t.is_completed) return false;
          if (t.due_date && !t.due_date.startsWith(todayStr)) return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesTags = t.tags?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });
  }, [tasks, currentView, selectedTag, searchQuery, selectedCalendarDate]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f6f9f6] flex text-[#1a2e22]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        tasks={tasks}
        isBackendOnline={isBackendOnline}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {currentView === 'overview' ? (
          <main className="flex-1 min-h-0 w-full h-full p-2.5 sm:p-3.5 overflow-hidden">
            <OverviewView
              tasks={tasks}
              onToggle={handleToggleTask}
              onEdit={(task) => setEditingTask(task)}
              onOpenNewTaskModal={() => {
                setQuickAddDefaultPriority('p3');
                setQuickAddDefaultDueDate(undefined);
                setIsQuickAddOpen(true);
              }}
              onViewAllTasks={() => setCurrentView('tasks')}
              selectedCalendarDate={selectedCalendarDate}
              onSelectCalendarDate={setSelectedCalendarDate}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            />
          </main>
        ) : currentView === 'timetable' ? (
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <Header
              currentView={currentView}
              selectedTag={selectedTag}
              onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
              onOpenNewTaskModal={() => {
                setQuickAddDefaultPriority('p3');
                setQuickAddDefaultDueDate(undefined);
                setIsQuickAddOpen(true);
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeLayout={activeLayout}
              setActiveLayout={setActiveLayout}
              filteredCount={tasks.length}
            />
            <main className="flex-1 min-h-0 w-full h-full p-2.5 sm:p-3.5 overflow-hidden">
              <WeeklyTimetable
                tasks={tasks}
                onToggle={handleToggleTask}
                onEdit={(task) => setEditingTask(task)}
                onQuickAddAtTime={(dateIso) => {
                  setQuickAddDefaultDueDate(dateIso);
                  setQuickAddDefaultPriority('p3');
                  setIsQuickAddOpen(true);
                }}
              />
            </main>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <Header
              currentView={currentView}
              selectedTag={selectedTag}
              onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
              onOpenNewTaskModal={() => {
                setQuickAddDefaultPriority('p3');
                setQuickAddDefaultDueDate(undefined);
                setIsQuickAddOpen(true);
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeLayout={activeLayout}
              setActiveLayout={setActiveLayout}
              filteredCount={filteredTasks.length}
            />

            <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col overflow-hidden space-y-2.5">
              {/* Backend Connection Warning */}
              {errorNotice && (
                <div className="bg-amber-50 border border-amber-200/90 text-amber-900 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs shadow-2xs shrink-0 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{errorNotice}</span>
                  </div>
                  <button
                    onClick={() => fetchTasks()}
                    className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Thử lại</span>
                  </button>
                </div>
              )}

              {/* Quick Input Bar (visible in list mode) */}
              {activeLayout === 'list' && (
                <div className="shrink-0">
                  <TaskInput
                    onAddTask={handleAddTask}
                    onOpenDetailedModal={() => {
                      setQuickAddDefaultPriority('p3');
                      setQuickAddDefaultDueDate(undefined);
                      setIsQuickAddOpen(true);
                    }}
                  />
                </div>
              )}

              {/* Main Content: List or Kanban (internally scrollable) */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                {activeLayout === 'list' ? (
                  <TaskList
                    tasks={filteredTasks}
                    isLoading={isLoading}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onEdit={(task) => setEditingTask(task)}
                    onOpenNewTaskModal={() => {
                      setQuickAddDefaultPriority('p3');
                      setQuickAddDefaultDueDate(undefined);
                      setIsQuickAddOpen(true);
                    }}
                    onStartPomodoro={(task) => setPomodoroActiveTask(task)}
                  />
                ) : (
                  <KanbanBoard
                    tasks={filteredTasks}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onEdit={(task) => setEditingTask(task)}
                    onQuickAddWithPriority={(priority) => {
                      setQuickAddDefaultPriority(priority);
                      setQuickAddDefaultDueDate(undefined);
                      setIsQuickAddOpen(true);
                    }}
                    onStartPomodoro={(task) => setPomodoroActiveTask(task)}
                  />
                )}
              </div>
            </main>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddTask={handleAddTask}
        defaultPriority={quickAddDefaultPriority}
        defaultDueDate={quickAddDefaultDueDate}
      />

      {/* Task Detail & Subtask Drawer */}
      <TaskDetailDrawer
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onToggle={handleToggleTask}
        onAddSubtask={handleAddSubtask}
        onToggleSubtask={handleToggleSubtask}
        onDeleteSubtask={handleDeleteSubtask}
      />

      {/* Otter Pomodoro Focus Widget */}
      <PomodoroTimer
        tasks={tasks}
        activeTask={pomodoroActiveTask}
        onSelectTask={(task) => setPomodoroActiveTask(task)}
        onLogPomodoro={handleLogPomodoro}
      />
    </div>
  );
}

export default App;
