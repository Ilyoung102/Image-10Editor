import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface TopMenuProps {
  onCommand: (cmd: string) => void;
}

export default function TopMenu({ onCommand }: TopMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus = [
    {
      title: '파일(F)',
      items: [
        { label: '새로 만들기', shortcut: 'Ctrl+N', action: 'new-file' },
        { label: '열기 (이미지/PDF)', shortcut: 'Ctrl+O', action: 'open-file' },
        { divider: true },
        { label: '프로젝트 저장 (.json)', action: 'save-project' },
        { label: '프로젝트 열기 (.json)', action: 'load-project' },
        { divider: true },
        { label: '내보내기 (고급)', shortcut: 'Ctrl+E', action: 'export-modal' },
        { label: '빠른 저장 (PNG)', shortcut: 'Ctrl+S', action: 'save-png-quick' },
      ],
    },
    {
      title: '편집(E)',
      items: [
        { label: '실행 취소', shortcut: 'Ctrl+Z', action: 'undo' },
        { label: '다시 실행', shortcut: 'Ctrl+Y', action: 'redo' },
        { divider: true },
        { label: '복사', shortcut: 'Ctrl+C', action: 'copy' },
        { label: '붙여넣기', shortcut: 'Ctrl+V', action: 'paste' },
        { divider: true },
        { label: '칠/획 설정 (Fill/Stroke)', action: 'fill-stroke' },
        { divider: true },
        { label: '삭제', shortcut: 'Del', action: 'delete' },
        { label: '그룹화 / 해제', shortcut: 'Ctrl+G', action: 'group' },
      ],
    },
    {
      title: '이미지(I)',
      items: [
        { label: '이미지 크기...', shortcut: 'Alt+Ctrl+I', action: 'image-size' },
        { label: '캔버스 크기...', shortcut: 'Alt+Ctrl+C', action: 'canvas-size' },
        { divider: true },
        { label: '자르기', shortcut: 'Ent/Dbl', action: 'start-crop' },
        { divider: true },
        { label: '배경 제거 (AI)', action: 'remove-bg' },
        { label: '스마트 분석 (AI)', action: 'smart-analysis' },
      ],
    },
    {
      title: '레이어(L)',
      items: [
        { label: '새 레이어 (이미지)', action: 'open-file' },
        { label: '레이어 복제', shortcut: 'Ctrl+C/V', action: 'duplicate' },
        { divider: true },
        { label: '레이어 병합', shortcut: 'Ctrl+E', action: 'merge-layers' },
        { label: '전체 레이어 병합', action: 'merge-all-layers' },
        { label: '전체 레이어 복사', shortcut: 'Ctrl+Shft+C', action: 'copy-merged' },
        { divider: true },
        { label: '맨 앞으로', shortcut: 'Ctrl+]', action: 'bring-front' },
        { label: '맨 뒤로', shortcut: 'Ctrl+[', action: 'send-back' },
      ],
    },
    {
      title: '도구(T)',
      items: [
        { label: '이모지 넣기 ✨', shortcut: 'Win+.', action: 'add-emoji' },
        { label: 'Meme 만들기', action: 'meme-generator' },
        { label: 'QR 코드 생성', action: 'qr-generator' },
      ],
    },
    {
      title: '보기(V)',
      items: [
        { label: '화면 맞추기 (100%)', shortcut: 'Ctrl+0', action: 'fit-screen' },
      ],
    },
    {
      title: '도움말(H)',
      items: [
        { label: 'API Key 설정', action: 'api-key-settings' },
        { label: 'AI 튜터 질문하기', action: 'ask-tutor' },
        { divider: true },
        { label: '정보', action: 'about' },
      ],
    },
  ];

  return (
    <div className="bg-[#2b2b2b] border-b border-[#1f1f1f] flex items-center px-2 h-[28px] text-[11px] select-none z-50">
      {menus.map((menu) => (
        <div
          key={menu.title}
          className="relative h-full flex items-center px-2.5 cursor-pointer text-[#aaa] hover:bg-[#3f3f3f] hover:text-white transition-colors duration-100"
          onMouseEnter={() => {
            if (activeMenu !== null) {
              setActiveMenu(menu.title);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenu(activeMenu === menu.title ? null : menu.title);
          }}
        >
          <span>{menu.title}</span>
          {activeMenu === menu.title && (
            <div className="absolute top-full left-0 bg-[#2b2b2b] border border-[#1f1f1f] min-width-[180px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] py-1 z-50 rounded-b flex flex-col w-[200px]">
              {menu.items.map((item, idx) => {
                if ('divider' in item) {
                  return <div key={idx} className="h-px bg-[#3f3f3f] my-1" />;
                }
                return (
                  <div
                    key={item.label}
                    className="px-3 py-1.5 flex justify-between items-center text-[#ccc] hover:bg-[#0078d7] hover:text-white transition-colors duration-70s cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(null);
                      onCommand(item.action);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[#888] text-[9px] font-mono pl-3">
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Close dropdown on background click */}
      {activeMenu !== null && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
