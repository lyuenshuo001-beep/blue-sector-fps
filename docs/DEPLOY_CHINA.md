# 中国大陆静态部署：阿里云 OSS

本指南对应 BLUE SECTOR 纯前端游戏。一份 GitHub 源码、一次构建产生 dist，可同时发布 GitHub Pages 与中国大陆 OSS。这里不包含你的账户、实际 Bucket 或可访问域名；这些资源必须在你的账号中创建。

## 1. 准备阿里云账号与域名

1. 注册并实名认证阿里云中国站账号，开通对象存储 OSS。
2. 准备域名，如 example.com。game.example.com 是该域名的一个子域名；不要使用文档示例作为实际网址。
3. **Bucket 在中国大陆地域时，绑定自定义域名需要完成 ICP 备案。** 备案在阿里云 ICP 备案控制台进行：选择主体类型（个人或企业）、提交真实身份和网站资料、按提示进行真实性核验、等待服务商初审与省通信管理局审核。填写内容须与实际公开网站用途一致，按控制台要求确认游戏类内容是否需要额外材料。
4. OSS Bucket 本身不应被假设为能直接提供所有首次备案所需的接入／备案资格。请使用备案控制台“检查备案资格”与当前阿里云官方 OSS 备案说明确认所需接入资源；有备案的域名也应核对接入状态。不要仅购买 Bucket 后就认为已经备案。
5. 香港、新加坡等非大陆地域的 OSS 绑定域名通常不要求中国大陆 ICP 备案，但这些是境外托管，不等同于大陆节点，也不能保证大陆网络速度。希望真正使用大陆节点时完成备案流程。
6. 不需要朋友拥有阿里云账户，也不需要登录游戏。

依据与进一步帮助（2026-09-26 查阅）：
- [OSS 静态网站托管](https://www.alibabacloud.com/help/en/oss/user-guide/hosting-static-websites)
- [OSS 自定义域名备案说明](https://www.alibabacloud.com/help/en/icp-filing/basic-icp-service/product-overview/use-oss)
- [OSS 自定义域名与地域要求](https://www.alibabacloud.com/help/en/oss/user-guide/access-buckets-via-custom-domain-names)

## 2. 创建 Bucket

进入 OSS 控制台 → Bucket 列表 → 创建 Bucket：
- 名称：全球唯一，例如你自己选择的 blue-sector-prod-xxxxx。
- 地域：选择靠近主要用户的大陆地域，例如华东 1（杭州）。后续 endpoint 必须与此地域一致。
- 存储类型：标准存储。
- 冗余类型：按预算选择控制台默认或适合业务的选项。
- 访问权限：用于此公开静态游戏的 **公共读**，禁止公共写；Bucket 中只存公开构建文件，不放私人文件和密钥。若账号开启了“阻止公共访问”，需为这个公开网站 Bucket 按控制台要求调整，否则匿名访问会返回 403。
- 其他功能保持默认即可；可以开启访问日志与费用提醒。

下载游戏的是朋友的浏览器，必须允许匿名 GET 游戏文件。私有 Bucket 不适合直接使用本指南的公开静态网址，除非另配可公开读取的 CDN／代理访问方案。

## 3. 本地构建与手动上传

在项目根目录：
```powershell
npm.cmd install
npm.cmd run build
npm.cmd test
```

打开 dist，你应看到 index.html、404.html、assets/、manifest.webmanifest、sw.js 和图标。

OSS Bucket → 文件管理 → 上传文件：
1. 上传 **dist 内的所有内容**到 Bucket 根目录，不是上传名为 dist 的父文件夹。
2. 保持 assets 子目录结构。
3. 第一次上传后确认 index.html 和 assets 下哈希 JS/CSS 都存在。
4. 后续更新先上传 assets 与图标，再 index.html，最后 sw.js；不要立即删除旧 assets 文件。

## 4. 静态首页、错误页和 MIME

Bucket → 数据管理／基础设置中的“静态页面”或“静态网站托管”（界面名称可能变化）：
- 默认首页：index.html
- 默认 404 页面：404.html
- 保留真正的 404 状态。此游戏没有客户端路由，不需要把未知 URL 全部改写成首页；尤其不要把缺失的 JS 请求返回 HTML。
- 上传时或对象 HTTP 头管理中检查：

| 后缀 | Content-Type | Cache-Control |
|---|---|---|
| .html | text/html; charset=utf-8 | no-cache |
| .js（assets 下） | application/javascript; charset=utf-8 | public, max-age=31536000, immutable |
| .css | text/css; charset=utf-8 | public, max-age=31536000, immutable |
| sw.js | application/javascript; charset=utf-8 | no-cache |
| .webmanifest | application/manifest+json | no-cache |
| .png | image/png | no-cache |
| .svg | image/svg+xml | no-cache |

不要给 HTML 配 Content-Disposition: attachment，否则浏览器会下载网页而不是打开。阿里云对默认 OSS 域名直接预览 HTML 的限制可能导致下载行为；请使用绑定后的自定义域名作为正式入口，不依赖原始 bucket 域名。

同源资源无需 CORS 配置。不要用泛开放跨域规则解决错误的路径／MIME 问题。

## 5. 绑定 game.example.com

1. Bucket → 传输管理／域名管理 → 绑定自定义域名。
2. 输入你自己的 game.example.com；大陆地域先确认域名备案。
3. 按控制台提示验证域名所有权；如要求添加 TXT 记录，请到域名 DNS 控制台添加对应记录。
4. DNS 控制台增加 CNAME：主机记录 game，记录值使用 OSS 控制台给出的 Bucket 公网域名，如 your-bucket.oss-cn-hangzhou.aliyuncs.com。不要带 https://，也不要在记录值后添加路径。
5. 等待 DNS 生效。若原来已有同名 A／AAAA／CNAME 记录，先核对并解决冲突，避免误改别的站点。
6. 使用 http://game.example.com 测试首页，确认资源路径都为同源。

## 6. 开启 HTTPS

PWA 与可靠的安全上下文能力需要 HTTPS：
1. 在阿里云数字证书管理服务申请／购买覆盖 game.example.com 的有效证书，完成域名验证。不要把私钥上传 GitHub。
2. 在 OSS 的自定义域名 HTTPS 配置中，按当前控制台能力选择已签发证书或上传证书链与私钥。
3. 确认证书链、域名与有效期正确，访问 https://game.example.com 无证书警告。
4. 支持时为此自定义域名开启 HTTP → HTTPS 跳转。
5. 如果使用 CDN，则在 CDN 自定义域名上配置 HTTPS 证书和正确的 OSS 回源，并检查 CDN 所需备案条件；不要只给回源域名配置证书。
6. 配置证书续期提醒，避免到期后手机无法打开。

官方：[OSS 域名与 HTTPS 配置入口](https://www.alibabacloud.com/help/en/oss/user-guide/access-and-network-overview)。

## 7. GitHub 自动上传 OSS

本项目提供 .github/workflows/deploy-china.yml 和 scripts/deploy-oss.mjs。

### 创建专用 RAM 身份

不要用阿里云主账号密钥。创建只用于发布这个 Bucket 的 RAM 用户，按控制台允许的方式创建 AccessKey。授权最小范围的 PutObject 到目标 Bucket（SDK 上传对象所需），例如：

```json
{
  "Version": "1",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["oss:PutObject"],
    "Resource": ["acs:oss:*:*:YOUR_BUCKET/*"]
  }]
}
```

本脚本不列举 Bucket、不删除旧对象，不需要给全部 OSS 管理权限。若你的组织要求短期身份凭证／OIDC，请按其制度配置，并相应扩展脚本的凭证输入。

### 填写 Secrets

GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret：
- ALIYUN_ACCESS_KEY_ID
- ALIYUN_ACCESS_KEY_SECRET
- ALIYUN_OSS_BUCKET，例如你创建的实际名称
- ALIYUN_OSS_ENDPOINT，例如 https://oss-cn-hangzhou.aliyuncs.com（公网，不能使用 internal 地址）

同页 Variables → New repository variable：
- 名称：CHINA_DEPLOY_ENABLED
- 值：true

若使用 environment 级 Secrets，请创建名为 china-production 的 environment 并填入同名 Secrets。工作流已关联此 environment。

运行 Actions → Deploy China OSS → Run workflow。成功后每次 push main 都先 npm ci、构建、测试，再上传同一套 dist。GitHub Pages 工作流独立运行。密钥仅在部署步骤使用，绝不以 VITE_ 前缀注入构建。

若部署失败：
- Missing secret：核对名称与环境权限。
- AccessDenied：核对 RAM 权限、Bucket 与账号归属。
- Signature／Region 错误：核对 endpoint 与 Bucket 地域。
- 网页下载：核对自定义域名与 HTML 响应头。
- 黑屏／JS MIME 错误：检查 assets 是否上传完整、是否错误配置了 404 改写。
- 旧版本：给 index.html、sw.js、manifest 配 no-cache；如有 CDN，发布后刷新这些入口，不要缓存它们一年。

## 8. 大陆访问与手机验收

上线后请使用 **大陆真实网络**（至少一个移动蜂窝网络和一个 Wi-Fi），分别在 Android Chrome／系统浏览器、iPhone Safari、微信中验收：
1. 打开你的 HTTPS 域名，不应提示下载文件或登录。
2. PC DevTools → Network → Disable cache → Reload。HTML、JS、CSS、manifest、图标和 sw.js 的主机必须均为你的域名。模型、贴图、声音由本地代码生成，不应请求 Google、远程 Three.js 或素材服务。
3. 手机横屏点击 PLAY；测试左手摇杆＋右手滑动＋第三指 FIRE，同时检查 ADS、换弹、切枪、跳、蹲。
4. 清空一波、拾取补给、被击倒并重开。
5. 首次加载完成后关闭页面，断网重开。支持 Service Worker 的浏览器应进入缓存游戏；微信可能限制离线存储。
6. 发布新版本，重新联网打开，点击“更新游戏”，确认无白屏。
7. 留意长时间运行温度与 FPS；低端设备选择 LOW。
8. 让新加坡朋友测试国际网址，同时记录具体手机、系统、浏览器版本和问题。

**同源与资源本地化减少外部依赖，但不能保证任何运营商、DNS、浏览器和地区永远可用。** 正式国内可用性必须通过实际域名与网络测试，不能用本机模拟结果代替。

