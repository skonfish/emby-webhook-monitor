# --- 第一阶段: 构建前端 (Builder) ---
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制依赖定义文件
COPY package.json package-lock.json* ./

# 安装所有依赖 (包括开发依赖，用于运行 tsc 和 vite build)
RUN npm install

# 复制所有源代码
COPY . .

# 执行构建 (生成 dist 目录)
RUN npm run build

# --- 第二阶段: 生产环境运行 (Production) ---
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 仅复制 package.json 用于安装生产依赖
COPY package.json ./

# 仅安装生产环境依赖 (不安装 TypeScript, Vite 等)
RUN npm install --production

# 从第一阶段复制构建好的前端静态文件 (dist 目录)
COPY --from=builder /app/dist ./dist

# 复制后端服务文件
COPY server.js .

# 确保数据库目录存在
RUN mkdir -p db

# 暴露服务端口
EXPOSE 33096

# 启动服务
CMD ["npm", "run", "start"]
