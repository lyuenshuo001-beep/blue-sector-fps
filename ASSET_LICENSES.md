# TWINKLE OPS 资源与生成工具记录

更新日期：2026-10-04。仅参考枪械名称／分类和美术目标，不使用任何商业游戏提取资源。

## 感染者

`public/assets/infected/` 中 11 个外形及各自低细节版本均为本项目原创：infected、civilian、worker、spitter、bomber、pouncer、brute、runner、screamer、stalker、titan。由 `scripts/build-infected.mjs` 生成 glTF 2.0 / GLB，包括原创建模、顶点色、15 骨骼蒙皮和 LurchRun 动画。tissue-color / normal / roughness 三张 PNG 也是生成器独立创建。生成资产按 CC0-1.0 提供；不存在外部肖像、游戏模型或需购买的素材。

2.2 版减少夸张囊肿，使用苍白皮肤、空洞眼部、不同脸型／发型／衣着和异常身形；爆裂弱点缩小到腹部，腐液者保留少量喉部标记。都是轻量原创游戏模型，不称为扫描级或 AAA 写实资产。金属度为材质数值；本阶段没有额外 AO 贴图。

已研究但**没有使用／下载**：[Quaternius Animated Zombie Pack](https://quaternius.com/packs/animatedzombie.html)。作者页面标注 CC0，但风格偏卡通，本次采用自主制作方式，未把研究链接冒充实际素材来源。

## 武器

本版 16 款：M4A1、AKM、K416、MCX LT、AK-12、MP5、MP7、Vector、AWM、M700、SR-25、M870、M1014、M249、G17、Desert Eagle。

名称／分类查证入口：[三角洲官方总部工具站](https://www.playdeltaforce.com/events/hq/zh-tw/)、[官方工具站国际版](https://www.playdeltaforce.com/events/hq/id/index.html)、[Garena 官方版本公告](https://deltaforce.garena.com/zh_tw/news/all/UBU5HJ)。官方工具站动态更新，本文不是对所有地区所有版本完整枪库的断言。

K416 是按需求保留的游戏用称呼，其现实风格参考 HK416；不宣称“K416”是现实制造商正式型号。其余名称用于识别枪械类别，不代表品牌合作或背书。

所有武器可视几何由 `src/weapons/WeaponModel.ts` 自主制作，材质由 `src/world/Materials.ts` 本机生成。不存在来自《三角洲行动》、VALORANT、COD 等游戏的枪械模型、皮肤、改枪参数和音频。伤害、后坐力、容量与本作平衡由 Catalog.ts 定义，不复制其他游戏数据。属于轻量比例近似模型，并非厂家 CAD。

## 声音与特效

感染者叫声、毒液、扑袭、倒计时及爆炸音由 Web Audio 本地合成，无在线语音 API。毒液弹、毒区、烟尘、碎屑和血点由代码生成并使用对象池。枪声由 GunAudio.ts 原创分层合成，不把合成音冒充真实枪械录音。

第三方程序库 Three.js（MIT）提供渲染、GLTFExporter/Loader 和蒙皮克隆；它不提供本项目的僵尸美术内容。全部依赖保留各自许可，版本见 package-lock.json。

## 原创台词与离线语音（2.2）

public/assets/voice/ 包含 33 条 WAV 和 transcript.json，台词为本项目原创，不模仿真实个人声线，不复制商业游戏台词或录音。scripts/build-voice.mjs 通过本地 text2wav 0.0.14 / eSpeak NG 生成；网页只加载已生成的音频，不分发 TTS 运行时或调用语音 API。

工具来源：[text2wav 作者仓库](https://github.com/abbr/text2wav.node.js)（包装层 MIT）；[eSpeak NG](https://github.com/espeak-ng/espeak-ng)（引擎 GPL-3.0）；[语言清单](https://github.com/espeak-ng/espeak-ng/blob/master/docs/languages.md)包含 cmn。第三方工具及其数据保留自身许可，不能将其软件改标 CC0。项目没有使用 Microsoft 系统语音生成的音频；相关尝试未成功，最终成品全部由上述离线工具生成。

声音仍有电子合成感，并非真人演员录制。单元测试验证每条 WAV 的非零波形，浏览器测试验证全部 33 条可解码。
