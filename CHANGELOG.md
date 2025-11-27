
# 更新日志

所有对本项目的显著更改都将记录在此文件中。

## [0.1.0] - 2024-05-20

### 🎉 发布
- 项目初始化发布 V0.1 版本。

### ✨ 新增功能
- **Dashboard**: 基于 React + Tailwind CSS 的响应式仪表盘。
- **Webhook**: Node.js Express 后端，支持接收 Emby `playback.start` 事件。
- **Persistence**: 集成 `lowdb`，实现本地 JSON 文件数据存储。
- **Filter**: 支持按用户、影片名、日期范围筛选记录。
- **Export**: 支持将播放记录导出为 CSV。
- **Docker**: 提供 Dockerfile 和 docker-compose.yml 一键部署方案。
- **Mock**: 提供手动录入 JSON 的弹窗，方便测试。

### 🐛 修复
- 修复了剧集名称显示不完整的问题，现在支持 `SeriesName SxxExx - Title` 格式。
- 增加了后端数据库目录自动检查，防止首次运行报错。
