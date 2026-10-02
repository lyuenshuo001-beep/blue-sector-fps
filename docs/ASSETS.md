# 素材与原创设计记录

2026-10-03，闪烁行动第二版。

## 公开设计研究

研究 Riot 官方 [The Birth of Ascent](https://playvalorant.com/en-gb/news/dev/the-birth-of-ascent/) 和 [地图介绍](https://playvalorant.com/en-gb/maps/)，以及公开可见截图，理解中央区域如何影响左右转点、空间地标、长短枪线与可读性。研究仅用于关卡组织思想，没有下载或提取 Riot 的模型、地图、贴图、图标或音效。

SKYWARD 自行设计 66×74 米地块：南侧出生，中路拱门通向北侧钟楼，西北喷泉，西侧市场与花园，东侧维修室／窄巷／坡道阳台，多处横向转点。建筑位置、可通行区域、覆盖物和生存模式出生点均由源码定义。它不是 Ascent 的尺寸或布局复刻，也不包含爆破模式或竞技地图资产。

## 实际资源来源

| 内容 | 来源 | 文件 |
|---|---|---|
| 墙面、地面、木、橡胶、金属色彩／法线／粗糙度 | 自制确定性 Canvas 生成 | src/world/Materials.ts |
| SKYWARD 建筑、拱门、喷泉、钟楼、植被、标牌和天空 | 自制几何与 Canvas | src/world/SkywardMap.ts |
| 14 把武器、瞄具、配件 | 自制轮廓挤出、圆柱和圆角结构 | src/weapons/WeaponModel.ts |
| 士兵和干员 | 自制圆角护甲、头盔、服装与设备 | src/enemy/SoldierModel.ts |
| UI 与 Twinkle 标记 | 自制 CSS、系统字体、SVG、Canvas | src/lobby.css、public/icon.svg |
| 枪声、脚步和反馈音 | Web Audio 合成 | src/audio/AudioManager.ts |
| 环境反射 | Three.js RoomEnvironment 生成 | src/core/Renderer.ts |

未引入任何外部枪模、商业游戏角色、音频或贴图，不存在额外素材包署名要求。Three.js、Vite、TypeScript 等第三方软件仍受各自许可证约束（Three.js 为 MIT）；依赖版本与完整包记录在 package-lock.json。

没有 GLB / Draco / Meshopt / KTX2 外部资源，因此没有虚构纹理压缩或下载体积收益。当前小尺寸纹理在本机生成并共享 GPU 贴图，构建约 0.65MB。几何合批、LOD、对象池和受限像素比负责运行时性能。

## 六处 Twinkle 彩蛋（含剧透）

木箱、设备／墙面铭牌及隐蔽侧路散布六处自制标记，具体坐标见 SkywardMap 中 Twinkle 文字调用；不参与伤害、碰撞或积分，避免影响战斗。
