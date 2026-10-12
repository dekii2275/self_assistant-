import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TaskInput } from './components/TaskInput';
import { FilterBar } from './components/FilterBar';
import { TaskList } from './components/TaskList';
import { StatsBar } from './components/StatsBar';
import { taskApi } from './services/api';
import type { Task, TaskCreateInput } from './types/task';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Filters
  const [currentTab, setCurrentTab] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const checkConnection = useCallback(async () => {
    try {
      await taskApi.checkHealth();
      setIsBackendOnline(true);
      setErrorNotice(null);
    } catch {
      setIsBackendOnline(false);
      setErrorNotice(
        'Không thể kết nối đến Backend (Port 8974). Vui lòng đảm bảo Docker Compose hoặc FastAPI backend đang chạy.'
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

  // Actions
  const handleAddTask = async (newTaskData: TaskCreateInput) => {
    try {
      const created = await taskApi.createTask(newTaskData);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Lỗi khi thêm công việc. Vui lòng kiểm tra kết nối backend!');
    }
  };

  const handleToggleTask = async (id: number) => {
    // Optimistic update
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
      // Revert if error
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

  // Filtered tasks calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Tab filter
      if (currentTab === 'active' && t.is_completed) return false;
      if (currentTab === 'completed' && !t.is_completed) return false;

      // Priority filter
      if (selectedPriority && t.priority !== selectedPriority) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesTag = t.tags?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      return true;
    });
  }, [tasks, currentTab, selectedPriority, searchQuery]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((t) => !t.is_completed).length,
      completed: tasks.filter((t) => t.is_completed).length,
    }),
    [tasks]
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Navbar isBackendOnline={isBackendOnline} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* Connection Alert if backend is offline */}
        {errorNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => fetchTasks()}
              className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Dashboard Progress & Metrics */}
        <StatsBar tasks={tasks} />

        {/* Quick Task Input Form */}
        <TaskInput onAddTask={handleAddTask} />

        {/* Filter and Search Bar */}
        <FilterBar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          counts={counts}
        />

        {/* Task List */}
        <TaskList
          tasks={filteredTasks}
          isLoading={isLoading}
          onToggle={handleToggleTask}
          onDelete={handleDeleteTask}
        />
      </main>
    </div>
  );
}

export default App;
