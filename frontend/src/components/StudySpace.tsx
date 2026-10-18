import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Type,
  Undo2,
  Redo2,
  Trash2,
  FileDown,
  Download,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sparkles,
  Clock,
  ListTodo,
  Music,
  Menu,
  Plus,
  StickyNote as StickyIcon,
  X,
  FileText,
  Check,
  Award,
  Sliders,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import type { Task } from '../types/task';

// --- TYPES & CONSTANTS ---
export type DrawingTool =
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'text';

export type CanvasBackground = 'blank' | 'grid' | 'lined' | 'dots' | 'chalkboard';

export type AmbientSoundType = 'none' | 'rain' | 'stream' | 'waves' | 'pink_noise';

export interface StickyNoteItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  colorIndex: number;
}

export interface StudyPage {
  id: string;
  title: string;
  drawingData: string; // Base64 DataURL của drawing canvas
  background: CanvasBackground;
  stickyNotes: StickyNoteItem[];
  createdAt: number;
  updatedAt: number;
}

const PASTEL_STICKY_COLORS = [
  { name: 'Vàng nắng', bg: '#fef9c3', border: '#facc15', text: '#713f12', header: '#fef08a' },
  { name: 'Xanh búp', bg: '#dcfce7', border: '#86efac', text: '#14532d', header: '#bbf7d0' },
  { name: 'Hồng phấn', bg: '#fce7f3', border: '#f472b6', text: '#831843', header: '#fbcfe8' },
  { name: 'Xanh hồ', bg: '#e0f2fe', border: '#7dd3fc', text: '#0c4a6e', header: '#bae6fd' },
  { name: 'Cam mơ', bg: '#ffedd5', border: '#fb923c', text: '#7c2d12', header: '#fed7aa' },
  { name: 'Tím hoa', bg: '#f3e8ff', border: '#c084fc', text: '#581c87', header: '#e9d5ff' },
];

const BASIC_COLORS = [
  { label: 'Đen than', value: '#1e293b' },
  { label: 'Xanh dương', value: '#2563eb' },
  { label: 'Đỏ tươi', value: '#dc2626' },
  { label: 'Xanh lá', value: '#16a34a' },
  { label: 'Cam ấm', value: '#ea580c' },
  { label: 'Tím hoa', value: '#9333ea' },
  { label: 'Trắng phấn', value: '#ffffff' },
];

const STROKE_WIDTHS = [
  { label: 'Mảnh', value: 2 },
  { label: 'Vừa', value: 4 },
  { label: 'Đậm', value: 8 },
  { label: 'Rất đậm', value: 16 },
  { label: 'Bút dạ', value: 24 },
];

const TIMER_PRESETS = [
  { label: '15p Khởi động', minutes: 15 },
  { label: '25p Pomodoro', minutes: 25 },
  { label: '45p Tiết học', minutes: 45 },
  { label: '60p Chuyên sâu', minutes: 60 },
];

const OTTER_QUOTES = [
  'Kỹ thuật Pomodoro (25 phút tập trung + 5 phút nghỉ) giúp tối ưu hóa khả năng ghi nhớ dài hạn.',
  'Vẽ sơ đồ tư duy (mindmap) giúp não bộ kết nối các khái niệm logic nhanh hơn ghi chép thông thường.',
  'Áp dụng phương pháp Feynman: Thử giải thích lại kiến thức vừa học bằng từ ngữ đơn giản nhất.',
  'Uống một ngụm nước và thư giãn mắt sau mỗi 30 phút để duy trì mức năng lượng làm việc cao.',
  'Chia nhỏ bài học phức tạp thành từng khối kiến thức con và xử lý tuần tự từng bước.',
  'Thực hành Active Recall: Tự đặt câu hỏi kiểm tra lại kiến thức thay vì chỉ đọc thụ động.',
  'Dán công thức hoặc thuật ngữ quan trọng lên Giấy Ghi Chú để ôn tập nhanh trước khi kết thúc buổi học.',
];

interface StudySpaceProps {
  tasks: Task[];
  onLogStudyMinutes?: (taskId: number, minutes: number) => Promise<void>;
  onExitFocusMode?: () => void;
  onOpenMobileMenu?: () => void;
}

export const StudySpace: React.FC<StudySpaceProps> = ({
  tasks,
  onLogStudyMinutes,
  onOpenMobileMenu,
}) => {
  // --- STUDY DOCUMENT & PAGES STATE ---
  const [docTitle, setDocTitle] = useState(() => {
    return localStorage.getItem('otter_studyspace_title_v3') || 'Ghi chép bài học';
  });

  const [pages, setPages] = useState<StudyPage[]>(() => {
    try {
      const saved = localStorage.getItem('otter_studyspace_pages_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'page_1',
        title: 'Trang 1: Sơ đồ tư duy',
        drawingData: '',
        background: 'grid',
        stickyNotes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  });

  const [activePageId, setActivePageId] = useState<string>(() => {
    return localStorage.getItem('otter_studyspace_active_page_v3') || pages[0]?.id || 'page_1';
  });

  const currentPage = pages.find((p) => p.id === activePageId) || pages[0];
  const currentDrawingData = currentPage?.drawingData;

  // Auto-save notification pill
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'quota_error'>('saved');
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- DUAL-LAYER CANVAS REFS & DRAWING STATE ---
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialDrawingDataRef = useRef(currentDrawingData || '');
  const imageLoadVersionRef = useRef(0);
  const restoringDrawingRef = useRef<string | null>(null);

  const [activeTool, setActiveTool] = useState<DrawingTool>('pen');
  const [activeColor, setActiveColor] = useState<string>('#1e293b');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [canvasBg, setCanvasBg] = useState<CanvasBackground>(currentPage?.background || 'grid');
  const canvasBgRef = useRef(canvasBg);

  // History stack for Undo / Redo (stores DataURL strings to survive window resize)
  const [history, setHistory] = useState<string[]>(() => [currentDrawingData || '']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Drawing in progress refs
  const isDrawing = useRef(false);
  const activePointerId = useRef<number | null>(null);
  const didMove = useRef(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshotData = useRef<ImageData | null>(null);

  // Sticky Notes on the current page
  const [stickyNotes, setStickyNotes] = useState<StickyNoteItem[]>(currentPage?.stickyNotes || []);
  const draggingStickyRef = useRef<{
    id: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

  // Text Tool State (Multi-line & rich options)
  const [textInputModal, setTextInputModal] = useState<{
    x: number;
    y: number;
    value: string;
    fontSize: number;
    color: string;
  } | null>(null);
  const isComposingRef = useRef(false);

  // --- TIMER & OTTER ASSISTANT STATE ---
  const [selectedTask, setSelectedTask] = useState<Task | null>(() => {
    return tasks.find((t) => !t.is_completed) || null;
  });

  // Restore timer from storage if available
  const [timerMinutes, setTimerMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('otter_timer_minutes');
    return saved ? parseInt(saved, 10) : 25;
  });
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('30');
  const [showCustomTimerModal, setShowCustomTimerModal] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = localStorage.getItem('otter_timer_timeleft');
    return saved ? parseInt(saved, 10) : 25 * 60;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [totalStudiedSeconds, setTotalStudiedSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('otter_total_studied_secs');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [otterQuoteIndex, setOtterQuoteIndex] = useState<number>(0);
  const [logSuccessToast, setLogSuccessToast] = useState<string | null>(null);

  // --- FOCUS MODE (ZEN) & AMBIENT AUDIO ---
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.5);
  const ambientVolumeRef = useRef<number>(ambientVolume);
  useEffect(() => {
    ambientVolumeRef.current = ambientVolume;
  }, [ambientVolume]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientAudioNodesRef = useRef<{
    source?: AudioBufferSourceNode | AudioNode;
    gainNode?: GainNode;
    filter?: BiquadFilterNode;
    lfo?: OscillatorNode;
    lfoGain?: GainNode;
    secondarySource?: AudioBufferSourceNode;
  } | null>(null);

  // Modals & Feedback
  const [isExporting, setIsExporting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeletePageConfirm, setShowDeletePageConfirm] = useState(false);
  const [editingPageTitleId, setEditingPageTitleId] = useState<string | null>(null);
  const [pageTitleInputValue, setPageTitleInputValue] = useState('');

  // ----------------------------------------------------
  // 1. AUTO-SAVE & PAGE SYNC
  // ----------------------------------------------------
  const triggerAutoSave = useCallback(
    (updatedPages: StudyPage[], currentActiveId: string, title: string) => {
      setSaveStatus('saving');
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem('otter_studyspace_pages_v3', JSON.stringify(updatedPages));
          localStorage.setItem('otter_studyspace_active_page_v3', currentActiveId);
          localStorage.setItem('otter_studyspace_title_v3', title);
          setSaveStatus('saved');
        } catch (e: unknown) {
          console.warn('LocalStorage quota or error in autosave:', e);
          const isQuota =
            e instanceof DOMException &&
            (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
          if (isQuota) {
            setSaveStatus('quota_error');
          } else {
            setSaveStatus('saved');
          }
        }
      }, 800);
    },
    []
  );

  // Sync title changes
  useEffect(() => {
    triggerAutoSave(pages, activePageId, docTitle);
  }, [docTitle, pages, activePageId, triggerAutoSave]);

  // Ensure activePageId is valid within current pages
  useEffect(() => {
    if (pages.length > 0 && !pages.some((p) => p.id === activePageId)) {
      setActivePageId(pages[0].id);
    }
  }, [pages, activePageId]);

  // Sync timer state to localStorage periodically
  useEffect(() => {
    try {
      localStorage.setItem('otter_timer_minutes', timerMinutes.toString());
      localStorage.setItem('otter_timer_timeleft', timeLeft.toString());
      localStorage.setItem('otter_total_studied_secs', totalStudiedSeconds.toString());
    } catch {
      // ignore storage errors
    }
  }, [timerMinutes, timeLeft, totalStudiedSeconds]);

  // Adjust active color if chalkboard is chosen
  useEffect(() => {
    if (canvasBg === 'chalkboard' && activeColor === '#1e293b') {
      setActiveColor('#ffffff');
    } else if (canvasBg !== 'chalkboard' && activeColor === '#ffffff') {
      setActiveColor('#1e293b');
    }
  }, [canvasBg, activeColor]);

  // ----------------------------------------------------
  // 2. BACKGROUND CANVAS RENDERING
  // ----------------------------------------------------
  const redrawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, bg: CanvasBackground) => {
      ctx.clearRect(0, 0, width, height);

      if (bg === 'chalkboard') {
        // Deep blackboard green
        ctx.fillStyle = '#1c382b';
        ctx.fillRect(0, 0, width, height);

        // Subtle chalkboard texture streaks
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        for (let i = 0; i < width; i += 36) {
          ctx.fillRect(i, 0, 1, height);
        }
        for (let j = 0; j < height; j += 48) {
          ctx.fillRect(0, j, width, 1);
        }
        return;
      }

      // White clean base
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      if (bg === 'grid') {
        // Grid pattern (Vở ô ly học sinh)
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const step = 28;
        ctx.beginPath();
        for (let x = step; x < width; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = step; y < height; y += step) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Subtle major grid lines every 4 cells
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = step * 4; x < width; x += step * 4) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = step * 4; y < height; y += step * 4) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      } else if (bg === 'lined') {
        // Lined notebook with left margin
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const lineStep = 32;
        ctx.beginPath();
        for (let y = lineStep; y < height; y += lineStep) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Red left margin rule
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(56, 0);
        ctx.lineTo(56, height);
        ctx.stroke();
      } else if (bg === 'dots') {
        // Dot grid
        ctx.fillStyle = '#94a3b8';
        const dotStep = 26;
        for (let x = dotStep; x < width; x += dotStep) {
          for (let y = dotStep; y < height; y += dotStep) {
            ctx.beginPath();
            ctx.arc(x, y, 1.25, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
    []
  );

  // ----------------------------------------------------
  // 3. CANVAS INITIALIZATION & RESIZE (DUAL-LAYER)
  // ----------------------------------------------------
  const initDualCanvas = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const container = containerRef.current;
    if (!bgCanvas || !drawingCanvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    const pixelWidth = Math.floor(w * dpr);
    const pixelHeight = Math.floor(h * dpr);
    if (drawingCanvas.width === pixelWidth && drawingCanvas.height === pixelHeight) return;
    const loadVersion = ++imageLoadVersionRef.current;
    isDrawing.current = false;
    activePointerId.current = null;

    // Save existing drawing dataURL before resizing dimensions
    let existingDataURL: string | null = null;
    if (restoringDrawingRef.current) {
      existingDataURL = restoringDrawingRef.current;
    } else if (drawingCanvas.width > 0 && drawingCanvas.height > 0) {
      existingDataURL = drawingCanvas.toDataURL();
    } else if (initialDrawingDataRef.current) {
      existingDataURL = initialDrawingDataRef.current;
    }

    // Set background canvas dimensions
    bgCanvas.width = pixelWidth;
    bgCanvas.height = pixelHeight;
    bgCanvas.style.width = `${w}px`;
    bgCanvas.style.height = `${h}px`;

    const bgCtx = bgCanvas.getContext('2d');
    if (bgCtx) {
      bgCtx.scale(dpr, dpr);
      redrawBackground(bgCtx, w, h, canvasBgRef.current);
    }

    // Set drawing canvas dimensions
    drawingCanvas.width = pixelWidth;
    drawingCanvas.height = pixelHeight;
    drawingCanvas.style.width = `${w}px`;
    drawingCanvas.style.height = `${h}px`;

    const drawCtx = drawingCanvas.getContext('2d', { willReadFrequently: true });
    if (!drawCtx) return;

    drawCtx.scale(dpr, dpr);

    // Restore drawing if existed
    if (existingDataURL && existingDataURL.length > 30) {
      restoringDrawingRef.current = existingDataURL;
      const img = new Image();
      img.onload = () => {
        if (loadVersion !== imageLoadVersionRef.current) return;
        drawCtx.save();
        drawCtx.setTransform(1, 0, 0, 1, 0, 0);
        drawCtx.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height);
        drawCtx.restore();
        restoringDrawingRef.current = null;
      };
      img.onerror = () => {
        if (loadVersion === imageLoadVersionRef.current) restoringDrawingRef.current = null;
      };
      img.src = existingDataURL;
    }
  }, [redrawBackground]);

  // Match the canvas to its container, including sidebar and layout changes.
  useEffect(() => {
    initDualCanvas();
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initDualCanvas();
      }, 120);
    };
    window.addEventListener('resize', handleResize);
    const observer = typeof ResizeObserver !== 'undefined' && containerRef.current
      ? new ResizeObserver(handleResize)
      : null;
    if (containerRef.current) observer?.observe(containerRef.current);
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [initDualCanvas]);

  // When changing background style, redraw bgCanvas ONLY without touching drawingCanvas!
  useEffect(() => {
    canvasBgRef.current = canvasBg;
    const bgCanvas = bgCanvasRef.current;
    const container = containerRef.current;
    if (!bgCanvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);

    const bgCtx = bgCanvas.getContext('2d');
    if (bgCtx) {
      bgCtx.save();
      bgCtx.setTransform(1, 0, 0, 1, 0, 0);
      bgCtx.scale(dpr, dpr);
      redrawBackground(bgCtx, w, h, canvasBg);
      bgCtx.restore();
    }

    // Also update background in active page object
    setPages((prevPages) => {
      const updated = prevPages.map((p) =>
        p.id === activePageId ? { ...p, background: canvasBg, updatedAt: Date.now() } : p
      );
      triggerAutoSave(updated, activePageId, docTitle);
      return updated;
    });
  }, [canvasBg, activePageId, redrawBackground, docTitle, triggerAutoSave]);

  // ----------------------------------------------------
  // 4. UNDO / REDO HISTORY MANAGEMENT (DataURL based)
  // ----------------------------------------------------
  const restoreDrawing = useCallback((dataURL: string) => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const loadVersion = ++imageLoadVersionRef.current;
    restoringDrawingRef.current = dataURL || null;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    if (!dataURL) return;

    const img = new Image();
    img.onload = () => {
      if (loadVersion !== imageLoadVersionRef.current || canvas !== drawingCanvasRef.current) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      restoringDrawingRef.current = null;
    };
    img.onerror = () => {
      if (loadVersion === imageLoadVersionRef.current) restoringDrawingRef.current = null;
    };
    img.src = dataURL;
  }, []);

  const pushHistorySnapshot = useCallback(() => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const dataURL = drawingCanvas.toDataURL();

    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      if (sliced.length >= 25) sliced.shift();
      return [...sliced, dataURL];
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 24));

    // Update active page drawingData and auto-save
    setPages((prevPages) => {
      const updated = prevPages.map((p) =>
        p.id === activePageId ? { ...p, drawingData: dataURL, updatedAt: Date.now() } : p
      );
      triggerAutoSave(updated, activePageId, docTitle);
      return updated;
    });
  }, [historyIndex, activePageId, docTitle, triggerAutoSave]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const targetIndex = historyIndex - 1;
    const targetDataURL = history[targetIndex];
    if (targetDataURL === undefined) return;
    restoreDrawing(targetDataURL);
    setHistoryIndex(targetIndex);
    setPages((prev) => prev.map((p) =>
      p.id === activePageId ? { ...p, drawingData: targetDataURL, updatedAt: Date.now() } : p
    ));
  }, [historyIndex, history, activePageId, restoreDrawing]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const targetIndex = historyIndex + 1;
    const targetDataURL = history[targetIndex];
    if (targetDataURL === undefined) return;
    restoreDrawing(targetDataURL);
    setHistoryIndex(targetIndex);
    setPages((prev) => prev.map((p) =>
      p.id === activePageId ? { ...p, drawingData: targetDataURL, updatedAt: Date.now() } : p
    ));
  }, [historyIndex, history, activePageId, restoreDrawing]);

  const handleClearBoard = () => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    imageLoadVersionRef.current += 1;
    restoringDrawingRef.current = null;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    ctx.restore();

    pushHistorySnapshot();
    setShowClearConfirm(false);
  };

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger undo if typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // ----------------------------------------------------
  // 5. DRAWING POINTER HANDLERS (DPR aligned & Shift-snap)
  // ----------------------------------------------------
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return { x: 0, y: 0 };
    const rect = drawingCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || isDrawing.current || restoringDrawingRef.current) return;
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    // Text tool triggers input popup at position
    if (activeTool === 'text') {
      setTextInputModal({
        x: Math.max(10, Math.min(x, (containerRef.current?.clientWidth || 500) - 280)),
        y: Math.max(10, Math.min(y, (containerRef.current?.clientHeight || 500) - 180)),
        value: '',
        fontSize: 20,
        color: activeColor,
      });
      return;
    }

    imageLoadVersionRef.current += 1;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture fallback
    }

    isDrawing.current = true;
    activePointerId.current = e.pointerId;
    didMove.current = false;
    startPos.current = { x, y };
    lastPos.current = { x, y };

    // Save snapshot before dragging shapes
    snapshotData.current = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'highlighter') {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = Math.max(strokeWidth * 3.5, 18);
    } else if (activeTool === 'eraser') {
      // Destination-out clears ONLY the drawing layer, leaving background intact!
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      ctx.lineWidth = strokeWidth * 4.5;
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || activePointerId.current !== e.pointerId) return;
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let { x, y } = getCanvasCoords(e);
    const sx = startPos.current.x;
    const sy = startPos.current.y;
    if (Math.hypot(x - lastPos.current.x, y - lastPos.current.y) < 0.5) return;
    didMove.current = true;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      // Restore snapshot to clear previous shape preview
      if (snapshotData.current) {
        ctx.putImageData(snapshotData.current, 0, 0);
      }
      ctx.save();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // SHIFT KEY SNAPPING MODIFIERS
      if (e.shiftKey) {
        if (activeTool === 'line' || activeTool === 'arrow') {
          // Snap angle to 0, 45, 90, 135, 180... degrees
          const angle = Math.atan2(y - sy, x - sx);
          const snapStep = Math.PI / 4; // 45 degrees
          const snappedAngle = Math.round(angle / snapStep) * snapStep;
          const dist = Math.hypot(x - sx, y - sy);
          x = sx + dist * Math.cos(snappedAngle);
          y = sy + dist * Math.sin(snappedAngle);
        } else if (activeTool === 'rect') {
          // Snap to 1:1 perfect square
          const size = Math.max(Math.abs(x - sx), Math.abs(y - sy));
          x = sx + (x >= sx ? size : -size);
          y = sy + (y >= sy ? size : -size);
        } else if (activeTool === 'circle') {
          // Snap to 1:1 perfect circle
          const radius = Math.max(Math.abs(x - sx), Math.abs(y - sy));
          x = sx + (x >= sx ? radius : -radius);
          y = sy + (y >= sy ? radius : -radius);
        }
      }

      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Arrowhead geometry
        const angle = Math.atan2(y - sy, x - sx);
        const headLen = Math.max(strokeWidth * 3.2, 14);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - headLen * Math.cos(angle - Math.PI / 6),
          y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - headLen * Math.cos(angle + Math.PI / 6),
          y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (activeTool === 'rect') {
        ctx.beginPath();
        ctx.strokeRect(sx, sy, x - sx, y - sy);
      } else if (activeTool === 'circle') {
        const radiusX = Math.abs(x - sx) / 2;
        const radiusY = Math.abs(y - sy) / 2;
        const centerX = sx + (x - sx) / 2;
        const centerY = sy + (y - sy) / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    lastPos.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || activePointerId.current !== e.pointerId) return;
    handlePointerMove(e);
    isDrawing.current = false;
    activePointerId.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // release fallback
    }

    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    if (!didMove.current && (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser')) {
      ctx.beginPath();
      ctx.arc(startPos.current.x, startPos.current.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
    ctx.restore();
    snapshotData.current = null;
    if (didMove.current || activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      pushHistorySnapshot();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || activePointerId.current !== e.pointerId) return;
    isDrawing.current = false;
    activePointerId.current = null;
    const ctx = drawingCanvasRef.current?.getContext('2d', { willReadFrequently: true });
    if (ctx && snapshotData.current) ctx.putImageData(snapshotData.current, 0, 0);
    ctx?.restore();
    snapshotData.current = null;
  };

  // ----------------------------------------------------
  // 6. MULTI-LINE TEXT COMMIT HANDLER
  // ----------------------------------------------------
  const handleCommitText = () => {
    if (!textInputModal || !textInputModal.value.trim()) {
      setTextInputModal(null);
      return;
    }
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { x, y, value, fontSize, color } = textInputModal;
    const lines = value.split('\n');
    const lineHeight = fontSize * 1.35;

    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.textBaseline = 'top';

    lines.forEach((line, idx) => {
      ctx.fillText(line, x, y + idx * lineHeight);
    });
    ctx.restore();

    pushHistorySnapshot();
    setTextInputModal(null);
  };

  // ----------------------------------------------------
  // 7. STICKY NOTES INTERACTION
  // ----------------------------------------------------
  const handleAddStickyNote = () => {
    const container = containerRef.current;
    const w = container?.clientWidth || 600;
    const h = container?.clientHeight || 500;

    const newNote: StickyNoteItem = {
      id: `sticky_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      x: Math.max(10, Math.min(w / 2 - 90 + (Math.random() * 40 - 20), w - 200)),
      y: Math.max(10, Math.min(h / 2 - 80 + (Math.random() * 40 - 20), h - 170)),
      width: 190,
      height: 160,
      content: '',
      colorIndex: Math.floor(Math.random() * PASTEL_STICKY_COLORS.length),
    };

    const updated = [...stickyNotes, newNote];
    setStickyNotes(updated);

    // Save to current page
    setPages((prev) => {
      const updatedPages = prev.map((p) =>
        p.id === activePageId ? { ...p, stickyNotes: updated, updatedAt: Date.now() } : p
      );
      triggerAutoSave(updatedPages, activePageId, docTitle);
      return updatedPages;
    });
  };

  const handleUpdateStickyContent = (id: string, text: string) => {
    const updated = stickyNotes.map((n) => (n.id === id ? { ...n, content: text } : n));
    setStickyNotes(updated);
    setPages((prev) => {
      const updatedPages = prev.map((p) =>
        p.id === activePageId ? { ...p, stickyNotes: updated, updatedAt: Date.now() } : p
      );
      triggerAutoSave(updatedPages, activePageId, docTitle);
      return updatedPages;
    });
  };

  const handleChangeStickyColor = (id: string, colorIndex: number) => {
    const updated = stickyNotes.map((n) => (n.id === id ? { ...n, colorIndex } : n));
    setStickyNotes(updated);
    setPages((prev) => {
      const updatedPages = prev.map((p) =>
        p.id === activePageId ? { ...p, stickyNotes: updated, updatedAt: Date.now() } : p
      );
      triggerAutoSave(updatedPages, activePageId, docTitle);
      return updatedPages;
    });
  };

  const handleDeleteStickyNote = (id: string) => {
    const updated = stickyNotes.filter((n) => n.id !== id);
    setStickyNotes(updated);
    setPages((prev) => {
      const updatedPages = prev.map((p) =>
        p.id === activePageId ? { ...p, stickyNotes: updated, updatedAt: Date.now() } : p
      );
      triggerAutoSave(updatedPages, activePageId, docTitle);
      return updatedPages;
    });
  };

  // Sticky drag & drop handlers
  const handleStickyPointerDown = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    const note = stickyNotes.find((n) => n.id === id);
    if (!note) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    draggingStickyRef.current = {
      id,
      pointerId: e.pointerId,
      offsetX: e.clientX - note.x,
      offsetY: e.clientY - note.y,
      width: note.width,
      height: note.height,
      x: note.x,
      y: note.y,
    };
  };

  const handleStickyPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dragging = draggingStickyRef.current;
    if (!dragging || dragging.pointerId !== e.pointerId) return;
    const { id, offsetX, offsetY } = dragging;
    const container = containerRef.current;
    const maxW = Math.max(10, (container?.clientWidth || 800) - dragging.width - 10);
    const maxH = Math.max(10, (container?.clientHeight || 600) - dragging.height - 10);

    const newX = Math.max(10, Math.min(e.clientX - offsetX, maxW));
    const newY = Math.max(10, Math.min(e.clientY - offsetY, maxH));

    dragging.x = newX;
    dragging.y = newY;
    setStickyNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x: newX, y: newY } : n)));
  };

  const handleStickyPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingStickyRef.current || draggingStickyRef.current.pointerId !== e.pointerId) return;
    handleStickyPointerMove(e);
    const { id, x, y } = draggingStickyRef.current;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    draggingStickyRef.current = null;

    // Trigger save after drag finishes
    setPages((prev) => {
      const updatedPages = prev.map((p) =>
        p.id === activePageId
          ? { ...p, stickyNotes: p.stickyNotes.map((n) => n.id === id ? { ...n, x, y } : n), updatedAt: Date.now() }
          : p
      );
      triggerAutoSave(updatedPages, activePageId, docTitle);
      return updatedPages;
    });
  };

  // ----------------------------------------------------
  // 8. MULTI-PAGE MANAGEMENT
  // ----------------------------------------------------
  const handleSwitchPage = (targetPageId: string) => {
    if (targetPageId === activePageId) return;

    // 1. Save current drawing & stickies to current page
    const drawingCanvas = drawingCanvasRef.current;
    const currentDataURL = restoringDrawingRef.current || drawingCanvas?.toDataURL() || '';

    const updatedPages = pages.map((p) =>
      p.id === activePageId
        ? { ...p, drawingData: currentDataURL, stickyNotes, background: canvasBg, updatedAt: Date.now() }
        : p
    );

    // 2. Load target page
    const targetPage = updatedPages.find((p) => p.id === targetPageId);
    if (!targetPage) return;

    setPages(updatedPages);
    setActivePageId(targetPageId);
    setCanvasBg(targetPage.background || 'grid');
    setStickyNotes(targetPage.stickyNotes || []);

    restoreDrawing(targetPage.drawingData);
    setHistory([targetPage.drawingData]);
    setHistoryIndex(0);

    triggerAutoSave(updatedPages, targetPageId, docTitle);
  };

  const handleAddNewPage = () => {
    // 1. Save current drawing first
    const drawingCanvas = drawingCanvasRef.current;
    const currentDataURL = restoringDrawingRef.current || drawingCanvas?.toDataURL() || '';

    const newPageId = `page_${Date.now()}`;
    const newPage: StudyPage = {
      id: newPageId,
      title: `Trang ${pages.length + 1}`,
      drawingData: '',
      background: canvasBg,
      stickyNotes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedPages = pages.map((p) =>
      p.id === activePageId
        ? { ...p, drawingData: currentDataURL, stickyNotes, background: canvasBg, updatedAt: Date.now() }
        : p
    );
    updatedPages.push(newPage);

    setPages(updatedPages);
    setActivePageId(newPageId);
    setStickyNotes([]);

    restoreDrawing('');
    setHistory(['']);
    setHistoryIndex(0);

    triggerAutoSave(updatedPages, newPageId, docTitle);
  };

  const handleDeleteCurrentPage = () => {
    if (pages.length <= 1) return;
    const remaining = pages.filter((p) => p.id !== activePageId);
    const nextActive = remaining[0];

    setShowDeletePageConfirm(false);
    setPages(remaining);
    setActivePageId(nextActive.id);
    setCanvasBg(nextActive.background || 'grid');
    setStickyNotes(nextActive.stickyNotes || []);

    restoreDrawing(nextActive.drawingData);
    setHistory([nextActive.drawingData]);
    setHistoryIndex(0);

    triggerAutoSave(remaining, nextActive.id, docTitle);
  };

  const handleCommitPageTitle = (pageId: string) => {
    if (!pageTitleInputValue.trim()) {
      setEditingPageTitleId(null);
      return;
    }
    const updated = pages.map((p) =>
      p.id === pageId ? { ...p, title: pageTitleInputValue.trim(), updatedAt: Date.now() } : p
    );
    setPages(updated);
    setEditingPageTitleId(null);
    triggerAutoSave(updated, activePageId, docTitle);
  };

  // ----------------------------------------------------
  // 9. HIGH-QUALITY AMBIENT SOUND GENERATOR (Web Audio API)
  // ----------------------------------------------------
  const stopAmbientSound = () => {
    if (ambientAudioNodesRef.current) {
      try {
        if (ambientAudioNodesRef.current.source) {
          (ambientAudioNodesRef.current.source as AudioBufferSourceNode).stop?.();
          ambientAudioNodesRef.current.source.disconnect();
        }
        if (ambientAudioNodesRef.current.lfo) {
          ambientAudioNodesRef.current.lfo.stop();
          ambientAudioNodesRef.current.lfo.disconnect();
        }
        if (ambientAudioNodesRef.current.secondarySource) {
          ambientAudioNodesRef.current.secondarySource.stop?.();
          ambientAudioNodesRef.current.secondarySource.disconnect();
        }
      } catch {
        // ignore disconnect errors
      }
      ambientAudioNodesRef.current = null;
    }
  };

  const playAmbientSound = useCallback(
    async (type: AmbientSoundType) => {
      stopAmbientSound();
      if (type === 'none') return;
      const volume = ambientVolumeRef.current;

      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Generate 6-second high quality loop buffer
        const sampleRate = ctx.sampleRate;
        const duration = 6;
        const bufferSize = sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const output = buffer.getChannelData(0);

        // Paul Kellet Pink Noise Algorithm with Brown Noise blending
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
          b6 = white * 0.115926;

          // Brown noise smoothing (low-frequency warmth)
          lastOut = (lastOut + 0.02 * white) / 1.02;
          output[i] = pink * 0.7 + lastOut * 0.3;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume * 0.35, ctx.currentTime);

        let filter: BiquadFilterNode;
        let lfo: OscillatorNode | undefined;
        let lfoGain: GainNode | undefined;

        if (type === 'rain') {
          // 🌧️ Gentle Rain: Lowpass 850Hz + High-shelf cut for zero harsh hiss
          filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(850, ctx.currentTime);

          const highShelf = ctx.createBiquadFilter();
          highShelf.type = 'highshelf';
          highShelf.frequency.setValueAtTime(2500, ctx.currentTime);
          highShelf.gain.setValueAtTime(-14, ctx.currentTime);

          noiseSource.connect(filter);
          filter.connect(highShelf);
          highShelf.connect(masterGain);
        } else if (type === 'stream') {
          // 🦦 Babbling Brook: Bandpass filter modulated by gentle LFO for water swirl
          filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(650, ctx.currentTime);
          filter.Q.setValueAtTime(2.2, ctx.currentTime);

          // LFO creates soothing stream modulation
          lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.35, ctx.currentTime);
          lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(120, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();

          noiseSource.connect(filter);
          filter.connect(masterGain);
        } else if (type === 'waves') {
          // 🌊 Ocean Waves: Lowpass + 9-second Ebb & Surge tidal breathing envelope
          filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(420, ctx.currentTime);

          lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.11, ctx.currentTime); // ~9 second tidal cycle
          lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(masterGain.gain);
          lfo.start();

          noiseSource.connect(filter);
          filter.connect(masterGain);
        } else {
          // 🍃 Warm Pink Noise: Deep soothing lowpass at 500Hz, optimal for intense focus
          filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(500, ctx.currentTime);

          noiseSource.connect(filter);
          filter.connect(masterGain);
        }

        masterGain.connect(ctx.destination);
        noiseSource.start();

        ambientAudioNodesRef.current = {
          source: noiseSource,
          gainNode: masterGain,
          filter,
          lfo,
          lfoGain,
        };
      } catch (err) {
        console.warn('Web Audio Ambient error:', err);
      }
    },
    []
  );

  // Trigger sound when ambientSound state changes
  useEffect(() => {
    playAmbientSound(ambientSound);
    return () => {
      stopAmbientSound();
    };
  }, [ambientSound, playAmbientSound]);

  // Adjust volume dynamically
  useEffect(() => {
    if (ambientAudioNodesRef.current?.gainNode && audioCtxRef.current) {
      ambientAudioNodesRef.current.gainNode.gain.setTargetAtTime(
        ambientVolume * 0.35,
        audioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [ambientVolume]);

  // Full cleanup on component unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const toggleSound = (type: AmbientSoundType) => {
    // Resume context on user click
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setAmbientSound((prev) => (prev === type ? 'none' : type));
  };

  // Completion chime audio helper
  const playCompletionChime = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx =
        audioCtxRef.current && audioCtxRef.current.state !== 'closed'
          ? audioCtxRef.current
          : new AudioCtx();

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);

      if (ctx !== audioCtxRef.current) {
        setTimeout(() => {
          ctx.close().catch(() => {});
        }, 1300);
      }
    } catch {
      // Audio fallback silent
    }
  }, []);

  // ----------------------------------------------------
  // 10. TIMER ENGINE & INSTANT LOGGING
  // ----------------------------------------------------
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTotalStudiedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);

      // Play completion chime
      playCompletionChime();

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
      });

      // Auto-log to selected task
      if (selectedTask && onLogStudyMinutes) {
        const completedMinutes = Math.round(timerMinutes);
        onLogStudyMinutes(selectedTask.id, completedMinutes);
        setLogSuccessToast(`Hoàn thành phiên học ${completedMinutes} phút cho "${selectedTask.title}"! 🎉`);
        setTimeout(() => setLogSuccessToast(null), 4000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft, timerMinutes, selectedTask, onLogStudyMinutes, playCompletionChime]);

  const handleSetPresetTimer = (minutes: number) => {
    setTimerMinutes(minutes);
    setTimeLeft(minutes * 60);
    setIsTimerRunning(false);
  };

  const handleApplyCustomTimer = () => {
    const mins = parseInt(customMinutesInput, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 300) {
      setTimerMinutes(mins);
      setTimeLeft(mins * 60);
      setIsTimerRunning(false);
      setShowCustomTimerModal(false);
    }
  };

  const toggleTimer = () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerMinutes * 60);
  };

  // Log study time NOW without waiting for countdown to finish
  const handleLogStudyTimeNow = async () => {
    const studiedSecondsInCurrentSession = timerMinutes * 60 - timeLeft;
    const studiedMinutes = Math.floor(studiedSecondsInCurrentSession / 60);

    if (studiedMinutes < 1) {
      alert('Bé Rái Cá khuyên: Bạn hãy tập trung học thêm một chút (ít nhất 1 phút) rồi mới ghi nhận nhé! 🦦');
      return;
    }

    if (!selectedTask) {
      alert('Vui lòng chọn một công việc/bài học ở danh sách bên dưới để ghi nhận thời gian học!');
      return;
    }

    if (onLogStudyMinutes) {
      await onLogStudyMinutes(selectedTask.id, studiedMinutes);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      setLogSuccessToast(
        `Bé Rái Cá đã ghi nhận ${studiedMinutes} phút học vào "${selectedTask.title}"! 🎉`
      );
      setTimeout(() => setLogSuccessToast(null), 4000);

      // Reset timer to full or keep going
      setTimeLeft(timerMinutes * 60);
      setIsTimerRunning(false);
    }
  };

  // ----------------------------------------------------
  // 11. EXPORT TO PDF & PNG (HIGH DPI + COMPOSITED STICKIES)
  // ----------------------------------------------------
  const generateCompositeExportCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const bgCanvas = bgCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!bgCanvas || !drawingCanvas) return null;

    // Use high DPI scale (2x) for crisp PDF/PNG
    const exportDpr = 2;
    const padding = 40 * exportDpr;
    const headerHeight = 100 * exportDpr;
    const footerHeight = 45 * exportDpr;

    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return null;

    const baseWidth = drawingCanvas.width;
    const baseHeight = drawingCanvas.height;

    exportCanvas.width = baseWidth + padding * 2;
    exportCanvas.height = baseHeight + headerHeight + footerHeight + padding;

    // 1. Fill clean background matching canvas theme
    exportCtx.fillStyle = canvasBg === 'chalkboard' ? '#1c382b' : '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. Header Banner
    exportCtx.fillStyle = canvasBg === 'chalkboard' ? '#f0fdf4' : '#143823';
    exportCtx.font = `bold ${32 * exportDpr}px sans-serif`;
    exportCtx.fillText(
      `${docTitle || 'Ghi chép bài học'} - ${currentPage.title}`,
      padding,
      50 * exportDpr
    );

    // Subtitle / Date / Otter metadata
    const dateStr = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date());

    exportCtx.fillStyle = canvasBg === 'chalkboard' ? '#a7f3d0' : '#4b7c5b';
    exportCtx.font = `${16 * exportDpr}px sans-serif`;
    exportCtx.fillText(
      `📅 ${dateStr}  •  ⏱️ Đã học: ${Math.floor(totalStudiedSeconds / 60)} phút  •  Trợ lý Rái Cá OtterTodo`,
      padding,
      82 * exportDpr
    );

    // Header Separator line
    exportCtx.strokeStyle =
      canvasBg === 'chalkboard' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    exportCtx.lineWidth = 2 * exportDpr;
    exportCtx.beginPath();
    exportCtx.moveTo(padding, 96 * exportDpr);
    exportCtx.lineTo(exportCanvas.width - padding, 96 * exportDpr);
    exportCtx.stroke();

    // 3. Draw Background Layer & Drawing Layer
    const canvasOriginX = padding;
    const canvasOriginY = headerHeight + 15 * exportDpr;

    exportCtx.drawImage(bgCanvas, canvasOriginX, canvasOriginY);
    exportCtx.drawImage(drawingCanvas, canvasOriginX, canvasOriginY);

    // 4. Render Sticky Notes on top of the drawing
    const dpr = window.devicePixelRatio || 1;
    stickyNotes.forEach((note) => {
      const palette = PASTEL_STICKY_COLORS[note.colorIndex] || PASTEL_STICKY_COLORS[0];
      const noteX = canvasOriginX + note.x * dpr;
      const noteY = canvasOriginY + note.y * dpr;
      const noteW = note.width * dpr;
      const noteH = note.height * dpr;
      const radius = 8 * dpr;

      // Draw shadow
      exportCtx.save();
      exportCtx.shadowColor = 'rgba(0,0,0,0.15)';
      exportCtx.shadowBlur = 10 * dpr;
      exportCtx.shadowOffsetX = 3 * dpr;
      exportCtx.shadowOffsetY = 4 * dpr;

      // Note body
      exportCtx.fillStyle = palette.bg;
      exportCtx.strokeStyle = palette.border;
      exportCtx.lineWidth = 1.5 * dpr;

      exportCtx.beginPath();
      exportCtx.roundRect(noteX, noteY, noteW, noteH, radius);
      exportCtx.fill();
      exportCtx.stroke();
      exportCtx.restore();

      // Note Header bar
      exportCtx.fillStyle = palette.header;
      exportCtx.beginPath();
      exportCtx.roundRect(noteX, noteY, noteW, 24 * dpr, [radius, radius, 0, 0]);
      exportCtx.fill();

      // Header dot pin
      exportCtx.fillStyle = palette.border;
      exportCtx.beginPath();
      exportCtx.arc(noteX + noteW / 2, noteY + 12 * dpr, 4 * dpr, 0, Math.PI * 2);
      exportCtx.fill();

      // Render note text multi-line
      if (note.content) {
        exportCtx.fillStyle = palette.text;
        exportCtx.font = `500 ${14 * dpr}px sans-serif`;
        exportCtx.textBaseline = 'top';

        const textX = noteX + 12 * dpr;
        let textY = noteY + 32 * dpr;
        const maxTextW = noteW - 24 * dpr;
        const noteLines = note.content.split('\n');

        noteLines.forEach((rawLine) => {
          // Word wrap
          const words = rawLine.split(' ');
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = exportCtx.measureText(testLine);
            if (metrics.width > maxTextW && currentLine) {
              exportCtx.fillText(currentLine, textX, textY);
              textY += 18 * dpr;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            exportCtx.fillText(currentLine, textX, textY);
            textY += 18 * dpr;
          }
        });
      }
    });

    // 5. Footer with Otter Watermark
    exportCtx.fillStyle = canvasBg === 'chalkboard' ? '#a7f3d0' : '#64748b';
    exportCtx.font = `${14 * exportDpr}px sans-serif`;
    exportCtx.fillText(
      '🦦 Không Gian Học Tập - OtterTodo • Làm nhiều hơn, học thông minh hơn',
      padding,
      exportCanvas.height - 20 * exportDpr
    );

    return exportCanvas;
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const compositeCanvas = await generateCompositeExportCanvas();
      if (!compositeCanvas) return;

      const imgData = compositeCanvas.toDataURL('image/png', 1.0);
      const isLandscape = compositeCanvas.width >= compositeCanvas.height;

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const ratio = Math.min(pdfWidth / compositeCanvas.width, pdfHeight / compositeCanvas.height);
      const w = compositeCanvas.width * ratio;
      const h = compositeCanvas.height * ratio;
      const x = (pdfWidth - w) / 2;
      const y = (pdfHeight - h) / 2;

      pdf.addImage(imgData, 'PNG', x, y, w, h);

      const safeTitle = (docTitle || 'Khong-Gian-Hoc')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      const filename = `${safeTitle}-${currentPage.title}-${new Date().toISOString().slice(0, 10)}.pdf`;

      pdf.save(filename);

      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Có lỗi khi tạo file PDF. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    const compositeCanvas = await generateCompositeExportCanvas();
    if (!compositeCanvas) return;

    const link = document.createElement('a');
    link.download = `${docTitle || 'Khong-Gian-Hoc'}-${currentPage.title}-${new Date()
      .toISOString()
      .slice(0, 10)}.png`;
    link.href = compositeCanvas.toDataURL('image/png');
    link.click();
  };

  // Format timer MM:SS
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timerProgress = Math.min(
    100,
    Math.max(0, ((timerMinutes * 60 - timeLeft) / (timerMinutes * 60)) * 100)
  );

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#f4f8f5] overflow-hidden select-none transition-all ${
        isFocusMode ? 'fixed inset-0 z-50 bg-[#16291e]' : 'relative'
      }`}
    >
      {/* TOP BAR: Document Title, Multi-page Tabs, Quick Timer Pill, Export Actions */}
      <div
        className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-20 backdrop-blur-md transition-colors ${
          isFocusMode
            ? 'bg-[#1e392a]/95 border-[#2d523c] text-white'
            : 'bg-white/90 border-emerald-100/90 text-slate-800 shadow-2xs'
        }`}
      >
        {/* Left: Mascot & Document Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onOpenMobileMenu && !isFocusMode && (
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 rounded-xl text-emerald-800 hover:bg-emerald-100 lg:hidden shrink-0"
              title="Mở menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center overflow-hidden ring-2 ring-emerald-300 shadow-xs shrink-0">
            <img
              src="/otter-mascot.png"
              alt="Otter Assistant"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Nhập tên bài học..."
                className={`text-xs sm:text-sm font-extrabold bg-transparent border-b border-dashed outline-none truncate transition-colors max-w-[150px] sm:max-w-[220px] ${
                  isFocusMode
                    ? 'text-white border-emerald-400 focus:border-emerald-200'
                    : 'text-emerald-950 border-emerald-300 focus:border-emerald-600'
                }`}
              />
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                  isFocusMode ? 'bg-[#294c37] text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                Không gian học
              </span>

              {/* Auto-save status indicator */}
              <span
                className={`flex items-center gap-1 text-[10px] font-medium shrink-0 ${
                  saveStatus === 'quota_error'
                    ? 'text-amber-500 font-bold'
                    : 'text-emerald-600 dark:text-emerald-300'
                }`}
                title={
                  saveStatus === 'quota_error'
                    ? 'Dung lượng LocalStorage của trình duyệt đã đầy. Vui lòng xuất PDF để lưu trữ bài học của bạn!'
                    : 'Tự động lưu vào bộ nhớ trình duyệt'
                }
              >
                {saveStatus === 'quota_error' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                    <span>Bộ nhớ đầy (Xuất PDF)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="hidden sm:inline">
                      {saveStatus === 'saved' ? 'Đã lưu' : 'Đang lưu...'}
                    </span>
                  </>
                )}
              </span>
            </div>
            {selectedTask && (
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-300/80 truncate">
                Đang gắn với: <b>{selectedTask.title}</b>
              </span>
            )}
          </div>
        </div>

        {/* Center: Multi-page Tab Bar */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-[40vw]">
          {pages.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                p.id === activePageId
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-emerald-50/60 dark:bg-[#203f2e] text-slate-700 dark:text-emerald-200 border-emerald-200/60 dark:border-[#2f553f] hover:bg-emerald-100/70'
              }`}
            >
              {editingPageTitleId === p.id ? (
                <input
                  type="text"
                  autoFocus
                  value={pageTitleInputValue}
                  onChange={(e) => setPageTitleInputValue(e.target.value)}
                  onBlur={() => handleCommitPageTitle(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitPageTitle(p.id);
                    if (e.key === 'Escape') setEditingPageTitleId(null);
                  }}
                  className="bg-transparent border-b border-white outline-none text-xs w-24 text-white"
                />
              ) : (
                <button
                  onClick={() => handleSwitchPage(p.id)}
                  onDoubleClick={() => {
                    setEditingPageTitleId(p.id);
                    setPageTitleInputValue(p.title);
                  }}
                  className="flex items-center gap-1 outline-none"
                  title="Nhấp để chuyển trang, nhấp đúp để đổi tên trang"
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[100px]">{p.title || `Trang ${idx + 1}`}</span>
                </button>
              )}
            </div>
          ))}

          {/* Add Page Button */}
          <button
            onClick={handleAddNewPage}
            className="p-1.5 rounded-xl bg-emerald-100 dark:bg-[#2b4c38] hover:bg-emerald-200 dark:hover:bg-[#345d45] text-emerald-800 dark:text-emerald-200 transition-colors shrink-0"
            title="Thêm trang ghi chú mới"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Delete Page Button (if > 1 page) */}
          {pages.length > 1 && (
            <button
              onClick={() => setShowDeletePageConfirm(true)}
              className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 transition-colors shrink-0"
              title="Xóa trang hiện tại"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Quick Timer Pill, Focus Mode, PDF Export */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Timer Pill */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-2xs transition-colors ${
              isFocusMode
                ? 'bg-[#254633] border-[#386249] text-white'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="text-xs font-mono font-black">{formatTimer(timeLeft)}</span>
            <button
              onClick={toggleTimer}
              className={`p-1 rounded-md text-white transition-all ${
                isTimerRunning
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-700 hover:bg-emerald-600'
              }`}
              title={isTimerRunning ? 'Tạm dừng học' : 'Bắt đầu học'}
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-1 rounded-md hover:bg-black/10 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              title="Đặt lại thời gian"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Focus Mode Button */}
          <button
            onClick={() => setIsFocusMode((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isFocusMode
                ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
                : 'bg-[#224830] text-white hover:bg-[#1a3825]'
            }`}
          >
            {isFocusMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thoát tập trung</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chế độ tập trung</span>
              </>
            )}
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors disabled:opacity-50"
            title="Lưu trang bài học thành file PDF hoàn hảo"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isExporting ? 'Đang xuất PDF...' : 'Lưu PDF'}</span>
          </button>

          {/* Export PNG button */}
          <button
            onClick={handleExportPNG}
            className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-emerald-200 dark:hover:bg-[#284a36] transition-colors"
            title="Tải ảnh PNG độ nét cao"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST FOR LOGGING TIME */}
      {logSuccessToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <Award className="w-4 h-4 text-amber-300" />
          <span>{logSuccessToast}</span>
        </div>
      )}

      {/* WORKSPACE MAIN BODY: Canvas + Sidebar Assistant */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        {/* LEFT / CENTER: Dual-layer Canvas Area & Toolbar */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-[#eaf0eb]">
          {/* FLOATING DRAWING TOOLBAR */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1 p-1.5 bg-white/95 dark:bg-[#1e392a]/95 backdrop-blur-md rounded-2xl shadow-lg border border-emerald-100 dark:border-[#2f553f] overflow-hidden">
            {/* Drawing Tools */}
            <div className="flex shrink-0 items-center gap-0.5 border-r border-slate-200 dark:border-[#2d523c] pr-1.5 mr-0.5">
              <button
                onClick={() => setActiveTool('pen')}
                className={`p-2 rounded-xl transition-all ${
                  activeTool === 'pen'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                }`}
                title="Bút mực (Pen)"
              >
                <Pen className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool('highlighter')}
                className={`p-2 rounded-xl transition-all ${
                  activeTool === 'highlighter'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                }`}
                title="Bút dạ quang (Highlighter)"
              >
                <Highlighter className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool('eraser')}
                className={`flex items-center gap-1 px-2 py-2 rounded-xl transition-all ${
                  activeTool === 'eraser'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                }`}
                title="Tẩy nét vẽ (giữ nguyên nền giấy)"
                aria-label="Tẩy nét vẽ"
                aria-pressed={activeTool === 'eraser'}
              >
                <Eraser className="w-4 h-4" />
                <span className="text-xs font-semibold">Tẩy</span>
              </button>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              <div className="flex shrink-0 items-center gap-0.5 border-r border-slate-200 dark:border-[#2d523c] pr-1.5 mr-0.5">
                <button
                  onClick={() => setActiveTool('line')}
                  className={`p-2 rounded-xl transition-all ${
                    activeTool === 'line'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                  }`}
                  title="Đường thẳng (Giữ Shift để vẽ ngang/dọc/chéo 45°)"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTool('arrow')}
                  className={`p-2 rounded-xl transition-all ${
                    activeTool === 'arrow'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                  }`}
                  title="Mũi tên (Dành cho sơ đồ tư duy)"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTool('rect')}
                  className={`p-2 rounded-xl transition-all ${
                    activeTool === 'rect'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                  }`}
                  title="Hình chữ nhật (Giữ Shift để vẽ hình vuông chuẩn)"
                >
                  <Square className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTool('circle')}
                  className={`p-2 rounded-xl transition-all ${
                    activeTool === 'circle'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                  }`}
                  title="Hình tròn / Ellipse (Giữ Shift để vẽ hình tròn chuẩn)"
                >
                  <Circle className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTool('text')}
                  className={`p-2 rounded-xl transition-all ${
                    activeTool === 'text'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                  }`}
                  title="Thêm văn bản nhiều dòng (Multi-line Text)"
                >
                  <Type className="w-4 h-4" />
                </button>

                {/* STICKY NOTE BUTTON */}
                <button
                  onClick={handleAddStickyNote}
                  className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                  title="Dán giấy ghi chú (Sticky Note)"
                >
                  <StickyIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Basic Colors Palette */}
              <div className="flex items-center gap-1 border-r border-slate-200 dark:border-[#2d523c] pr-1.5 mr-0.5">
                {BASIC_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setActiveColor(c.value)}
                    className={`w-5 h-5 rounded-full transition-transform ring-offset-1 ${
                      activeColor === c.value
                        ? 'ring-2 ring-emerald-500 scale-110 shadow-xs'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: c.value,
                      border: c.value === '#ffffff' ? '1px solid #cbd5e1' : 'none',
                    }}
                    title={c.label}
                  />
                ))}

                {/* Custom Color Input */}
                <label className="relative cursor-pointer ml-0.5" title="Chọn màu tùy thích">
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => setActiveColor(e.target.value)}
                    aria-label="Chọn màu vẽ tùy thích"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: activeColor }}
                  >
                    🌈
                  </div>
                </label>
              </div>

              {/* Stroke Width Selector */}
              <div className="flex items-center gap-1 border-r border-slate-200 dark:border-[#2d523c] pr-1.5 mr-0.5">
                {STROKE_WIDTHS.map((sw) => (
                  <button
                    key={sw.value}
                    onClick={() => setStrokeWidth(sw.value)}
                    className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      strokeWidth === sw.value
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-800 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                    }`}
                    title={`Cỡ nét: ${sw.label}`}
                  >
                    {sw.label}
                  </button>
                ))}
              </div>

              {/* Canvas Background Paper Selector */}
              <div className="flex items-center gap-1 border-r border-slate-200 dark:border-[#2d523c] pr-1.5 mr-0.5">
                {(
                  [
                    { id: 'grid', label: 'Ô ly' },
                    { id: 'lined', label: 'Kẻ ngang' },
                    { id: 'dots', label: 'Chấm bi' },
                    { id: 'chalkboard', label: 'Bảng phấn' },
                    { id: 'blank', label: 'Trơn' },
                  ] as const
                ).map((bgItem) => (
                  <button
                    key={bgItem.id}
                    onClick={() => setCanvasBg(bgItem.id)}
                    className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      canvasBg === bgItem.id
                        ? 'bg-[#21472f] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37]'
                    }`}
                    title={`Đổi nền giấy sang ${bgItem.label} (Không làm mất nét vẽ)`}
                  >
                    {bgItem.label}
                  </button>
                ))}
              </div>

              {/* Undo / Redo / Clear */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37] disabled:opacity-30 transition-all"
                  title="Hoàn tác (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284d37] disabled:opacity-30 transition-all"
                  title="Làm lại (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                  title="Xóa trắng bảng vẽ trang này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* DUAL-LAYER CANVAS CONTAINER */}
          <div
            ref={containerRef}
            className="flex-1 w-full h-full relative cursor-crosshair overflow-hidden touch-none"
          >
            {/* LAYER 1: Background Canvas (Grid / Lined / Chalkboard) */}
            <canvas
              ref={bgCanvasRef}
              className="absolute inset-0 block w-full h-full pointer-events-none z-0"
            />

            {/* LAYER 2: Drawing Canvas (User strokes & shapes) */}
            <canvas
              ref={drawingCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              className="absolute inset-0 block w-full h-full z-10"
            />

            {/* LAYER 3: STICKY NOTES OVERLAY */}
            {stickyNotes.map((note) => {
              const palette = PASTEL_STICKY_COLORS[note.colorIndex] || PASTEL_STICKY_COLORS[0];
              return (
                <div
                  key={note.id}
                  className="absolute z-20 rounded-xl shadow-lg border flex flex-col transition-shadow hover:shadow-xl select-none"
                  style={{
                    left: note.x,
                    top: note.y,
                    width: note.width,
                    minHeight: note.height,
                    backgroundColor: palette.bg,
                    borderColor: palette.border,
                  }}
                >
                  {/* Sticky Header Drag Handle */}
                  <div
                    onPointerDown={(e) => handleStickyPointerDown(note.id, e)}
                    onPointerMove={handleStickyPointerMove}
                    onPointerUp={handleStickyPointerUp}
                    onPointerCancel={handleStickyPointerUp}
                    className="px-2.5 py-1.5 cursor-grab active:cursor-grabbing touch-none flex items-center justify-between rounded-t-xl"
                    style={{ backgroundColor: palette.header }}
                  >
                    {/* Color picker small dots */}
                    <div className="flex items-center gap-1">
                      {PASTEL_STICKY_COLORS.map((col, cIdx) => (
                        <button
                          key={col.name}
                          onClick={() => handleChangeStickyColor(note.id, cIdx)}
                          className={`w-2.5 h-2.5 rounded-full transition-transform ${
                            note.colorIndex === cIdx ? 'scale-125 ring-1 ring-black/40' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: col.border }}
                          title={col.name}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleDeleteStickyNote(note.id)}
                      className="p-0.5 rounded text-slate-500 hover:text-rose-600 hover:bg-black/5"
                      title="Xóa giấy ghi chú"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sticky Content Textarea */}
                  <div className="p-2 flex-1 flex flex-col">
                    <textarea
                      value={note.content}
                      onChange={(e) => handleUpdateStickyContent(note.id, e.target.value)}
                      placeholder="Ghi nhanh công thức, từ khóa cần nhớ..."
                      className="w-full flex-1 bg-transparent resize-none outline-none text-xs font-medium leading-relaxed"
                      style={{ color: palette.text }}
                      rows={5}
                    />
                  </div>
                </div>
              );
            })}

            {/* LAYER 4: MULTI-LINE TEXT INPUT POPUP */}
            {textInputModal && (
              <div
                className="absolute z-40 bg-white dark:bg-[#1a3325] p-3 rounded-2xl shadow-2xl border border-emerald-300 dark:border-[#315740] flex flex-col gap-2 animate-in zoom-in-95 w-72"
                style={{
                  left: textInputModal.x,
                  top: textInputModal.y,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1">
                    <Type className="w-3.5 h-3.5" /> Chèn văn bản
                  </span>
                  {/* Font Size Selector */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'Nhỏ', size: 14 },
                      { label: 'Vừa', size: 20 },
                      { label: 'Lớn', size: 28 },
                      { label: 'Tiêu đề', size: 36 },
                    ].map((fs) => (
                      <button
                        key={fs.size}
                        onClick={() =>
                          setTextInputModal((prev) => (prev ? { ...prev, fontSize: fs.size } : null))
                        }
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          textInputModal.fontSize === fs.size
                            ? 'bg-emerald-700 text-white'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
                        }`}
                      >
                        {fs.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  autoFocus
                  rows={3}
                  value={textInputModal.value}
                  onChange={(e) =>
                    setTextInputModal((prev) => (prev ? { ...prev, value: e.target.value } : null))
                  }
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
                      e.preventDefault();
                      handleCommitText();
                    }
                    if (e.key === 'Escape') setTextInputModal(null);
                  }}
                  placeholder="Gõ văn bản (Shift+Enter để xuống dòng)..."
                  className="text-xs p-2 border rounded-xl outline-none border-emerald-300 dark:border-[#345b42] focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 dark:bg-[#203e2c] text-slate-800 dark:text-slate-100"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Enter: Chèn • Shift+Enter: Xuống dòng</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTextInputModal(null)}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleCommitText}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Chèn chữ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: TRỢ LÝ RÁI CÁ (OTTER ASSISTANT) & FOCUS CONTROLS */}
        {!isFocusMode && (
          <div className="w-full md:w-80 bg-white dark:bg-[#1a3325] border-t md:border-t-0 md:border-l border-emerald-100 dark:border-[#2a4d38] p-3.5 flex flex-col gap-3.5 overflow-y-auto shrink-0 shadow-sm">
            {/* Mascot Greeting & Advice Box */}
            <div className="bg-gradient-to-br from-[#f2f8f3] via-[#e8f5ec] to-[#d8ede0] dark:from-[#234532] dark:to-[#1b3627] rounded-2xl p-3 border border-[#cbe5d2] dark:border-[#315740] relative overflow-hidden">
              <div className="flex items-start gap-2.5">
                <div
                  onClick={() => setOtterQuoteIndex((prev) => (prev + 1) % OTTER_QUOTES.length)}
                  className="w-12 h-12 rounded-xl overflow-hidden bg-white/80 dark:bg-black/20 ring-2 ring-emerald-300 shadow-sm shrink-0 cursor-pointer hover:scale-105 transition-transform"
                  title="Nhấn vào Bé Rái Cá để nhận lời khuyên mới!"
                >
                  <img
                    src="/otter-mascot.png"
                    alt="Bé Rái Cá"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Gợi ý phương pháp
                    </span>
                    <button
                      onClick={() => setOtterQuoteIndex((prev) => (prev + 1) % OTTER_QUOTES.length)}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Đổi gợi ý
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-normal leading-relaxed mt-1">
                    "{OTTER_QUOTES[otterQuoteIndex]}"
                  </p>
                </div>
              </div>
            </div>

            {/* 1. TIMER WIDGET (FLEXIBLE PRESETS + CUSTOM MINUTES + LOG STUDY TIME NOW) */}
            <div className="bg-[#f9fbf9] dark:bg-[#1e3a2b] rounded-2xl p-3 border border-emerald-100 dark:border-[#2f553f] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Đồng hồ tập trung
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Tổng học: {Math.floor(totalStudiedSeconds / 60)} phút
                </span>
              </div>

              {/* Timer Progress Ring & Digital Display */}
              <div className="flex items-center justify-center py-1">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-emerald-100 dark:text-[#2d503b]"
                      strokeWidth="7"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-emerald-600 transition-all duration-1000 ease-linear"
                      strokeWidth="7"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={2 * Math.PI * 42 * (1 - timerProgress / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-black font-mono tracking-tight text-emerald-950 dark:text-white">
                      {formatTimer(timeLeft)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      {isTimerRunning ? 'Đang học bài 📖' : 'Sẵn sàng'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Presets & Custom input trigger */}
              <div className="grid grid-cols-2 gap-1.5">
                {TIMER_PRESETS.map((p) => (
                  <button
                    key={p.minutes}
                    onClick={() => handleSetPresetTimer(p.minutes)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                      timerMinutes === p.minutes
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        : 'bg-white dark:bg-[#254634] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#345b42] hover:bg-emerald-50 dark:hover:bg-[#2a4e39]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Minutes Input Trigger */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  onClick={() => setShowCustomTimerModal((prev) => !prev)}
                  className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border border-emerald-200 dark:border-[#345b42] bg-emerald-50/50 dark:bg-[#224432] text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-1 hover:bg-emerald-100"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Tùy chỉnh số phút...</span>
                </button>
              </div>

              {showCustomTimerModal && (
                <div className="p-2 bg-white dark:bg-[#224432] rounded-xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={customMinutesInput}
                    onChange={(e) => setCustomMinutesInput(e.target.value)}
                    placeholder="Số phút"
                    className="w-16 px-2 py-1 text-xs font-bold border rounded-lg dark:bg-[#1a3325] dark:border-[#345b42] text-slate-800 dark:text-white outline-none"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">phút</span>
                  <button
                    onClick={handleApplyCustomTimer}
                    className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 ml-auto"
                  >
                    Đặt
                  </button>
                </div>
              )}

              {/* Timer Controls */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={toggleTimer}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 ${
                    isTimerRunning
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-[#224830] hover:bg-[#1a3825]'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Bắt đầu phiên học</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-2 rounded-xl border border-slate-200 dark:border-[#345b42] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2b4c39]"
                  title="Đặt lại thời gian"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* LOG STUDY TIME NOW BUTTON */}
              <button
                onClick={handleLogStudyTimeNow}
                className="w-full py-1.5 px-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60 flex items-center justify-center gap-1.5 transition-colors"
                title="Lưu số phút bạn đã học được vào công việc ngay mà không cần đợi hết giờ đếm ngược!"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Ghi nhận tiến độ ngay</span>
              </button>
            </div>

            {/* 2. CHẾ ĐỘ TẬP TRUNG & ÂM THANH NỀN CHẤT LƯỢNG CAO (AMBIENT FOCUS) */}
            <div className="bg-[#f9fbf9] dark:bg-[#1e3a2b] rounded-2xl p-3 border border-emerald-100 dark:border-[#2f553f] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-emerald-600" />
                  Âm thanh tập trung (Ambient)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {ambientSound === 'none' ? 'Tắt' : 'Đang phát 🎧'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'none', label: 'Tắt âm' },
                    { id: 'rain', label: '🌧️ Mưa êm dịu' },
                    { id: 'stream', label: '🦦 Suối Rái Cá' },
                    { id: 'waves', label: '🌊 Sóng biển' },
                    { id: 'pink_noise', label: '🍃 Tiếng ồn êm' },
                  ] as const
                ).map((snd) => (
                  <button
                    key={snd.id}
                    onClick={() => toggleSound(snd.id)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                      ambientSound === snd.id
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        : 'bg-white dark:bg-[#254634] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#345b42] hover:bg-emerald-50 dark:hover:bg-[#2a4e39]'
                    }`}
                  >
                    {snd.label}
                  </button>
                ))}
              </div>

              {/* Volume Slider */}
              {ambientSound !== 'none' && (
                <div className="flex items-center gap-2 pt-1">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-700 h-1 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-500 w-7">
                    {Math.round(ambientVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* 3. GẮN VỚI CÔNG VIỆC / BÀI HỌC CẦN HOÀN THÀNH */}
            <div className="bg-[#f9fbf9] dark:bg-[#1e3a2b] rounded-2xl p-3 border border-emerald-100 dark:border-[#2f553f] space-y-2">
              <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-emerald-600" />
                Gắn vào công việc
              </span>

              <select
                value={selectedTask?.id || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const found = tasks.find((t) => t.id === id);
                  setSelectedTask(found || null);
                }}
                className="w-full text-xs p-2 rounded-xl bg-white dark:bg-[#254634] border border-slate-200 dark:border-[#345b42] text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="">-- Không gắn công việc --</option>
                {tasks
                  .filter((t) => !t.is_completed)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>

              {selectedTask && (
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  💡 Thời gian bạn học sẽ được cộng dồn trực tiếp vào tiến độ của <b>"{selectedTask.title}"</b>!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM CLEAR MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a3325] rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-emerald-100 dark:border-[#2a4d38] space-y-3 animate-in zoom-in-95">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Xóa nét vẽ trên bảng?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Toàn bộ nét vẽ trên trang này sẽ bị làm mới. Các ghi chú Sticky Notes và nền giấy vẫn được giữ nguyên.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284a36] rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleClearBoard}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-500 shadow-xs"
              >
                Xóa nét vẽ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PAGE MODAL */}
      {showDeletePageConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a3325] rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-emerald-100 dark:border-[#2a4d38] space-y-3 animate-in zoom-in-95">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Xóa "{currentPage.title}"?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ trang này cùng các hình vẽ và giấy ghi chú trên đó không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeletePageConfirm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#284a36] rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCurrentPage}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-500 shadow-xs"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
