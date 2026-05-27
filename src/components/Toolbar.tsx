import React, { useState } from 'react';
import {
  MousePointer2,
  BoxSelect,
  Circle,
  Scissors,
  Hand,
  Crop,
  Square,
  Maximize,
  Triangle,
  Minus,
  Shapes,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Heart,
  MessageSquare,
  Activity,
  Star,
  Box as CubeIcon,
  Package,
  Database,
  CircleDot,
  LayoutList,
  Type,
  Brush,
  Sparkles,
  Wand2,
  MonitorUp,
  Flame,
  Diamond
} from 'lucide-react';
import { ToolMode } from '../types';

interface ToolbarProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  onAddShape: (shape: string) => void;
  onAdd3DShape: (shape3d: string) => void;
  onAddShapeIcon: (iconName: string) => void;
  onAIAction: (action: string) => void;
  onCaptureScreen: (mode: 'screen' | 'rect') => void;
}

export default function Toolbar({
  activeTool,
  onSelectTool,
  onAddShape,
  onAdd3DShape,
  onAddShapeIcon,
  onAIAction,
  onCaptureScreen,
}: ToolbarProps) {
  const [hoveredPopup, setHoveredPopup] = useState<string | null>(null);

  const buttonStyle = (tool: ToolMode) =>
    `w-8 h-8 rounded mb-0.5 flex items-center justify-center cursor-pointer transition-all duration-100 position-relative ${
      activeTool === tool
        ? 'bg-[#404040] text-[#4facfe] border-l-2 border-[#4facfe]'
        : 'text-[#aaa] hover:bg-[#3f3f3f] hover:text-white'
    }`;

  return (
    <div className="w-[42px] bg-[#262626] border-r border-[#1f1f1f] flex flex-col items-center pt-2 z-30 select-none">
      {/* 1. Select Tool (Move) */}
      <button
        id="tool-select"
        className={buttonStyle('select')}
        onClick={() => onSelectTool('select')}
        title="이동 (V)"
      >
        <MousePointer2 size={14} />
      </button>

      {/* 2. Selection Submenus */}
      <div
        className="relative group w-8 h-8 mb-0.5 flex items-center justify-center"
        onMouseEnter={() => setHoveredPopup('selection')}
        onMouseLeave={() => setHoveredPopup(null)}
      >
        <button
          id="tool-marquee"
          className={`w-full h-full rounded flex items-center justify-center cursor-pointer ${
            activeTool.startsWith('marquee-') && activeTool !== 'marquee-wand'
              ? 'bg-[#404040] text-[#4facfe] border-l-2 border-[#4facfe]'
              : 'text-[#aaa] hover:bg-[#3f3f3f] hover:text-white'
          }`}
          title="선택 도구 (M)"
        >
          {activeTool === 'marquee-ellipse' ? (
            <Circle size={14} />
          ) : activeTool === 'marquee-polygon' ? (
            <Shapes size={14} />
          ) : (
            <BoxSelect size={14} />
          )}
          <div className="absolute bottom-0.5 right-0.5 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-[#888]" />
        </button>

        {hoveredPopup === 'selection' && (
          <div className="absolute left-[34px] top-0 bg-[#2b2b2b] border border-[#1f1f1f] rounded-r p-[2px] flex flex-col gap-[1px] shadow-[4px_4px_10px_rgba(0,0,0,0.5)] z-50 min-w-[140px]">
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onSelectTool('marquee-rect')}
            >
              <BoxSelect size={12} /> 사각 선택 (Rect)
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onSelectTool('marquee-ellipse')}
            >
              <Circle size={12} /> 원형 선택 (Circle)
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onSelectTool('marquee-lasso')}
            >
              <Wand2 size={12} fill="none" /> 올가미 (Lasso)
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onSelectTool('marquee-polygon')}
            >
              <Shapes size={12} /> 다각선 (Polygon)
            </button>
          </div>
        )}
      </div>

      {/* 3. Magic Wand */}
      <button
        id="tool-magic-wand"
        className={buttonStyle('marquee-wand')}
        onClick={() => onSelectTool('marquee-wand')}
        title="매직봉 (W)"
      >
        <Wand2 size={14} />
      </button>

      {/* 4. Hand Tool */}
      <button
        id="tool-hand"
        className={buttonStyle('hand')}
        onClick={() => onSelectTool('hand')}
        title="손 도구 (Space)"
      >
        <Hand size={14} />
      </button>

      {/* 5. Crop Tool */}
      <button
        className="w-8 h-8 rounded mb-0.5 flex items-center justify-center cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white"
        onClick={() => onSelectTool('select')}
        onDoubleClick={() => onAIAction('crop')}
        onClickCapture={() => onAIAction('crop')}
        title="자르기 (Ent/Dbl)"
      >
        <Crop size={14} />
      </button>

      <div className="w-5 h-[1px] bg-[#3f3f3f] my-1" />

      {/* 6. Standard 2D Shape Tool Menu */}
      <div
        className="relative w-8 h-8 mb-0.5 flex items-center justify-center"
        onMouseEnter={() => setHoveredPopup('shapes-2d')}
        onMouseLeave={() => setHoveredPopup(null)}
      >
        <button
          className="w-full h-full text-[#aaa] hover:bg-[#3f3f3f] hover:text-white rounded flex items-center justify-center cursor-pointer"
          title="도형 그리기"
        >
          <Square size={14} />
          <div className="absolute bottom-0.5 right-0.5 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-[#888]" />
        </button>

        {hoveredPopup === 'shapes-2d' && (
          <div className="absolute left-[34px] top-0 bg-[#2b2b2b] border border-[#1f1f1f] rounded-r p-[2px] flex flex-col gap-[1px] shadow-[4px_4px_10px_rgba(0,0,0,0.5)] z-50 min-w-[130px]">
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('rect')}
            >
              <Square size={10} /> 사각형
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('round-rect')}
            >
              <Maximize size={10} /> 라운드 사각
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('circle')}
            >
              <Circle size={10} /> 원형
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('triangle')}
            >
              <Triangle size={10} /> 삼각형
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('rhombus')}
            >
              <Diamond size={10} /> 마름모
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onSelectTool('line-draw')}
            >
              <Minus size={10} /> 선 그리기
            </button>
          </div>
        )}
      </div>

      {/* 7. Symbol/Icons Tool Menu */}
      <div
        className="relative w-8 h-8 mb-0.5 flex items-center justify-center"
        onMouseEnter={() => setHoveredPopup('symbols')}
        onMouseLeave={() => setHoveredPopup(null)}
      >
        <button
          className="w-full h-full text-[#aaa] hover:bg-[#3f3f3f] hover:text-white rounded flex items-center justify-center cursor-pointer"
          title="모형 모음"
        >
          <Shapes size={14} />
          <div className="absolute bottom-0.5 right-0.5 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-[#888]" />
        </button>

        {hoveredPopup === 'symbols' && (
          <div className="absolute left-[34px] top-0 bg-[#2b2b2b] border border-[#1f1f1f] rounded-r p-[2px] flex flex-col gap-[1px] shadow-[4px_4px_10px_rgba(0,0,0,0.5)] z-50 min-w-[140px] max-h-[300px] overflow-y-auto">
            <div className="text-[8px] text-[#555] px-2 py-0.5 border-b border-[#333]">화살표</div>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('arrow-right')}
            >
              <ArrowRight size={10} /> 오른쪽 →
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('arrow-left')}
            >
              <ArrowLeft size={10} /> 왼쪽 ←
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('arrow-up')}
            >
              <ArrowUp size={10} /> 위 ↑
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('arrow-down')}
            >
              <ArrowDown size={10} /> 아래 ↓
            </button>

            <div className="text-[8px] text-[#555] px-2 py-0.5 border-b border-[#333] mt-1">카드 무늬</div>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left text-red-400"
              onClick={() => onAddShape('heart')}
            >
              <Heart size={10} fill="currentColor" /> 하트 ♥
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left text-red-400"
              onClick={() => onAddShape('card-diamond')}
            >
              ♦ 다이아몬드
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('spade')}
            >
              ♠ 스페이드
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('club')}
            >
              ♣ 클로버
            </button>

            <div className="text-[8px] text-[#555] px-2 py-0.5 border-b border-[#333] mt-1">특수 모양</div>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('speech-bubble')}
            >
              <MessageSquare size={10} /> 말풍선
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('taeguk')}
            >
              ☯ 태극
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAddShape('sine-wave')}
            >
              <Activity size={10} /> 사인파
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left text-yellow-400"
              onClick={() => onAddShape('star5')}
            >
              <Star size={10} fill="currentColor" /> 별 ★
            </button>
          </div>
        )}
      </div>

      {/* 8. 3D Structure Tools */}
      <div
        className="relative w-8 h-8 mb-0.5 flex items-center justify-center"
        onMouseEnter={() => setHoveredPopup('shapes-3d')}
        onMouseLeave={() => setHoveredPopup(null)}
      >
        <button
          className="w-full h-full text-[#aaa] hover:bg-[#3f3f3f] hover:text-white rounded flex items-center justify-center cursor-pointer"
          title="3D 도형"
        >
          <CubeIcon size={14} />
          <div className="absolute bottom-0.5 right-0.5 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-[#888]" />
        </button>

        {hoveredPopup === 'shapes-3d' && (
          <div className="absolute left-[34px] top-0 bg-[#2b2b2b] border border-[#1f1f1f] rounded-r p-[2px] flex flex-col gap-[1px] shadow-[4px_4px_10px_rgba(0,0,0,0.5)] z-50 min-w-[150px]">
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAdd3DShape('cube')}
            >
              <CubeIcon size={10} /> 정육면체 (Cube)
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAdd3DShape('round-cube')}
            >
              <Package size={10} /> 라운드 큐브
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAdd3DShape('cylinder')}
            >
              <Database size={10} /> 원기둥 (Cylinder)
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAdd3DShape('sphere')}
            >
              <CircleDot size={10} /> 구 (Sphere)
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onAdd3DShape('bar')}
            >
              <LayoutList size={10} /> 막대 (Bar)
            </button>
          </div>
        )}
      </div>

      {/* 9. Text Tool */}
      <button
        className="w-8 h-8 rounded mb-0.5 flex items-center justify-center cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white"
        onClick={() => onAddShape('text')}
        title="텍스트 추가"
      >
        <Type size={14} />
      </button>

      {/* 10. Paint Brush Tool */}
      <button
        id="tool-brush"
        className={buttonStyle('brush')}
        onClick={() => onSelectTool('brush')}
        title="브러시"
      >
        <Brush size={14} />
      </button>

      {/* 11. Spot Healing Tool */}
      <button
        id="tool-spot-healing"
        className={buttonStyle('spot-healing')}
        onClick={() => onSelectTool('spot-healing')}
        title="스팟 복구 브러쉬 (J)"
      >
        <Flame size={14} />
      </button>

      <div className="w-5 h-[1px] bg-[#3f3f3f] my-1" />

      {/* 12. AI Tools */}
      <button
        className="w-8 h-8 rounded mb-0.5 flex items-center justify-center cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white"
        onClick={() => onAIAction('remove-bg')}
        title="배경 제거"
      >
        <Scissors size={14} />
      </button>

      <button
        className="w-8 h-8 rounded mb-0.5 flex items-center justify-center cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white"
        onClick={() => onAIAction('enhance')}
        title="화질 개선"
      >
        <Sparkles size={14} />
      </button>

      <button
        className="w-8 h-8 rounded mb-0.5 flex items-center justify-center cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white animate-pulse"
        onClick={() => onAIAction('style')}
        title="스타일 변환"
      >
        <Sparkles className="text-purple-400" size={14} />
      </button>

      <button
        className="w-8 h-8 rounded mb-0.5 flex items-center justify-center cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white"
        onClick={() => onAIAction('sticker')}
        title="AI Sticker"
      >
        <Shapes className="text-blue-400" size={14} />
      </button>

      <div className="flex-1" />

      {/* 13. Screen Capture */}
      <div
        className="relative w-8 h-8 mb-2 flex items-center justify-center"
        onMouseEnter={() => setHoveredPopup('capture')}
        onMouseLeave={() => setHoveredPopup(null)}
      >
        <button
          className="w-full h-full text-[#aaa] hover:bg-[#3f3f3f] hover:text-white rounded flex items-center justify-center cursor-pointer"
          title="캡처"
        >
          <MonitorUp size={14} />
          <div className="absolute top-0.5 right-0.5 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[3px] border-b-[#888]" />
        </button>

        {hoveredPopup === 'capture' && (
          <div className="absolute left-[34px] bottom-0 bg-[#2b2b2b] border border-[#1f1f1f] rounded p-[2px] flex flex-col gap-[1px] shadow-[4px_4px_10px_rgba(0,0,0,0.5)] z-50 min-w-[140px]">
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onCaptureScreen('screen')}
            >
              전체 화면
            </button>
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#ccc] hover:bg-[#0078d7] hover:text-white rounded-sm w-full text-left"
              onClick={() => onCaptureScreen('rect')}
            >
              영역 지정 (Auto-Crop)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
