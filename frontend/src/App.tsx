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
import { StudySpace } from './components/StudySpace';
import { TaskReminders } from './components/TaskReminders';
import { taskApi } from './services/api';
import { localDateKey, dueDateKey } from './utils/date';
import type { Task, TaskCreateInput, TaskUpdateInput, Priority, Subtask } from './types/task';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const DEFAULT_MOCK_TASKS: Task[] = [
  {
    id: -1,
    title: 'Ôn tập công thức Toán & Giải tích',
    description: 'Vẽ sơ đồ tư duy các dạng tích phân và đạo hàm trên bảng Không gian học',
    priority: 'p1',
    status: 'in_progress',
    is_completed: false,
    due_date: localDateKey(new Date()),
    estimated_minutes: 45,
    actual_minutes: 25,
    tags: 'Toán,Học tập',
    subtasks: [
      { id: 101, task_id: 1, title: 'Công thức đạo hàm lượng giác', is_completed: true, created_at: '' },
      { id: 102, task_id: 1, title: 'Bài tập tích phân từng phần', is_completed: false, created_at: '' },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: -2,
    title: 'Ghi chép từ vựng Tiếng Anh chuyên ngành',
    description: 'Sử dụng Không gian học để vẽ mindmap từ vựng và lưu PDF',
    priority: 'p2',
    status: 'todo',
    is_completed: false,
    due_date: localDateKey(new Date()),
    estimated_minutes: 30,
    actual_minutes: 0,
    tags: 'Tiếng Anh,Mindmap',
    subtasks: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: -3,
    title: 'Vẽ sơ đồ hệ thống kiến thức',
    description: 'Tổng hợp các ý chính vào bảng vẽ và xuất file PDF lưu trữ',
    priority: 'p3',
    status: 'todo',
    is_completed: false,
    due_date: localDateKey(new Date()),
    estimated_minutes: 25,
    actual_minutes: 0,
    tags: 'Sơ đồ,Không gian học',
    subtasks: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('otter_cached_tasks');
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((task): task is Task =>
            task !== null &&
            typeof task === 'object' &&
            typeof task.id === 'number' &&
            typeof task.title === 'string' &&
            Array.isArray(task.subtasks)
          );
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_MOCK_TASKS;
  });
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

  const fetchTasks = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await taskApi.getTasks();
      setTasks(data);
      setIsBackendOnline(true);
      setErrorNotice(null);
    } catch {
      setIsBackendOnline(false);
      setErrorNotice('Không thể tải danh sách công việc. Vui lòng kiểm tra kết nối Backend.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (isBackendOnline) return;
    const interval = setInterval(() => { void fetchTasks(false); }, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks, isBackendOnline]);

  useEffect(() => {
    if (!isBackendOnline) return;
    const interval = setInterval(() => { void fetchTasks(false); }, 60000);
    const onFocus = () => { void fetchTasks(false); };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchTasks, isBackendOnline]);

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

  // Save tasks to cache
  useEffect(() => {
    if (tasks === DEFAULT_MOCK_TASKS) return;
    try {
      localStorage.setItem('otter_cached_tasks', JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  // CRUD Handlers
  const handleAddTask = async (newTaskData: TaskCreateInput) => {
    const created = await taskApi.createTask(newTaskData);
    setTasks((prev) => [created, ...prev.filter((task) => task.id > 0)]);
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
      if (updated.is_completed && updated.recurrence_rule) void fetchTasks(false);
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const handleToggleTask = async (id: number) => {
    try {
      const updated = await taskApi.toggleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (editingTask?.id === id) {
        setEditingTask(updated);
      }
      if (updated.is_completed && updated.recurrence_rule) void fetchTasks(false);
    } catch (err) {
      console.error('Error toggling task:', err);
      alert('Không thể cập nhật công việc. Vui lòng kiểm tra kết nối Backend.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await taskApi.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (editingTask?.id === id) setEditingTask(null);
      if (pomodoroActiveTask?.id === id) setPomodoroActiveTask(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Không thể xóa công việc. Vui lòng kiểm tra kết nối Backend.');
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
    const todayStr = localDateKey(new Date());

    return tasks.filter((t) => {
      // Calendar date filter (if selected from calendar)
      if (selectedCalendarDate) {
        if (!t.due_date || dueDateKey(t.due_date) !== selectedCalendarDate) return false;
      }

      // Tag filter override
      if (selectedTag) {
        if (!t.tags || !t.tags.includes(selectedTag)) return false;
      } else {
        // Navigation View filter
        if (currentView === 'today') {
          if (t.is_completed) return false;
          if (t.due_date && dueDateKey(t.due_date) !== todayStr) return false;
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
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex text-slate-900">
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
          <main className="flex-1 min-h-0 w-full h-full p-3 sm:p-5 overflow-hidden">
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
              onOpenStudySpace={() => setCurrentView('study-space')}
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
        ) : currentView === 'study-space' ? (
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <StudySpace
              tasks={tasks.filter((task) => task.id > 0)}
              onLogStudyMinutes={handleLogPomodoro}
              onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            />
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

            <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col overflow-hidden space-y-3">
              {/* Backend Connection Warning */}
              {errorNotice && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs shadow-2xs shrink-0 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{errorNotice}</span>
                  </div>
                  <button
                    onClick={() => fetchTasks()}
                    className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition-colors shrink-0"
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
        tasks={tasks.filter((task) => task.id > 0)}
        activeTask={pomodoroActiveTask?.id && pomodoroActiveTask.id > 0 ? pomodoroActiveTask : null}
        onSelectTask={(task) => setPomodoroActiveTask(task)}
        onLogPomodoro={handleLogPomodoro}
      />

      <TaskReminders
        enabled={isBackendOnline}
        onOpenTask={(id) => {
          void taskApi.getTask(id).then((task) => {
            setEditingTask(task);
            setCurrentView('tasks');
          }).catch(() => setErrorNotice('Không thể mở nhiệm vụ từ lời nhắc. Vui lòng tải lại danh sách.'));
        }}
      />
    </div>
  );
}

export default App;
