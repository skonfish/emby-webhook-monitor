
import { PlaybackRecord, EmbyWebhookPayload } from './types';

// Mock 数据仅保留用于 GeoIP 模拟演示，实际后端会处理
const MOCK_LOCATIONS = [
  '中国, 北京', '中国, 上海', '中国, 广州', '中国, 深圳', 
  '中国, 成都', '美国, 洛杉矶', '日本, 东京', '新加坡'
];

// 简单的客户端解析逻辑保留，供手动导入功能使用
export const resolveIpLocationMock = async (ip: string): Promise<string> => {
  return new Promise((resolve) => {
    // 简单模拟网络延迟
    setTimeout(() => {
      resolve(MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)]);
    }, 100);
  });
};

// 解析前端手动输入的 JSON
export const parseEmbyPayload = async (jsonString: string): Promise<PlaybackRecord | null> => {
  try {
    const data: EmbyWebhookPayload = JSON.parse(jsonString);

    // 宽松检查：虽然主要是 playback.start，但在测试时允许其他，只给警告
    if (!data.Event || !data.Event.toLowerCase().includes('playback')) {
      console.warn("注意: 输入的事件可能不是播放事件:", data.Event);
    }

    const username = data.User?.Name || 'Unknown User';
    const ip = data.Session?.RemoteEndPoint || '0.0.0.0';
    const client = data.Session?.Client || 'Unknown Client';
    const device = data.Session?.DeviceName || 'Unknown Device';
    
    let mediaTitle = data.Item?.Name || data.Title || 'Unknown Title';
    
    // 智能标题拼接
    if (data.Item?.SeriesName) {
        const s = data.Item.ParentIndexNumber;
        const e = data.Item.IndexNumber;
        if (s !== undefined && e !== undefined) {
             mediaTitle = `${data.Item.SeriesName} S${s}E${e} - ${data.Item.Name}`;
        } else {
             mediaTitle = `${data.Item.SeriesName} - ${data.Item.Name}`;
        }
    }

    const location = await resolveIpLocationMock(ip);

    return {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      username,
      ip,
      location,
      client,
      device,
      mediaTitle,
      mediaType: data.Item?.Type || 'Unknown',
    };
  } catch (e) {
    console.error("Failed to parse payload", e);
    return null;
  }
};

export const exportToCSV = (records: PlaybackRecord[]) => {
  const BOM = '\uFEFF'; // 防止 Excel 打开乱码
  const headers = ['时间', '用户名', 'IP地址', 'IP归属地', '播放软件', '设备', '影片名称', '类型'];
  
  const csvContent = records.map(r => {
    const dateStr = new Date(r.timestamp).toLocaleString('zh-CN');
    // 处理 CSV 注入和特殊字符
    const escape = (str: string) => {
        if (str === null || str === undefined) return '""';
        return `"${String(str).replace(/"/g, '""')}"`;
    };
    
    return [
      escape(dateStr),
      escape(r.username),
      escape(r.ip),
      escape(r.location),
      escape(r.client),
      escape(r.device),
      escape(r.mediaTitle),
      escape(r.mediaType)
    ].join(',');
  }).join('\n');

  const blob = new Blob([BOM + headers.join(',') + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `emby_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // 释放 URL 对象
  URL.revokeObjectURL(url);
};
