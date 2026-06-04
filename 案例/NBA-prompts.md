# 篮球虾仔 · 角色公仔生成 Prompt 工具包

适用：ChatGPT image-2 / DALL·E 3 / MJ v6 / 即梦 / Nano-banana / SD + LoRA

---

## 0. 风格锁（每张图都加,不要改）

```
3D chibi blind-box figurine, popmart-style collectible toy,
oversized round head, tiny stubby body (3-head-tall proportions),
glossy vinyl plastic material with soft subsurface scattering,
front-facing pose, big sparkly eyes,
soft studio lighting from upper-left, subtle floor shadow,
hyper-clean Pixar-meets-PopMart aesthetic,
centered composition, full body visible,
1:1 square, high detail, product photography quality,
isolated on pure transparent background, no backdrop,
alpha channel cutout, sticker-style PNG with transparent edges
```

---

## 1. 球队槽位模板（套用到 30 支队）

```
[风格锁] +
wearing {球队主场球衣 + 配色} basketball jersey #{球衣号码} with team logo on chest,
holding {球队/球员代表道具},
{球员/吉祥物外貌特征 — 肤色 / 发型 / 表情},
{城市/球馆元素 as faint logo on shorts or sweatband},
basketball at feet or in hand
```

---

## 2. 优先两队（你已关注）

### 🟦🟧 New York Knicks（纽约尼克斯）

#### idle.png — Jalen Brunson 公仔
```
[风格锁]
wearing royal blue New York Knicks home jersey #11 with orange and white "NEW YORK" wordmark across chest,
holding an orange basketball under one arm,
short brown hair, focused but warm smile, slight stubble,
small Statue of Liberty silhouette on sweatband,
gold championship-grit confidence pose
```

#### 备选 idle — Karl-Anthony Towns 公仔
```
[风格锁]
wearing royal blue New York Knicks jersey #32 with orange "NEW YORK" wordmark,
holding a basketball above head like a power forward,
tall lanky frame, long dark hair tied back, gentle smile,
Empire State Building silhouette pattern on shorts,
big-7-footer feel but chibi cute
```

### ⬛⬜ San Antonio Spurs（圣安东尼奥马刺）

#### idle.png — Victor Wembanyama 公仔
```
[风格锁]
wearing classic black-and-silver San Antonio Spurs jersey #1 with team logo,
holding a basketball like a tennis ball in one giant hand,
extremely tall lanky frame (still chibi proportions, slightly stretched neck),
French youthful face, neat short black hair, gentle confident smile,
Alamo silhouette outline on sweatband, small French flag pin on collar,
"the Alien" vibe — calm yet otherworldly
```

#### 备选 idle — Spurs 队史复古风
```
[风格锁]
wearing retro silver Spurs jersey with Tim-Duncan-era stripe,
holding a championship trophy small replica,
clean-cut chibi figure, friendly determined eyes,
five small championship-ring icons floating around base,
Texas longhorn cowhide-pattern wristband
```

---

## 3. 其他热门球队 idle prompts（一行一队,直接复制）

```
🟪🟨 Los Angeles Lakers — wearing iconic purple-and-gold Lakers jersey #6, holding basketball with showtime swag, slicked black hair, sunglasses on forehead, palm tree silhouette on shorts, Hollywood-sign micro detail

🟩⬜ Boston Celtics — wearing Kelly-green Celtics jersey #0, dribbling stance, freckles + red beard, clover shamrock on sweatband, Boston harbor detail

🟧🔵 Golden State Warriors — wearing royal blue Warriors jersey #30, shooting motion mid-release, friendly young face, Bay Bridge silhouette on shorts, Splash Brother sparkle effect

🟪🟦 Phoenix Suns — wearing purple Suns jersey #1, sunset-orange basketball, cool desert sunglasses, sun-rays graphic on shorts, cactus pin on collar

🔴⚫ Chicago Bulls — wearing red Bulls jersey #23 (homage), tongue-out playful jordan pose, vintage 90s feel, bull-horn micro accessory, Chicago skyline outline

🔵⚪ Dallas Mavericks — wearing royal blue Mavs jersey #77, European charm Doncic vibe, slight beard, Slovenian flag pin, dribbling crossover stance

🟦🟡 Denver Nuggets — wearing navy Nuggets jersey #15, big friendly Jokic-style smile, mountain silhouette on shorts, hot chocolate steam doodle

🟥🟦 Miami Heat — wearing black Vice City jersey #22, flame accent under feet, Miami sunset gradient on sweatband, palm + neon vibe

🟩⬛ Milwaukee Bucks — wearing green Bucks jersey #34, Greek deer antlers tiny on headband, Greek flag pin, intense dunking stance

🟦🟧 Oklahoma City Thunder — wearing blue Thunder jersey #2, lightning bolt accents, calm confident face, Oklahoma cowboy hat pin

🟨🟪 Minnesota Timberwolves — wearing dark navy Wolves jersey #5, wolf-ear hood detail, snowflake pattern on shorts, ANT-MAN ant icon

🔴⚫ Philadelphia 76ers — wearing red 76ers jersey #21, liberty bell on sweatband, "Trust the Process" stitched on shorts, joel-embiid towering chibi

🟦🟧 Cleveland Cavaliers — wearing wine-red Cavs jersey #45, lake-erie wave on shorts, friendly Mitchell-style face

🟦⚫ Brooklyn Nets — wearing black Nets jersey #11, Brooklyn Bridge silhouette on sweatband, simple monochrome cool

🟦🔴 Toronto Raptors — wearing red Raptors jersey #43, dinosaur claw tiny accessory, maple leaf pin, north strong proud

🟥🟨 Atlanta Hawks — wearing red Hawks jersey #11, peach state outline on shorts, Trae-Young-style baby face

🟧🟦 Memphis Grizzlies — wearing navy Grizzlies jersey #12, grizzly paw print on sweatband, blues guitar pin

🟦🟨 Indiana Pacers — wearing yellow Pacers jersey #0, race car checkered flag accent on shorts, Hoosier basketball feel

🟦🟧 Houston Rockets — wearing red Rockets jersey #2, rocket fin tiny on shoulder, space astronaut helmet beside

⬛🟧 Portland Trail Blazers — wearing black Blazers jersey #0, Mt. Hood silhouette on shorts, rip-city pin

🟨⬛ Utah Jazz — wearing yellow Jazz jersey #45, saxophone tiny accessory, mountain badge on sweatband

🟦⚪ Sacramento Kings — wearing purple Kings jersey #5, crown accent on sweatband, beam-the-cowbell pin

🟦🟧 LA Clippers — wearing red Clippers jersey #13, anchor on sweatband, beach feel, San Diego nostalgic detail

🟪⚪ Charlotte Hornets — wearing teal Hornets jersey #1, hornet wings tiny on shoulder, southern charm

🟦🟥 Detroit Pistons — wearing red Pistons jersey #2, piston-engine tiny graphic on shorts, motor city vibe

🟦⚪ Orlando Magic — wearing blue Magic jersey #5, star wand small accessory, Florida sun on shorts

🟦🟥 Washington Wizards — wearing red Wizards jersey #1, wizard hat tiny on head, monument star

🟦🟧 New Orleans Pelicans — wearing red Pelicans jersey #1, pelican beak silhouette on shoulder, jazz mardi gras vibe
```

---

## 4. 七种心情对应 pose（i2i 用,上传 idle.png 当参考）

> 用法：`[上传 idle.png] + same character, same uniform, only change pose to: <下面对应一句>`

| 文件名 | 场景 | Pose prompt (英文) |
|---|---|---|
| `idle.png` | 待机摸鱼 | standing relaxed, basketball under one arm, gentle smile, neutral pose |
| `watch.png` | 看球中 | sitting on bench with towel around neck, eyes wide focused forward, hands gripping knees |
| `cheer.png` | 庆祝中 | both arms raised mid-jump celebration, mouth open shouting, basketball thrown up |
| `sad.png` | 难过中 | shoulders slumped, head down, hands on hips, single tear, basketball at feet |
| `flag.png` | 准备开赛 | jump-ball ready stance, one hand reaching up, intense focused eyes, both feet bent |
| `sleep.png` | 打盹中 | seated on bench drowsing, head tilted with Z's floating, half-eaten popcorn beside |
| `dance.png` | 蹦迪中 | celebration dance pose, tiny sunglasses, championship belt or trophy mid-spin, sparkles |

### 中文版（即梦/文心适用）

| 状态 | 中文 prompt |
|---|---|
| idle | 同一角色同一球衣,只改姿势：放松站立,单手夹球,微微一笑,正面 |
| watch | 同一角色同一球衣,只改姿势：坐替补席,毛巾围脖,瞪大眼睛盯着前方,双手扶膝 |
| cheer | 同一角色同一球衣,只改姿势：跳起来双手举高庆祝,张嘴大喊,篮球抛起 |
| sad | 同一角色同一球衣,只改姿势：肩塌头低,双手插腰,一颗眼泪,篮球落脚边 |
| flag | 同一角色同一球衣,只改姿势：跳球准备姿势,一手向上,目光锐利,双腿微屈 |
| sleep | 同一角色同一球衣,只改姿势：坐替补席打瞌睡,头歪一边,飘 Z 字,旁边半袋爆米花 |
| dance | 同一角色同一球衣,只改姿势：庆祝舞步,戴小墨镜,腰间冠军腰带,旋转中,周围星光 |

---

## 5. 工具特定调整

### ChatGPT image-2 / DALL-E 3 ✅ 透明背景原生支持
直接把 §0 风格锁 + §1 槽位完整粘贴,prompt 末尾再强调一次 `transparent background, no backdrop, alpha channel PNG`

### MJ v6
- 末尾追加：`--ar 1:1 --style raw --s 250 --v 6.1 --no background`
- 所有公仔用**同一个 `--seed`** 锁材质和透视
- 用 `--cref <你的 idle.png 链接> --cw 100` 做多 mood 一致性

### 即梦 / Nano-banana
- 选"贴纸模式"或"透明背景"
- 一致性角色功能上传 idle.png
- 风格描述只写 "3D 盲盒手办风,光面塑料质感,可爱"

### SD + ComfyUI（专业向）
- 装 `layerdiffuse` 扩展直出透明 PNG
- 配 `Vinyl Toy` / `Blind Box` LoRA 强度 0.6
- ControlNet 用 OpenPose 锁姿势

### Negative prompt（SD 必加）
```
realistic human, photo of real person, scary, creepy, low quality, blurry,
distorted limbs, extra fingers, watermark, text logo on background,
flat 2D illustration, anime line art, full background scene, sky, sunset
```

---

## 6. 批量出图 SOP

1. 先做 **1 张满意的 idle**（Wemby 或 Brunson），作为整套基准
2. 用 idle 当 cref/参考图 → 跑 7 种 pose
3. 检查每张:
   - 是否真透明（双击 PNG → 预览看是否有白底）
   - 角色五官是否一致
   - 球衣号码/颜色是否对
4. 落地：每队建文件夹 `~/Library/Application Support/fanshrimp-nba/characters/<team>/`
   - `pack.json`: `{ "name": "Knicks · Brunson", "author": "你" }`
   - 7 张 mood PNG（或只放 idle.png,其余 fallback）
5. 启动篮球虾仔 → 设置 → 角色形象里选

---

## 7. 球星身份对应表（写 prompt 时用）

| 球队 | 当家明星 | 球衣号 | 标志特征 |
|---|---|---|---|
| Spurs | Victor Wembanyama | #1 | 法国超高个,细长肢体 |
| Knicks | Jalen Brunson | #11 | 短小精悍,头脑型控卫 |
| Knicks | Karl-Anthony Towns | #32 | 高瘦长发 |
| Lakers | LeBron James | #6 / #23 | 标志性发际线 |
| Lakers | Luka Dončić | #77 | 欧洲胡子 |
| Celtics | Jayson Tatum | #0 | 瘦高 |
| Warriors | Stephen Curry | #30 | 邻家男孩,投篮姿势 |
| Nuggets | Nikola Jokić | #15 | 大块头慢热 |
| Mavericks | (transferred to LAL) | — | — |
| Thunder | Shai Gilgeous-Alexander | #2 | 加拿大冷酷 |
| Bucks | Giannis Antetokounmpo | #34 | 希腊怪兽肌肉 |
| 76ers | Joel Embiid | #21 | 喀麦隆中锋 |
| Suns | Devin Booker | #1 | 优雅射手 |
| Wolves | Anthony Edwards | #5 | 爆炸性 ANT |
| Heat | Tyler Herro / Bam | #14 / #13 | — |
| Cavs | Donovan Mitchell | #45 | 弹簧腿 |
| Grizzlies | Ja Morant | #12 | 闪电小后卫 |
| Hawks | Trae Young | #11 | 娃娃脸射手 |

---

## 8. 替代风格（可选,别一开始就跑这些,先把 §0 走通）

- **像素风** — `16-bit pixel art, 64×64, retro NBA Jam style`
- **复古卡牌** — `vintage trading card portrait, 1990s Topps NBA, foil edge`
- **手办拆盒** — `unboxed blind box figure photo, in clear plastic shell, partial wrap`
- **Q 版水彩** — `cute watercolor sticker, soft pastel, ink outline, chibi`

每种风格都要把 §0 末尾的透明背景三行带上,否则会出底色。
