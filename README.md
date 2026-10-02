# 闪烁行动 / TWINKLE OPS

**游戏网址：[点击进入闪烁行动](https://lyuenshuo001-beep.github.io/blue-sector-fps/)**

[完整源码仓库](https://github.com/lyuenshuo001-beep/blue-sector-fps)。原 BLUE SECTOR 项目的第二版，沿用移动、射击、波次、触屏和 PWA 基础。无需账号、App 或后端。阿里云暂未启用；GitHub Pages 的大陆微信真实网络可达性仍需实测。

## 这次升级

- 原创 **SKYWARD / 悬空城**：约 66 × 74 米，明亮古城、中央钟楼、拱门、A 区喷泉、B 区维修室、市场、花园、可走上去的高台与侧路。7 个出生点、6 处 Twinkle 彩蛋。
- 程序化石材、砖、灰泥、木、金属和橡胶表面；本地生成 Base Color / Normal / Roughness，金属度区分材质。没有游戏素材提取或运行时 CDN。
- 14 把原创命名武器，完整枪身、枪管、导轨、枪托、扳机护圈、弹匣及瞄具；不同射速、伤害、射程、散布、移动倍率和后坐力。保留换弹、开镜、摆动和射击反馈。
- 大厅、可拖动 3D 武器预览、Credits 商店、主副武器配装、枪口／握把／弹匣／倍镜改装。
- 疾影、天隼、月痕、守望四名原创干员，各三个技能，有冷却和效果。敌人仍叫 **路一号**。
- 本地保存 Credits、解锁、配装、干员、最佳成绩和画质。单人 Wave Survival，不提供联网多人。

## 开始游戏

大厅 → 开始游戏 → 选择干员 → 下一步配装 → START。初始免费 AR-01 + PX-12，其余使用游戏 Credits 解锁，无真实付费。配件本版免费。

| PC 操作 | 功能 |
|---|---|
| WASD / 鼠标 | 移动 / 视角 |
| 左键 / 右键 | 射击 / 按住开镜 |
| R / Space | 换弹 / 跳跃 |
| C 或 Ctrl / Shift | 蹲下 / 冲刺 |
| 1 / 2 | 已装备主武器 / 副武器 |
| Q / E / X | 技能 1 / 技能 2 / 特殊技能 |
| ESC | 暂停 |

手机横屏：左摇杆移动，右侧滑动视角，FIRE、ADS、RELOAD、JUMP、CROUCH、SWITCH、SPRINT 及三个技能键。移动、视角、射击绑定独立触点。切后台／竖屏暂停；全屏请求失败不阻碍游玩。手枪、狙击、DMR、霰弹枪每次按下发射一次；自动武器可按住连续射击。

| 干员 | Q | E | X |
|---|---|---|---|
| 疾影 | 超载加速 8 秒，击杀延长 | 撞击爆炸微型榴弹 | 战术滑铲；也可冲刺时蹲下 |
| 天隼 | 定向推进约 8.8 米，碰墙停止 | 延时吸附炸弹 | 范围减速冲击弹 |
| 月痕 | 落点侦察扫描 | 持续电弧伤害 | 近域敌情标记；命中也会标记 |
| 守望 | 范围恢复生命 | 近域减伤装置 | 60 点临时护甲 |

武器：AR-01、AR-02、KA-47、CB-7、SMG-9、VX-45、CX-6、SR-50、BA-90、DMR-21、SG-8、SG-12、PX-12、HP-45。详细平衡参数见 `src/weapons/Catalog.ts`。

倍镜支持机械、红点、全息、2×、4×、7×，真实修改相机 FOV，并切换模型与准星。消焰补偿器与垂直握把降低纵向后坐力，斜握把改善横向后坐力及 ADS 速度，消音器减弱声音／火焰但缩短射程，扩容弹匣例如 30→40，换弹变慢。

局末收入：每次击杀 25 C、爆头击杀另加 10 C、每个已完成波次 100 C、每存活 10 秒 5 C。结算只发放一次。可重开或回大厅购枪。关闭网页前未结束的一局不结算。存档只在当前浏览器／域名；清除网站数据会清除进度，没有云同步。

## 本地运行

Node.js **22.18+**。在包含 package.json 的项目目录运行；Windows 使用 npm.cmd：

```powershell
npm.cmd ci
npm.cmd run dev -- --port 5174
```

打开 http://localhost:5174 。手机与电脑同一 Wi-Fi 时使用终端显示的局域网地址，并允许 Node 通过防火墙。不要双击 index.html，也不要在手机上输入电脑的 localhost。

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run preview
```

`dist/` 是完整静态站点。运行时不向国外 CDN、Google、模型或音频服务器取资源。当前构建约 **0.65 MB 未压缩**，贴图／几何／声音在本机生成；没有为压缩引入额外远程解码器。

## 性能

静态几何按材质合并，植被使用 InstancedMesh，敌人近／远 LOD、视锥裁剪及最多 15 名对象池，技能和命中特效复用。没有实体子弹、重型后处理或大量动态灯。

| 设置 | 像素比上限 | 最大同时敌人 | 阴影 |
|---|---|---|---|
| LOW | 1 | 8 | 关闭 |
| MEDIUM | 1.35 | 15 | 静态快照 |
| HIGH | 手机 1.5 / PC 2 | 15 | 单方向光实时阴影 |

持续低帧率会继续降低渲染比例。自动化测试中的 LOW、8 名敌人场景约 154 次绘制、3.3 万三角形；该预算不等同于手机 FPS 实测。普通手机优先 LOW。

## 测试

另一个终端保持开发服务器运行在 5174：

```powershell
npx.cmd playwright install chromium webkit
npm.cmd run build
npm.cmd test
npm.cmd run test:browser
npm.cmd run test:mechanics
npm.cmd run test:pwa
npm.cmd run test:live
```

最后一项测试实际公网网址；前三套浏览器回归覆盖成长循环、三指操作、战斗技能、坡道、WebKit 触屏。PWA 使用独立临时生产服务器验证子路径、断网和版本更新。`test:webkit` 与 `test:mechanics` 同一套综合脚本。旧版脚本归档在 tests/legacy-v1，仅作历史参考，不用于新版验收。

报告及截图输出到 test-results；发布证据见 [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md)。生产仅显式 `?test=1` 提供测试对象。浏览器模拟不是 Android、iPhone 或微信真机认证。

## GitHub Pages 与回退

仓库 Settings → Pages → Source 设为 **GitHub Actions**。`.github/workflows/deploy-github.yml` 在 push main 时自动 npm ci → build → test → 部署。仓库名称和网址继续保留 blue-sector-fps，游戏品牌改为闪烁行动，不必让朋友更换收藏。

Vite `base: './'`，同一 dist 支持仓库子目录及独立域名根目录。旧版保存在 **blue-sector-v1-stable** 标签；升级开发分支为 **upgrade/twinkle-ops**。需要回退时可从标签创建修复分支，通过常规提交恢复旧内容并发布，不要强制覆盖远端历史。

## PWA、微信与大陆部署

支持安装到主屏幕（取决于浏览器）及首次联网后缓存离线运行。每次构建自动生成内容版本，出现“发现新版本”后点击更新；完整建立新缓存再清理旧缓存，避免旧 JS 混用。浏览器可能回收缓存，首次打开仍需网络。

微信内可尝试直接游玩，页面提供系统浏览器提示；无法绕过微信或网络对网址的限制，也不能保证所有大陆运营商访问 GitHub Pages。Aliyun 按当前要求保持关闭。

需要以后启用国内托管时，按 [docs/DEPLOY_CHINA.md](docs/DEPLOY_CHINA.md) 创建 OSS、绑定 HTTPS 域名并处理大陆域名备案。一个仓库、同一份 dist。GitHub Secrets：`ALIYUN_ACCESS_KEY_ID`、`ALIYUN_ACCESS_KEY_SECRET`、`ALIYUN_OSS_BUCKET`、`ALIYUN_OSS_ENDPOINT`；只有变量 `CHINA_DEPLOY_ENABLED=true` 才启用国内自动部署。密钥不得写入源码或 VITE_ 前缀环境变量。

## 源码与资源

`src/world` 地图与材质；`src/weapons` 参数、模型与武器状态；`src/player` 移动及技能；`src/core` 输入、存档与游戏循环；`src/ui` 大厅/HUD；`src/enemy` 士兵模型、AI与波次；`src/audio` 合成音效。保留原 BlueRoomMap 基础接口，新增 SkywardMap，没有另建替代项目。

素材来源、独立布局和设计参考见 [docs/ASSETS.md](docs/ASSETS.md)。
