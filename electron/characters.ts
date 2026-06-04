import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export type Mood = 'idle' | 'watch' | 'cheer' | 'sad' | 'flag' | 'sleep' | 'dance';
const ALL_MOODS: Mood[] = ['idle','watch','cheer','sad','flag','sleep','dance'];

export type CharacterPack = {
  id: string;                        // folder name
  name: string;                      // display name
  author?: string;
  builtin?: boolean;
  // file URL for each mood; if missing, renderer falls back to default emoji
  frames: Partial<Record<Mood, string>>;
};

export const DEFAULT_PACK_ID = 'default-shrimp';

export function charactersDir(): string {
  return path.join(app.getPath('userData'), 'characters');
}

export function ensureCharactersDir(): void {
  const dir = charactersDir();
  fs.mkdirSync(dir, { recursive: true });

  // Drop a README the first time so the user knows the spec
  const readme = path.join(dir, 'README.txt');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(readme,
`篮球虾仔 · 自定义角色包格式
=================================

每个角色包是这个文件夹里的一个子文件夹。

子文件夹结构（最简单的版本）：

  my-character/
    pack.json
    idle.png
    watch.png
    cheer.png
    sad.png
    flag.png
    sleep.png
    dance.png

pack.json 示例：
{
  "name": "梅西公仔",
  "author": "你的名字"
}

PNG 规范：
  - 推荐尺寸: 220×220 (与窗口同尺寸；任意尺寸都会被居中缩放)
  - 必须是 PNG 且透明背景
  - 角色应该居中
  - 缺哪张图就会 fallback 回默认虾仔表情

七种心情对应场景：
  idle  - 待机摸鱼
  watch - 看球中（专注）
  cheer - 庆祝（兴奋、举手）
  sad   - 难过（低头、流泪）
  flag  - 摇旗呐喊（兴奋、举旗）
  sleep - 打盹（闭眼）
  dance - 蹦迪（手舞足蹈）

提示：可以只画 1 张 idle.png，其他不放，系统会用默认 emoji 顶上。
`);
  }
}

export function listPacks(): CharacterPack[] {
  ensureCharactersDir();
  const dir = charactersDir();
  const packs: CharacterPack[] = [{
    id: DEFAULT_PACK_ID,
    name: '🦐 默认虾仔（emoji）',
    builtin: true,
    frames: {},
  }];

  let entries: string[] = [];
  try { entries = fs.readdirSync(dir); } catch { return packs; }

  for (const entry of entries) {
    const folder = path.join(dir, entry);
    let stat: fs.Stats;
    try { stat = fs.statSync(folder); } catch { continue; }
    if (!stat.isDirectory()) continue;

    const metaPath = path.join(folder, 'pack.json');
    let meta: any = {};
    try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')); } catch { /* optional */ }

    const frames: Partial<Record<Mood, string>> = {};
    for (const mood of ALL_MOODS) {
      const candidate = path.join(folder, `${mood}.png`);
      if (fs.existsSync(candidate)) {
        frames[mood] = `file://${candidate}`;
      }
    }
    // Allow single-image packs (e.g. country flags): any .png in folder becomes idle.
    if (!frames.idle) {
      const anyPng = (fs.readdirSync(folder).find(f => f.toLowerCase().endsWith('.png')));
      if (anyPng) frames.idle = `file://${path.join(folder, anyPng)}`;
    }
    if (Object.keys(frames).length === 0) continue;
    // Fill missing moods with idle as fallback so the renderer always has something.
    if (frames.idle) {
      for (const mood of ALL_MOODS) {
        if (!frames[mood]) frames[mood] = frames.idle;
      }
    }

    packs.push({
      id: entry,
      name: meta.name ?? entry,
      author: meta.author,
      frames,
    });
  }
  return packs;
}

export function packById(id: string): CharacterPack | null {
  return listPacks().find(p => p.id === id) ?? null;
}
