export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  json: string | null;
  history: HistoryItem[];
  historyStep: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface HistoryItem {
  json: string;
  name: string;
  time: string;
}

export interface ChatHistoryItem {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export type ToolMode =
  | 'select'
  | 'hand'
  | 'brush'
  | 'dodge'
  | 'ai-draw'
  | 'spot-healing'
  | 'line-draw'
  | 'marquee-rect'
  | 'marquee-ellipse'
  | 'marquee-lasso'
  | 'marquee-polygon'
  | 'marquee-wand';

export interface ShapeIconConfig {
  type: string;
  title: string;
  emoji: string;
}
