import React, { useEffect, useRef, useState } from 'react';
import TopMenu from './components/TopMenu';
import Toolbar from './components/Toolbar';
import PropertyBar from './components/PropertyBar';
import RightPanel from './components/RightPanel';
import Modals from './components/Modals';
import { Project, ToolMode, HistoryItem, ChatHistoryItem } from './types';
import { Minus, Plus, Maximize2, SlidersHorizontal, Image as ImageIcon, X, Copy, Clipboard, Trash2, Download, ChevronsUp, ChevronsDown, Layers, Folder, FolderOpen } from 'lucide-react';

const fabric = (window as any).fabric;
const pdfjsLib = (window as any).pdfjsLib;
const Cropper = (window as any).Cropper;

export default function App() {
  // Configured default local-handling key (fallback)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  // 1. Projects & Tabs State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // 2. Viewport Transform & Active Mode States
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // 3. Modals and Triggers State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');

  // 4. Layers and Active Layer Selection State
  const [layers, setLayers] = useState<any[]>([]);
  const [activeLayer, setActiveLayer] = useState<any | null>(null);
  const [selectedObjProps, setSelectedObjProps] = useState<any>({});

  // 5. Drawing settings states (Brush / Healing / Selection params)
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(10);
  const [healingWidth, setHealingWidth] = useState(20);
  const [healingMode, setHealingMode] = useState('content-aware');
  const [tolerance, setTolerance] = useState(32);
  const [contiguous, setContiguous] = useState(true);
  const [antiAlias, setAntiAlias] = useState(true);

  // 6. Secondary AI integrations states
  const [aiTutorChat, setAiTutorChat] = useState<ChatHistoryItem[]>([]);
  const [analysisReport, setAnalysisReport] = useState<{ caption: string; mood: string; loading: boolean } | null>(null);

  // 7. Clipboard state (supporting marquee shape clip extraction)
  const [clipboard, setClipboard] = useState<any | null>(null);

  // 8. PDF importation data thumbnails (Base64 list)
  const [pdfPagesData, setPdfPagesData] = useState<string[]>([]);
  const pdfDocumentRef = useRef<any>(null);

  // 9. Floating Filter parameters
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(false);

  // 10. Cropper modal states
  const [isCropActive, setIsCropActive] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const cropperInstanceRef = useRef<any>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

  // 11. Generative Fill Drag & Drop parameters
  const [isGenFillActive, setIsGenFillActive] = useState(false);
  const [genFillPrompt, setGenFillPrompt] = useState('');

  // DOM Refs
  const fabricCanvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  // Close context menu on click-away
  useEffect(() => {
    const handleClose = () => {
      setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };
    window.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  // Load pdf worker
  useEffect(() => {
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }, []);

  // Sync active project state from project list
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Initialize fabric canvas once mounted
  useEffect(() => {
    const canvasEl = document.getElementById('editor-canvas') as HTMLCanvasElement;
    if (!canvasEl) return;

    // Create fabric Canvas
    const canvas = new fabric.Canvas('editor-canvas', {
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
      selection: true,
    });

    fabricCanvasRef.current = canvas;

    // Apply global Fabric Prototype Defaults
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#0078d7',
      borderColor: '#0078d7',
      cornerSize: 10,
      padding: 8,
      cornerStyle: 'circle',
      borderDashArray: [4, 4],
      centeredRotation: true,
      snapAngle: 45,
      hasRotatingPoint: true,
    });
    fabric.Object.prototype.controls.mtr.offsetY = -30;
    fabric.Object.prototype.controls.mtr.withConnection = true;
    fabric.Object.prototype.controls.mtr.cursorStyle = 'grab';

    // Sync state helpers on fabric events
    const syncState = () => {
      setLayers([...canvas.getObjects()]);
      const actObj = canvas.getActiveObject();
      setActiveLayer(actObj);

      if (actObj) {
        setSelectedObjProps({
          text: actObj.text || '',
          fontFamily: actObj.fontFamily || 'Pretendard',
          fontSize: actObj.fontSize || 40,
          fill: actObj.fill || 'transparent',
          stroke: actObj.stroke || 'transparent',
          strokeWidth: actObj.strokeWidth || 1,
          rx: actObj.rx || 0,
          globalCompositeOperation: actObj.globalCompositeOperation || 'source-over',
        });
      } else {
        setSelectedObjProps({});
      }
    };

    canvas.on('object:added', syncState);
    canvas.on('object:removed', syncState);
    canvas.on('object:modified', () => {
      syncState();
      saveHistory();
    });
    canvas.on('selection:created', syncState);
    canvas.on('selection:updated', syncState);
    canvas.on('selection:cleared', syncState);

    // Scaling fixed radius for round corners
    canvas.on('object:scaling', function (e: any) {
      const obj = e.target;
      if (obj && obj.type === 'rect' && obj._fixedRadius) {
        const r = obj._fixedRadius;
        const newWidth = obj.width * obj.scaleX;
        const newHeight = obj.height * obj.scaleY;
        const maxR = Math.min(r, newWidth / 2, newHeight / 2);
        obj.set({
          width: newWidth,
          height: newHeight,
          scaleX: 1,
          scaleY: 1,
          rx: maxR,
          ry: maxR,
        });
      }
    });

    // Custom path drawings (for lasso select or spot-healing)
    canvas.on('path:created', (e: any) => {
      if (activeTool === 'marquee-lasso') {
        const path = e.path;
        canvas.remove(path);
        path.clone((cloned: any) => {
          cloned.set({
            fill: 'rgba(0,120,215,0.15)',
            stroke: '#0078d7',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });
          canvas.add(cloned);
          canvas.renderAll();
        });
      } else if (activeTool === 'spot-healing') {
        runSpotHealing(e.path);
      }
    });

    // Initial Bootstrap
    onNewFile(1366, 768, 'transparent');

    return () => {
      canvas.dispose();
    };
  }, []);

  // Coordinate resize fits when projects mount
  useEffect(() => {
    if (activeProjectId) {
      fitCanvasViewport();
    }
  }, [activeProjectId]);

  // Sync tools mode changes inside Fabric brush or selection permissions
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Reset default brush modes & interactive states
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';

    // Lock selections if using selection modes (we draw them on mouse-down custom logic)
    const formsModeActive = activeTool.startsWith('marquee-') || activeTool === 'line-draw';
    if (formsModeActive) {
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      canvas.forEachObject((obj: any) => {
        obj.selectable = false;
        obj.evented = false;
      });
    } else {
      canvas.forEachObject((obj: any) => {
        obj.selectable = true;
        obj.evented = true;
      });
    }

    if (activeTool === 'brush') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    } else if (activeTool === 'spot-healing') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      // Red mask look alike
      canvas.freeDrawingBrush.color = 'rgba(255, 0, 0, 0.5)';
      canvas.freeDrawingBrush.width = healingWidth;
    } else if (activeTool === 'ai-draw') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = 'rgba(255, 0, 0, 0.5)';
      canvas.freeDrawingBrush.width = 20;
    } else if (activeTool === 'marquee-lasso') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = 'rgba(0, 120, 215, 0.5)';
      canvas.freeDrawingBrush.width = 2;
    }

    canvas.renderAll();
  }, [activeTool]);

  // Global window keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.code === 'Space' && !isSpaceHeld) {
        setIsSpaceHeld(true);
        e.preventDefault();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        onUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onCopy();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        onPaste();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        onGroupObjects();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDeleteLayer();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceHeld(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpaceHeld, activeTool, activeProjectId, projects]);

  // Modal actions dispatcher
  const handleCommand = (action: string) => {
    switch (action) {
      case 'new-file':
        setActiveModal('new-file');
        break;
      case 'open-file':
        document.getElementById('file-input-global')?.click();
        break;
      case 'save-project':
        saveProjectBlob();
        break;
      case 'load-project':
        document.getElementById('load-project-input-global')?.click();
        break;
      case 'export-modal':
        setActiveModal('export-modal');
        break;
      case 'save-png-quick':
        savePNGQuick();
        break;
      case 'undo':
        onUndo();
        break;
      case 'redo':
        onRedo();
        break;
      case 'copy':
        onCopy();
        break;
      case 'paste':
        onPaste();
        break;
      case 'fill-stroke':
        setActiveModal('fill-stroke');
        break;
      case 'delete':
        onDeleteLayer();
        break;
      case 'group':
        onGroupObjects();
        break;
      case 'image-size':
        setActiveModal('image-size');
        break;
      case 'canvas-size':
        setActiveModal('canvas-size');
        break;
      case 'start-crop':
        startCropEditing();
        break;
      case 'remove-bg':
        onAIAction('remove-bg');
        break;
      case 'smart-analysis':
        onAIAction('smart-analysis');
        break;
      case 'duplicate':
        onDuplicateLayer();
        break;
      case 'merge-layers':
        onMergeLayers();
        break;
      case 'merge-all-layers':
        onMergeAllLayers();
        break;
      case 'copy-merged':
        onCopyMerged();
        break;
      case 'bring-front':
        onBringToFront();
        break;
      case 'send-back':
        onSendToBack();
        break;
      case 'add-emoji':
        onAddShape('emoji');
        break;
      case 'meme-generator':
        setActiveModal('meme-generator');
        break;
      case 'qr-generator':
        setActiveModal('qr-generator');
        break;
      case 'fit-screen':
        fitCanvasViewport();
        break;
      case 'api-key-settings':
        setActiveModal('api-key-settings');
        break;
      case 'ask-tutor':
        setActiveModal('ask-tutor');
        break;
      case 'about':
        alert(`Pro Editor Pro v1.45 \nBuild: ${new Date().toLocaleDateString()}`);
        break;
      default:
        break;
    }
  };

  // Toast notifier dispenser
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Create standard file
  const onNewFile = (width: number, height: number, bgColor: string, preloadedImage: any = null) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    const id = Date.now().toString();
    const cleanBg = bgColor === 'transparent' ? 'transparent' : bgColor;
    canvas.backgroundColor = cleanBg;
    canvas.setWidth(width);
    canvas.setHeight(height);

    const initialProject: Project = {
      id,
      name: `Untitled-${projects.length + 1}`,
      width,
      height,
      backgroundColor: cleanBg,
      json: null,
      history: [],
      historyStep: -1,
      zoom: 1.0,
      panX: 0,
      panY: 0,
    };

    if (preloadedImage) {
      preloadedImage.set({
        left: width / 2,
        top: height / 2,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(preloadedImage);
      canvas.setActiveObject(preloadedImage);
    }

    setProjects((prev) => [...prev, initialProject]);
    setActiveProjectId(id);

    // Setup first history step
    setTimeout(() => {
      saveHistory('New Project', id);
      syncLayersState();
      fitCanvasViewport();
    }, 120);
  };

  const closeProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert('최소 하나의 작업창은 열려 있어야 합니다.');
      return;
    }
    if (!confirm('작업창을 닫으시겠습니까? 저장되지 않은 내용은 폐기됩니다.')) return;

    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id) {
      setActiveProjectId(remaining[remaining.length - 1].id);
    }
  };

  const switchProject = (id: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Cache current project settings first
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            json: JSON.stringify(canvas),
            zoom,
            panX,
            panY,
          };
        }
        return p;
      })
    );

    // Switch to target project
    const nextProj = projects.find((p) => p.id === id);
    if (!nextProj) return;

    setActiveProjectId(id);
    canvas.clear();
    canvas.setWidth(nextProj.width);
    canvas.setHeight(nextProj.height);
    canvas.backgroundColor = nextProj.backgroundColor;

    if (nextProj.json) {
      canvas.loadFromJSON(nextProj.json, () => {
        canvas.renderAll();
        setLayers([...canvas.getObjects()]);
      });
    } else {
      setLayers([]);
    }

    setZoom(nextProj.zoom);
    setPanX(nextProj.panX);
    setPanY(nextProj.panY);
  };

  // Sync Canvas viewport sizes
  const fitCanvasViewport = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !containerRef.current) return;

    setPanX(0);
    setPanY(0);

    const aspectW = (containerRef.current.clientWidth - 100) / canvas.width;
    const aspectH = (containerRef.current.clientHeight - 100) / canvas.height;
    const bestScale = Math.min(aspectW, aspectH, 1.0);
    setZoom(Math.max(bestScale, 0.15));
  };

  // Synchronize layers state helper
  const syncLayersState = () => {
    if (fabricCanvasRef.current) {
      setLayers([...fabricCanvasRef.current.getObjects()]);
      setActiveLayer(fabricCanvasRef.current.getActiveObject());
    }
  };

  // Save changes onto browser History list
  const saveHistory = (actionName = 'Action', specificProjId: string | null = null) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const targetProjId = specificProjId || activeProjectId;
    if (!targetProjId) return;

    const serialized = JSON.stringify(canvas);

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === targetProjId) {
          const step = p.historyStep + 1;
          const freshHistory = p.history.slice(0, step);
          freshHistory.push({
            json: serialized,
            name: actionName,
            time: new Date().toLocaleTimeString(),
          });

          return {
            ...p,
            history: freshHistory,
            historyStep: step,
            json: serialized,
          };
        }
        return p;
      })
    );
  };

  // Redo / Undo controllers
  const onUndo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !activeProject) return;

    if (activeProject.historyStep > 0) {
      const nextStep = activeProject.historyStep - 1;
      const targetHistoryObj = activeProject.history[nextStep];

      canvas.loadFromJSON(targetHistoryObj.json, () => {
        canvas.renderAll();
        setProjects((prev) =>
          prev.map((p) => (p.id === activeProjectId ? { ...p, historyStep: nextStep } : p))
        );
        syncLayersState();
      });
    }
  };

  const onRedo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !activeProject) return;

    if (activeProject.historyStep < activeProject.history.length - 1) {
      const nextStep = activeProject.historyStep + 1;
      const targetHistoryObj = activeProject.history[nextStep];

      canvas.loadFromJSON(targetHistoryObj.json, () => {
        canvas.renderAll();
        setProjects((prev) =>
          prev.map((p) => (p.id === activeProjectId ? { ...p, historyStep: nextStep } : p))
        );
        syncLayersState();
      });
    }
  };

  const onLoadHistoryStep = (step: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !activeProject) return;

    const targetHistoryObj = activeProject.history[step];
    canvas.loadFromJSON(targetHistoryObj.json, () => {
      canvas.renderAll();
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProjectId ? { ...p, historyStep: step } : p))
      );
      syncLayersState();
    });
  };

  // --- Core Selection / Paste Object / Copy Actions ---

  const onCopy = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Check marquee subselection logic first
    const selection = canvas.getObjects().find((obj: any) => obj.stroke === '#0078d7' && obj.selectable === false);

    if (selection) {
      const originalClip = canvas.clipPath;
      selection.clone((clonedMask: any) => {
        clonedMask.absolutePositioned = true;
        clonedMask.left = selection.left;
        clonedMask.top = selection.top;
        clonedMask.scaleX = selection.scaleX;
        clonedMask.scaleY = selection.scaleY;
        clonedMask.angle = selection.angle;

        const wasVisible = selection.visible;
        selection.visible = false;
        canvas.clipPath = clonedMask;
        canvas.renderAll();

        const br = selection.getBoundingRect();
        const dataURL = canvas.toDataURL({
          left: br.left,
          top: br.top,
          width: br.width,
          height: br.height,
          format: 'png',
          multiplier: 1,
        });

        canvas.clipPath = originalClip;
        selection.visible = wasVisible;
        canvas.renderAll();

        setClipboard({ type: 'image_data', source: dataURL });
        showToast('선택 영역 복사 완료');
      });
    } else {
      const activeObj = canvas.getActiveObject();
      if (activeObj) {
        activeObj.clone((cloned: any) => {
          setClipboard(cloned);
          showToast('레이어가 복사되었습니다.');
        });
      }
    }
  };

  const onPaste = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !clipboard) return;

    if (clipboard.type === 'image_data') {
      fabric.Image.fromURL(clipboard.source, (img: any) => {
        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center',
          evented: true,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        setActiveTool('select');
        canvas.requestRenderAll();
        syncLayersState();
        saveHistory('Paste selection image');
        showToast('복사해둔 이미지 붙여넣기 완료');
      });
    } else {
      clipboard.clone((clonedObj: any) => {
        canvas.discardActiveObject();
        clonedObj.set({
          left: clonedObj.left + 22,
          top: clonedObj.top + 22,
          evented: true,
        });

        if (clonedObj.type === 'activeSelection') {
          clonedObj.canvas = canvas;
          clonedObj.forEachObject((obj: any) => {
            canvas.add(obj);
          });
          clonedObj.setCoords();
        } else {
          canvas.add(clonedObj);
        }

        canvas.setActiveObject(clonedObj);
        canvas.requestRenderAll();
        syncLayersState();
        saveHistory('Paste Layer');
        showToast('레이어 붙여넣기 완료');
      });
    }
  };

  // Duplicate active selected layers
  const onDuplicateLayer = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    obj.clone((cloned: any) => {
      cloned.set({
        left: obj.left + 20,
        top: obj.top + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      syncLayersState();
      saveHistory('Duplicate Layer');
    });
  };

  // Multiple layers merge logic
  const onMergeLayers = () => {
    const canvas = fabricCanvasRef.current;
    const activeObj = canvas?.getActiveObject();
    if (!activeObj) return showToast('병합할 레이어를 지정해주세요.');

    if (activeObj.type === 'activeSelection') {
      const selection = activeObj;
      canvas.discardActiveObject();
      const group = new fabric.Group(selection._objects, {
        left: selection.left,
        top: selection.top,
      });
      const dataUrl = group.toDataURL({ format: 'png', multiplier: 2 });

      fabric.Image.fromURL(dataUrl, (img: any) => {
        img.set({
          left: group.left + group.width / 2,
          top: group.top + group.height / 2,
          originX: 'center',
          originY: 'center',
        });
        selection._objects.forEach((obj: any) => canvas.remove(obj));
        canvas.add(img);
        canvas.setActiveObject(img);
        syncLayersState();
        saveHistory('Merge Layers');
        showToast('선택한 레이어들이 단일 이미지로 병합되었습니다.');
      });
    } else {
      const objects = canvas.getObjects();
      const index = objects.indexOf(activeObj);
      if (index <= 0) return showToast('아래에 병합할 레이어가 없습니다.');

      const objectBelow = objects[index - 1];
      canvas.discardActiveObject();

      const group = new fabric.Group([objectBelow, activeObj], {
        left: Math.min(objectBelow.left, activeObj.left),
        top: Math.min(objectBelow.top, activeObj.top),
      });

      const dataUrl = group.toDataURL({ format: 'png', multiplier: 2 });
      fabric.Image.fromURL(dataUrl, (img: any) => {
        img.set({
          left: group.left + group.width / 2,
          top: group.top + group.height / 2,
          originX: 'center',
          originY: 'center',
        });
        canvas.remove(activeObj);
        canvas.remove(objectBelow);
        canvas.insertAt(img, index - 1);
        canvas.setActiveObject(img);
        syncLayersState();
        saveHistory('Merge Down');
        showToast('아래 레이어와 한 장으로 결합되었습니다.');
      });
    }
  };

  const onMergeAllLayers = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    if (objects.length < 2) return showToast('병합할 레이어가 최소 2개 이상 이어야 합니다.');

    canvas.discardActiveObject();
    canvas.renderAll();

    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
    fabric.Image.fromURL(dataUrl, (img: any) => {
      canvas.getObjects().slice().forEach((obj: any) => canvas.remove(obj));
      img.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      syncLayersState();
      saveHistory('Merge All Layers');
      showToast('모든 레이어가 병합되었습니다.');
    });
  };

  const onCopyMerged = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.discardActiveObject();
    canvas.renderAll();

    const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 });
    setClipboard({ type: 'image_data', source: dataURL });
    showToast('전체 레이어가 클립보드 이미지로 캡처 복사되었습니다.');
  };

  const onBringToFront = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      canvas.bringToFront(obj);
      syncLayersState();
      saveHistory('Bring layer to top');
    }
  };

  const onSendToBack = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      canvas.sendToBack(obj);
      syncLayersState();
      saveHistory('Send layer to back');
    }
  };

  const onGroupObjects = () => {
    const canvas = fabricCanvasRef.current;
    const target = canvas?.getActiveObject();
    if (!target) return;

    if (target.type === 'activeSelection') {
      target.toGroup();
      canvas.requestRenderAll();
      showToast('선택한 객체들이 그룹화되었습니다.');
    } else if (target.type === 'group') {
      target.toActiveSelection();
      canvas.requestRenderAll();
      showToast('그룹이 개별 객체로 해제되었습니다.');
    }

    syncLayersState();
    saveHistory('Group/Ungroup');
  };

  const onDeleteLayer = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      canvas.remove(obj);
      syncLayersState();
      saveHistory('Delete selection Layer');
    }
  };

  const onSaveSelectedImage = (targetObj?: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = targetObj || canvas.getActiveObject() || activeLayer;
    if (!activeObj) {
      showToast('저장할 레이어를 선택해주세요.');
      return;
    }

    try {
      // 1. Save original visibilities & background
      const allObjects = canvas.getObjects();
      const originalStates = allObjects.map((obj: any) => ({
        obj,
        visible: obj.visible,
      }));

      // Keep only active object (or selection of objects) visible
      const isSelection = activeObj.type === 'activeSelection';
      const selectionObjects = isSelection ? activeObj._objects : [];

      allObjects.forEach((obj: any) => {
        if (obj === activeObj) {
          obj.visible = true;
        } else if (isSelection && selectionObjects.includes(obj)) {
          obj.visible = true;
        } else {
          obj.visible = false;
        }
      });

      const originalBgColor = canvas.backgroundColor;
      const originalBgImage = canvas.backgroundImage;
      canvas.backgroundColor = 'transparent';
      canvas.backgroundImage = null;

      // 2. Save original zoom & pan viewport transform
      const originalZoom = canvas.getZoom();
      const originalVP = canvas.viewportTransform ? [...canvas.viewportTransform] : null;

      // Temporarily reset zoom & pan to 1:1 for pixel-perfect bounding box matches
      canvas.setZoom(1);
      canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
      canvas.renderAll();

      // 3. Now get the pixel-perfect bounding rectangle of the active layer
      const rect = activeObj.getBoundingRect(true, true);

      let dataURL = '';
      if (rect.width > 0 && rect.height > 0) {
        try {
          // Export cropped area directly using the native canvas.toDataURL bounds
          dataURL = canvas.toDataURL({
            format: 'png',
            left: Math.max(0, rect.left),
            top: Math.max(0, rect.top),
            width: Math.min(canvas.width - rect.left, rect.width),
            height: Math.min(canvas.height - rect.top, rect.height),
            multiplier: 2, // High resolution 2x scale
          });
        } catch (cropErr) {
          console.warn('Cropped export failed, trying fallback:', cropErr);
        }
      }

      // If cropping failed or bounds are zero, fallback to standard object toDataURL
      if (!dataURL && typeof activeObj.toDataURL === 'function') {
        dataURL = activeObj.toDataURL({
          format: 'png',
          multiplier: 2,
        });
      }

      // 4. Restore original visibility, background, zoom & pan
      originalStates.forEach((item: any) => {
        item.obj.visible = item.visible;
      });
      canvas.backgroundColor = originalBgColor;
      canvas.backgroundImage = originalBgImage;

      if (originalVP) canvas.viewportTransform = originalVP;
      canvas.setZoom(originalZoom);
      canvas.renderAll();

      // 5. Download the image file immediately
      if (!dataURL) {
        throw new Error('Failed to generate PNG image data URL');
      }

      const link = document.createElement('a');
      link.download = 'Image_10editor.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('선택한 레이어가 Image_10editor.png 이미지로 바로 저장되었습니다.');
    } catch (err: any) {
      console.error('Save selected image failed:', err);
      showToast('레이어 저장 오류: 파일 저장 권한 혹은 CORS 허용이 필요합니다.');
    }
  };

  const handleLayerContextMenu = (e: React.MouseEvent, layer: any, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.setActiveObject(layer);
      canvas.requestRenderAll();
      setActiveLayer(layer);
    }

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Use standard finder in fabric
    let clickedObj: any = canvas.findTarget ? canvas.findTarget(e.nativeEvent, false) : null;

    // Fallback manual point check in case findTarget didn't match
    if (!clickedObj) {
      const pointer = canvas.getPointer(e.nativeEvent);
      const targets = canvas.getObjects();
      const point = new fabric.Point(pointer.x, pointer.y);

      for (let i = targets.length - 1; i >= 0; i--) {
        const obj = targets[i];
        if (obj.stroke === 'rgba(255, 0, 0, 0.5)' || obj.name === 'tempSelection' || !obj.visible) {
          continue;
        }
        if (obj.containsPoint && obj.containsPoint(point)) {
          clickedObj = obj;
          break;
        }
      }
    } else {
      // Filter out helper or invisible objects
      if (clickedObj.stroke === 'rgba(255, 0, 0, 0.5)' || clickedObj.name === 'tempSelection' || !clickedObj.visible) {
        clickedObj = null;
      }
    }

    if (clickedObj) {
      canvas.setActiveObject(clickedObj);
      canvas.requestRenderAll();
      setActiveLayer(clickedObj);
    } else {
      // Background click
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setActiveLayer(null);
    }

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const onDeleteLayerIndex = (index: number) => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const objects = canvas.getObjects();
      if (objects[index]) {
        canvas.remove(objects[index]);
        syncLayersState();
        saveHistory('Delete Layer');
      }
    }
  };

  // Reorder layer depths
  const onReorderLayers = (dragIdx: number, dropIdx: number) => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const obj = canvas.getObjects()[dragIdx];
      if (obj) {
        canvas.moveTo(obj, dropIdx);
        syncLayersState();
        saveHistory('Reorder Layers');
      }
    }
  };

  // File loading events
  const handleLoadProjectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonStr = event.target?.result as string;
      onNewFile(1366, 768, 'transparent');
      setTimeout(() => {
        fabricCanvasRef.current?.loadFromJSON(jsonStr, () => {
          fabricCanvasRef.current.renderAll();
          syncLayersState();
          saveHistory('Loaded manual project file');
        });
      }, 150);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFileInputGlobal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      handlePdfImport(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        fabric.Image.fromURL(event.target?.result as string, (img: any) => {
          const canvas = fabricCanvasRef.current;
          if (canvas) {
            if (img.width > canvas.width) {
              img.scaleToWidth(canvas.width * 0.7);
            }
            img.set({
              left: canvas.width / 2,
              top: canvas.height / 2,
              originX: 'center',
              originY: 'center',
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            syncLayersState();
            saveHistory('Add Image Layer');
          }
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // PDF Page importer rendering
  const handlePdfImport = async (file: File) => {
    setIsLoading(true);
    setLoadingText('PDF 파일 분석 중...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      pdfDocumentRef.current = pdf;

      const thumbnails: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // Page boundaries
        const viewport = page.getViewport({ scale: 0.35 });
        const canvasEl = document.createElement('canvas');
        canvasEl.width = viewport.width;
        canvasEl.height = viewport.height;
        const ctx = canvasEl.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        thumbnails.push(canvasEl.toDataURL('image/png'));
      }

      setPdfPagesData(thumbnails);
      setActiveModal('pdf-import');
    } catch (err: any) {
      alert(`PDF parsing failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectPdfPage = async (pageNum: number) => {
    const pdf = pdfDocumentRef.current;
    if (!pdf) return;

    setIsLoading(true);
    setLoadingText('PDF 페이지 고해상도 변환 중...');
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.8 }); // Higher scaling factor for crisp results
      const canvasEl = document.createElement('canvas');
      canvasEl.width = viewport.width;
      canvasEl.height = viewport.height;
      const ctx = canvasEl.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      const imgData = canvasEl.toDataURL('image/png');
      fabric.Image.fromURL(imgData, (img: any) => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
          if (img.width > canvas.width) {
            img.scaleToWidth(canvas.width * 0.84);
          }
          img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: 'center',
            originY: 'center',
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          syncLayersState();
          saveHistory(`Add PDF Page ${pageNum} Layer`);
        }
      });
    } catch (err: any) {
      alert(`PDF Import error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save manual raw workspace
  const saveProjectBlob = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const data = JSON.stringify(canvas.toJSON());
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject?.name || 'edited_project'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const savePNGQuick = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${activeProject?.name || 'quick_capture'}.png`;
    link.href = canvas.toDataURL({ format: 'png', quality: 1.0 });
    link.click();
  };

  // --- Resizing Image & Viewports ---

  const onApplyImageSize = (w: number, h: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const scaleX = w / canvas.width;
    const scaleY = h / canvas.height;

    canvas.getObjects().forEach((obj: any) => {
      obj.scaleX *= scaleX;
      obj.scaleY *= scaleY;
      obj.left *= scaleX;
      obj.top *= scaleY;
      obj.setCoords();
    });

    onApplyCanvasSize(w, h, 0, 0);
    saveHistory('Image Scale Adjustment');
  };

  const onApplyCanvasSize = (w: number, h: number, anchorX: number, anchorY: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const diffW = w - canvas.width;
    const diffH = h - canvas.height;
    const shiftX = diffW * anchorX;
    const shiftY = diffH * anchorY;

    canvas.getObjects().forEach((obj: any) => {
      obj.left += shiftX;
      obj.top += shiftY;
      obj.setCoords();
    });

    canvas.setWidth(w);
    canvas.setHeight(h);
    canvas.renderAll();

    setProjects((prev) =>
      prev.map((p) => (p.id === activeProjectId ? { ...p, width: w, height: h } : p))
    );

    setTimeout(() => {
      fitCanvasViewport();
      saveHistory('Canvas Resize');
    }, 100);
  };

  // --- Color Configurations Fill Stroke ---

  const onApplyFillStroke = (config: { fill: string; stroke: string; strokeWidth: number }) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set('fill', config.fill);
      obj.set('stroke', config.stroke);
      obj.set('strokeWidth', config.strokeWidth);
      canvas.requestRenderAll();
      saveHistory('Edit Fill & Stroke attributes');
    }
  };

  // --- Meme Generator & Shape Icons Added handlers ---

  const onGenerateMeme = (top: string, bottom: string, color: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    const targetObj = activeObj || canvas.getObjects().find((obj: any) => obj.type === 'image');
    if (!targetObj) return alert('텍스트를 입힐 이미지 대상을 먼저 선택해주세요');

    const topTxt = new fabric.IText(top.toUpperCase(), {
      left: targetObj.left,
      top: targetObj.top - targetObj.height * targetObj.scaleY / 2.3,
      fontFamily: 'Impact',
      fontSize: 48,
      fill: color,
      stroke: '#000000',
      strokeWidth: 2,
      originX: 'center',
    });

    const botTxt = new fabric.IText(bottom.toUpperCase(), {
      left: targetObj.left,
      top: targetObj.top + targetObj.height * targetObj.scaleY / 2.7,
      fontFamily: 'Impact',
      fontSize: 48,
      fill: color,
      stroke: '#000000',
      strokeWidth: 2,
      originX: 'center',
    });

    canvas.add(topTxt);
    canvas.add(botTxt);
    canvas.renderAll();
    syncLayersState();
    saveHistory('Add Meme Overlay Text');
  };

  const onAddQRCode = (dataUrl: string) => {
    fabric.Image.fromURL(dataUrl, (img: any) => {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        syncLayersState();
        saveHistory('Add QR Code Image');
      }
    });
  };

  const onExportImage = (format: 'png' | 'jpeg' | 'webp', quality: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `exported_image.${format}`;
    link.href = canvas.toDataURL({ format, quality });
    link.click();
  };

  // Add Emojis or Shapes
  const onAddShape = (type: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const center = {
      left: canvas.width / 2,
      top: canvas.height / 2,
      fill: '#cccccc',
      stroke: '#000000',
      strokeWidth: 1,
    };

    let shapeObj: any = null;

    if (type === 'rect') {
      shapeObj = new fabric.Rect({ ...center, width: 100, height: 100 });
    } else if (type === 'round-rect') {
      shapeObj = new fabric.Rect({ ...center, width: 100, height: 100, rx: 20, ry: 20, _fixedRadius: 20 });
    } else if (type === 'circle') {
      shapeObj = new fabric.Circle({ ...center, radius: 50 });
    } else if (type === 'triangle') {
      shapeObj = new fabric.Triangle({ ...center, width: 100, height: 100 });
    } else if (type === 'rhombus') {
      shapeObj = new fabric.Polygon(
        [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }],
        { ...center, originX: 'center', originY: 'center' }
      );
    } else if (type === 'text') {
      shapeObj = new fabric.IText('Text Here', {
        left: canvas.width / 2,
        top: canvas.height / 2,
        fontSize: 40,
        fontFamily: 'Pretendard',
        fill: '#000000',
      });
    } else if (type === 'emoji') {
      shapeObj = new fabric.IText('😀', {
        left: canvas.width / 2,
        top: canvas.height / 2,
        fontSize: 70,
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji',
      });
    } else if (['arrow-right', 'arrow-left', 'arrow-up', 'arrow-down'].includes(type)) {
      const paths: Record<string, string> = {
        'arrow-right': 'M 0 20 L 60 20 L 60 0 L 100 40 L 60 80 L 60 60 L 0 60 Z',
        'arrow-left': 'M 100 20 L 40 20 L 40 0 L 0 40 L 40 80 L 40 60 L 100 60 Z',
        'arrow-up': 'M 20 100 L 20 40 L 0 40 L 40 0 L 80 40 L 60 40 L 60 100 Z',
        'arrow-down': 'M 20 0 L 20 60 L 0 60 L 40 100 L 80 60 L 60 60 L 60 0 Z',
      };
      shapeObj = new fabric.Path(paths[type], { ...center });
    } else if (type === 'heart') {
      shapeObj = new fabric.Path('M 50 88 C 20 60, 0 30, 25 12 C 40 0, 50 10, 50 25 C 50 10, 60 0, 75 12 C 100 30, 80 60, 50 88 Z', {
        ...center,
        fill: '#ef4444',
      });
    } else if (type === 'card-diamond') {
      shapeObj = new fabric.Polygon(
        [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }],
        { ...center, fill: '#ef4444', originX: 'center', originY: 'center' }
      );
    } else if (type === 'spade') {
      shapeObj = new fabric.Path('M 50 0 C 50 0, 0 40, 0 65 C 0 85, 20 95, 40 85 L 40 100 L 60 100 L 60 85 C 80 95, 100 85, 100 65 C 100 40, 50 0, 50 0 Z', {
        ...center,
        fill: '#1e293b',
      });
    } else if (type === 'club') {
      shapeObj = new fabric.Path('M 50 10 C 35 10, 25 25, 30 40 C 15 35, 0 45, 0 60 C 0 80, 20 85, 40 80 L 40 100 L 60 100 L 60 80 C 80 85, 100 80, 100 60 C 100 45, 85 35, 70 40 C 75 25, 65 10, 50 10 Z', {
        ...center,
        fill: '#1e293b',
      });
    } else if (type === 'speech-bubble') {
      shapeObj = new fabric.Path('M 10 0 L 90 0 C 95 0, 100 5, 100 10 L 100 60 C 100 65, 95 70, 90 70 L 35 70 L 20 90 L 25 70 L 10 70 C 5 70, 0 65, 0 60 L 0 10 C 0 5, 5 0, 10 0 Z', {
        ...center,
        fill: '#ffffff',
        stroke: '#33333s',
        strokeWidth: 2,
      });
    } else if (type === 'taeguk') {
      const group = new fabric.Group([], { ...center, originX: 'center', originY: 'center' });
      const bigCircle = new fabric.Circle({ radius: 50, fill: '#ffffff', stroke: '#000', strokeWidth: 1, originX: 'center', originY: 'center' });
      const topHalf = new fabric.Path('M 0 50 A 50 50 0 0 1 100 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 0 50 Z', { fill: '#c60c30', left: -50, top: -50, originX: 'center', originY: 'center' });
      const bottomHalf = new fabric.Path('M 0 50 A 50 50 0 0 0 100 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 0 50 Z', { fill: '#003478', left: -50, top: -50, originX: 'center', originY: 'center' });
      group.addWithUpdate(bigCircle);
      group.addWithUpdate(topHalf);
      group.addWithUpdate(bottomHalf);
      shapeObj = group;
    } else if (type === 'sine-wave') {
      let pathStr = 'M 0 50';
      for (let i = 0; i <= 100; i += 2) {
        const y = 50 - Math.sin(i * Math.PI / 25) * 30;
        pathStr += ` L ${i} ${y}`;
      }
      shapeObj = new fabric.Path(pathStr, { ...center, fill: 'transparent', stroke: '#3b82f6', strokeWidth: 3 });
    } else if (type === 'star5') {
      const points = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 50 : 20;
        const angle = (i * 36 - 90) * Math.PI / 180;
        points.push({ x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) });
      }
      shapeObj = new fabric.Polygon(points, { ...center, fill: '#fbbf24', originX: 'center', originY: 'center' });
    }

    if (shapeObj) {
      canvas.add(shapeObj);
      canvas.setActiveObject(shapeObj);
      setActiveTool('select');
      syncLayersState();
      saveHistory(`Add Vector Shape (${type})`);
    }
  };

  const onAdd3DShape = (type: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    let shapeObj: any = null;

    if (type === 'cube') {
      const p1 = new fabric.Polygon([{ x: 0, y: 50 }, { x: 87, y: 0 }, { x: 174, y: 50 }, { x: 87, y: 100 }], { fill: '#93c5fd' });
      const p2 = new fabric.Polygon([{ x: 0, y: 50 }, { x: 87, y: 100 }, { x: 87, y: 200 }, { x: 0, y: 150 }], { fill: '#3b82f6' });
      const p3 = new fabric.Polygon([{ x: 87, y: 100 }, { x: 174, y: 50 }, { x: 174, y: 150 }, { x: 87, y: 200 }], { fill: '#1d4ed8' });
      shapeObj = new fabric.Group([p1, p2, p3], { left: cx, top: cy, originX: 'center', originY: 'center' });
    } else if (type === 'round-cube') {
      const rect = new fabric.Rect({ width: 100, height: 100, rx: 20, ry: 20, fill: '#3b82f6', originX: 'center', originY: 'center' });
      rect.setShadow(new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 10, offsetY: 10 }));
      const highlight = new fabric.Rect({ width: 80, height: 40, rx: 10, ry: 10, fill: 'rgba(255,255,255,0.3)', left: 0, top: -30, originX: 'center', originY: 'center' });
      shapeObj = new fabric.Group([rect, highlight], { left: cx, top: cy, originX: 'center', originY: 'center' });
    } else if (type === 'cylinder') {
      const w = 100, h = 120, ry = 20;
      const body = new fabric.Rect({ width: w, height: h, fill: '#3b82f6', top: ry, left: -w / 2 });
      const topFace = new fabric.Ellipse({ rx: w / 2, ry: ry, fill: '#60a5fa', top: 0, left: 0, originX: 'center' });
      const bottomFace = new fabric.Ellipse({ rx: w / 2, ry: ry, fill: '#1d4ed8', top: h, left: 0, originX: 'center' });
      shapeObj = new fabric.Group([bottomFace, body, topFace], { left: cx, top: cy, originX: 'center', originY: 'center' });
    } else if (type === 'sphere') {
      shapeObj = new fabric.Circle({ radius: 60, left: cx, top: cy, originX: 'center', originY: 'center' });
      const grad = new fabric.Gradient({
        type: 'radial',
        coords: { r1: 0, r2: 60, x1: 40, y1: 40, x2: 60, y2: 60 },
        colorStops: [
          { offset: 0, color: '#93c5fd' },
          { offset: 0.5, color: '#3b82f6' },
          { offset: 1, color: '#1e3a8a' },
        ],
      });
      shapeObj.set('fill', grad);
    } else if (type === 'bar') {
      const len = 150;
      const p1 = new fabric.Polygon([{ x: 0, y: 20 }, { x: 35, y: 0 }, { x: 35 + len, y: 0 }, { x: len, y: 20 }], { fill: '#93c5fd' });
      const p2 = new fabric.Polygon([{ x: 0, y: 20 }, { x: len, y: 20 }, { x: len, y: 60 }, { x: 0, y: 60 }], { fill: '#3b82f6' });
      const p3 = new fabric.Polygon([{ x: len, y: 20 }, { x: 35 + len, y: 0 }, { x: 35 + len, y: 40 }, { x: len, y: 60 }], { fill: '#1d4ed8' });
      shapeObj = new fabric.Group([p1, p2, p3], { left: cx, top: cy, originX: 'center', originY: 'center' });
    }

    if (shapeObj) {
      canvas.add(shapeObj);
      canvas.setActiveObject(shapeObj);
      syncLayersState();
      saveHistory('Add 3D Shape');
    }
  };

  const onAddShapeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      heart: '❤️', diamond: '♦️', spade: '♠️', club: '♣️',
      star: '⭐', moon: '🌙', sun: '☀️', cloud: '☁️',
      lightning: '⚡', fire: '🔥', check: '✔️', cross: '❌',
      speech: '💬', thought: '💭', 'arrow-right': '➡️', 'arrow-up': '⬆️',
      music: '🎵', sparkle: '✨', crown: '👑', ribbon: '🎀',
      gift: '🎁', balloon: '🎈', confetti: '🎊', trophy: '🏆',
      medal: '🏅', target: '🎯', bell: '🔔', lock: '🔒',
      key: '🔑', bulb: '💡', bomb: '💣', gem: '💎',
      money: '💰', email: '📧', phone: '📱', camera: '📷',
      video: '🎬', mic: '🎤', headphone: '🎧', game: '🎮',
      dice: '🎲', puzzle: '🧩', palette: '🎨', pencil: '✏️',
      scissors: '✂️', pin: '📌', clip: '📎', folder: '📁',
      trash: '🗑️', hourglass: '⏳', alarm: '⏰', calendar: '📅',
      chart: '📊', rocket: '🚀', plane: '✈️', car: '🚗',
      home: '🏠', tree: '🌲', flower: '🌸', rainbow: '🌈'
    };

    const emoji = iconMap[type] || '❓';
    const textObj = new fabric.IText(emoji, {
      left: fabricCanvasRef.current.width / 2,
      top: fabricCanvasRef.current.height / 2,
      fontSize: 80,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    });

    fabricCanvasRef.current.add(textObj);
    fabricCanvasRef.current.setActiveObject(textObj);
    fabricCanvasRef.current.renderAll();
    syncLayersState();
    saveHistory(`Add Symbol (${type})`);
    showToast(`${type} 아이콘이 레이어로 성골적으로 추가되었습니다.`);
  };

  // --- Real Fullstack Gemini AI integrations handlers ---

  const onAIAction = async (action: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (action === 'crop') {
      startCropEditing();
      return;
    }

    if (action === 'sticker') {
      setActiveModal('sticker');
      return;
    }

    if (action === 'style') {
      setActiveModal('style');
      return;
    }

    if (action === 'remove-bg' || action === 'enhance') {
      const promptText = action === 'remove-bg' ? 'Remove background, make it translucent or white.' : 'Enhance quality.';
      onGenerateStyle(promptText);
      return;
    }

    if (action === 'smart-analysis') {
      setAnalysisReport({ caption: '', mood: '', loading: true });
      setActiveModal('smart-analysis');

      const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.5 });
      try {
        const res = await fetch('/api/ai/smart-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: dataUrl, clientApiKey: apiKey }),
        });
        const details = await res.json();
        if (details.success) {
          setAnalysisReport({
            caption: details.caption || 'No caption description provided',
            mood: details.mood || 'No style analysis provided',
            loading: false,
          });
        } else {
          throw new Error(details.error);
        }
      } catch (err: any) {
        setAnalysisReport(null);
        setActiveModal(null);
        alert(`AI Smart 분석 중 오류가 발생했습니다: ${err.message}`);
      }
    }
  };

  const onGenerateSticker = async (promptText: string) => {
    setIsLoading(true);
    setLoadingText('AI가 스티커를 생성하는 중입니다...');
    try {
      const res = await fetch('/api/ai/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, clientApiKey: apiKey }),
      });
      const data = await res.json();
      if (data.success && data.imageBase64) {
        fabric.Image.fromURL(`data:image/jpeg;base64,${data.imageBase64}`, (img: any) => {
          const canvas = fabricCanvasRef.current;
          if (canvas) {
            img.scale(0.5);
            img.set({
              left: canvas.width / 2,
              top: canvas.height / 2,
              originX: 'center',
              originY: 'center',
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            syncLayersState();
            saveHistory('AI sticker generated');
            showToast('스티커가 추가되었습니다!');
          }
        });
      } else {
        throw new Error(data.error || 'Failed generating sticker bytes');
      }
    } catch (error: any) {
      alert(`Sticker generation error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onGenerateStyle = async (promptText: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setLoadingText('AI가 스타일/효과 변형 편집중입니다...');
    canvas.discardActiveObject();
    canvas.renderAll();

    const dataUrl = canvas.toDataURL({ format: 'png' });
    try {
      const res = await fetch('/api/ai/gen-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, prompt: promptText, clientApiKey: apiKey }),
      });
      const data = await res.json();
      if (data.success && data.imageBase64) {
        fabric.Image.fromURL(`data:image/png;base64,${data.imageBase64}`, (img: any) => {
          canvas.clear();
          img.scale(canvas.width / img.width);
          canvas.add(img);
          canvas.renderAll();
          syncLayersState();
          saveHistory(`AI Style: ${promptText}`);
          showToast('스타일 적용이 완료되었습니다!');
        });
      } else {
        throw new Error(data.error || 'Failed resolving style image');
      }
    } catch (err: any) {
      alert(`AI style edit failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Spot recovery brush actions
  const runSpotHealing = async (pathObj: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setLoadingText('스팟 복구 브러시 데이터 복구 작업 중...');
    canvas.discardActiveObject();

    // Scale canvas if too large for Gemini limits
    const maxDim = 1024;
    let scaleF = 1.0;
    if (canvas.width > maxDim || canvas.height > maxDim) {
      scaleF = Math.min(maxDim / canvas.width, maxDim / canvas.height);
    }

    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: scaleF });
    canvas.remove(pathObj);

    const promptText =
      healingMode === 'content-aware'
        ? 'Remove the red painted masked stroke area and fill it seamlessly matching the background context. Output only the result image.'
        : healingMode === 'texture'
        ? 'Replace the red painted masked stroke area with a generated patch texture pattern that matches the surrounding surface structure. Output only the result image.'
        : 'Inpaint the red masked area by seamlessly interpolating immediate colors, lines, and gradients from its edges. Output only the result image.';

    try {
      const res = await fetch('/api/ai/gen-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, prompt: promptText, clientApiKey: apiKey }),
      });
      const data = await res.json();
      if (data.success && data.imageBase64) {
        fabric.Image.fromURL(`data:image/png;base64,${data.imageBase64}`, (img: any) => {
          canvas.clear();
          img.scale(canvas.width / img.width);
          canvas.add(img);
          canvas.renderAll();
          syncLayersState();
          saveHistory('Spot Healing Recovery finished');
          showToast('스팟 복구가 완료되었습니다.');
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert(`Spot Healing failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSendTutorChat = async (text: string) => {
    const uniqueUserId = Date.now().toString();
    const newUserMsg: ChatHistoryItem = { id: uniqueUserId, text, sender: 'user' };
    setAiTutorChat((prev) => [...prev, newUserMsg]);

    try {
      const res = await fetch('/api/ai/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, clientApiKey: apiKey }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        const uniqueAiId = (Date.now() + 1).toString();
        const newAiMsg: ChatHistoryItem = { id: uniqueAiId, text: data.text, sender: 'ai' };
        setAiTutorChat((prev) => [...prev, newAiMsg]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      const uniqueErrorId = (Date.now() + 2).toString();
      const newErr: ChatHistoryItem = { id: uniqueErrorId, text: `AI 튜터 응답 중 문제가 발생했습니다: ${err.message}`, sender: 'ai' };
      setAiTutorChat((prev) => [...prev, newErr]);
    }
  };

  // --- Real-time Screen Web Capture Web API wrappers ---

  const onCaptureScreen = async (mode: 'screen' | 'rect') => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return alert('이 브라우저는 화면 캡처를 지원하지 않습니다.');
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        setTimeout(() => {
          const capCvs = document.createElement('canvas');
          capCvs.width = video.videoWidth;
          capCvs.height = video.videoHeight;
          const ctx = capCvs.getContext('2d');
          ctx?.drawImage(video, 0, 0);

          // Stop streaming captures
          stream.getTracks().forEach((t) => t.stop());

          fabric.Image.fromURL(capCvs.toDataURL(), (img: any) => {
            const canvas = fabricCanvasRef.current;
            if (canvas) {
              if (img.width > canvas.width) {
                img.scaleToWidth(canvas.width);
              }
              img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
              });
              canvas.add(img);
              canvas.setActiveObject(img);
              syncLayersState();
              saveHistory('Screen Capture');

              if (mode === 'rect') {
                setTimeout(() => {
                  alert('이미지가 캡처되었습니다. 원하는 영역을 선택하여 자르세요.');
                  startCropEditing();
                }, 120);
              }
            }
          });
        }, 500);
      };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        if (err.message.includes('permissions policy')) {
          alert('보안 정책으로 인해 화면 캡처가 차단되었습니다.\n로컬에서 실행하거나 새 탭을 이용하세요.');
        } else {
          console.log('Capture cancelled by user');
        }
      } else {
        alert(`Screen share capture error: ${err.message}`);
      }
    }
  };

  // --- Image Cropper Integrations ---

  const startCropEditing = () => {
    const canvas = fabricCanvasRef.current;
    const activeObj = canvas?.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') {
      return alert('자르기를 원하는 이미지 레이어를 먼저 마우스 클릭으로 선택해 주세요');
    }

    setCropImageSrc(activeObj.toDataURL());
    setIsCropActive(true);
  };

  useEffect(() => {
    if (isCropActive && cropImageRef.current) {
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
      }
      cropperInstanceRef.current = new Cropper(cropImageRef.current, {
        viewMode: 1,
        background: false,
      });
    }
    return () => {
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
        cropperInstanceRef.current = null;
      }
    };
  }, [isCropActive, cropImageSrc]);

  const applyCrop = () => {
    if (!cropperInstanceRef.current) return;

    const dataUrl = cropperInstanceRef.current.getCroppedCanvas().toDataURL();
    const canvas = fabricCanvasRef.current;
    const oldImage = canvas.getActiveObject();

    fabric.Image.fromURL(dataUrl, (img: any) => {
      img.set({
        left: oldImage.left,
        top: oldImage.top,
      });
      canvas.remove(oldImage);
      canvas.add(img);
      canvas.setActiveObject(img);
      setIsCropActive(false);
      cropperInstanceRef.current.destroy();
      cropperInstanceRef.current = null;
      syncLayersState();
      saveHistory('Crop Image');
    });
  };

  const cancelCrop = () => {
    setIsCropActive(false);
    if (cropperInstanceRef.current) {
      cropperInstanceRef.current.destroy();
      cropperInstanceRef.current = null;
    }
    setActiveTool('select');
  };

  // Active object properties updating handler
  const onUpdateProp = (prop: string, value: any) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      if (prop === 'rx') {
        obj.set('rx', value);
        obj.set('ry', value);
      } else {
        obj.set(prop, value);
      }
      canvas.requestRenderAll();
      syncLayersState();

      // Sync React state to prevent inputs from reverting and frozen up/down buttons
      setSelectedObjProps((prev: any) => ({
        ...prev,
        [prop]: value,
        ...(prop === 'rx' ? { ry: value } : {}),
      }));

      if (prop !== 'text') {
        saveHistory('Property Change');
      }
    }
  };

  const onUpdateBrush = (prop: 'color' | 'width', value: any) => {
    const canvas = fabricCanvasRef.current;
    if (prop === 'color') {
      setBrushColor(value);
      if (canvas?.freeDrawingBrush && activeTool === 'brush') {
        canvas.freeDrawingBrush.color = value;
      }
    } else if (prop === 'width') {
      setBrushWidth(value);
      if (canvas?.freeDrawingBrush && activeTool === 'brush') {
        canvas.freeDrawingBrush.width = value;
      }
    }
  };

  const onUpdateHealing = (prop: 'width' | 'mode', value: any) => {
    const canvas = fabricCanvasRef.current;
    if (prop === 'width') {
      setHealingWidth(value);
      if (canvas?.freeDrawingBrush && activeTool === 'spot-healing') {
        canvas.freeDrawingBrush.width = value;
      }
    } else if (prop === 'mode') {
      setHealingMode(value);
    }
  };

  // Viewport Panning / Zoom Handlers
  const handleViewportMouseDown = (e: React.MouseEvent) => {
    const formsModeActive = activeTool.startsWith('marquee-') || activeTool === 'line-draw';
    if (formsModeActive) return;

    if (isSpaceHeld || e.button === 1 || activeTool === 'hand') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    }
  };

  const handleViewportMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanX(e.clientX - panStartRef.current.x);
      setPanY(e.clientY - panStartRef.current.y);
    }
  };

  const handleViewportMouseUp = () => {
    setIsPanning(false);
  };

  // Adjusting zooms
  const adjustZoom = (delta: number) => {
    setZoom((v) => Math.max(0.15, Math.min(v + delta, 5.0)));
  };

  // Floating Filter Panel
  const onApplyFilterValue = (type: string, value: any) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.type !== 'image') return;

    if (!obj.filters) obj.filters = [];

    switch (type) {
      case 'brightness':
        setBrightness(value);
        obj.filters[0] = new fabric.Image.filters.Brightness({ brightness: parseFloat(value) });
        break;
      case 'contrast':
        setContrast(value);
        obj.filters[1] = new fabric.Image.filters.Contrast({ contrast: parseFloat(value) });
        break;
      case 'saturation':
        setSaturation(value);
        obj.filters[2] = new fabric.Image.filters.Saturation({ saturation: parseFloat(value) });
        break;
      case 'blur':
        setBlur(value);
        obj.filters[3] = new fabric.Image.filters.Blur({ blur: parseFloat(value) });
        break;
      case 'grayscale':
        setGrayscale(value);
        obj.filters[4] = value ? new fabric.Image.filters.Grayscale() : false;
        break;
    }

    obj.applyFilters();
    canvas.requestRenderAll();
  };

  const onApplyPreset = (name: string) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.type !== 'image') return alert('이미지를 선택해주세요.');

    if (!obj.filters) obj.filters = [];
    obj.filters = []; // Clear existing

    if (name === 'grayscale') {
      obj.filters.push(new fabric.Image.filters.Grayscale());
    } else if (name === 'sepia') {
      obj.filters.push(new fabric.Image.filters.Sepia());
    } else if (name === 'vintage') {
      obj.filters.push(
        new fabric.Image.filters.Sepia(),
        new fabric.Image.filters.Contrast({ contrast: 0.2 }),
        new fabric.Image.filters.Noise({ noise: 100 })
      );
    } else if (name === 'kodachrome') {
      obj.filters.push(
        new fabric.Image.filters.Contrast({ contrast: 0.2 }),
        new fabric.Image.filters.Saturation({ saturation: 0.3 }),
        new fabric.Image.filters.Brightness({ brightness: 0.05 })
      );
    } else if (name === 'technicolor') {
      obj.filters.push(new fabric.Image.filters.Saturation({ saturation: 0.5 }), new fabric.Image.filters.Contrast({ contrast: 0.1 }));
    } else if (name === 'polaroid') {
      obj.filters.push(new fabric.Image.filters.Sepia(), new fabric.Image.filters.Brightness({ brightness: 0.1 }), new fabric.Image.filters.Contrast({ contrast: -0.1 }));
    } else if (name === 'cool') {
      obj.filters.push(new fabric.Image.filters.Saturation({ saturation: -0.2 }), new fabric.Image.filters.Brightness({ brightness: 0.05 }));
    } else if (name === 'warm') {
      obj.filters.push(new fabric.Image.filters.Saturation({ saturation: 0.2 }), new fabric.Image.filters.Brightness({ brightness: 0.1 }));
    } else if (name === 'fade') {
      obj.filters.push(new fabric.Image.filters.Contrast({ contrast: -0.2 }), new fabric.Image.filters.Saturation({ saturation: -0.3 }), new fabric.Image.filters.Brightness({ brightness: 0.1 }));
    } else if (name === 'dramatic') {
      obj.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.4 }), new fabric.Image.filters.Saturation({ saturation: 0.2 }), new fabric.Image.filters.Brightness({ brightness: -0.1 }));
    } else if (name === 'noir') {
      obj.filters.push(new fabric.Image.filters.Grayscale(), new fabric.Image.filters.Contrast({ contrast: 0.3 }), new fabric.Image.filters.Brightness({ brightness: -0.1 }));
    } else if (name === 'sunset') {
      obj.filters.push(new fabric.Image.filters.Saturation({ saturation: 0.4 }), new fabric.Image.filters.Brightness({ brightness: 0.15 }));
    } else if (name === 'invert') {
      obj.filters.push(new fabric.Image.filters.Invert());
    }

    obj.applyFilters();
    canvas.requestRenderAll();
    saveHistory(`Filter Preset applied: ${name}`);
  };

  const onResetFilters = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj && obj.type === 'image') {
      obj.filters = [];
      obj.applyFilters();
      canvas.requestRenderAll();
      setBrightness(0);
      setContrast(0);
      setSaturation(0);
      setBlur(0);
      setGrayscale(false);
      saveHistory('Filters cleared');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1a1a1a] text-[#e0e0e0] font-sans antialiased text-xs">
      {/* 1. Header Dropdown Menu */}
      <TopMenu onCommand={handleCommand} />

      {/* 2. Horizontal properties bar */}
      <PropertyBar
        activeTool={activeTool}
        selectedObjType={activeLayer ? activeLayer.type : null}
        selectedObjProps={selectedObjProps}
        brushColor={brushColor}
        brushWidth={brushWidth}
        healingWidth={healingWidth}
        healingMode={healingMode}
        tolerance={tolerance}
        contiguous={contiguous}
        antiAlias={antiAlias}
        isRightPanelOpen={isRightPanelOpen}
        onUpdateProp={onUpdateProp}
        onUpdateBrush={onUpdateBrush}
        onUpdateHealing={onUpdateHealing}
        onUpdateTolerance={(val) => {
          setTolerance(val);
        }}
        onUpdateContiguous={setContiguous}
        onUpdateAntiAlias={setAntiAlias}
        onClearSelection={() => {
          setActiveTool('select');
        }}
        onToggleBold={() => {
          const act = fabricCanvasRef.current?.getActiveObject();
          if (act) {
            act.set('fontWeight', act.fontWeight === 'bold' ? 'normal' : 'bold');
            fabricCanvasRef.current.requestRenderAll();
            saveHistory();
          }
        }}
        onToggleItalic={() => {
          const act = fabricCanvasRef.current?.getActiveObject();
          if (act) {
            act.set('fontStyle', act.fontStyle === 'italic' ? 'normal' : 'italic');
            fabricCanvasRef.current.requestRenderAll();
            saveHistory();
          }
        }}
        onFlipX={() => {
          const act = fabricCanvasRef.current?.getActiveObject();
          if (act) {
            act.set('flipX', !act.flipX);
            fabricCanvasRef.current.requestRenderAll();
            saveHistory();
          }
        }}
        onFlipY={() => {
          const act = fabricCanvasRef.current?.getActiveObject();
          if (act) {
            act.set('flipY', !act.flipY);
            fabricCanvasRef.current.requestRenderAll();
            saveHistory();
          }
        }}
        onRotate90={() => {
          const act = fabricCanvasRef.current?.getActiveObject();
          if (act) {
            act.rotate((act.angle || 0) + 90);
            fabricCanvasRef.current.requestRenderAll();
            saveHistory();
          }
        }}
        onToggleFilterPanel={() => setIsFilterPanelOpen((p) => !p)}
        onUndo={onUndo}
        onRedo={onRedo}
        onToggleRightPanel={() => setIsRightPanelOpen((p) => !p)}
      />

      {/* 3. Global working viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar */}
        <Toolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onAddShape={onAddShape}
          onAdd3DShape={onAdd3DShape}
          onAddShapeIcon={onAddShapeIcon}
          onAIAction={onAIAction}
          onCaptureScreen={onCaptureScreen}
        />

        {/* Center Canvas area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#121212]">
          {/* Tab bar header */}
          <div className="tab-bar h-[32px] bg-[#181818] border-b border-[#1f1f1f] flex items-end px-1.5 select-none overflow-x-auto">
            {projects.map((p) => {
              const isActive = p.id === activeProjectId;
              return (
                <div
                  key={p.id}
                  onClick={() => switchProject(p.id)}
                  className={`tab-item h-[28px] px-3 flex items-center gap-2 border border-[#1f1f1f] border-b-0 rounded-t mr-0.5 cursor-pointer max-w-[160px] text-[11px] transition-all ${
                    isActive
                      ? 'bg-[#262626] text-white border-t-2 border-t-[#4facfe] h-[30px]'
                      : 'bg-[#1e1e1e] text-gray-500 hover:bg-[#222]'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <button
                    onClick={(e) => closeProject(p.id, e)}
                    className="p-0.5 rounded-full hover:bg-neutral-600 hover:text-white"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Canvas Working Workspace */}
          <div
            ref={containerRef}
            onMouseDown={handleViewportMouseDown}
            onMouseMove={handleViewportMouseMove}
            onMouseUp={handleViewportMouseUp}
            onContextMenu={handleCanvasContextMenu}
            className={`flex-1 relative flex items-center justify-center p-8 overflow-hidden select-none ${
              isSpaceHeld || activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'
            } ${isPanning ? 'cursor-grabbing' : ''}`}
          >
            <div
              className="box-shadow shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-neutral-800 relative"
              style={{
                width: activeProject ? activeProject.width : 1366,
                height: activeProject ? activeProject.height : 768,
                transformOrigin: 'center center',
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                backgroundImage: 'linear-gradient(45deg, #a8a8a8 25%, transparent 25%, transparent 75%, #a8a8a8 75%, #a8a8a8), linear-gradient(45deg, #a8a8a8 25%, #bcbcbc 25%, #bcbcbc 75%, #a8a8a8 75%, #a8a8a8)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
                backgroundColor: '#bcbcbc',
              }}
            >
              <canvas id="editor-canvas" className="w-full h-full block" />

              {/* Floating Processing Loader */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-2 select-none">
                  <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-white text-[11px] font-bold tracking-wider">{loadingText}</p>
                </div>
              )}

              {/* Crop Box Container Workspace Overlay */}
              {isCropActive && (
                <div className="absolute inset-0 bg-black/60 z-50 flex flex-col items-center justify-center">
                  <div className="relative max-w-[90%] max-h-[80%] bg-[#121212] overflow-hidden">
                    <img
                      ref={cropImageRef}
                      src={cropImageSrc}
                      alt="Crop Source"
                      className="block max-w-full max-h-[70vh]"
                    />
                  </div>
                  <div className="flex gap-2.5 mt-3.5 z-50">
                    <button
                      onClick={cancelCrop}
                      className="bg-neutral-800 text-white border border-neutral-700 font-bold hover:bg-neutral-700 cursor-pointer px-4 py-1.5 rounded text-[10.5px]"
                    >
                      Cancel (ESC)
                    </button>
                    <button
                      onClick={applyCrop}
                      className="bg-blue-600 text-white font-bold hover:bg-blue-500 cursor-pointer px-4 py-1.5 rounded text-[10.5px]"
                    >
                      Apply (Enter)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Floating zoom controls bar */}
            <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 bg-[#262626] border border-[#3f3f3f] px-3.5 py-1.5 rounded-full flex items-center gap-3 w-[150px] justify-between shadow-[0_4px_15px_rgba(0,0,0,0.5)] z-40 select-none">
              <button
                onClick={() => adjustZoom(-0.1)}
                className="text-gray-400 hover:text-white cursor-pointer"
                title="Zoom out"
              >
                <Minus size={13} />
              </button>
              <span className="text-[10px] text-gray-300 font-mono font-bold w-[45px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => adjustZoom(0.1)}
                className="text-gray-400 hover:text-white cursor-pointer"
                title="Zoom in"
              >
                <Plus size={13} />
              </button>
              <div className="w-[1px] h-3.5 bg-neutral-700" />
              <button
                onClick={fitCanvasViewport}
                className="text-gray-400 hover:text-white cursor-pointer"
                title="Fit canvas to editor space"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Floating Filters Adjust properties card */}
        {isFilterPanelOpen && (
          <div className="absolute top-[20px] right-[215px] bg-[#2b2b2b] border border-[#3f3f3f] rounded-lg p-3 w-[220px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-40 select-none text-[10.5px]">
            <div className="flex justify-between items-center mb-2 border-b border-[#444] pb-1.5">
              <span className="font-bold text-white uppercase text-[10px]">이미지 보정</span>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>

            {/* Filters Presets */}
            <div className="mb-3">
              <span className="text-[9px] text-gray-500 block mb-1">Presets</span>
              <div className="flex flex-wrap gap-1">
                {['grayscale', 'sepia', 'vintage', 'kodachrome', 'technicolor', 'polaroid', 'cool', 'warm', 'fade', 'dramatic', 'noir', 'sunset', 'invert'].map((p) => (
                  <button
                    key={p}
                    onClick={() => onApplyPreset(p)}
                    className="bg-[#333] hover:bg-[#0078d7] border border-[#555] text-gray-300 hover:text-white text-[9px] px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    {p.substring(0, 5).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Brightness slider */}
            <div className="mb-2.5">
              <div className="flex justify-between text-gray-400 mb-0.5">
                <span>밝기 (Brightness)</span>
                <span className="font-mono">{brightness}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={brightness}
                onChange={(e) => onApplyFilterValue('brightness', e.target.value)}
                className="w-full h-1 bg-gray-700 appearance-none rounded"
              />
            </div>

            {/* Contrast slider */}
            <div className="mb-2.5">
              <div className="flex justify-between text-gray-400 mb-0.5">
                <span>대비 (Contrast)</span>
                <span className="font-mono">{contrast}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={contrast}
                onChange={(e) => onApplyFilterValue('contrast', e.target.value)}
                className="w-full h-1 bg-gray-700 appearance-none rounded"
              />
            </div>

            {/* Saturation slider */}
            <div className="mb-2.5">
              <div className="flex justify-between text-gray-400 mb-0.5">
                <span>채도 (Saturation)</span>
                <span className="font-mono">{saturation}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={saturation}
                onChange={(e) => onApplyFilterValue('saturation', e.target.value)}
                className="w-full h-1 bg-gray-700 appearance-none rounded"
              />
            </div>

            {/* Blur slider */}
            <div className="mb-3">
              <div className="flex justify-between text-gray-400 mb-0.5">
                <span>흐림 (Blur)</span>
                <span className="font-mono">{blur}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={blur}
                onChange={(e) => onApplyFilterValue('blur', e.target.value)}
                className="w-full h-1 bg-gray-700 appearance-none rounded"
              />
            </div>

            {/* Grayscale checkbox */}
            <div className="flex items-center gap-2 border-t border-[#444] pt-2.5 justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={grayscale}
                  onChange={(e) => onApplyFilterValue('grayscale', e.target.checked)}
                  className="w-3 h-3 cursor-pointer"
                />
                <span>흑백 모드</span>
              </label>
              <button
                onClick={onResetFilters}
                className="text-[9.5px] text-red-400 hover:text-red-300 pr-1 cursor-pointer font-bold"
              >
                필터 초기화
              </button>
            </div>
          </div>
        )}

        {/* Right side Layers/Controls component */}
        {isRightPanelOpen && (
          <RightPanel
            layers={layers}
            activeLayer={activeLayer}
            history={activeProject ? activeProject.history : []}
            historyStep={activeProject ? activeProject.historyStep : -1}
            isHistoryOpen={activeModal === 'history-panel'}
            opacity={activeLayer ? activeLayer.opacity || 1.0 : 1.0}
            onToggleHistory={() =>
              setActiveModal((p) => (p === 'history-panel' ? null : 'history-panel'))
            }
            onAddLayerClick={() => handleCommand('open-file')}
            onDeleteLayerClick={() => handleCommand('delete')}
            onUpdateOpacity={updateActiveOpacity}
            onPickColor={onPickColor}
            onSelectLayer={onSelectLayer}
            onToggleLayerVisibility={onToggleLayerVisibility}
            onDeleteLayerIndex={onDeleteLayerIndex}
            onReorderLayers={onReorderLayers}
            onAddShapeIcon={onAddShapeIcon}
            onLoadHistoryStep={onLoadHistoryStep}
            onLayerContextMenu={handleLayerContextMenu}
          />
        )}
      </div>

      {/* 4. Horizontal bottom Status Info bar */}
      <footer className="h-[24px] bg-[#262626] border-t border-[#1f1f1f] flex items-center justify-between px-[15px] text-[10px] text-zinc-500 select-none z-50">
        <div className="flex items-center gap-2 font-mono">
          <span>
            {activeProject ? `${activeProject.width} x ${activeProject.height} px` : '1366 x 768 px'}
          </span>
        </div>
        <span className="text-[9px] text-gray-600 uppercase flex items-center gap-1">
          Powered by Gemini AI Studio ✨
        </span>
      </footer>

      {/* 5. Custom overlays elements for QR or File triggers */}
      <input
        type="file"
        id="load-project-input-global"
        className="hidden"
        accept=".json"
        onChange={handleLoadProjectInput}
      />
      <input
        type="file"
        id="file-input-global"
        className="hidden"
        accept="image/*, application/pdf"
        onChange={handleFileInputGlobal}
      />

      {/* 6. Modals container launcher */}
      <Modals
        activeModal={activeModal === 'history-panel' ? null : activeModal}
        onClose={() => setActiveModal(null)}
        onNewFile={onNewFile}
        canvasWidth={activeProject ? activeProject.width : 1366}
        canvasHeight={activeProject ? activeProject.height : 768}
        onApplyImageSize={onApplyImageSize}
        onApplyCanvasSize={onApplyCanvasSize}
        selectedColorConfig={{
          fill: selectedObjProps.fill || 'transparent',
          stroke: selectedObjProps.stroke || 'transparent',
          strokeWidth: selectedObjProps.strokeWidth || 1,
        }}
        onApplyFillStroke={onApplyFillStroke}
        onGenerateMeme={onGenerateMeme}
        onAddQRCode={onAddQRCode}
        onExportImage={onExportImage}
        onGenerateSticker={onGenerateSticker}
        onGenerateStyle={onGenerateStyle}
        aiTutorChat={aiTutorChat}
        onSendTutorChat={onSendTutorChat}
        analysisReport={analysisReport}
        apiKey={apiKey}
        onSaveApiKey={(key) => {
          setApiKey(key);
          localStorage.setItem('gemini_api_key', key);
          showToast('API Key가 로컬에 전용 저장되었습니다.');
        }}
        pdfPagesData={pdfPagesData}
        onSelectPdfPage={onSelectPdfPage}
      />

      {/* 7. Toast alert box notifier popup */}
      {toastMessage && (
        <div className="fixed bottom-[34px] left-1/2 -translate-x-1/2 bg-black/85 text-white border border-[#555] rounded-full py-2 px-6 shadow-2xl transition-all duration-200 z-[1000] text-[11px] tracking-wide font-sans animate-bounce whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 8. Context Menu (오른쪽 클릭 메뉴) */}
      {contextMenu.visible && (
        <div
          className="fixed bg-[#1e1e1e]/95 backdrop-blur-md border border-neutral-700/80 rounded-lg shadow-2xl py-1 w-[180px] z-[9999] text-xs text-neutral-200 divide-y divide-neutral-800 pointer-events-auto"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 300),
            left: Math.min(contextMenu.x, window.innerWidth - 190),
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Section 1: Copy / Paste */}
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
                setContextMenu({ ...contextMenu, visible: false });
              }}
              disabled={!activeLayer}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b2b2b] ${
                !activeLayer ? 'opacity-40 cursor-not-allowed text-neutral-500' : 'cursor-pointer hover:text-white'
              }`}
            >
              <Copy size={13} className="text-neutral-400" />
              <span>복사</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPaste();
                setContextMenu({ ...contextMenu, visible: false });
              }}
              disabled={!clipboard}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b2b2b] ${
                !clipboard ? 'opacity-40 cursor-not-allowed text-neutral-500' : 'cursor-pointer hover:text-white'
              }`}
            >
              <Clipboard size={13} className="text-neutral-400" />
              <span>붙여넣기</span>
            </button>
          </div>

          {/* Section 2: Group / Ungroup / Merge */}
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGroupObjects();
                setContextMenu({ ...contextMenu, visible: false });
              }}
              disabled={!activeLayer || (activeLayer.type !== 'activeSelection' && activeLayer.type !== 'group')}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b2b2b] ${
                !activeLayer || (activeLayer.type !== 'activeSelection' && activeLayer.type !== 'group')
                  ? 'opacity-40 cursor-not-allowed text-neutral-500'
                  : 'cursor-pointer hover:text-white'
              }`}
            >
              {activeLayer?.type === 'group' ? <FolderOpen size={13} className="text-blue-400" /> : <Folder size={13} className="text-blue-400" />}
              <span>{activeLayer?.type === 'group' ? '그룹 해제' : '그룹화 / 해제'}</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMergeLayers();
                setContextMenu({ ...contextMenu, visible: false });
              }}
              disabled={!activeLayer}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b2b2b] ${
                !activeLayer ? 'opacity-40 cursor-not-allowed text-neutral-500' : 'cursor-pointer hover:text-white'
              }`}
            >
              <Layers size={13} className="text-pink-400" />
              <span>레이어 병합</span>
            </button>
          </div>

          {/* Section 3: Depth Arrange */}
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBringToFront();
                setContextMenu({ ...contextMenu, visible: false });
              }}
              disabled={!activeLayer}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b2b2b] ${
                !activeLayer ? 'opacity-40 cursor-not-allowed text-neutral-500' : 'cursor-pointer hover:text-white'
              }`}
            >
              <ChevronsUp size={13} className="text-emerald-400" />
              <span>레이어 맨앞으로</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendToBack();
                setContextMenu({ ...contextMenu, visible: false });
              }}
              disabled={!activeLayer}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b2b2b] ${
                !activeLayer ? 'opacity-40 cursor-not-allowed text-neutral-500' : 'cursor-pointer hover:text-white'
              }`}
            >
              <ChevronsDown size={13} className="text-emerald-400" />
              <span>레이어 맨뒤로</span>
            </button>
          </div>

          {/* Section 4: Save Selected Image / Delete */}
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveSelectedImage(activeLayer);
                setContextMenu({ ...contextMenu, visible: false });
              }}
              disabled={!activeLayer}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b2b2b] ${
                !activeLayer ? 'opacity-40 cursor-not-allowed text-neutral-500' : 'cursor-pointer hover:text-white'
              }`}
            >
              <Download size={13} className="text-purple-400" />
              <span>선택된 레이어 저장</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLayer();
                setContextMenu({ ...contextMenu, visible: false });
              }}
              disabled={!activeLayer}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-red-400 hover:bg-red-950/40 ${
                !activeLayer ? 'opacity-40 cursor-not-allowed text-neutral-500' : 'cursor-pointer hover:text-red-300'
              }`}
            >
              <Trash2 size={13} />
              <span>삭제</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Self helpers

  function updateActiveOpacity(val: number) {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set('opacity', val);
      canvas.requestRenderAll();
      syncLayersState();
    }
  }

  function onSelectLayer(layer: any) {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.setActiveObject(layer);
      canvas.renderAll();
      syncLayersState();
    }
  }

  function onToggleLayerVisibility(index: number) {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const obj = canvas.getObjects()[index];
      if (obj) {
        obj.visible = !obj.visible;
        if (!obj.visible) {
          canvas.discardActiveObject();
        }
        canvas.renderAll();
        syncLayersState();
      }
    }
  }

  function onPickColor(hex: string) {
    const canvas = fabricCanvasRef.current;
    const isDrawingMode = canvas?.isDrawingMode;

    if (isDrawingMode) {
      onUpdateBrush('color', hex);
    } else {
      const active = canvas?.getActiveObject();
      if (active) {
        if (active.type === 'i-text' || active.type === 'text') {
          onUpdateProp('fill', hex);
        } else if (['rect', 'circle', 'triangle', 'polygon', 'path', 'line'].includes(active.type)) {
          onUpdateProp('fill', hex);
        }
      }
    }
  }
}
