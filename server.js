
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// --- 配置部分 ---
const PORT = process.env.PORT || 33096;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- 目录初始化 ---
// 确保 db 目录存在，否则 lowdb 可能会报错
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)){
    try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('数据库目录已创建:', dbDir);
    } catch (err) {
        console.error('无法创建数据库目录:', err);
    }
}

// --- 数据库初始化 (使用 lowdb 存储 JSON 文件) ---
// 默认数据结构
const defaultData = { posts: [] };
const dbPath = path.join(dbDir, 'db.json');
const db = await JSONFilePreset(dbPath, defaultData);

const app = express();

app.use(cors());
app.use(bodyParser.json());

// --- 辅助函数 ---

// IP 归属地解析 (接入 PCOnline 接口，专为中国大陆优化)
const resolveIpLocation = async (rawIp) => {
  if (!rawIp) return '未知 IP';

  // 清洗 IP (处理 IPv6 映射的 IPv4)
  const ip = rawIp.replace('::ffff:', '');

  // 内网检测
  if (
    ip === '127.0.0.1' || 
    ip === '::1' || 
    ip.startsWith('192.168.') || 
    ip.startsWith('10.') || 
    (ip.startsWith('172.') && parseInt(ip.split('.')[1], 10) >= 16 && parseInt(ip.split('.')[1], 10) <= 31)
  ) {
    return '内网 / 局域网';
  }

  try {
    // 使用太平洋网络 (PCOnline) 接口，支持精确到省市区
    // 注意：PCOnline 返回的数据是 GBK 编码
    // 设置 5 秒超时，防止 API 无响应阻塞请求
    const response = await fetch(`http://whois.pconline.com.cn/ip.jsp?ip=${ip}`, {
        signal: AbortSignal.timeout(5000) 
    });

    if (!response.ok) throw new Error('API Request failed');

    const arrayBuffer = await response.arrayBuffer();
    // Node.js 支持 TextDecoder 解码 GBK
    const decoder = new TextDecoder('gbk');
    const text = decoder.decode(arrayBuffer);
    
    // 接口返回格式通常为 "xx省xx市xx区 ISP" 或单纯地址，去除首尾空格即可
    // 示例: "青海省西宁市城北区 电信"
    return text.trim() || '未知位置';

  } catch (error) {
    console.error(`IP解析失败 [${ip}]:`, error.message);
    // 降级方案：如果 API 失败，返回错误提示
    return '未知位置 (API超时)';
  }
};

// --- API 路由 ---

// 1. 接收 Emby Webhook
app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;
    console.log('收到 Webhook 事件:', data.Event);

    // 只处理 playback.start 事件
    // 注意：Emby 有时发送 "playback.start"，有时可能是 "system.notification" 包含播放信息，目前仅严格匹配 playback.start
    if (data.Event && data.Event.toLowerCase().includes('playback.start')) {
      
      const username = data.User?.Name || 'Unknown User';
      const ip = data.Session?.RemoteEndPoint || '0.0.0.0';
      const client = data.Session?.Client || 'Unknown Client';
      const device = data.Session?.DeviceName || 'Unknown Device';
      
      // 构建标题
      let mediaTitle = data.Item?.Name || data.Title || 'Unknown Title';
      if (data.Item?.SeriesName) {
        // 如果是剧集，拼接 S01E01 格式
        const s = data.Item.ParentIndexNumber; // 季
        const e = data.Item.IndexNumber; // 集
        if (s !== undefined && e !== undefined) {
             mediaTitle = `${data.Item.SeriesName} S${s}E${e} - ${data.Item.Name}`;
        } else {
             mediaTitle = `${data.Item.SeriesName} - ${data.Item.Name}`;
        }
      }

      // 异步获取位置信息
      const location = await resolveIpLocation(ip);

      const newRecord = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        username,
        ip,
        location,
        client,
        device,
        mediaTitle,
        mediaType: data.Item?.Type || 'Unknown',
        rawEvent: data.Event
      };

      // 写入数据库 (unshift 保证最新的在前面)
      await db.update(({ posts }) => posts.unshift(newRecord));
      
      console.log(`[记录成功] 用户: ${username} | 影片: ${mediaTitle} | IP: ${ip} | 位置: ${location}`);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook 处理错误:', error);
    res.status(500).send('Server Error');
  }
});

// 2. 前端获取数据的 API
app.get('/api/history', (req, res) => {
  try {
    // 重新读取，防止缓存
    db.read(); 
    const { posts } = db.data;
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: "Read DB failed" });
  }
});

// 3. 清空数据 API
app.delete('/api/history', async (req, res) => {
  try {
    await db.update((data) => { data.posts = [] });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// --- 生产环境服务前端静态文件 ---
// 检查 dist 目录是否存在（构建后的前端文件）
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    // 排除 API 路径
    if (!req.path.startsWith('/api') && !req.path.startsWith('/webhook')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
    console.log("提示: 'dist' 目录不存在。如果是开发环境请忽略，生产环境请确保已执行构建。");
}

app.listen(PORT, () => {
  console.log('-------------------------------------------');
  console.log(` Emby Webhook Monitor v0.1`);
  console.log(` 服务端口: ${PORT}`);
  console.log(` Webhook URL: http://your-ip:${PORT}/webhook`);
  console.log('-------------------------------------------');
});
