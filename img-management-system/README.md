# XiaofArt 本地作品管理后台

这是公开作品站的本地内容管理工具。Node.js/Express 提供管理页面和 API，MongoDB 保存管理员、系列、图片资料及访客数据，上传后的作品文件保存在仓库根目录 `images/managed/`。保存和发布作品时，后台同步生成根目录的 `site-data.js` 静态快照。

图片不使用 GridFS。GitHub Pages 也不运行本后台、不连接 MongoDB、不提供登录或上传接口。

## 当前功能

- 管理员登录与 JWT 鉴权；
- 系列创建、排序、编辑、发布和取消发布；
- 多图上传、图片资料编辑和顺序管理；
- 公开作品 API 与 `site-data.js` 静态快照；
- 本地访客与浏览统计。

## 本地启动

要求 Node.js、npm，以及本机 MongoDB 或 Docker Desktop。

```bash
cp .env.example .env
npm install
npm run db:up
npm run local
```

如果已有可用的 MongoDB，可在 `.env` 设置 `MONGODB_URI` 后运行 `npm start`。

默认地址：

- 公开站：<http://127.0.0.1:3000/>
- 管理后台：<http://127.0.0.1:3000/admin.html>
- 登录页：<http://127.0.0.1:3000/login.html>

项目不提供可写入文档的默认管理员密码。请在本地 `.env` 中设置唯一的 `ADMIN_EMAIL` 和强 `ADMIN_PASSWORD`，首次启动时会创建管理员；以后修改环境变量密码会同步更新该账号。

## 环境变量

以 `.env.example` 为唯一模板。本地推荐：

- `NODE_ENV=development`
- `HOST=127.0.0.1`
- `ALLOW_LAN_ACCESS=false`
- `ALLOW_REGISTRATION=false`
- `MONGODB_URI=mongodb://127.0.0.1:27017/xiaofart`
- `CORS_ORIGIN=http://localhost:3000`

不要提交 `.env`。如果未来改为完整线上后台，必须另外配置 `NODE_ENV=production`、`HOST=0.0.0.0`、至少 32 位随机 `JWT_SECRET`、独立 `ANALYTICS_SALT`、正确的 HTTPS 来源、远程 MongoDB、持久化图片存储、自动重启和备份。

## 发布公开静态站

完成本地编辑并确认作品已发布后：

```bash
npm run site:publish
```

此命令生成仓库根目录 `docs/`，只复制 `site-data.js` 当前引用的公开图片，并运行静态资源检查。默认 Pages 地址可通过 `SITE_URL` 覆盖：

```bash
SITE_URL=https://example.com/ npm run site:publish
```

随后按根目录 [README](../README.md) 的步骤检查、提交和推送。不要把 `images/managed/` 当作 Pages 发布目录。

## 常用命令

```bash
npm run build          # JavaScript 语法/构建检查
npm audit              # 依赖安全扫描
npm run images:optimize
npm run site:build     # 重新生成 docs/
npm run site:check     # 检查已有 docs/
npm run site:publish   # 生成并检查
```
