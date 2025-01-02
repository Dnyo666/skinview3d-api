# Minecraft Skin Viewer API

基于 [skinview3d](https://github.com/bs-community/skinview3d) 的 Minecraft 皮肤渲染 API 服务。

[![MIT License](https://img.shields.io/badge/license-MIT-yellowgreen.svg?style=flat-square)](https://github.com/bs-community/skinview3d/blob/master/LICENSE)

## 系统要求

- Node.js >= 14.0.0
- 如果在 Linux 系统上运行，需要安装 Chrome 的依赖库（会在 `npm install` 时自动安装）
- 如果自动安装失败，需要手动安装以下依赖：

  Debian/Ubuntu:
  ```bash
  sudo apt-get update && sudo apt-get install -y \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
      libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
      libxrandr2 libgbm1 libasound2
  ```

  CentOS/RHEL:
  ```bash
  sudo yum install -y \
      nss atk at-spi2-atk cups-libs libdrm libxkbcommon \
      libXcomposite libXdamage libXfixes libXrandr \
      mesa-libgbm alsa-lib
  ```

## API 端点

### GET /render

渲染 Minecraft 皮肤的 3D 视图并返回 PNG 图片。

#### 参数

- `skin` (必需): Minecraft 皮肤的 URL
- `cape` (可选): 披风的 URL
- `width` (可选): 图片宽度，默认为 300
- `height` (可选): 图片高度，默认为 400
- `angle` (可选): 水平查看角度（度数），默认为 0
- `angleY` (可选): 垂直查看角度（度数），默认为 30

#### 示例

使用皮肤 URL：
```
http://your-domain.com/render?skin=https://example.com/skin.png&width=300&height=400&angle=45&angleY=30
```

### GET /health

健康检查端点，返回服务器状态。

## 配置选项

服务器通过环境变量进行配置。创建 `.env` 文件（基于 `.env.example`）来设置以下选项：

- `PORT`: 服务器端口（默认：3000）
- `RENDER_TIMEOUT`: 渲染等待时间，毫秒（默认：10000）
- `DEFAULT_WIDTH`: 默认图片宽度（默认：300）
- `DEFAULT_HEIGHT`: 默认图片高度（默认：400）

## 部署说明

1. 安装依赖：
```bash
npm install
```

2. 构建项目
```bash
npm run build
```

3. 配置环境变量：
```bash
# .env 文件会在安装时自动从 .env.example 创建
vim .env
```

4. 启动服务器：
```bash
npm start
```

## 注意事项

- 确保服务器有足够的内存来运行 Puppeteer
- 建议在生产环境中使用 PM2 或类似工具来管理进程
- 需要稳定的网络连接以访问皮肤资源

## 致谢

本项目基于 [skinview3d](https://github.com/bs-community/skinview3d) 开发，这是一个由 Three.js 驱动的 Minecraft 皮肤查看器。

### skinview3d 特性
* 支持 1.8 皮肤
* 支持高清皮肤
* 支持披风
* 支持鞘翅
* 支持细手臂
  * 自动模型检测（细/默认）
* 支持 FXAA（快速近似抗锯齿）

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。
