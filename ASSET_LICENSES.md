# LAST SECTOR 首发资源许可记录

核查日期：2026-10-03。仅参考枪械名称／分类和美术目标，不使用任何商业游戏提取资源。

## 感染者

`public/assets/infected/` 中四类模型及各自低细节版本均为本项目原创：infected、spitter、bomber、pouncer。由 `scripts/build-infected.mjs` 生成 glTF 2.0 / GLB，包括原创建模、顶点色、15 骨骼蒙皮和 LurchRun 动画。tissue-color / normal / roughness 三张 PNG 也是生成器独立创建。生成资产按 CC0-1.0 提供；不存在外部肖像、游戏模型或需购买的素材。

四种外形分别包含普通破衣感染者、绿色胸腔囊肿腐液者、膨大腹部及橙色弱点囊的爆裂者、瘦体长指扑袭者。都是轻量原创游戏模型，不称为扫描级或 AAA 写实资产。金属度为材质数值；本阶段没有额外 AO 贴图。

已研究但**没有使用／下载**：[Quaternius Animated Zombie Pack](https://quaternius.com/packs/animatedzombie.html)。作者页面标注 CC0，但风格偏卡通，本次采用自主制作方式，未把研究链接冒充实际素材来源。

## 武器

本版 16 款：M4A1、AKM、K416、MCX LT、AK-12、MP5、MP7、Vector、AWM、M700、SR-25、M870、M1014、M249、G17、Desert Eagle。

名称／分类查证入口：[三角洲官方总部工具站](https://www.playdeltaforce.com/events/hq/zh-tw/)、[官方工具站国际版](https://www.playdeltaforce.com/events/hq/id/index.html)、[Garena 官方版本公告](https://deltaforce.garena.com/zh_tw/news/all/UBU5HJ)。官方工具站动态更新，本文不是对所有地区所有版本完整枪库的断言。

K416 是按需求保留的游戏用称呼，其现实风格参考 HK416；不宣称“K416”是现实制造商正式型号。其余名称用于识别枪械类别，不代表品牌合作或背书。

所有武器可视几何由 `src/weapons/WeaponModel.ts` 自主制作，材质由 `src/world/Materials.ts` 本机生成。不存在来自《三角洲行动》、VALORANT、COD 等游戏的枪械模型、皮肤、改枪参数和音频。伤害、后坐力、容量与本作平衡由 Catalog.ts 定义，不复制其他游戏数据。属于轻量比例近似模型，并非厂家 CAD。

## 声音与特效

感染者叫声、毒液、扑袭、倒计时及爆炸音由 Web Audio 本地合成，无在线语音 API。毒液弹、毒区、烟尘、碎屑和血点由代码生成并使用对象池。干员本地语音包属于后续阶段，当前没有把合成提示音当作角色语音。

第三方程序库 Three.js（MIT）提供渲染、GLTFExporter/Loader 和蒙皮克隆；它不提供本项目的僵尸美术内容。全部依赖保留各自许可，版本见 package-lock.json。
