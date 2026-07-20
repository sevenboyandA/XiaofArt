# XiaofArt

林小肥的小型个人作品展示网站。公开站使用原生 HTML、CSS 和 JavaScript；Node.js、Express、MongoDB 管理后台只在本地运行。

## 部署结构

- `index.html`、`about.html`、`gallery.css`、`gallery-app.js`：公开前台源码。
- `site-data.js`：本地后台发布后生成的公开作品快照。
- `images/managed/`：本地后台图片工作区，不直接发布，也不再新增到 Git。
- `img-management-system/`：本地管理后台源码和运行说明。
- `docs/`：唯一的 GitHub Pages 发布目录，只含公开页面及 `site-data.js` 当前引用的图片。

GitHub Pages 不包含登录、MongoDB、上传接口或访客统计。静态站不会请求这些本地 API。

## 本地后台

```bash
cd img-management-system
cp .env.example .env
# 编辑 .env，设置唯一管理员账号以及两个不同的 32 位以上随机密钥
npm install
npm run local
```

访问：

- 公开站预览：<http://127.0.0.1:3000/>
- 管理后台：<http://127.0.0.1:3000/admin.html>

真实 `.env`、MongoDB 数据、上传临时文件和 `node_modules/` 都被 Git 忽略。不要把管理员密码、JWT 密钥或数据库连接字符串写入文档和源码。

## 生成 GitHub Pages 发布包

在后台完成上传、资料编辑和发布后执行：

```bash
cd img-management-system
npm run site:publish
```

该命令会重新生成 `../docs/` 并检查：

- 公开系列不为空；
- 只复制 `site-data.js` 当前引用的图片；
- 所有图片和页面资源都存在；
- Open Graph、404、favicon、robots 和 sitemap 已生成；
- Pages 版本已关闭本地 API 与访客统计请求。

默认站点地址是 `https://sevenboyandA.github.io/XiaofArt/`。如果仓库名、账号或域名改变，请在构建时传入完整地址：

```bash
SITE_URL=https://example.com/ npm run site:publish
```

## 首次上传到 GitHub

当前仓库过去曾跟踪 `images/` 源图片。确认 `docs/` 检查通过后，首次整理时执行：

```bash
git rm -r --cached images
git add .
git status
git diff --cached --stat
```

请在提交前再次确认暂存区没有 `.env`、`img-management-system/data/`、`node_modules/`、管理员凭据或无关图片。确认后再自行提交和推送：

```bash
git commit -m "Prepare public portfolio for GitHub Pages"
git push origin main
```

本项目不会自动替你提交或推送。

## 启用 GitHub Pages

1. 打开仓库的 **Settings → Pages**。
2. 在 **Build and deployment → Source** 选择 **Deploy from a branch**。
3. Branch 选择 `main`，目录选择 `/docs` 并保存。
4. 等待 GitHub Pages 发布完成后访问站点地址。

Pages 只读取已在本地生成和检查的 `docs/`，不会把本地后台发布到网站。

## 后续更新作品

1. 启动本地后台，上传、编辑并发布作品。
2. 运行 `npm run site:publish`。
3. 本地预览 `docs/`，检查 PC/移动端、深浅色、滚轮/触控/滑动、横竖图和 `?project=作品ID` 直达链接。
4. 只提交本次源码、`site-data.js` 和 `docs/` 的变化。
5. 推送 `main` 后，GitHub Pages 自动更新线上站点。

## 检查命令

```bash
cd img-management-system
npm run build
npm audit
npm run site:check
```

如需在任意电脑远程登录和上传，才需要另行部署 Node.js、远程 MongoDB 和持久化图片存储；当前 GitHub Pages 方案不需要这些服务。
