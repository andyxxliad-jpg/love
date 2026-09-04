# Our Little Universe 💗

一个为重要的人制作的沉浸式情侣回忆相册。项目将照片、音乐、星空粒子和互动文字结合在一起，打开网页即可进入一段属于两个人的小宇宙。

## 项目预览

项目是一个纯前端静态网页，可以直接部署到 GitHub Pages、Vercel、Netlify 或其他静态托管服务。

## 功能

- **星空粒子背景**：使用 Three.js WebGL 创建缓慢旋转的星空效果。
- **照片 3D 相册**：通过 CSS3DRenderer 将照片排列成可交互的 3D 场景。
- **多种照片布局**：支持心形、球形、螺旋和网格四种排列方式。
- **照片放大查看**：点击任意照片可以打开大图预览。
- **自动旋转与手势操作**：支持拖动旋转、缩放和自动旋转。
- **恋爱计时器**：从指定日期开始计算相处天数、小时、分钟和秒数。
- **天气小惊喜**：进入页面前请求浏览器定位，并通过 Open-Meteo 获取当前位置天气。
- **回忆语录轮播**：页面底部会定时切换专属文字。
- **时光碎片**：通过日历入口查看特别日期和回忆内容。
- **情书打字机**：以逐字出现的方式展示写给对方的信。
- **背景音乐**：进入主页面后播放本地音频；如果浏览器阻止自动播放，点击页面即可开始播放。
- **移动端适配**：针对手机屏幕和触摸操作进行了适配。

## 技术栈

- HTML5
- CSS3
- JavaScript
- [Three.js](https://threejs.org/) `r128`
- [Tween.js](https://github.com/tweenjs/tween.js)
- Three.js `CSS3DRenderer` 和 `OrbitControls`
- [Open-Meteo Weather API](https://open-meteo.com/)
- Google Fonts：Caveat、ZCOOL KuaiLe

## 目录结构

```text
.
├── index.html              # 页面入口
├── css/
│   └── style.css           # 页面样式和移动端适配
├── js/
│   └── main.js             # 交互逻辑、3D 场景和数据配置
└── assets/
    ├── audio/
    │   └── 1.mp3           # 背景音乐
    └── images/
        ├── 1.png
        ├── 2.png
        └── ...             # 回忆照片
```

## 本地运行

这是一个静态项目，不需要构建工具。由于浏览器的定位、音频和跨域限制，建议通过本地 HTTP 服务器运行，而不是直接双击 `index.html`：

```bash
python3 -m http.server 8000
```

然后打开：

```text
http://localhost:8000
```

也可以使用 VS Code 的 Live Server 等静态服务器工具。

## 个性化配置

主要配置位于 `js/main.js`：

### 修改恋爱开始日期

```javascript
const startDate = new Date('2026-08-07T00:00:00').getTime();
```

将日期替换为你们的纪念日或相识日期。

### 修改照片数量

```javascript
const photoCount = 120;
const totalUploadedPhotos = 120;
```

当照片数量发生变化时，同时调整这两个值，并确保图片文件名从 `1.webp` 连续编号。

### 修改轮播语录

编辑 `hotQuotes` 数组即可替换页面底部显示的文字。

### 修改时光碎片

编辑日历生成部分的日期判断和回忆文本，可以添加更多特别日期及对应内容。

### 修改情书

编辑 `letterText` 字符串即可替换情书内容。使用 `\\n\\n` 表示段落间距。

## 注意事项

1. 天气功能需要用户允许浏览器获取位置，并依赖网络访问 Open-Meteo API。
2. 浏览器通常会阻止未经用户操作的音频自动播放；项目已提供点击页面播放的兼容处理。
3. 页面引用了 CDN 上的 Three.js、Tween.js 和字体资源，完全离线运行时需要将这些依赖下载到本地。
4. 照片和音频文件较大，部署前可以适当压缩，以提升首次加载速度。
5. 项目中的照片、音乐和情书内容属于私人回忆，请在公开部署前确认素材的授权和隐私范围。

## 部署

将整个项目上传到任意静态托管平台即可。以 GitHub Pages 为例：

1. 将项目推送到 GitHub 仓库。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 `Deploy from a branch`。
4. 选择 `main` 分支和 `/ (root)` 目录并保存。
5. 等待部署完成后，通过 GitHub Pages 地址访问项目。

## 致谢

感谢 Three.js、Tween.js 和 Open-Meteo 提供的开源工具与服务。

---

愿每一张照片，都能把你们带回当时的心动。✨
