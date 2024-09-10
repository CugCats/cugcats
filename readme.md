# 校园猫咪投喂&陪伴记录系统

这是一个用于记录校园猫咪的投喂和陪伴情况的网站。

## 项目描述

本系统旨在帮助校园内的猫咪爱好者更好地管理和记录对校园猫咪的喂食和陪伴情况。通过这个系统，我们可以避免猫咪被过度投喂，同时也能确保每只猫咪都得到适当的关注和照顾。

## 主要功能

- 记录每只猫咪的日常喂食情况
- 记录用户对猫咪的陪伴次数
- 每日自动重置喂食和陪伴计数
- 查看历史喂食和陪伴数据
- 按区域分类显示猫咪信息

## 项目结构

- `frontend/`: 前端 HTML 文件
- `backend/`: 后端 Node.js 服务器
- `database/`: SQLite 数据库文件

## 技术栈

- 前端：HTML, JavaScript
- 后端：Node.js, Express
- 数据库：SQLite

## 部署指南

1. 安装 Node.js 和 npm（如果尚未安装）。

2. 克隆或下载此项目到您的服务器。

3. 进入 backend 目录并安装依赖：
   ```
   cd backend
   npm install
   ```

4. 启动后端服务器：
   ```
   npm start
   ```

5. 配置您的 Web 服务器（如 Nginx 或 Apache）来提供 frontend/index.html 文件。

6. 如果需要，更新 frontend/index.html 中的 API_URL 常量以匹配您的服务器地址。

7. 访问您配置的 URL 来使用应用程序。

注意：确保您的服务器防火墙允许 7789 端口的流量（用于后端 API）。

## 维护

- 数据库文件位于 database/cats.db。
- 猫咪的数据位于 backend/cats_data.js
- 每天午夜，系统会自动重置所有猫咪的喂食和陪伴计数。

## 贡献

如果您想为这个项目做出贡献，欢迎提交 Pull Request 或开启 Issue。

## 联系方式

如果需要补充猫咪的信息或有任何问题，请联系：
- 微信：cugcats
- 邮箱：cugcats@gmail.com

## 开源信息

本项目已开源，您可以在 [GitHub](https://github.com/CugCats/cugcats) 上查看源代码。

## 免责声明

本项目仅用于管理和记录校园猫咪的喂食情况，不会获取任何经济收益。项目维护者承担相关成本，包括服务器、域名、猫粮和每月的捐款等。我们感谢您的支持和传播。