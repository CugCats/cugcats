# 校园流浪猫喂食记录系统

这是一个用于记录校园流浪猫喂食情况的网站。

## 项目结构

- frontend/: 前端HTML文件
- backend/: 后端Node.js服务器
- database/: SQLite数据库文件

## 部署指南

1. 安装Node.js和npm（如果尚未安装）。

2. 克隆或下载此项目到您的服务器。

3. 进入backend目录并安装依赖：
   ```
   cd backend
   npm install
   ```

4. 启动后端服务器：
   ```
   npm start
   ```

5. 配置您的Web服务器（如Nginx或Apache）来提供frontend/index.html文件。

6. 如果需要，更新frontend/index.html中的API_URL常量以匹配您的服务器地址。

7. 访问您配置的URL来使用应用程序。

注意：确保您的服务器防火墙允许3000端口的流量（用于后端API）。

## 维护

- 数据库文件位于database/cats.db。
- 每天午夜，系统会自动重置所有猫咪的喂食计数。