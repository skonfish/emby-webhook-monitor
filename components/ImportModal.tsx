import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (json: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!input.trim()) return;
    try {
      JSON.parse(input); // Validate JSON
      onImport(input);
      setInput('');
      setError(null);
      onClose();
    } catch (e) {
      setError('无效的 JSON 格式，请检查复制的内容。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">手动录入 Webhook JSON</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
          <p className="text-slate-400 text-sm mb-4">
            将 Emby 发送的 Webhook JSON 载荷粘贴到下方。系统会自动解析 "播放-开始" 事件并提取所需信息。
          </p>
          <textarea
            className="w-full h-64 bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder='{ "Event": "playback.start", "User": { ... } }'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleImport}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors flex items-center space-x-2"
          >
            <Check size={18} />
            <span>解析并添加</span>
          </button>
        </div>
      </div>
    </div>
  );
};
