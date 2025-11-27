
# Emby Webhook Monitor (EWM)

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue)

一个轻量级的 Emby 播放记录监控与统计面板。通过接收 Emby Server 的 Webhook 推送，实时记录用户的播放行为，并提供可视化的数据统计、筛选和 CSV 导出功能。

## ✨ 功能特性

*   **实时监控**：监听 Emby `Playback Start` 事件，实时刷新列表。
*   **关键信息提取**：自动解析用户名、IP 地址、播放设备、客户端、影片名称（支持剧集 S0xE0x 格式化）。
*   **数据持久化**：使用轻量级 JSON 数据库存储记录，Docker 重启数据不丢失。
*   **多维筛选**：支持按用户名、影片名称、日期范围进行搜索和过滤。
*   **数据导出**：支持将筛选结果导出为 CSV 文件，方便 Excel 分析。
*   **模拟测试**：内置手动录入 JSON 功能，方便在没有真实 Webhook 环境下进行调试。

## 🚀 快速开始 (Docker Compose)

这是最推荐的部署方式。

1.  **下载代码**
    ```bash
    git clone https://github.com/your-username/emby-webhook-monitor.git
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
    *注意：在纯开发模式下，你需要手动处理跨域或代理，建议直接使用 Docker 调试完整流程。*

## 📝 待办事项 (TODO)

- [ ] 集成真实的 GeoIP 数据库，替代目前的模拟/随机城市。
- [ ] 增加用户登录/鉴权系统，保护面板安全。
- [ ] 支持更多 Emby 事件（如播放停止、暂停）。
- [ ] 增加图表可视化（ECharts/Recharts）。

## 📄 许可证

MIT License
