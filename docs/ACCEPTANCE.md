# 第一版验收记录

验证日期：2026-09-26。这里区分“自动化已验证”“实现但待实机”“待账户上线”，不把模拟浏览器写成真实手机。

## 已执行

- [x] npm install 成功，锁文件生成，安装时审计 0 个漏洞。
- [x] npm run dev 启动成功，PC 本地浏览器可加载。
- [x] npm run build：TypeScript 检查与 Vite 构建通过。
- [x] npm test：构建相对路径、PWA 版本机制、包体检查通过。
- [x] Chromium 桌面：场景、开始、WASD 移动、跳跃、蹲下。
- [x] 原创 52 × 64 米蓝室地图，路径图所有出生区域连接玩家区。
- [x] 四枪参数、武器模型、弹药、换弹守恒、墙体阻挡射线、狙击爆头击杀。
- [x] 路一号名称 Sprite，机器人对象池，AI 攻击造成伤害。
- [x] Wave 1 刷怪，Wave 1→2 敌人总数 3→5，视线外／遮挡出生规则。
- [x] 四枪分别验证自动／半自动行为、弹药扣除、狙击 ADS FOV、身体伤害 30 与爆头区别。
- [x] LOW DPR 上限与 HIGH 阴影开关。
- [x] Health Pack、Ammo Box、Game Over 统计、Restart 重置。
- [x] Chromium 手机尺寸：摇杆移动、右侧转向、三个真实触摸点同时 Move + Look + Shoot。
- [x] Touch release 清除持续射击，竖屏提示，DPR 上限。
- [x] WebKit 手机尺寸：WebGL2 启动、ADS、SWITCH、CROUCH、FIRE、RELOAD。
- [x] 程序合成音效；不支持 Web Audio 的浏览器静音降级。
- [x] 微信 User-Agent 下提示、关闭提示、触屏 PLAY / ADS / FIRE 已通过 Chromium 模拟；不是微信真机结论。
- [x] 无未捕获浏览器错误。
- [x] 生产 /blue-sector/ 子目录加载，全量关键请求同源。
- [x] PWA 缓存完成后断网刷新并开始游戏。
- [x] 新 Service Worker 等待用户更新，激活后清理旧缓存并正常加载。
- [x] GitHub Pages 与 OSS 工作流已生成，部署 Secret 不进入前端代码。
- [x] README 与 DEPLOY_CHINA.md 已交付，无远程 CDN / Google 字体 / 游戏素材依赖。

截图与 JSON 结果在测试运行时写入 test-results/；交付包 docs/evidence 中保留本轮证据。

## 实现完成，但不能用本机模拟替代的检查

- [ ] Android 真机长时间操作、发热、电量、LOW 档实际 FPS。
- [ ] iPhone 真机 Safari、多点触控、刘海安全区、主屏幕安装。
- [ ] 微信内置浏览器真机音频／横屏／WebGL 差异。
- [ ] 在实际用户网络上的操作延迟与稳定性。

Playwright 的 WebKit 不等于 iPhone；Chromium 触摸模拟也不等于 Android。本机软件渲染 FPS 不作为手机 60 FPS 的承诺。

## 需要账号和外部资源才能完成

- [x] 用户的公开 GitHub 仓库 lyuenshuo001-beep/blue-sector-fps 已确认。
- [x] 源码已推送 main，仓库归用户 lyuenshuo001-beep 所有。
- [x] GitHub Pages 工作流成功；https://lyuenshuo001-beep.github.io/blue-sector-fps/ 返回 200。
- [x] 公网桌面真实点击 PLAY 后获取 Pointer Lock 并射击；微信 User-Agent 手机模拟下 PLAY / ADS / FIRE 正常；所有关键资源同源，PWA 激活，无未捕获错误。
- [ ] 阿里云 OSS／域名／备案／证书已配置。
- [ ] OSS 自动部署在真实账号执行成功。
- [ ] 中国大陆真实移动网络、Wi-Fi、新加坡实际网址访问验收。

没有账户、域名与 Secret 的情况下，不会生成假的公开 URL。示例地址不能当作正式访问地址。

## 已知第一版边界

紧凑地图直跑用时约十余秒，1–2 分钟指完整遭遇与绕行而非直线跑图。机器人采用简化网格路径点；没有多人联网、破坏场景、翻越、真实骨骼动作或商业游戏资源。半自动武器需逐次按 FIRE。门框保持常开，玻璃为不可破坏阻挡。补给与机器人复用对象。HTTPS、首次联网和浏览器可用存储是离线缓存的前提。


