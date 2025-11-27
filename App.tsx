import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Users, 
  MapPin, 
  MonitorPlay, 
  Download, 
  Plus, 
  Terminal, 
  Search, 
  Trash2,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ImportModal } from './components/ImportModal';
import { 
  PlaybackRecord, 
  FilterState 
} from './types';
import { 
  parseEmbyPayload, 
  exportToCSV 
} from './utils';

const App: React.FC = () => {
  const [records, setRecords] = useState<PlaybackRecord[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    username: '',
    mediaTitle: '',
    startDate: '',
    endDate: ''
  });

  // 获取后端数据
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history');
      if (!res.ok) {
        throw new Error('API request failed');
      }
      const data = await res.json();
      setRecords(data);
      setServerError(false);
    } catch (error) {
      console.warn("无法连接到后端，当前可能处于纯前端预览模式或后端未启动。", error);
      setServerError(true);
      // 如果获取失败（比如在预览环境中），我们不覆盖现有的（可能是手动导入的）数据
      // 仅在初始加载时置空，或者什么都不做
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchRecords();
    
    // 简单的轮询，每30秒更新一次
    const interval = setInterval(fetchRecords, 30000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  // 筛选逻辑
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchUser = record.username.toLowerCase().includes(filters.username.toLowerCase());
      const matchTitle = record.mediaTitle.toLowerCase().includes(filters.mediaTitle.toLowerCase());
      
      let matchDate = true;
      const recordDate = new Date(record.timestamp);
      
      if (filters.startDate) {
        matchDate = matchDate && recordDate >= new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        matchDate = matchDate && recordDate <= end;
      }

      return matchUser && matchTitle && matchDate;
    });
  }, [records, filters]);

  // 统计逻辑
  const uniqueUsers = useMemo(() => new Set(filteredRecords.map(r => r.username)).size, [filteredRecords]);
  const uniqueTitles = useMemo(() => new Set(filteredRecords.map(r => r.mediaTitle)).size, [filteredRecords]);
  const activeClients = useMemo(() => {
     const clients = filteredRecords.map(r => r.client);
     return clients.length > 0 ? clients.sort((a,b) => clients.filter(v => v===a).length - clients.filter(v => v===b).length).pop() : "暂无";
  }, [filteredRecords]);

  const handleManualImport = async (json: string) => {
    const record = await parseEmbyPayload(json);
    if (record) {
      // 手动导入仅添加到前端状态，实际应该通过 POST 发送到后端，这里简化处理
      setRecords(prev => [record, ...prev]);
    } else {
      alert("无法解析该 JSON，或者该事件不是播放开始事件。");
    }
  };

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      alert("当前列表为空，无法导出。");
      return;
    }
    exportToCSV(filteredRecords);
  };

  const handleClear = async () => {
    if(confirm("确定要清空所有后端记录吗？")) {
      try {
        await fetch('/api/history', { method: 'DELETE' });
        setRecords([]);
      } catch (e) {
        // 如果后端不可用，仅清空前端
        setRecords([]);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="bg-emerald-600 p-2 rounded-lg">
                <Activity className="text-white" />
              </span>
              Emby 播放监控台
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-slate-400">
                实时接收并分析 Emby Webhook "播放-开始" 事件
              </p>
              {serverError && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/30">
                  <WifiOff size={12} />
                  后端未连接
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => fetchRecords()}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
              <span>刷新数据</span>
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 transition-all"
            >
              <Terminal size={18} />
              <span>手动/模拟测试</span>
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="当前记录总数" 
            value={filteredRecords.length} 
            icon={Activity} 
            colorClass="text-blue-400" 
          />
          <StatsCard 
            title="独立用户" 
            value={uniqueUsers} 
            icon={Users} 
            colorClass="text-emerald-400" 
          />
          <StatsCard 
            title="播放影片数" 
            value={uniqueTitles} 
            icon={MonitorPlay} 
            colorClass="text-purple-400" 
          />
          <StatsCard 
            title="主要播放客户端" 
            value={activeClients || "N/A"} 
            icon={MapPin} 
            colorClass="text-orange-400" 
          />
        </div>

        {/* Main Content Area */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
          
          {/* Toolbar & Filters */}
          <div className="p-6 border-b border-slate-700 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-semibold text-white">播放记录明细</h2>
              <div className="flex gap-2">
                 <button 
                  onClick={handleClear}
                  className="flex items-center space-x-2 text-slate-400 hover:text-red-400 px-3 py-2 transition-colors"
                >
                  <Trash2 size={18} />
                  <span className="hidden sm:inline">清空列表</span>
                </button>
                <button 
                  onClick={handleExport}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Download size={18} />
                  <span>导出 CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="搜索用户名..." 
                  value={filters.username}
                  onChange={(e) => setFilters(prev => ({...prev, username: e.target.value}))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="搜索影片/剧集..." 
                  value={filters.mediaTitle}
                  onChange={(e) => setFilters(prev => ({...prev, mediaTitle: e.target.value}))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                />
              </div>
              <div>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]"
                />
              </div>
              <div>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">时间</th>
                  <th className="p-4 font-medium">用户</th>
                  <th className="p-4 font-medium">网络信息</th>
                  <th className="p-4 font-medium">客户端 / 设备</th>
                  <th className="p-4 font-medium">播放内容</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500">
                      {serverError 
                        ? "无法连接到服务器。请检查 Docker 是否运行，或使用手动测试功能。" 
                        : "暂无播放记录，等待 Emby Webhook 推送..."}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="p-4 whitespace-nowrap text-slate-400 text-sm">
                        {new Date(record.timestamp).toLocaleString('zh-CN', {
                          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 font-bold text-xs border border-emerald-800">
                            {record.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{record.username}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-200 text-sm font-mono">{record.ip}</span>
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                            <MapPin size={10} />
                            {record.location}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-200 text-sm">{record.client}</span>
                          <span className="text-slate-500 text-xs">{record.device}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-emerald-400 font-medium text-sm line-clamp-1 group-hover:text-emerald-300 transition-colors">
                            {record.mediaTitle}
                          </span>
                          <span className="text-slate-500 text-xs inline-block px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 w-max mt-1">
                            {record.mediaType}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-700 bg-slate-900/30 text-slate-500 text-xs text-center flex justify-between items-center">
            <span>显示 {filteredRecords.length} 条记录</span>
            {serverError && <span className="text-amber-500">离线模式 / 仅本地预览</span>}
          </div>
        </div>

      </div>

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleManualImport}
      />
    </div>
  );
};

export default App;