
# Emby Webhook Monitor (EWM)

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue)

一个轻量级的 Emby 播放记录监控与统计面板。通过接收 Emby Server 的 Webhook 推送，实时记录用户的播放行为，并提供可视化的数据统计、筛选和 CSV 导出功能。

## ✨ 功能特性

*   **实时监控**：监听 Emby `Playback Start` 事件，实时刷新列表。
*   **精准定位**：针对中国大陆 IP 优化，接入 PCOnline 接口，可精确显示到 **省-市-区** (如：青海省西宁市城北区)。
*   **关键信息提取**：自动解析用户名、IP 地址、播放设备、客户端、影片名称（支持剧集 S0xE0x 格式化）。
*   **数据持久化**：使用轻量级 JSON 数据库存储记录，Docker 重启数据不丢失。
*   **多维筛选**：支持按用户名、影片名称、日期范围进行搜索和过滤。
*   **数据导出**：支持将筛选结果导出为 CSV 文件，方便 Excel 分析。
*   **模拟测试**：内置手动录入 JSON 功能，方便在没有真实 Webhook 环境下进行调试。

## 🚀 快速开始 (Docker Compose)

### 步骤 0: 首次代码上传 (开发者/部署者)
如果你是刚创建了仓库，请先在**本地电脑**将代码上传到 GitHub：
```bash
# 初始化并上传代码
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/skonfish/emby-webhook-monitor.git
git push -u origin main
```

### 步骤 1: 服务器部署
在你的 NAS 或服务器 (如 Unraid/群晖) 上执行：

1.  **下载代码**
    ```bash
    git clone https://github.com/skonfish/emby-webhook-monitor.git
    cd emby-webhook-monitor
    ```

2.  **启动服务**
    ```bash
    docker-compose up -d
    ```

3.  **访问面板**
    打开浏览器访问 `http://localhost:33096`（或你的服务器 IP:33096）。

## ⚙️ Emby 配置指南

为了让程序接收数据，你需要在 Emby Server 中配置 Webhook。

1.  登录 Emby 管理后台。
2.  进入 **设置 (Settings)** -> **Webhooks**。
3.  点击 **添加 Webhook (Add Webhook)**。
4.  配置如下：
    *   **Url**: `http://<你的服务器IP>:33096/webhook`
    *   **Request Content Type**: `application/json` (默认)
    *   **Events**: 勾选 `Playback Start` (播放开始)。建议只勾选此项，以保持数据整洁。
5.  点击保存。

## ❓ 常见问题 (FAQ)

**Q: Docker 启动后报错找不到 `db` 目录？**
A: V0.1 版本已修复此问题，程序会自动检测并创建目录。如果仍有问题，请手动在项目根目录执行 `mkdir db`。

**Q: 为什么 IP 归属地显示不准确？**
A: 程序优先使用在线接口进行解析。如果显示不准或“未知位置”，可能是接口暂时超时或 IP 为内网 IP。

## 🛠️ 本地开发

如果你想参与开发或修改源码：

1.  **安装依赖**
    ```bash
    npm install
    ```

2.  **开发模式**
    同时启动前端（Vite）和后端（Express）：
    ```bash
    npm run dev  # 仅启动前端
    # 或者
    node server.js # 启动后端 (前端需要 build 后才能被后端 serve)
    ```

## 📝 待办事项 (TODO)

- [ ] 增加用户登录/鉴权系统，保护面板安全。
- [ ] 支持更多 Emby 事件（如播放停止、暂停）。
- [ ] 增加图表可视化（ECharts/Recharts）。

## 📄 许可证

MIT License
