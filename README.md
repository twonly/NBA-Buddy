# 🦐 篮球虾仔 · NBA-Buddy

桌面挂着只虾仔, 帮你追 NBA 实时比分。Wemby 暴扣他起立, Brunson 三分他蹦迪, 终场 0.5s 绝杀他抱头。

> 数据源: ESPN 公开 API · 免 key · 完全免费

## ⬇️ 下载

最新版: [Releases](https://github.com/twonly/NBA-Buddy/releases/latest)

- **macOS** (Apple Silicon): `NBA-Buddy-x.y.z-mac-arm64.dmg`
- **Windows** (x64): `NBA-Buddy-x.y.z-win-x64.exe` (portable, 双击即用)

### macOS 装好提示"已损坏"?

未签名所以系统多疑。终端跑一行:

```bash
xattr -dr com.apple.quarantine /Applications/篮球虾仔.app
```

### Windows SmartScreen 警告?

未签名同理。点"更多信息" → "仍要运行"即可,一次性的。

## ✨ 功能

- **常驻比分板** — 两队 logo + 实时比分 + 状态徽章, 20s 一刷
- **系列赛 chip** — `G1 · 0-1 · Bo7` 一行知道整轮形势
- **胜率 sparkline** — chip 下方迷你折线, 关键时刻紧绷
- **赛前倒计时** — `🕐 2h 13m` 不必盯着等开球
- **事件实时推送** — 三分/暴扣/罚球/换人/节末/半场/终场, 带球员名
- **战报卡片** — 一键保存当前比分 + logo + 陪伴时长 PNG
- **自定义形象** — 拖 PNG 到 characters 文件夹即可换公仔
- **静默模式** — 关气泡只看 chip, 适合工作时
- **8-bit 音效** — 得分/暴扣/终场可选音效
- **⌘⇧X 召回** — 隐藏后随时唤回

## 🎨 换公仔

虾仔丑? 自己换:

1. 右键虾仔 → 设置 → 角色形象 → 📂 素材文件夹
2. 新建子文件夹放 `idle.png` (220×220 透明 PNG 最佳)
3. 重启或刷新, 设置里选你的包

7 种心情对应文件名: `idle.png` / `watch.png` / `cheer.png` / `sad.png` / `flag.png` / `sleep.png` / `dance.png`。只放 idle.png 也能用, 其他自动 fallback。

Prompt 模板见 [案例/NBA-prompts.md](案例/NBA-prompts.md)。

## 🛠 开发

```bash
npm i --legacy-peer-deps
npm run dev          # vite + electron 开发模式
npm run package:mac  # 出 macOS dmg
npm run package:win  # 出 Windows portable.exe
```

## 📦 发布流程

详见 [RELEASE.md](RELEASE.md)。简版:

```bash
npm version patch   # 0.1.0 → 0.1.1
git push --follow-tags
# 等 GitHub Actions 跑完 (~5 分钟), Releases 自动出 mac + win 双平台包
# 老用户下次启动会自动检测并升级
```

## 🙏 致谢

- 数据: [ESPN](https://www.espn.com/) 公开 API
- 引擎: [Electron](https://www.electronjs.org/) + [Vite](https://vitejs.dev/) + React
- 灵感: 来自一只虾仔
