import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Key,
  Maximize,
  Layout,
  Smile,
  QrCode,
  Download,
  SlidersHorizontal,
  Flame,
  FileText
} from 'lucide-react';
import { ChatHistoryItem } from '../types';

interface ModalsProps {
  activeModal: string | null;
  onClose: () => void;
  
  // New File callback
  onNewFile: (width: number, height: number, bgColor: string) => void;
  // Canvas / Image Resizing Callbacks
  canvasWidth: number;
  canvasHeight: number;
  onApplyImageSize: (w: number, h: number) => void;
  onApplyCanvasSize: (w: number, h: number, anchorX: number, anchorY: number) => void;
  // Fill & Stroke Callbacks
  selectedColorConfig: { fill: string; stroke: string; strokeWidth: number };
  onApplyFillStroke: (config: { fill: string; stroke: string; strokeWidth: number }) => void;
  // Meme Callback
  onGenerateMeme: (top: string, bottom: string, color: string) => void;
  // QR Callback
  onAddQRCode: (dataUrl: string) => void;
  // Export Callback
  onExportImage: (format: 'png' | 'jpeg' | 'webp', quality: number) => void;
  // AI Actions Callbacks
  onGenerateSticker: (prompt: string) => void;
  onGenerateStyle: (prompt: string) => void;
  aiTutorChat: ChatHistoryItem[];
  onSendTutorChat: (text: string) => void;
  analysisReport: { caption: string; mood: string; loading: boolean } | null;
  // API Key callbacks
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  // PDF Selection Callbacks
  pdfPagesData: string[]; // Base64 png thumbnails of PDF pages
  onSelectPdfPage: (pageNum: number) => void;
}

export default function Modals({
  activeModal,
  onClose,
  onNewFile,
  canvasWidth,
  canvasHeight,
  onApplyImageSize,
  onApplyCanvasSize,
  selectedColorConfig,
  onApplyFillStroke,
  onGenerateMeme,
  onAddQRCode,
  onExportImage,
  onGenerateSticker,
  onGenerateStyle,
  aiTutorChat,
  onSendTutorChat,
  analysisReport,
  apiKey,
  onSaveApiKey,
  pdfPagesData,
  onSelectPdfPage,
}: ModalsProps) {
  if (!activeModal) return null;

  // 1. New File States
  const [newW, setNewW] = useState(1366);
  const [newH, setNewH] = useState(768);
  const [newBg, setNewBg] = useState('transparent');

  // 2. Image Size States
  const [imgW, setImgW] = useState(canvasWidth);
  const [imgH, setImgH] = useState(canvasHeight);
  const [imgConstrain, setImgConstrain] = useState(true);

  useEffect(() => {
    setImgW(canvasWidth);
    setImgH(canvasHeight);
  }, [canvasWidth, canvasHeight]);

  const handleImgResizeWChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setImgW(val);
    if (imgConstrain && canvasWidth > 0) {
      const aspect = canvasWidth / canvasHeight;
      setImgH(Math.round(val / aspect));
    }
  };

  const handleImgResizeHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setImgH(val);
    if (imgConstrain && canvasHeight > 0) {
      const aspect = canvasWidth / canvasHeight;
      setImgW(Math.round(val * aspect));
    }
  };

  // 3. Canvas Size States
  const [cvsW, setCvsW] = useState(canvasWidth);
  const [cvsH, setCvsH] = useState(canvasHeight);
  const [anchorX, setAnchorX] = useState(0.5);
  const [anchorY, setAnchorY] = useState(0.5);

  useEffect(() => {
    setCvsW(canvasWidth);
    setCvsH(canvasHeight);
  }, [canvasWidth, canvasHeight]);

  // 4. Fill Stroke States
  const [modalFill, setModalFill] = useState(selectedColorConfig.fill);
  const [modalStroke, setModalStroke] = useState(selectedColorConfig.stroke);
  const [modalStrokeWidth, setModalStrokeWidth] = useState(selectedColorConfig.strokeWidth);
  const [fillTransparent, setFillTransparent] = useState(selectedColorConfig.fill === 'transparent');
  const [strokeTransparent, setStrokeTransparent] = useState(selectedColorConfig.stroke === 'transparent');

  useEffect(() => {
    setModalFill(selectedColorConfig.fill === 'transparent' ? '#ffffff' : selectedColorConfig.fill);
    setFillTransparent(selectedColorConfig.fill === 'transparent');
    setModalStroke(selectedColorConfig.stroke === 'transparent' ? '#000000' : selectedColorConfig.stroke);
    setStrokeTransparent(selectedColorConfig.stroke === 'transparent');
    setModalStrokeWidth(selectedColorConfig.strokeWidth);
  }, [selectedColorConfig]);

  // 5. Meme States
  const [memeTop, setMemeTop] = useState('');
  const [memeBottom, setMemeBottom] = useState('');
  const [memeColor, setMemeColor] = useState('#ffffff');

  // 6. QR States
  const [qrText, setQrText] = useState('https://ai.studio/build');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeModal === 'qr-generator' && qrRef.current) {
      qrRef.current.innerHTML = '';
      if ((window as any).QRCode) {
        new (window as any).QRCode(qrRef.current, {
          text: qrText,
          width: 128,
          height: 128,
          colorDark: '#000000',
          colorLight: '#ffffff',
        });
      }
    }
  }, [activeModal, qrText]);

  const handleAddQRToCanvasClick = () => {
    const qrImg = qrRef.current?.querySelector('img');
    if (qrImg && qrImg.src) {
      onAddQRCode(qrImg.src);
      onClose();
    } else {
      // Find canvas as fallback
      const qrCanvas = qrRef.current?.querySelector('canvas');
      if (qrCanvas) {
        onAddQRCode(qrCanvas.toDataURL());
        onClose();
      } else {
        alert('QR code has not generated correctly yet.');
      }
    }
  };

  // 7. Export States
  const [expFormat, setExpFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [expQuality, setExpQuality] = useState(1.0);

  // 8. AI Sticker Prompt
  const [stickerPrompt, setStickerPrompt] = useState('');

  // 9. AI Style Prompt
  const [stylePrompt, setStylePrompt] = useState('');

  // 10. Chat States
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiTutorChat]);

  // 11. API Key States
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);
  useEffect(() => {
    setApiKeyInput(apiKey);
  }, [apiKey]);

  // General helper styling
  const modalOverlayStyle = 'fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm';
  const modalBoxStyle = 'bg-[#1e1e1e] rounded-lg border border-[#333] p-5 shadow-2xl relative w-[300px] text-[11px] text-[#ccc]';

  return (
    <>
      {/* 1. New File Modal */}
      {activeModal === 'new-file' && (
        <div className={modalOverlayStyle}>
          <div className={`${modalBoxStyle} w-[280px]`}>
            <h3 className="text-xs text-white mb-3 font-bold border-b border-[#333] pb-2">
              새 파일 만들기 (새 탭)
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">너비 (px)</label>
                <input
                  type="number"
                  value={newW}
                  onChange={(e) => setNewW(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#121212] text-white text-[11px] p-1.5 border border-[#333] rounded outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">높이 (px)</label>
                <input
                  type="number"
                  value={newH}
                  onChange={(e) => setNewH(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#121212] text-white text-[11px] p-1.5 border border-[#333] rounded outline-none"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[10px] text-gray-400 block mb-1">배경색</label>
              <select
                value={newBg}
                onChange={(e) => setNewBg(e.target.value)}
                className="w-full bg-[#121212] text-white text-[11px] p-1.5 border border-[#333] rounded outline-none"
              >
                <option value="transparent">투명 (Transparent)</option>
                <option value="#ffffff">흰색 (White)</option>
                <option value="#000000">검은색 (Black)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-white px-2 cursor-pointer">
                취소
              </button>
              <button
                onClick={() => {
                  onNewFile(newW, newH, newBg);
                  onClose();
                }}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Image Size Modal */}
      {activeModal === 'image-size' && (
        <div className={modalOverlayStyle}>
          <div className={`${modalBoxStyle} w-[280px]`}>
            <h3 className="text-xs text-white mb-3 font-bold border-b border-[#333] pb-2 flex items-center gap-2">
              <Maximize size={14} className="text-blue-400" /> 이미지 크기
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">너비 (Width)</label>
                <input
                  type="number"
                  value={imgW}
                  onChange={handleImgResizeWChange}
                  className="w-full bg-[#121212] text-white text-[11px] p-1.5 border border-[#333] rounded outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">높이 (Height)</label>
                <input
                  type="number"
                  value={imgH}
                  onChange={handleImgResizeHChange}
                  className="w-full bg-[#121212] text-white text-[11px] p-1.5 border border-[#333] rounded outline-none"
                />
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="img-constrain"
                checked={imgConstrain}
                onChange={(e) => setImgConstrain(e.target.checked)}
                className="accent-blue-500 cursor-pointer w-3 h-3"
              />
              <label htmlFor="img-constrain" className="text-[10px] text-gray-300 cursor-pointer select-none">
                비율 유지 (Constrain)
              </label>
            </div>
            <p className="text-[9px] text-gray-500 mb-3">* 이미지 내용물도 함께 확대/축소됩니다.</p>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-white px-2 cursor-pointer">
                취소
              </button>
              <button
                onClick={() => {
                  onApplyImageSize(imgW, imgH);
                  onClose();
                }}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Canvas Size Modal */}
      {activeModal === 'canvas-size' && (
        <div className={modalOverlayStyle}>
          <div className={`${modalBoxStyle} w-[280px]`}>
            <h3 className="text-xs text-white mb-3 font-bold border-b border-[#333] pb-2 flex items-center gap-2">
              <Layout size={14} className="text-green-400" /> 캔버스 크기
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">너비 (Width)</label>
                <input
                  type="number"
                  value={cvsW}
                  onChange={(e) => setCvsW(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#121212] text-white text-[11px] p-1.5 border border-[#333] rounded outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">높이 (Height)</label>
                <input
                  type="number"
                  value={cvsH}
                  onChange={(e) => setCvsH(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#121212] text-white text-[11px] p-1.5 border border-[#333] rounded outline-none"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[10px] text-gray-400 block mb-2 text-center">기준점 (Anchor)</label>
              <div className="grid grid-cols-3 gap-1 w-20 mx-auto">
                {[
                  [0, 0], [0.5, 0], [1, 0],
                  [0, 0.5], [0.5, 0.5], [1, 0.5],
                  [0, 1], [0.5, 1], [1, 1],
                ].map(([x, y], idx) => {
                  const isActive = anchorX === x && anchorY === y;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setAnchorX(x);
                        setAnchorY(y);
                      }}
                      className={`w-6 h-6 border flex items-center justify-center cursor-pointer transition-all ${
                        isActive ? 'bg-[#0078d7] border-white' : 'bg-[#333] border-[#555] hover:bg-[#444]'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-gray-500'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-white px-2 cursor-pointer">
                취소
              </button>
              <button
                onClick={() => {
                  onApplyCanvasSize(cvsW, cvsH, anchorX, anchorY);
                  onClose();
                }}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Fill & Stroke Modal */}
      {activeModal === 'fill-stroke' && (
        <div className={modalOverlayStyle}>
          <div className={`${modalBoxStyle} w-[280px]`}>
            <h3 className="text-xs text-white mb-3 font-bold border-b border-[#333] pb-2 flex gap-2">
              <SlidersHorizontal size={14} className="text-pink-400" /> 칠/획 설정 (Fill & Stroke)
            </h3>
            <div className="mb-3">
              <label className="text-[10px] text-gray-400 block mb-1">칠하기 (Fill)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={modalFill}
                  disabled={fillTransparent}
                  onChange={(e) => setModalFill(e.target.value)}
                  className="w-8 h-8 rounded border-none bg-transparent cursor-pointer disabled:opacity-30"
                />
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fillTransparent}
                    onChange={(e) => setFillTransparent(e.target.checked)}
                    className="cursor-pointer w-3 h-3"
                  />
                  <span className="text-[10px] text-gray-300 select-none">투명 (None)</span>
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[10px] text-gray-400 block mb-1">선 색상 (Stroke Color)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={modalStroke}
                  disabled={strokeTransparent}
                  onChange={(e) => setModalStroke(e.target.value)}
                  className="w-8 h-8 rounded border-none bg-transparent cursor-pointer disabled:opacity-30"
                />
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strokeTransparent}
                    onChange={(e) => setStrokeTransparent(e.target.checked)}
                    className="cursor-pointer w-3 h-3"
                  />
                  <span className="text-[10px] text-gray-300 select-none">없음 (None)</span>
                </label>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between">
                <label className="text-[10px] text-gray-400 block mb-1">선 두께 (Width)</label>
                <span className="text-[10px] text-gray-400 font-mono">{modalStrokeWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                disabled={strokeTransparent}
                value={modalStrokeWidth}
                onChange={(e) => setModalStrokeWidth(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-600 appearance-none rounded disabled:opacity-30"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-white px-2 cursor-pointer">
                취소
              </button>
              <button
                onClick={() => {
                  onApplyFillStroke({
                    fill: fillTransparent ? 'transparent' : modalFill,
                    stroke: strokeTransparent ? 'transparent' : modalStroke,
                    strokeWidth: strokeTransparent ? 0 : modalStrokeWidth,
                  });
                  onClose();
                }}
                className="text-[10px] bg-pink-600 hover:bg-pink-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Meme Generator Modal */}
      {activeModal === 'meme-generator' && (
        <div className={modalOverlayStyle}>
          <div className={modalBoxStyle}>
            <h3 className="text-xs text-white mb-3 font-bold border-b border-[#333] pb-2 flex gap-2">
              <Smile size={14} className="text-yellow-400" /> Meme 생성기
            </h3>
            <p className="text-[10px] text-gray-400 mb-2">선택한 이미지에 텍스트를 위/아래 추가합니다.</p>
            <div className="space-y-2 mb-4">
              <input
                type="text"
                value={memeTop}
                onChange={(e) => setMemeTop(e.target.value)}
                className="w-full bg-[#121212] text-white text-[11px] p-2 border border-[#333] rounded outline-none"
                placeholder="상단 텍스트 (Top Text)"
              />
              <input
                type="text"
                value={memeBottom}
                onChange={(e) => setMemeBottom(e.target.value)}
                className="w-full bg-[#121212] text-white text-[11px] p-2 border border-[#333] rounded outline-none"
                placeholder="하단 텍스트 (Bottom Text)"
              />
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={memeColor}
                  onChange={(e) => setMemeColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                />
                <span className="text-[10px] text-gray-400">글자 색상 (Text Color)</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-white px-2 cursor-pointer">
                취소
              </button>
              <button
                onClick={() => {
                  onGenerateMeme(memeTop, memeBottom, memeColor);
                  onClose();
                }}
                className="text-[10px] bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. QR Code Generator Modal */}
      {activeModal === 'qr-generator' && (
        <div className={modalOverlayStyle}>
          <div className={`${modalBoxStyle} w-[280px]`}>
            <h3 className="text-xs text-white mb-3 font-bold border-b border-[#333] pb-2 flex gap-2">
              <QrCode size={14} className="text-white" /> QR Code 생성
            </h3>
            <input
              type="text"
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              className="w-full bg-[#121212] text-white text-[11px] p-2 border border-[#333] rounded mb-3 outline-none"
              placeholder="URL 또는 텍스트 입력..."
            />
            {/* Target rendering canvas of standard QRCode CDN script inside */}
            <div
              ref={qrRef}
              id="qr-preview"
              className="bg-white w-32 h-32 mx-auto mb-3 flex items-center justify-center p-1.5 rounded"
            />
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-white px-2 cursor-pointer">
                취소
              </button>
              <button
                onClick={handleAddQRToCanvasClick}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Export Images Modal */}
      {activeModal === 'export-modal' && (
        <div className={modalOverlayStyle}>
          <div className={`${modalBoxStyle} w-[280px]`}>
            <h3 className="text-xs text-white mb-3 font-bold border-b border-[#333] pb-2 flex gap-2">
              <Download size={14} className="text-blue-400" /> 이미지 내보내기
            </h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">포맷 (Format)</label>
                <select
                  value={expFormat}
                  onChange={(e) => setExpFormat(e.target.value as any)}
                  className="w-full bg-[#121212] text-white text-[11px] p-1.5 border border-[#333] rounded outline-none"
                >
                  <option value="png">PNG (투명도 유지)</option>
                  <option value="jpeg">JPG (압축)</option>
                  <option value="webp">WEBP (웹 최적화)</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="text-[10px] text-gray-400 block mb-1">품질 (Quality)</label>
                  <span className="text-[10px] text-gray-400 font-mono">{expQuality}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={expQuality}
                  onChange={(e) => setExpQuality(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-600 appearance-none rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-white px-2 cursor-pointer">
                취소
              </button>
              <button
                onClick={() => {
                  onExportImage(expFormat, expQuality);
                  onClose();
                }}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer"
              >
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Sticker AI modal */}
      {activeModal === 'sticker' && (
        <div className={modalOverlayStyle}>
          <div className={`${modalBoxStyle} w-[280px]`}>
            <h3 className="text-xs text-white mb-2 font-bold flex items-center gap-1">
              AI Sticker (Imagen 3) ✨
            </h3>
            <textarea
              value={stickerPrompt}
              onChange={(e) => setStickerPrompt(e.target.value)}
              className="w-full bg-[#121212] text-[11px] text-white p-2 border border-[#333] h-16 mb-2 rounded outline-none resize-none"
              placeholder="생성할 스티커 설명 (예: 귀여운 고양이 로고)"
            />
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-white px-2 cursor-pointer">
                취소
              </button>
              <button
                onClick={() => {
                  onGenerateSticker(stickerPrompt);
                  onClose();
                  setStickerPrompt('');
                }}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded cursor-pointer font-bold"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Style AI modal */}
      {activeModal === 'style' && (
        <div className={modalOverlayStyle}>
          <div className={`${modalBoxStyle} w-[280px]`}>
            <h3 className="text-xs text-white mb-2 font-bold flex items-center gap-1">
              AI Style / Edit ✨
            </h3>
            <textarea
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              className="w-full bg-[#121212] text-[11px] text-white p-2 border border-[#333] h-16 mb-2 rounded outline-none resize-none"
              placeholder="변경할 스타일이나 효과 설명..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-white px-2 cursor-pointer">
                취소
              </button>
              <button
                onClick={() => {
                  onGenerateStyle(stylePrompt);
                  onClose();
                  setStylePrompt('');
                }}
                className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded cursor-pointer font-bold"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Ask AI Tutor chat modal */}
      {activeModal === 'ask-tutor' && (
        <div className={modalOverlayStyle}>
          <div className="bg-[#1e1e1e] w-[300px] h-[400px] rounded-lg border border-[#333] flex flex-col font-sans select-none overflow-hidden relative shadow-2xl">
            <div className="p-3 border-b border-[#333] flex justify-between items-center bg-[#2b2b2b]">
              <span className="text-xs text-white font-bold flex items-center gap-1.5">
                Ask AI Tutor ✨
              </span>
              <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={14} />
              </button>
            </div>
            
            {/* Chat Body messages */}
            <div className="flex-1 p-3 text-[10px] overflow-y-auto space-y-2.5 bg-[#121212] flex flex-col">
              {aiTutorChat.length === 0 ? (
                <div className="text-gray-500 text-center my-auto">
                  궁금한 점을 아래 입력후 AI 튜터에게 물어보세요!
                </div>
              ) : (
                aiTutorChat.map((msg) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${isAi ? 'self-start items-start' : 'self-end items-end'}`}
                    >
                      <div
                        className={`px-2.5 py-1.5 rounded-lg text-[10.5px] leading-relaxed break-words ${
                          isAi ? 'bg-[#333] text-gray-200' : 'bg-blue-600 text-white'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Form submit */}
            <div className="p-2 border-t border-[#333] bg-[#222]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInput.trim()) {
                    onSendTutorChat(chatInput);
                    setChatInput('');
                  }
                }}
                className="flex gap-1"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#333] rounded text-[10px] px-2.5 py-1.5 text-white outline-none focus:border-[#4facfe]"
                  placeholder="Ask a question..."
                />
                <button
                  type="submit"
                  className="bg-[#4facfe] text-black px-3.5 py-1.5 rounded text-[10px] font-bold cursor-pointer hover:bg-cyan-400 active:scale-95 transition-all"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 11. Analysis Report Modal */}
      {activeModal === 'smart-analysis' && analysisReport && (
        <div className={modalOverlayStyle}>
          <div className="bg-[#1e1e1e] w-[300px] max-h-[70vh] rounded-lg border border-[#333] flex flex-col overflow-hidden relative shadow-2xl select-none">
            <div className="p-3 border-b border-[#333] flex justify-between items-center bg-[#2b2b2b]">
              <span className="text-xs text-white font-bold flex items-center gap-1.5">
                AI Analysis Report ✨
              </span>
              <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={14} />
              </button>
            </div>
            
            <div className="p-3 text-[11px] overflow-y-auto space-y-3 bg-[#121212]">
              {analysisReport.loading ? (
                <div className="my-6 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                  <span>Analyzing Image...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-[#252525] p-2.5 rounded border border-[#333]">
                    <h4 className="text-blue-400 font-bold mb-1">Caption / 이미지 묘사</h4>
                    <p className="text-gray-300 leading-normal">{analysisReport.caption}</p>
                  </div>
                  <div className="bg-[#252525] p-2.5 rounded border border-[#333]">
                    <h4 className="text-purple-400 font-bold mb-1">Mood & Style / 무드 분석</h4>
                    <p className="text-gray-300 leading-normal">{analysisReport.mood}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 12. API Key settings Modal */}
      {activeModal === 'api-key-settings' && (
        <div className={modalOverlayStyle}>
          <div className={`${modalBoxStyle} w-[320px]`}>
            <h3 className="text-sm text-white mb-3 font-bold flex items-center gap-2">
              <Key size={16} className="text-yellow-400" /> API Key 설정
            </h3>
            <p className="text-[11px] text-gray-400 mb-3 leading-normal">
              이 애플리케이션은 서버 측에서 자동으로 API 키를 사용하도록 고안되었습니다. <br />
              필요한 경우, 본인의 개인 Google Gemini API 키를 브라우저에 명시적으로 추가 기입할 수도 있습니다 (키는 로컬 스토리지에만 저장됩니다).
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-[#121212] text-white text-[12px] p-2 border border-[#333] rounded mb-4 focus:border-blue-500 outline-none"
              placeholder="Enter Gemini API Key (Optional)..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-white px-3 py-1.5 cursor-pointer">
                취소
              </button>
              <button
                onClick={() => {
                  onSaveApiKey(apiKeyInput);
                  onClose();
                }}
                className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer"
              >
                저장
              </button>
            </div>
            <div className="mt-4 pt-2.5 border-t border-[#333] text-center">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-400 hover:underline inline-block"
              >
                API 키 발급받기 &rarr;
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 13. PDF page Selection Modal (Multipage support) */}
      {activeModal === 'pdf-import' && pdfPagesData.length > 0 && (
        <div className={modalOverlayStyle}>
          <div className="bg-[#1e1e1e] w-[600px] max-h-[80vh] rounded-lg border border-[#333] p-4 shadow-2xl flex flex-col text-[11px] select-none">
            <h3 className="text-xs text-white mb-3 font-bold border-b border-[#333] pb-2 flex gap-2 items-center">
              <FileText size={14} className="text-red-400" /> PDF 페이지 선택 (Select Page)
            </h3>
            
            {/* Grid display of thumbnail images fetched from pdf state processing */}
            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 p-2.5 bg-[#121212] rounded min-h-[200px]">
              {pdfPagesData.map((dataUrl, index) => {
                const pageNum = index + 1;
                return (
                  <div
                    key={index}
                    onClick={() => {
                      onSelectPdfPage(pageNum);
                      onClose();
                    }}
                    className="relative cursor-pointer border-2 border-transparent hover:border-[#0078d7] hover:scale-[1.02] transition-all bg-[#262626] rounded-md overflow-hidden flex flex-col justify-between"
                  >
                    <img
                      src={dataUrl}
                      alt={`Page ${pageNum}`}
                      className="w-full object-contain pointer-events-none"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {pageNum}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-3.5">
              <button
                onClick={onClose}
                className="text-[10px] text-gray-400 hover:text-white px-2.5 py-1.5 cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
