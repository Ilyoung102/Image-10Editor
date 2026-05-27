import React from 'react';
import {
  History,
  PlusSquare,
  Trash2,
  Eye,
  EyeOff,
  Type,
  Image as ImageIcon,
  FolderTree,
  PenTool,
  Box,
  ChevronDown,
  Sparkles,
  Award,
  LucideIcon
} from 'lucide-react';
import { HistoryItem } from '../types';

interface RightPanelProps {
  layers: any[]; // Fabric.js objects
  activeLayer: any | null;
  history: HistoryItem[];
  historyStep: number;
  isHistoryOpen: boolean;
  opacity: number;
  
  onToggleHistory: () => void;
  onAddLayerClick: () => void;
  onDeleteLayerClick: () => void;
  onUpdateOpacity: (val: number) => void;
  onPickColor: (hex: string) => void;
  onSelectLayer: (layer: any) => void;
  onToggleLayerVisibility: (index: number) => void;
  onDeleteLayerIndex: (index: number) => void;
  onReorderLayers: (dragIdx: number, dropIdx: number) => void;
  onAddShapeIcon: (emoji: string) => void;
  onLoadHistoryStep: (step: number) => void;
  onLayerContextMenu: (e: React.MouseEvent, layer: any, index: number) => void;
}

export default function RightPanel({
  layers,
  activeLayer,
  history,
  historyStep,
  isHistoryOpen,
  opacity,
  onToggleHistory,
  onAddLayerClick,
  onDeleteLayerClick,
  onUpdateOpacity,
  onPickColor,
  onSelectLayer,
  onToggleLayerVisibility,
  onDeleteLayerIndex,
  onReorderLayers,
  onAddShapeIcon,
  onLoadHistoryStep,
  onLayerContextMenu,
}: RightPanelProps) {
  // Drag-and-drop state
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const colors = [
    { hex: '#ffffff', title: 'White', bg: 'bg-white' },
    { hex: '#9ca3af', title: 'Gray', bg: 'bg-gray-400' },
    { hex: '#000000', title: 'Black', bg: 'bg-black' },
    { hex: '#ef4444', title: 'Red', bg: 'bg-red-500' },
    { hex: '#f97316', title: 'Orange', bg: 'bg-orange-500' },
    { hex: '#facc15', title: 'Yellow', bg: 'bg-yellow-400' },
    { hex: '#22c55e', title: 'Green', bg: 'bg-green-500' },
    { hex: '#22d3ee', title: 'Cyan', bg: 'bg-cyan-400' },
    { hex: '#3b82f6', title: 'Blue', bg: 'bg-blue-500' },
    { hex: '#a855f7', title: 'Purple', bg: 'bg-purple-500' },
    { hex: '#ec4899', title: 'Pink', bg: 'bg-pink-500' },
    { hex: '#a16207', title: 'Brown', bg: 'bg-[#a16207]' },
  ];

  const emojis = [
    { type: 'heart', title: '하트', emoji: '❤️' },
    { type: 'diamond', title: '다이아몬드', emoji: '♦️' },
    { type: 'spade', title: '스페이드', emoji: '♠️' },
    { type: 'club', title: '클로버', emoji: '♣️' },
    { type: 'star', title: '별', emoji: '⭐' },
    { type: 'moon', title: '달', emoji: '🌙' },
    { type: 'sun', title: '태양', emoji: '☀️' },
    { type: 'cloud', title: '구름', emoji: '☁️' },
    { type: 'lightning', title: '번개', emoji: '⚡' },
    { type: 'fire', title: '불꽃', emoji: '🔥' },
    { type: 'check', title: '체크', emoji: '✔️' },
    { type: 'cross', title: '엑스', emoji: '❌' },
    { type: 'speech', title: '말풍선', emoji: '💬' },
    { type: 'thought', title: '생각풍선', emoji: '💭' },
    { type: 'arrow-right', title: '화살표', emoji: '➡️' },
    { type: 'arrow-up', title: '위 화살표', emoji: '⬆️' },
    { type: 'music', title: '음표', emoji: '🎵' },
    { type: 'sparkle', title: '반짝', emoji: '✨' },
    { type: 'crown', title: '왕관', emoji: '👑' },
    { type: 'ribbon', title: '리본', emoji: '🎀' },
    { type: 'gift', title: '선물', emoji: '🎁' },
    { type: 'balloon', title: '풍선', emoji: '🎈' },
    { type: 'confetti', title: '폭죽', emoji: '🎊' },
    { type: 'trophy', title: '트로피', emoji: '🏆' },
    { type: 'medal', title: '메달', emoji: '🏅' },
    { type: 'target', title: '과녁', emoji: '🎯' },
    { type: 'bell', title: '종', emoji: '🔔' },
    { type: 'lock', title: '자물쇠', emoji: '🔒' },
    { type: 'key', title: '열쇠', emoji: '🔑' },
    { type: 'bulb', title: '전구', emoji: '💡' },
    { type: 'bomb', title: '폭탄', emoji: '💣' },
    { type: 'gem', title: '보석', emoji: '💎' },
    { type: 'money', title: '돈', emoji: '💰' },
    { type: 'email', title: '이메일', emoji: '📧' },
    { type: 'phone', title: '전화', emoji: '📱' },
    { type: 'camera', title: '카메라', emoji: '📷' },
    { type: 'video', title: '비디오', emoji: '🎬' },
    { type: 'mic', title: '마이크', emoji: '🎤' },
    { type: 'headphone', title: '헤드폰', emoji: '🎧' },
    { type: 'game', title: '게임', emoji: '🎮' },
    { type: 'dice', title: '주사위', emoji: '🎲' },
    { type: 'puzzle', title: '퍼즐', emoji: '🧩' },
    { type: 'palette', title: '팔레트', emoji: '🎨' },
    { type: 'pencil', title: '연필', emoji: '✏️' },
    { type: 'scissors', title: '가위', emoji: '✂️' },
    { type: 'pin', title: '핀', emoji: '📌' },
    { type: 'clip', title: '클립', emoji: '📎' },
    { type: 'folder', title: '폴더', emoji: '📁' },
    { type: 'trash', title: '휴지통', emoji: '🗑️' },
    { type: 'hourglass', title: '모래시계', emoji: '⏳' },
    { type: 'alarm', title: '알람', emoji: '⏰' },
    { type: 'calendar', title: '달력', emoji: '📅' },
    { type: 'chart', title: '차트', emoji: '📊' },
    { type: 'rocket', title: '로켓', emoji: '🚀' },
    { type: 'plane', title: '비행기', emoji: '✈️' },
    { type: 'car', title: '자동차', emoji: '🚗' },
    { type: 'home', title: '집', emoji: '🏠' },
    { type: 'tree', title: '나무', emoji: '🌲' },
    { type: 'flower', title: '꽃', emoji: '🌸' },
    { type: 'rainbow', title: '무지개', emoji: '🌈' },
  ];

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'i-text':
      case 'text':
        return <Type size={10} className="text-blue-400 mr-2" />;
      case 'image':
        return <ImageIcon size={10} className="text-green-400 mr-2" />;
      case 'group':
        return <FolderTree size={10} className="text-yellow-400 mr-2" />;
      case 'path':
        return <PenTool size={10} className="text-pink-400 mr-2" />;
      default:
        return <Box size={10} className="text-blue-300 mr-2" />;
    }
  };

  // Reorder layer indexes
  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIdx: number) => {
    if (dragIndex !== null && dragIndex !== dropIdx) {
      onReorderLayers(dragIndex, dropIdx);
    }
    setDragIndex(null);
  };

  return (
    <div className="w-[200px] bg-[#262626] border-l border-[#1f1f1f] flex flex-col z-30 select-none relative h-full">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between px-2.5 h-[35px] border-b border-[#1f1f1f] bg-[#2b2b2b]">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleHistory}
            className={`cursor-pointer ${isHistoryOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            title="작업 내역"
          >
            <History size={14} />
          </button>
          <span className="text-[11px] font-bold text-[#ccc] uppercase tracking-wider">
            Layers
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddLayerClick}
            className="hover:text-white text-gray-400 cursor-pointer"
            title="새 이미지 추가"
          >
            <PlusSquare size={12} />
          </button>
          <button
            onClick={onDeleteLayerClick}
            className="hover:text-white text-gray-400 cursor-pointer"
            title="선택 레이어 삭제"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* 2. Opacity Slider */}
      <div className="p-2 border-b border-[#333] flex items-center gap-2">
        <span className="text-[10px] text-gray-400">Opacity</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(e) => onUpdateOpacity(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-gray-600 appearance-none rounded cursor-pointer"
        />
        <span className="text-[10px] text-gray-300 w-8 text-right">
          {Math.round(opacity * 100)}%
        </span>
      </div>

      {/* 3. 12-Color Palette swatches */}
      <div className="flex gap-[6px] p-2 border-b border-[#1f1f1f] flex-wrap justify-between">
        {colors.map((c) => (
          <div
            key={c.hex}
            onClick={() => onPickColor(c.hex)}
            className={`w-[20px] h-[20px] rounded cursor-pointer border border-[#444] hover:scale-110 active:scale-95 hover:border-white transition-all duration-75 ${c.bg}`}
            title={c.title}
          />
        ))}
      </div>

      {/* 4. Layers List */}
      <div className="flex-1 overflow-y-auto relative min-h-[120px]">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-[10px] text-gray-600">
            No Layers
          </div>
        ) : (
          <div className="flex flex-col-reverse">
            {layers.map((layer, idx) => {
              // Safety filters check to ignore special nodes like painting path or selections
              if (layer.stroke === 'rgba(255, 0, 0, 0.5)' || layer.name === 'tempSelection') return null;

              const isSelected = activeLayer === layer;

              return (
                <div
                  key={layer.id || idx}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  onClick={() => onSelectLayer(layer)}
                  onContextMenu={(e) => onLayerContextMenu(e, layer, idx)}
                  className={`flex items-center px-2.5 py-1.5 border-b border-[#333] font-[11px] cursor-pointer text-[#ccc] transition-all hover:bg-[#333] ${
                    isSelected ? 'bg-[#404040] border-l-[3px] border-l-[#0078d7] text-white' : ''
                  }`}
                >
                  {/* Eye Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLayerVisibility(idx);
                    }}
                    className="p-1 text-gray-500 hover:text-white mr-1.5 cursor-pointer"
                  >
                    {layer.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                  </button>

                  {/* Icon + Label */}
                  {getLayerIcon(layer.type)}
                  <span className="flex-1 truncate text-[10px] text-gray-300">
                    {layer.type === 'i-text' ? 'text' : layer.type} {idx + 1}
                  </span>

                  {/* Trash delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayerIndex(idx);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 cursor-pointer ml-auto"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Secondary Panel: History Overlay */}
      {isHistoryOpen && (
        <div className="absolute top-[35px] left-0 w-full h-[calc(100%-35px)] bg-[#262626] z-40 border-t border-[#1f1f1f] flex flex-col">
          <div className="p-2 border-b border-[#333] text-[10px] font-bold text-gray-400 flex justify-between bg-[#1e1e1e]">
            <span>작업 기록</span>
            <button
              onClick={onToggleHistory}
              className="text-gray-600 hover:text-white cursor-pointer"
            >
              닫기
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {history.map((h, i) => (
              <div
                key={i}
                onClick={() => onLoadHistoryStep(i)}
                className={`p-2 font-[10px] text-gray-400 cursor-pointer border-b border-[#333] hover:bg-[#333] hover:text-white ${
                  i === historyStep ? 'text-[#4facfe] font-bold bg-[#333]' : ''
                }`}
              >
                {i + 1}. {h.name} <span className="text-[8px] text-gray-600">({h.time})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Symbol and Emoji list section */}
      <div className="border-t border-[#333] bg-[#222]">
        <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 tracking-wider">
          Shapes 🎴
        </div>
        <div className="p-1.5 grid grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto w-full">
          {emojis.map((emojiObj) => (
            <button
              key={emojiObj.type}
              onClick={() => onAddShapeIcon(emojiObj.type)}
              className="bg-[#2a2a2a] border border-[#333] hover:border-[#4facfe] hover:scale-110 active:scale-95 text-base p-1.5 rounded cursor-pointer transition-all duration-150 flex items-center justify-center"
              title={emojiObj.title}
            >
              {emojiObj.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
