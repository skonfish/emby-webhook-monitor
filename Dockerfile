# --- 阶段 1: 构建前端 (Builder) ---
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./

# 安装所有依赖 (包括 devDependencies 用于构建)
RUN npm install

# 复制源代码
COPY . .

# 构建前端 (生成 dist 目录)
RUN npm run build

# --- 阶段 2: 生产环境 (Production) ---
FROM node:18-alpine

WORKDIR /app

# 仅复制 package.json
COPY package.json ./

# 仅安装生产环境依赖 (不安装 vite, tailwind 等)
RUN npm install --production

# 从构建阶段复制构建好的前端文件 (dist)
COPY --from=builder /app/dist ./dist

# 复制后端入口文件
COPY server.js .

# 创建数据库目录
RUN mkdir -p db

# 暴露端口
EXPOSE 33096

# 启动命令
CMD ["npm", "run", "start"]
