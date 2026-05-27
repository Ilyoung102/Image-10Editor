import React from 'react';
import {
  BoxSelect,
  Wand2,
  X,
  Type,
  Bold,
  Italic,
  Square,
  Minus,
  Brush,
  Flame,
  Blend,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  SlidersHorizontal,
  Undo2,
  Redo2,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { ToolMode } from '../types';

interface PropertyBarProps {
  activeTool: ToolMode;
  selectedObjType: string | null;
  selectedObjProps: {
    text?: string;
    fontFamily?: string;
    fontSize?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rx?: number;
    globalCompositeOperation?: string;
  };
  brushColor: string;
  brushWidth: number;
  healingWidth: number;
  healingMode: string;
  tolerance: number;
  contiguous: boolean;
  antiAlias: boolean;
  isRightPanelOpen: boolean;
  
  onUpdateProp: (prop: string, value: any) => void;
  onUpdateBrush: (prop: 'color' | 'width', value: any) => void;
  onUpdateHealing: (prop: 'width' | 'mode', value: any) => void;
  onUpdateTolerance: (val: number) => void;
  onUpdateContiguous: (val: boolean) => void;
  onUpdateAntiAlias: (val: boolean) => void;
  onClearSelection: () => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onFlipX: () => void;
  onFlipY: () => void;
  onRotate90: () => void;
  onToggleFilterPanel: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleRightPanel: () => void;
}

export default function PropertyBar({
  activeTool,
  selectedObjType,
  selectedObjProps,
  brushColor,
  brushWidth,
  healingWidth,
  healingMode,
  tolerance,
  contiguous,
  antiAlias,
  isRightPanelOpen,
  onUpdateProp,
  onUpdateBrush,
  onUpdateHealing,
  onUpdateTolerance,
  onUpdateContiguous,
  onUpdateAntiAlias,
  onClearSelection,
  onToggleBold,
  onToggleItalic,
  onFlipX,
  onFlipY,
  onRotate90,
  onToggleFilterPanel,
  onUndo,
  onRedo,
  onToggleRightPanel,
}: PropertyBarProps) {
  return (
    <div className="bg-[#262626] border-b border-[#1f1f1f] h-[44px] flex justify-between items-center px-[15px] z-40 select-none text-[11px] text-[#ccc]">
      <div className="flex items-center gap-[15px] overflow-x-auto flex-1">
        {/* Core Logo Label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
            P
          </div>
          <span className="text-xs font-bold text-gray-200 tracking-wide">
            Pro Editor{' '}
            <span className="text-[9px] text-gray-500 ml-1 font-normal">
              v1.45 Magic Wand
            </span>
          </span>
        </div>

        {/* Dynamic Tool Properties Grid */}
        <div className="flex items-center h-full">
          {/* Default State or Selection Tool properties */}
          {activeTool.startsWith('marquee-') && activeTool !== 'marquee-wand' && (
            <div className="flex items-center gap-2.5 ml-2.5 pl-2.5 border-l border-[#3f3f3f] h-6 flex-shrink-0">
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5">
                <BoxSelect size={12} className="text-blue-400" />
                <span className="text-[10px] font-bold">선택 도구</span>
              </div>
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5 text-gray-400">
                <span className="text-[9px]">모드:</span>
                <span className="text-white">이미지 고정 (Locked)</span>
              </div>
              <button
                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white transition-all duration-75"
                onClick={onClearSelection}
                title="선택 해제"
              >
                <X size={12} /> 해제
              </button>
            </div>
          )}

          {/* Magic Wand Properties */}
          {activeTool === 'marquee-wand' && (
            <div className="flex items-center gap-2.5 ml-2.5 pl-2.5 border-l border-[#3f3f3f] h-6 flex-shrink-0">
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5">
                <Wand2 size={12} className="text-purple-400" />
                <span className="text-[10px] font-bold">매직봉</span>
              </div>
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5">
                <span className="text-gray-500 text-[9px]">톨러런스</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={tolerance}
                  onChange={(e) => onUpdateTolerance(parseInt(e.target.value))}
                  className="w-16 h-1 bg-gray-600 rounded appearance-none cursor-pointer"
                />
                <span className="text-[10px] text-[#4facfe] w-5 font-bold">
                  {tolerance}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5 select-none">
                <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contiguous}
                    onChange={(e) => onUpdateContiguous(e.target.checked)}
                    className="w-3 h-3 cursor-pointer"
                  />
                  <span>인접</span>
                </label>
              </div>
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5 select-none">
                <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={antiAlias}
                    onChange={(e) => onUpdateAntiAlias(e.target.checked)}
                    className="w-3 h-3 cursor-pointer"
                  />
                  <span>AA</span>
                </label>
              </div>
              <button
                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white transition-all duration-75"
                onClick={onClearSelection}
                title="선택 해제"
              >
                <X size={12} /> 해제
              </button>
            </div>
          )}

          {/* Text Tool Properties */}
          {selectedObjType === 'i-text' && (
            <div className="flex items-center gap-2.5 ml-2.5 pl-2.5 border-l border-[#3f3f3f] h-6 flex-shrink-0">
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5">
                <Type size={12} className="text-gray-400" />
                <span className="text-[10px]">텍스트</span>
              </div>
              <input
                type="text"
                value={selectedObjProps.text || ''}
                onChange={(e) => onUpdateProp('text', e.target.value)}
                className="bg-[#1a1a1a] border border-[#3f3f3f] text-white px-1.5 py-0.5 rounded text-[10px] outline-none w-28"
                placeholder="내용 입력..."
              />
              <select
                value={selectedObjProps.fontFamily || 'Pretendard'}
                onChange={(e) => onUpdateProp('fontFamily', e.target.value)}
                className="bg-[#1a1a1a] border border-[#3f3f3f] text-white px-1.5 py-0.5 rounded text-[10px] outline-none w-20"
              >
                <option value="Pretendard">Pretendard</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times</option>
                <option value="Impact">Impact</option>
                <option value="Courier New">Courier</option>
                <option value="Segoe UI Emoji, Apple Color Emoji">Emoji</option>
              </select>
              <input
                type="number"
                value={selectedObjProps.fontSize || 40}
                onChange={(e) => onUpdateProp('fontSize', parseInt(e.target.value) || 12)}
                className="bg-[#1a1a1a] border border-[#3f3f3f] text-white px-1 py-0.5 rounded text-[10px] outline-none w-10 text-center"
              />
              <div className="flex items-center gap-1 border-r border-[#3f3f3f] pr-2.5 h-5">
                <div className="w-4 h-4 rounded border border-[#555] cursor-pointer relative overflow-hidden">
                  <input
                    type="color"
                    value={selectedObjProps.fill || '#000000'}
                    onChange={(e) => onUpdateProp('fill', e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                  />
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: selectedObjProps.fill || '#000000' }}
                  />
                </div>
              </div>
              <button
                className="p-1 rounded cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white"
                onClick={onToggleBold}
                title="Bold"
              >
                <Bold size={11} />
              </button>
              <button
                className="p-1 rounded cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white"
                onClick={onToggleItalic}
                title="Italic"
              >
                <Italic size={11} />
              </button>
            </div>
          )}

          {/* Simple Vector Shapes (rect, circle, triangle, line, polygon, path) */}
          {selectedObjType &&
            ['rect', 'circle', 'triangle', 'line', 'polygon', 'path'].includes(
              selectedObjType
            ) && (
              <div className="flex items-center gap-2.5 ml-2.5 pl-2.5 border-l border-[#3f3f3f] h-6 flex-shrink-0">
                <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5">
                  <Square size={12} className="text-gray-400" />
                  <span className="text-[10px]">도형</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 text-[9px]">채우기</span>
                  <div className="w-4 h-4 rounded border border-[#555] cursor-pointer relative overflow-hidden">
                    <input
                      type="color"
                      value={selectedObjProps.fill && selectedObjProps.fill !== 'transparent' ? selectedObjProps.fill : '#ffffff'}
                      onChange={(e) => onUpdateProp('fill', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                    />
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor:
                          selectedObjProps.fill === 'transparent'
                            ? 'transparent'
                            : selectedObjProps.fill || '#cccccc',
                      }}
                    />
                  </div>
                  <button
                    className="text-[9px] text-gray-500 hover:text-white ml-1.5 cursor-pointer"
                    onClick={() => onUpdateProp('fill', 'transparent')}
                  >
                    투명
                  </button>
                </div>
                <div className="flex items-center gap-1.5 ml-1.5 pl-2 border-l border-[#3f3f3f] h-5">
                  <span className="text-gray-500 text-[9px]">테두리</span>
                  <div className="w-4 h-4 rounded border border-[#555] cursor-pointer relative overflow-hidden">
                    <input
                      type="color"
                      value={selectedObjProps.stroke || '#000000'}
                      onChange={(e) => onUpdateProp('stroke', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                    />
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: selectedObjProps.stroke || '#000000' }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-gray-500 text-[9px]">두께</span>
                  <input
                    type="number"
                    min="0"
                    value={selectedObjProps.strokeWidth !== undefined ? selectedObjProps.strokeWidth : 1}
                    onChange={(e) =>
                      onUpdateProp('strokeWidth', parseInt(e.target.value) || 0)
                    }
                    className="bg-[#1a1a1a] border border-[#3f3f3f] text-white px-1.5 py-0.5 rounded outline-none w-14 text-center font-mono"
                  />
                </div>
                {selectedObjType === 'rect' && (
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-gray-500 text-[9px]">R</span>
                    <input
                      type="number"
                      min="0"
                      value={selectedObjProps.rx !== undefined ? selectedObjProps.rx : 0}
                      onChange={(e) => onUpdateProp('rx', parseInt(e.target.value) || 0)}
                      className="bg-[#1a1a1a] border border-[#3f3f3f] text-white px-1.5 py-0.5 rounded outline-none w-14 text-center font-mono"
                    />
                  </div>
                )}
              </div>
            )}

          {/* Regular Brush Properties */}
          {activeTool === 'brush' && (
            <div className="flex items-center gap-2.5 ml-2.5 pl-2.5 border-l border-[#3f3f3f] h-6 flex-shrink-0">
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5">
                <Brush size={12} className="text-gray-400" />
                <span className="text-[10px]">브러시</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 text-[9px]">색상</span>
                <div className="w-4 h-4 rounded border border-[#555] cursor-pointer relative overflow-hidden">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => onUpdateBrush('color', e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                  />
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: brushColor }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-[9px]">크기</span>
                <input
                  type="number"
                  value={brushWidth}
                  onChange={(e) =>
                    onUpdateBrush('width', parseInt(e.target.value) || 1)
                  }
                  className="bg-[#1a1a1a] border border-[#3f3f3f] text-white px-1 py-0.5 rounded outline-none w-10 text-center"
                />
              </div>
            </div>
          )}

          {/* Spot Healing Brush Properties */}
          {activeTool === 'spot-healing' && (
            <div className="flex items-center gap-2.5 ml-2.5 pl-2.5 border-l border-[#3f3f3f] h-6 flex-shrink-0">
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3f3f3f] h-5">
                <Flame size={12} className="text-pink-400" />
                <span className="text-[10px]">스팟 복구</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-[9px]">크기</span>
                <input
                  type="number"
                  value={healingWidth}
                  onChange={(e) =>
                    onUpdateHealing('width', parseInt(e.target.value) || 1)
                  }
                  className="bg-[#1a1a1a] border border-[#3f3f3f] text-white px-1 py-0.5 rounded outline-none w-10 text-center"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-[9px]">타입</span>
                <select
                  value={healingMode}
                  onChange={(e) => onUpdateHealing('mode', e.target.value)}
                  className="bg-[#1a1a1a] border border-[#3f3f3f] text-white px-1.5 py-0.5 rounded text-[10px] outline-none w-28"
                >
                  <option value="content-aware">내용 인식</option>
                  <option value="texture">텍스처 만들기</option>
                  <option value="proximity">근접 일치</option>
                </select>
              </div>
            </div>
          )}

          {/* Common Blend/Transform buttons shown when an object is selected */}
          {selectedObjType && (
            <div className="flex items-center gap-2.5 ml-2.5 pl-2.5 border-l border-[#3f3f3f] h-6 flex-shrink-0">
              <div className="flex items-center gap-1">
                <Blend size={12} className="text-gray-400" />
                <select
                  value={selectedObjProps.globalCompositeOperation || 'source-over'}
                  onChange={(e) => onUpdateProp('globalCompositeOperation', e.target.value)}
                  className="bg-[#1a1a1a] border border-[#3f3f3f] text-white px-1.5 py-0.5 rounded text-[10px] outline-none w-20"
                >
                  <option value="source-over">Normal</option>
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                  <option value="lighten">Lighten</option>
                  <option value="darken">Darken</option>
                </select>
              </div>

              {/* Transform Operations */}
              <div className="flex items-center bg-[#1a1a1a] border border-[#3f3f3f] rounded px-0.5">
                <button
                  className="p-[3px] hover:bg-[#3f3f3f] text-[#aaa] hover:text-white rounded"
                  onClick={onFlipX}
                  title="좌우 반전"
                >
                  <FlipHorizontal size={12} />
                </button>
                <button
                  className="p-[3px] hover:bg-[#3f3f3f] text-[#aaa] hover:text-white rounded"
                  onClick={onFlipY}
                  title="상하 반전"
                >
                  <FlipVertical size={12} />
                </button>
                <button
                  className="p-[3px] hover:bg-[#3f3f3f] text-[#aaa] hover:text-white rounded"
                  onClick={onRotate90}
                  title="90도 회전"
                >
                  <RotateCw size={12} />
                </button>
              </div>

              {/* Filter Floating trigger */}
              {selectedObjType === 'image' && (
                <button
                  id="btn-filter"
                  className="flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer bg-[#333] hover:bg-[#3f3f3f] text-white transition-all duration-75 text-[10px] font-bold border border-[#444]"
                  onClick={onToggleFilterPanel}
                  title="이미지 필터 패널"
                >
                  <SlidersHorizontal size={11} /> 필터
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Undo/Redo/Panel Controls on Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-[#1a1a1a] bg-[#1a1a1a] rounded p-[2px] border border-[#3f3f3f] gap-[1px]">
          <button
            className="p-[3px] text-[#aaa] hover:text-white hover:bg-[#3f3f3f] rounded"
            onClick={onUndo}
            title="Undo"
          >
            <Undo2 size={13} />
          </button>
          <button
            className="p-[3px] text-[#aaa] hover:text-white hover:bg-[#3f3f3f] rounded"
            onClick={onRedo}
            title="Redo"
          >
            <Redo2 size={13} />
          </button>
        </div>

        <button
          className="bg-[#333] hover:bg-[#444] text-[#ccc] px-1.5 py-1 rounded text-[11px] border border-[#555] flex items-center gap-1 cursor-pointer"
          onClick={onToggleRightPanel}
          title="패널 접기/펼치기"
        >
          {isRightPanelOpen ? (
            <PanelRightClose size={13} />
          ) : (
            <PanelRightOpen size={13} />
          )}
        </button>
      </div>
    </div>
  );
}
