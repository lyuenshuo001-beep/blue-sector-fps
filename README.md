# BLUE SECTOR / 蓝域行动

**立即游玩：[BLUE SECTOR](https://lyuenshuo001-beep.github.io/blue-sector-fps/)**

源码仓库：[lyuenshuo001-beep/blue-sector-fps](https://github.com/lyuenshuo001-beep/blue-sector-fps)。GitHub Pages 已发布，阿里云部署暂未启用。手机横屏点击 PLAY；已完成公网浏览器检查，但大陆微信真机和运营商网络仍需实测，无法保证 GitHub Pages 在所有地区稳定。

原创蓝色航天设施室内 FPS 生存游戏。TypeScript + Three.js + Vite，纯前端，无账号、无后端、无运行时第三方 CDN。所有模型、界面纹理和音效由代码生成，不使用任何商业游戏素材。地图 52 × 64 米，核心蓝室、两侧设施区与环形维护通道组成 CQB 空间。

## 快速运行

需要 Node.js **22.18+** 或 24 LTS、npm，以及支持 WebGL2 的浏览器。Windows 推荐 PowerShell 使用 npm.cmd（避免本机脚本执行策略拦截 npm.ps1）。

```powershell
cd "D:\delta move"
npm.cmd install
npm.cmd run dev
```

浏览器打开终端显示的地址，通常是 http://localhost:5173 。手机与电脑连接同一 Wi-Fi，打开终端显示的局域网地址，例如 http://192.168.1.10:5173 。电脑防火墙需要允许 Node 的局域网连接。localhost 对手机指手机自身，不是电脑。

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run preview
```

构建结果在 dist/。不能直接双击 index.html 使用 file:// 运行 ES Modules；请使用上述服务器或静态网站。PWA 需要 HTTPS，localhost 是开发例外。局域网 HTTP 可测试游戏，但无法完整测试手机离线安装。

如果 npm 默认缓存目录没有写权限，可用：
`npm.cmd install --cache .npm-cache --registry https://registry.npmjs.org`。缓存不应提交仓库。

## 玩法与操作

点击 PLAY 开始。敌人统一名为“路一号”，橙红色战术机器人，头顶始终显示姓名。清空每波后有 4 秒准备时间，下一波增加 2 名敌人；单波总敌人数封顶 45，同时存在最多 15 名（LOW 最多 8 名）。敌人优先在视野外或墙后生成；没有安全出生点时会等待，不强行刷在眼前。靠近绿色十字恢复 35 HP，橙色补给给四把枪增加备用弹药。补给使用后 22–34 秒在可通行位置刷新。

| PC | 功能 |
|---|---|
| WASD / 鼠标 | 移动 / 转向 |
| 左键 / 右键按住 | 射击 / ADS |
| R / 空格 | 换弹 / 跳跃 |
| C 或 Ctrl | 蹲下切换 |
| 1 / 2 / 3 / 4 | AR-01 / SMG-9 / SR-50 / PX-12 |
| ESC / 右上角暂停 | 暂停并释放鼠标 |

手机：左下摇杆移动；右侧空白区域滑动转向；FIRE 按住自动射击（狙击枪、手枪每按一次发射一发），ADS 与 CROUCH 点击切换，另有 RELOAD / JUMP / SWITCH。三个触点分别绑定各自 pointerId，支持移动、转向、射击同时进行。横屏继续，切后台自动暂停。系统不允许全屏时仍能玩。iOS 可使用 Safari 分享菜单“添加到主屏幕”；Android Chrome 使用浏览器菜单安装或添加。

| 枪械 | 伤害 | 每秒射击 | 弹匣 / 初始备用 | 换弹秒 | ADS FOV |
|---|---:|---:|---:|---:|---:|
| AR-01 | 30 | 9 | 30 / 120 | 1.9 | 57 |
| SMG-9 | 21 | 13 | 30 / 150 | 1.5 | 62 |
| SR-50 | 90 | 0.85 | 5 / 25 | 2.6 | 25 |
| PX-12 | 36 | 4.5 | 12 / 72 | 1.25 | 60 |

爆头 2 倍伤害。每种武器定义散布、腰射／ADS 精度与后坐力，支持武器回弹、动态准心、命中／爆头／击杀反馈、合成音效。换枪会中断换弹。玩家 HP 100，死亡显示击杀、波次、生存时间、命中率并可直接重开。

## 性能和画质

- 静态场景按材质合并几何体；机器人 15 个预分配对象池；命中特效 36 个复用对象。
- 不生成物理子弹；射线分别检测头、身体和地图。墙、设备与完整玻璃阻挡射击。第一版玻璃不可破坏、门为常开门框；跳跃不会翻越掩体。
- 没有重型后处理与运行时模型下载。照明为半球光、环境光与单个方向光，灯带采用自发光材质。
- LOW DPR 上限 1，2 个命中粒子，8 名同时活动敌人；MEDIUM 上限 1.35，5 个粒子，15 名敌人；HIGH 手机 DPR 1.5、PC 2，10 个粒子，局部阴影。
- 持续低帧率自动降低渲染比例，最低为所选档位的 65%。高画质无法保证每台手机 60 FPS；请以实际设备测试为准。
- 地图直跑约十余秒，战斗、绕行和搜集形成 1–2 分钟的遭遇节奏；这是紧凑 CQB 地图，不是 1–2 分钟直线跑图的大地图。

## 一个源码仓库，两个网址

### 国际 / 备用：GitHub Pages

1. 在自己的 GitHub 账号创建空仓库，例如 blue-sector；不要先添加 README，避免首次推送分叉。
2. 把本项目上传，必须包含 src、public、scripts、tests、.github、package.json、package-lock.json、tsconfig.json、vite.config.ts、index.html、README、docs。不要上传 node_modules。
3. 推荐 Git 命令（已有本地仓库无需重复 git init；用户名邮箱使用你自己的）：

```powershell
git init -b main
git add .
git commit -m "Build BLUE SECTOR survival FPS"
git remote add origin https://github.com/YOUR_USERNAME/blue-sector.git
git push -u origin main
```

4. 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
5. Actions → Deploy GitHub Pages；首次可点击 Run workflow。此后 push main 自动构建并发布。
6. 在成功任务的 deployment 页面取得实际网址，通常为 https://YOUR_USERNAME.github.io/blue-sector/ 。
7. 若组织策略禁止 Pages，先在账户／组织设置中开放。

Vite base 为 `./`，资源、manifest 和 service worker 都使用相对路径，可运行在仓库子目录或独立域名根目录。这里展示的是格式示例，不是已经发布的网址。

### 中国大陆：阿里云 OSS

详见 [docs/DEPLOY_CHINA.md](docs/DEPLOY_CHINA.md)。dist 与 Pages 使用同一份构建，不需要后端。部署完成后，你把 **自己的 HTTPS 游戏网址**发给朋友即可，不需要朋友接触 GitHub。

GitHub Repository → Settings → Secrets and variables → Actions → Secrets 添加：

| Secret | 值 |
|---|---|
| ALIYUN_ACCESS_KEY_ID | 专用 RAM 用户 AccessKey ID |
| ALIYUN_ACCESS_KEY_SECRET | 对应 Secret |
| ALIYUN_OSS_BUCKET | bucket 名称，不含 oss:// |
| ALIYUN_OSS_ENDPOINT | 如 https://oss-cn-hangzhou.aliyuncs.com |

Variables 添加 `CHINA_DEPLOY_ENABLED=true` 后才启用中国部署。可以先不配置，Pages 不受影响。脚本使用 OSS SDK 上传，带正确 Content-Type 和缓存头；先上传哈希资源，再 index.html，最后 sw.js，保留旧哈希资源避免打开旧版的玩家断资源。密钥不写进源码、不写进 VITE_ 环境变量、不进入浏览器。建议为 china-production environment 配置所需分支限制。

## PWA 缓存与版本更新

构建脚本读取所有构建文件并生成内容哈希版本，预缓存 HTML / JS / CSS / manifest / 本地图标。模型、纹理、音频由这些 JS 在本机生成，不另取远程资源。新 Service Worker 安装完成后显示“发现新版本”，用户点击更新才激活并刷新；新缓存完整建立后才删除本作用域旧缓存。导航优先尝试网络，失败使用本版缓存首页。若第一次加载时没有网络，仍无法使用；浏览器主动回收缓存后需要重新联网。

不依赖 PWA 能力的浏览器仍可在线玩；微信的 WebGL、音频、全屏支持随手机内核变化，页面提供使用系统浏览器的提示。

## 测试

```powershell
npm.cmd run build
npm.cmd test
npx.cmd playwright install chromium
# 保持另一个终端 npm run dev 正在运行
npm.cmd run test:browser
node tests/pwa.mjs
```

自动化覆盖射线遮挡、爆头击杀、换弹守恒、AI 伤害、补给、路径连通、多指同时操作、横屏提示、Game Over、Restart、生产子路径、同源请求、断网启动、缓存更新。截图和报告写入 test-results/。开发模式提供 window.__game 用于测试，生产仅 ?test=1 显式开启。

验收状态与不能代替真机的项目见 [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md)。Android、iPhone、微信与中国大陆真实网络需要在你的设备／已部署域名上验证，自动化模拟不能冒充真机验收。

## 目录

```text
src/core/       渲染、输入、游戏主循环
src/player/     玩家移动、碰撞、跳跃、蹲下
src/weapons/    四枪参数与武器管理
src/enemy/      机器人、AI、波次与出生点
src/world/      原创地图、路径点、补给
src/ui/         菜单、HUD、触屏控制、结算
src/audio/      Web Audio 程序音效
src/effects/    复用命中粒子
public/        PWA 图标与 manifest
scripts/       构建缓存与 OSS 部署
tests/         构建与浏览器验证
.github/       两套发布工作流
```

第一版把相关职责集中在少量模块，避免只有一行逻辑的空壳文件。无遗留 TODO 或需要你补写的核心系统。完整源代码在本项目中，发布后仓库归你的 GitHub 账号所有。


补充机制测试：`node tests/mechanics.mjs`；WebKit 验证先 `npx playwright install webkit`，再 `npm run test:webkit`。

