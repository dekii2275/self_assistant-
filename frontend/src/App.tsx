import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar, type NavView } from './components/Sidebar';
import { Header } from './components/Header';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { KanbanBoard } from './components/KanbanBoard';
import { QuickAddModal } from './components/QuickAddModal';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { taskApi } from './services/api';
import type { Task, TaskCreateInput, TaskUpdateInput, Priority } from './types/task';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Layout & Navigation State
  const [currentView, setCurrentView] = useState<NavView>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLayout, setActiveLayout] = useState<'list' | 'kanban'>('list');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals & Drawers
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaultPriority, setQuickAddDefaultPriority] = useState<Priority>('p3');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Connection check
  const checkConnection = useCallback(async () => {
    try {
      await taskApi.checkHealth();
      setIsBackendOnline(true);
      setErrorNotice(null);
    } catch {
      setIsBackendOnline(false);
      setErrorNotice('Không thể kết nối đến Backend (Port 8974). Vui lòng đảm bảo Docker Compose đang chạy.');
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

  // Global Keyboard shortcuts (e.g. 'n' for new task)
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
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Lỗi khi cập nhật công việc!');
    }
  };

  const handleToggleTask = async (id: number) => {
    // Optimistic toggle
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
      await taskApi.toggleTask(id);
    } catch (err) {
      console.error('Error toggling task:', err);
      await fetchTasks();
    }
  };

  const handleDeleteTask = async (id: number) => {
    // Optimistic delete
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await taskApi.deleteTask(id);
    } catch (err) {
      console.error('Error deleting task:', err);
      await fetchTasks();
    }
  };

  // Filter Tasks by View, Tag, and Search
  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return tasks.filter((t) => {
      // Tag filter override
      if (selectedTag) {
        if (!t.tags || !t.tags.includes(selectedTag)) return false;
      } else {
        // Navigation View filter
        if (currentView === 'today') {
          if (t.is_completed) return false;
          if (t.due_date && !t.due_date.startsWith(todayStr)) return false;
        } else if (currentView === 'upcoming') {
          if (t.is_completed) return false;
          if (!t.due_date) return false;
          const dueDay = t.due_date.split('T')[0];
          if (dueDay < todayStr || dueDay > next7Days) return false;
        } else if (currentView === 'urgent') {
          if (t.is_completed) return false;
          if (t.priority !== 'p1') return false;
        } else if (currentView === 'completed') {
          if (!t.is_completed) return false;
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
  }, [tasks, currentView, selectedTag, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
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
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentView={currentView}
          selectedTag={selectedTag}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenNewTaskModal={() => {
            setQuickAddDefaultPriority('p3');
            setIsQuickAddOpen(true);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeLayout={activeLayout}
          setActiveLayout={setActiveLayout}
          filteredCount={filteredTasks.length}
        />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Backend Connection Warning */}
          {errorNotice && (
            <div className="bg-amber-50 border border-amber-200/90 text-amber-900 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{errorNotice}</span>
              </div>
              <button
                onClick={() => fetchTasks()}
                className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          {/* Quick Input Bar (visible in list mode) */}
          {activeLayout === 'list' && (
            <TaskInput
              onAddTask={handleAddTask}
              onOpenDetailedModal={() => {
                setQuickAddDefaultPriority('p3');
                setIsQuickAddOpen(true);
              }}
            />
          )}

          {/* Main Content: List or Kanban */}
          {activeLayout === 'list' ? (
            <TaskList
              tasks={filteredTasks}
              isLoading={isLoading}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={(task) => setEditingTask(task)}
              onOpenNewTaskModal={() => {
                setQuickAddDefaultPriority('p3');
                setIsQuickAddOpen(true);
              }}
            />
          ) : (
            <KanbanBoard
              tasks={filteredTasks}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={(task) => setEditingTask(task)}
              onQuickAddWithPriority={(priority) => {
                setQuickAddDefaultPriority(priority);
                setIsQuickAddOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddTask={handleAddTask}
        defaultPriority={quickAddDefaultPriority}
      />

      {/* Task Detail & Edit Drawer */}
      <TaskDetailDrawer
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onToggle={handleToggleTask}
      />
    </div>
  );
}

export default App;
