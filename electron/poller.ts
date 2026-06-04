import * as https from 'https';

export type Mood = 'idle' | 'watch' | 'cheer' | 'sad' | 'flag' | 'sleep' | 'dance';
export type GameEvent = { mood: Mood; message: string; ttl?: number };

type PollerOptions = {
  favoriteTeams: string[];
  mode: 'live' | 'replay';
  onEvent: (ev: GameEvent) => void;
  onScore?: (s: ScoreState | null) => void;
  onWinProb?: (points: number[]) => void;
};

export type ScoreState = {
  matchId: string;
  myTeam: string;
  oppTeam: string;
  myTeamAbbr: string;
  oppTeamAbbr: string;
  myTeamLogo: string;
  oppTeamLogo: string;
  myScore: number;
  oppScore: number;
  status: string;
  statusText: string;
  period: number;
  clock: string;
  myIsHome: boolean;
  utcDate: string;                  // ISO start time, for countdown
  // Series / playoff context
  seriesSummary?: string;           // "NY leads series 1-0"
  seriesMyWins?: number;
  seriesOppWins?: number;
  seriesBestOf?: number;            // 7 for Finals, 5 for round 1
  gameNumber?: number;              // parsed from "Game N"
  gameHeadline?: string;            // "NBA Finals - Game 1"
};
let currentScore: ScoreState | null = null;
export function getCurrentScore(): ScoreState | null { return currentScore; }

const NBA_TEAMS = [
  'Atlanta Hawks','Boston Celtics','Brooklyn Nets','Charlotte Hornets','Chicago Bulls',
  'Cleveland Cavaliers','Dallas Mavericks','Denver Nuggets','Detroit Pistons',
  'Golden State Warriors','Houston Rockets','Indiana Pacers','LA Clippers',
  'Los Angeles Lakers','Memphis Grizzlies','Miami Heat','Milwaukee Bucks',
  'Minnesota Timberwolves','New Orleans Pelicans','New York Knicks',
  'Oklahoma City Thunder','Orlando Magic','Philadelphia 76ers','Phoenix Suns',
  'Portland Trail Blazers','Sacramento Kings','San Antonio Spurs','Toronto Raptors',
  'Utah Jazz','Washington Wizards',
];

const TEAM_ALIASES: Record<string, string[]> = {
  'san antonio spurs': ['spurs', 'sas', 'san antonio'],
  'new york knicks': ['knicks', 'nyk', 'new york'],
  'los angeles lakers': ['lakers', 'lal', 'la lakers'],
  'la clippers': ['clippers', 'lac'],
  'golden state warriors': ['warriors', 'gsw', 'golden state'],
  'boston celtics': ['celtics', 'bos'],
  'milwaukee bucks': ['bucks', 'mil'],
  'denver nuggets': ['nuggets', 'den'],
  'phoenix suns': ['suns', 'phx'],
  'dallas mavericks': ['mavericks', 'mavs', 'dal'],
  'oklahoma city thunder': ['thunder', 'okc'],
  'minnesota timberwolves': ['timberwolves', 'wolves', 'min'],
  'philadelphia 76ers': ['76ers', 'sixers', 'phi'],
  'cleveland cavaliers': ['cavaliers', 'cavs', 'cle'],
  'miami heat': ['heat', 'mia'],
  'brooklyn nets': ['nets', 'bkn'],
  'toronto raptors': ['raptors', 'tor'],
  'atlanta hawks': ['hawks', 'atl'],
  'chicago bulls': ['bulls', 'chi'],
  'memphis grizzlies': ['grizzlies', 'mem'],
  'new orleans pelicans': ['pelicans', 'nop'],
  'orlando magic': ['magic', 'orl'],
  'sacramento kings': ['kings', 'sac'],
  'portland trail blazers': ['blazers', 'trail blazers', 'por'],
  'utah jazz': ['jazz', 'utah'],
  'indiana pacers': ['pacers', 'ind'],
  'detroit pistons': ['pistons', 'det'],
  'charlotte hornets': ['hornets', 'cha'],
  'washington wizards': ['wizards', 'was'],
  'houston rockets': ['rockets', 'hou'],
};

type FallbackMatch = {
  id: number; home: string; away: string;
  homeScore: number; awayScore: number;
  stage: string; date: string;
};

const NBA_HIGHLIGHTS: FallbackMatch[] = [
  { id: 9_001, home: 'Boston Celtics', away: 'Dallas Mavericks', homeScore: 106, awayScore: 88, stage: '2024 总决赛 G5', date: '2024-06-17' },
  { id: 9_002, home: 'Denver Nuggets', away: 'Miami Heat',       homeScore: 94,  awayScore: 89, stage: '2023 总决赛 G5', date: '2023-06-12' },
  { id: 9_003, home: 'Golden State Warriors', away: 'Boston Celtics', homeScore: 103, awayScore: 90, stage: '2022 总决赛 G6', date: '2022-06-16' },
  { id: 9_004, home: 'Los Angeles Lakers', away: 'Miami Heat',  homeScore: 106, awayScore: 93, stage: '2020 总决赛 G6', date: '2020-10-11' },
  { id: 9_005, home: 'San Antonio Spurs', away: 'Miami Heat',   homeScore: 104, awayScore: 87, stage: '2014 总决赛 G5', date: '2014-06-15' },
  { id: 9_006, home: 'New York Knicks', away: 'Indiana Pacers',  homeScore: 101, awayScore: 97, stage: '常规赛',           date: '2024-02-10' },
];

let pollTimer: NodeJS.Timeout | null = null;
let replayTimer: NodeJS.Timeout | null = null;
let currentOptions: PollerOptions | null = null;
let lastSeenGameIds = new Set<number>();
let lastSeenPlayId = new Map<string, string>();
let lastSeenStatus = new Map<string, string>();
let lastEventAt = new Map<string, number>();  // last time we said anything about a match
let pendingEmits: NodeJS.Timeout[] = [];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export type LastGameSnapshot = {
  myTeam: string; oppTeam: string;
  myScore: number; oppScore: number;
  date: string; highlight: string;
  mood: 'cheer' | 'sad' | 'watch';
};
let lastGameSnapshot: LastGameSnapshot | null = null;

export function getLastGameSnapshot(): LastGameSnapshot | null { return lastGameSnapshot; }
export function getKnownTeams(): string[] { return [...NBA_TEAMS]; }

export function setFavoriteTeams(teams: string[]) {
  if (currentOptions) currentOptions.favoriteTeams = teams;
  lastSeenGameIds = new Set();
  lastSeenPlayId = new Map();
  lastSeenStatus = new Map();
  lastEventAt = new Map();
  pendingEmits.forEach(t => clearTimeout(t));
  pendingEmits = [];
  if (replayTimer) clearTimeout(replayTimer);
  setTimeout(() => tick().catch(() => {}), 800);
}

export function startPoller(opts: PollerOptions) {
  currentOptions = opts;
  setTimeout(() => tick().catch(() => {}), 1500);
  // Tight loop during live games so user feels the action
  const interval = opts.mode === 'live' ? 20_000 : 60_000;
  pollTimer = setInterval(() => { tick().catch(() => {}); }, interval);
}

export function stopPoller() {
  if (pollTimer) clearInterval(pollTimer);
  if (replayTimer) clearTimeout(replayTimer);
  pendingEmits.forEach(t => clearTimeout(t));
  pendingEmits = [];
  pollTimer = null;
  replayTimer = null;
}

// Force a poll immediately (e.g. user clicked the shrimp). 5s debounced so spam-clicks
// don't hammer ESPN.
let forceTickCooldownUntil = 0;
export function forceTick(): boolean {
  const now = Date.now();
  if (now < forceTickCooldownUntil) return false;
  forceTickCooldownUntil = now + 5000;
  tick().catch(() => {});
  return true;
}

// Last time we emitted a real game event (status transition or scoring play).
// Used by the click handler to decide whether to fire an info-bite instead.
let lastRealEventAt = 0;
export function getLastRealEventAt(): number { return lastRealEventAt; }

// Pull leaders/venue/news from the summary endpoint and return a single
// info-bite bubble (best for "user clicked during a quiet stretch").
export async function fetchInfoBite(): Promise<GameEvent | null> {
  const snap = currentScore;
  if (!snap) return null;
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${snap.matchId}`;
    const json = await httpGetJson(url);
    const options: GameEvent[] = [];

    // Leaders — top scorer/rebound/assist per team
    const catLabel = (s: string) =>
      s === 'Points' ? '得分' : s === 'Rebounds' ? '篮板' : s === 'Assists' ? '助攻' : s;
    for (const team of (json?.leaders ?? [])) {
      const tName = team?.team?.displayName ?? '';
      const isMy = teamMatches(tName, snap.myTeam.toLowerCase()) ||
                   teamMatches(snap.myTeam, tName.toLowerCase());
      const tLabel = isMy ? snap.myTeam : snap.oppTeam;
      for (const cat of (team?.leaders ?? [])) {
        const catName = cat?.displayName ?? '';
        const top = cat?.leaders?.[0];
        const ath = top?.athlete?.displayName;
        const val = top?.displayValue;
        if (ath && val) {
          options.push({
            mood: isMy ? 'cheer' : 'watch',
            message: `📊 ${tLabel} ${catLabel(catName)}王: ${ath} (${val})`,
            ttl: 6500,
          });
        }
      }
    }

    // Venue
    const venue = json?.gameInfo?.venue?.fullName;
    const city = json?.gameInfo?.venue?.address?.city;
    if (venue) {
      options.push({
        mood: 'idle',
        message: `🏟️ 这场在 ${venue}${city ? ' (' + city + ')' : ''}`,
        ttl: 5500,
      });
    }

    // Win probability — surface only at clutch moments
    const wp = json?.winprobability ?? [];
    if (wp.length > 0 && snap.status === 'STATUS_IN_PROGRESS') {
      const last = wp[wp.length - 1];
      const homeWin = Number(last?.homeWinPercentage ?? 0.5);
      const myWin = snap.myIsHome ? homeWin : 1 - homeWin;
      const pct = Math.round(myWin * 100);
      if (pct >= 80) {
        options.push({ mood: 'dance', message: `📈 ${snap.myTeam} 胜率 ${pct}%, 稳了!`, ttl: 6500 });
      } else if (pct <= 20) {
        options.push({ mood: 'sad', message: `📉 ${snap.myTeam} 胜率只剩 ${pct}%, 别放弃!`, ttl: 6500 });
      } else if (pct >= 45 && pct <= 55) {
        options.push({ mood: 'watch', message: `⚖️ 胜率 ${pct}% / ${100-pct}%, 五五开,屏住呼吸`, ttl: 6500 });
      }
    }

    // News headline (if any recent article)
    const articles = json?.news?.articles ?? [];
    if (articles.length > 0) {
      const a = articles[0];
      options.push({
        mood: 'watch',
        message: `📰 ${(a?.headline ?? '').slice(0, 50)}`,
        ttl: 7500,
      });
    }

    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)];
  } catch {
    return null;
  }
}

function emit(ev: GameEvent, matchId: string) {
  if (!currentOptions) return;
  currentOptions.onEvent(ev);
  lastEventAt.set(matchId, Date.now());
  lastRealEventAt = Date.now();
}
function scheduleEmit(ev: GameEvent, matchId: string, delayMs: number) {
  const t = setTimeout(() => {
    emit(ev, matchId);
    pendingEmits = pendingEmits.filter(x => x !== t);
  }, delayMs);
  pendingEmits.push(t);
}

async function tick() {
  if (!currentOptions) return;
  if (currentOptions.mode === 'live') await tickLive().catch(() => {});
  else await tickReplay().catch(() => {});
}

// =====================================================================
// REPLAY MODE — canned NBA highlights
// =====================================================================
async function tickReplay() {
  if (!currentOptions) return;
  const matches = [...NBA_HIGHLIGHTS].sort(() => Math.random() - 0.5);
  const fav = currentOptions.favoriteTeams.map(t => t.toLowerCase());
  const favMatch =
    matches.find(m => fav.some(f => teamMatches(m.home, f) || teamMatches(m.away, f))) ??
    matches[0];

  if (lastSeenGameIds.has(favMatch.id)) return;
  lastSeenGameIds.add(favMatch.id);
  startReplay(favMatch, fav);
}

function startReplay(match: FallbackMatch, favLower: string[]) {
  if (!currentOptions) return;
  const onEvent = currentOptions.onEvent;
  const myIsHome = favLower.some(f => teamMatches(match.home, f));
  const myTeam = myIsHome ? match.home : match.away;
  const oppTeam = myIsHome ? match.away : match.home;
  const myScore = myIsHome ? match.homeScore : match.awayScore;
  const oppScore = myIsHome ? match.awayScore : match.homeScore;
  const won = myScore > oppScore;
  const draw = myScore === oppScore;

  lastGameSnapshot = {
    myTeam, oppTeam, myScore, oppScore,
    date: new Date().toLocaleDateString('zh-CN'),
    highlight: won ? `${match.stage}・${myTeam} 顶住压力拿下!` :
               draw ? `${match.stage}・${myTeam} 战平 ${oppTeam}` :
                      `${match.stage}・没顶住,明天再来!`,
    mood: won ? 'cheer' : draw ? 'watch' : 'sad',
  };

  const beats: GameEvent[] = [
    { mood: 'flag', message: `🏀 ${match.stage}・${myTeam} vs ${oppTeam} 跳球开战!虾仔抱好爆米花` },
    { mood: 'watch', message: `Q1 开打, ${myTeam} 试探节奏` },
    { mood: 'cheer', message: `🔥 ${myTeam} 一个三分,士气高昂` },
    { mood: 'sad', message: `💢 对面 ${oppTeam} 反扑了一波,要稳住` },
    { mood: 'watch', message: `⏸️ 半场战罢` },
    { mood: 'watch', message: `Q3 末段, ${myTeam} ${myScore > oppScore ? '建立优势' : '咬住比分'}` },
    won
      ? { mood: 'dance', message: `🏆 终场! ${myTeam} ${myScore} - ${oppScore} ${oppTeam}, 赢了!虾仔蹦迪 🦐💃` }
      : draw
      ? { mood: 'watch', message: `🤝 终场战平 ${myTeam} ${myScore} - ${oppScore} ${oppTeam}` }
      : { mood: 'sad', message: `😭 终场 ${myTeam} ${myScore} - ${oppScore} ${oppTeam}, 惜败` },
  ];

  let i = 0;
  const next = () => {
    if (!currentOptions) return;
    if (i >= beats.length) return;
    onEvent(beats[i]);
    i++;
    replayTimer = setTimeout(next, 9_000 + Math.random() * 3000);
  };
  next();
}

// =====================================================================
// LIVE MODE — ESPN public NBA API
// =====================================================================
type EspnEvent = {
  id: string;
  home: string; away: string;
  homeAbbr: string; awayAbbr: string;
  homeLogo: string; awayLogo: string;
  homeId: string; awayId: string;
  homeScore: number; awayScore: number;
  status: string; statusText: string;
  period: number; clock: string; utcDate: string;
  seriesSummary?: string;
  seriesWinsByTeamId?: Record<string, number>;
  seriesBestOf?: number;
  gameNumber?: number;
  gameHeadline?: string;
};

type EspnPlay = {
  id: string;
  text: string;
  scoringPlay: boolean;
  homeScore: number; awayScore: number;
  teamId?: string;
  typeText: string;
  period: number; clock: string;
};

async function tickLive() {
  if (!currentOptions) return;
  const onEvent = currentOptions.onEvent;
  const fav = currentOptions.favoriteTeams.map(t => t.toLowerCase());

  let matches: EspnEvent[] = [];
  try { matches = await fetchEspnScoreboard(); } catch { return; }
  if (!matches.length) return;

  const relevant = matches.filter(m =>
    fav.some(f => teamMatches(m.home, f) || teamMatches(m.away, f))
  );

  if (relevant.length === 0) {
    if (currentScore) {
      currentScore = null;
      currentOptions.onScore?.(null);
    }
    const sentinelKey = 999_000 + new Date().getUTCDate();
    if (!lastSeenGameIds.has(sentinelKey)) {
      lastSeenGameIds.add(sentinelKey);
      const next = matches.find(m => m.status === 'STATUS_SCHEDULED' || m.status === 'STATUS_IN_PROGRESS');
      const fallbackName = currentOptions.favoriteTeams[0] ?? 'Spurs';
      onEvent({
        mood: 'idle',
        message: next
          ? `🌙 ${fallbackName} 今天没比赛~ 联盟在打 ${next.home} vs ${next.away}`
          : `🌙 ${fallbackName} 今天没比赛~ 虾仔陪你工作`,
        ttl: 6000,
      });
    }
    return;
  }

  // Broadcast the BEST current live match as the persistent scoreboard.
  // Priority: IN_PROGRESS > END_PERIOD > HALFTIME > FINAL today > SCHEDULED today.
  const priorityRank = (s: string) =>
    s === 'STATUS_IN_PROGRESS' ? 0 :
    s === 'STATUS_END_PERIOD' ? 1 :
    s === 'STATUS_HALFTIME' ? 2 :
    s === 'STATUS_FINAL' || s === 'STATUS_END_OF_GAME' ? 3 :
    s === 'STATUS_SCHEDULED' ? 4 : 5;
  const sorted = [...relevant].sort((a, b) => priorityRank(a.status) - priorityRank(b.status));
  const best = sorted[0];
  if (best) {
    const bestMyHome = fav.some(f => teamMatches(best.home, f));
    const myId = bestMyHome ? best.homeId : best.awayId;
    const oppId = bestMyHome ? best.awayId : best.homeId;
    const newScore: ScoreState = {
      matchId: best.id,
      myTeam: bestMyHome ? best.home : best.away,
      oppTeam: bestMyHome ? best.away : best.home,
      myTeamAbbr: bestMyHome ? best.homeAbbr : best.awayAbbr,
      oppTeamAbbr: bestMyHome ? best.awayAbbr : best.homeAbbr,
      myTeamLogo: bestMyHome ? best.homeLogo : best.awayLogo,
      oppTeamLogo: bestMyHome ? best.awayLogo : best.homeLogo,
      myScore: bestMyHome ? best.homeScore : best.awayScore,
      oppScore: bestMyHome ? best.awayScore : best.homeScore,
      status: best.status,
      statusText: best.statusText,
      period: best.period,
      clock: best.clock,
      myIsHome: bestMyHome,
      utcDate: best.utcDate,
      seriesSummary: best.seriesSummary,
      seriesMyWins: best.seriesWinsByTeamId?.[myId],
      seriesOppWins: best.seriesWinsByTeamId?.[oppId],
      seriesBestOf: best.seriesBestOf,
      gameNumber: best.gameNumber,
      gameHeadline: best.gameHeadline,
    };
    currentScore = newScore;
    currentOptions.onScore?.(newScore);
  }

  for (const m of relevant) {
    const prevStatus = lastSeenStatus.get(m.id);
    lastSeenStatus.set(m.id, m.status);
    const myIsHome = fav.some(f => teamMatches(m.home, f));
    const myTeam = myIsHome ? m.home : m.away;
    const oppTeam = myIsHome ? m.away : m.home;
    const myTeamId = myIsHome ? m.homeId : m.awayId;
    const myScore = myIsHome ? m.homeScore : m.awayScore;
    const oppScore = myIsHome ? m.awayScore : m.homeScore;

    // ============= First sighting — describe CURRENT state honestly =============
    if (prevStatus === undefined) {
      const localTime = new Date(m.utcDate).toLocaleString('zh-CN', {
        hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit',
      });
      if (m.status === 'STATUS_SCHEDULED') {
        emit({ mood: 'flag', message: `📅 ${localTime} ${myTeam} vs ${oppTeam}, 锁定时间`, ttl: 6000 }, m.id);
      } else if (m.status === 'STATUS_IN_PROGRESS') {
        emit({
          mood: 'watch',
          message: `👀 接上比赛: Q${m.period} ${m.clock} | ${myTeam} ${myScore} - ${oppScore} ${oppTeam}`,
          ttl: 6000,
        }, m.id);
      } else if (m.status === 'STATUS_HALFTIME') {
        emit({ mood: 'sleep', message: `💤 半场休息 | ${myTeam} ${myScore} - ${oppScore} ${oppTeam}`, ttl: 6000 }, m.id);
      } else if (m.status === 'STATUS_END_PERIOD') {
        emit({ mood: 'watch', message: `⏸️ Q${m.period} 结束 | ${myTeam} ${myScore} - ${oppScore} ${oppTeam}`, ttl: 6000 }, m.id);
      } else if (m.status === 'STATUS_FINAL' || m.status === 'STATUS_END_OF_GAME') {
        const won = myScore > oppScore;
        emit({
          mood: won ? 'cheer' : myScore === oppScore ? 'watch' : 'sad',
          message: `📰 已结束: ${myTeam} ${myScore} - ${oppScore} ${oppTeam}`,
          ttl: 6000,
        }, m.id);
      }
    }

    // ============= Status transitions =============
    if (prevStatus !== undefined && prevStatus !== m.status) {
      if (m.status === 'STATUS_IN_PROGRESS') {
        if (prevStatus === 'STATUS_HALFTIME') {
          emit({ mood: 'flag', message: pick([
            `▶️ 下半场开打! ${myTeam} ${myScore} - ${oppScore} ${oppTeam}`,
            `🏀 第三节继续! ${myTeam} ${myScore} - ${oppScore}`,
            `🔥 中场歇够了, Q3 走起!`,
          ]), ttl: 5500 }, m.id);
        } else if (prevStatus === 'STATUS_END_PERIOD') {
          emit({ mood: 'flag', message: pick([
            `▶️ Q${m.period} 开打! ${myTeam} ${myScore} - ${oppScore} ${oppTeam}`,
            `🏀 第${m.period}节继续战斗!`,
          ]), ttl: 5500 }, m.id);
        } else if (prevStatus === 'STATUS_SCHEDULED') {
          emit({ mood: 'flag', message: pick([
            `🏀 跳球! ${myTeam} vs ${oppTeam} 开打!`,
            `🚨 ${myTeam} vs ${oppTeam} 正式开赛!`,
            `🔥 ${myTeam} vs ${oppTeam} 全场屏息!`,
          ]), ttl: 6000 }, m.id);
        }
      } else if (m.status === 'STATUS_HALFTIME') {
        emit({ mood: 'sleep', message: pick([
          `💤 半场 ${myTeam} ${myScore} - ${oppScore} ${oppTeam}, 喘口气`,
          `🛋️ 中场了, ${myTeam} ${myScore} - ${oppScore} ${oppTeam}`,
          `🍿 半场, 补点爆米花, ${myScore}-${oppScore}`,
        ]), ttl: 6000 }, m.id);
      } else if (m.status === 'STATUS_END_PERIOD') {
        const tag = myScore > oppScore ? '(领先)' : myScore < oppScore ? '(落后)' : '(打平)';
        const diff = Math.abs(myScore - oppScore);
        emit({ mood: 'watch', message: pick([
          `⏸️ Q${m.period} 结束 ${myTeam} ${myScore} - ${oppScore} ${oppTeam} ${tag}`,
          `📊 Q${m.period} 战罢, 分差 ${diff} 分 ${tag}`,
          `⏳ 第${m.period}节结束 ${myScore}-${oppScore}`,
        ]), ttl: 5500 }, m.id);
      } else if (m.status === 'STATUS_FINAL' || m.status === 'STATUS_END_OF_GAME') {
        const won = myScore > oppScore;
        const draw = myScore === oppScore;
        emit({
          mood: won ? 'dance' : draw ? 'watch' : 'sad',
          message: won
            ? pick([
                `🏆 终场! ${myTeam} ${myScore} - ${oppScore} ${oppTeam}, 赢了! 🦐💃`,
                `🎉 ${myTeam} 拿下! 终分 ${myScore}-${oppScore}, 蹦迪!`,
                `🥇 ${myTeam} ${myScore}-${oppScore} ${oppTeam}, 胜利时刻!`,
              ])
            : draw
            ? `🤝 终场战平 ${myTeam} ${myScore} - ${oppScore} ${oppTeam}`
            : pick([
                `😭 终场 ${myTeam} ${myScore} - ${oppScore} ${oppTeam}, 惜败`,
                `💔 ${myTeam} 输了 ${myScore}-${oppScore}, 明天再战`,
                `😩 终场 ${myScore}-${oppScore}, 真的差一口气`,
              ]),
          ttl: 7500,
        }, m.id);
        lastGameSnapshot = {
          myTeam, oppTeam, myScore, oppScore,
          date: new Date().toLocaleDateString('zh-CN'),
          highlight: won ? `${myTeam} 顶住压力拿下!` :
                     draw ? `${myTeam} 战平 ${oppTeam}` :
                            `${myTeam} 惜败 ${oppTeam}`,
          mood: won ? 'cheer' : draw ? 'watch' : 'sad',
        };
      }
    }

    // ============= Live play-by-play =============
    if (m.status === 'STATUS_IN_PROGRESS' ||
        m.status === 'STATUS_END_PERIOD' ||
        m.status === 'STATUS_HALFTIME') {
      let plays: EspnPlay[] = [];
      try {
        const r = await fetchEspnPlays(m.id);
        plays = r.plays;
        // Re-orient winprob to MY team perspective (ESPN gives home-pct)
        const myPct = myIsHome ? r.winProb : r.winProb.map(p => 1 - p);
        if (myPct.length > 0) currentOptions.onWinProb?.(myPct);
      } catch { continue; }

      const lastSeenId = lastSeenPlayId.get(m.id);
      const newScoring = collectNewScoringPlays(plays, lastSeenId);
      if (plays.length > 0) {
        lastSeenPlayId.set(m.id, plays[plays.length - 1].id);
      }

      // Emit ALL new scoring plays (cap at 3 per poll to avoid flood), spaced 4s apart
      const toEmit = newScoring.slice(-3);
      let delay = 600;
      for (const play of toEmit) {
        const ev = playToGameEvent(
          play, myTeamId, myTeam, oppTeam,
          play.homeScore, play.awayScore, myIsHome
        );
        if (ev) scheduleEmit(ev, m.id, delay);
        delay += 4500;
      }

      // Heartbeat: nothing said for >2 min and game is in progress → status check
      if (toEmit.length === 0 && m.status === 'STATUS_IN_PROGRESS') {
        const idleMs = Date.now() - (lastEventAt.get(m.id) ?? 0);
        if (idleMs > 120_000) {
          const lead = myScore > oppScore ? `领先 ${myScore - oppScore}` :
                       myScore < oppScore ? `落后 ${oppScore - myScore}` : '战平';
          emit({
            mood: 'watch',
            message: pick([
              `📊 Q${m.period} ${m.clock} | ${myTeam} ${myScore} - ${oppScore} ${oppTeam}, ${lead}`,
              `👀 Q${m.period} ${m.clock}, 比分 ${myScore}-${oppScore} (${lead})`,
              `🏀 还在打 Q${m.period}, ${myTeam} ${myScore} - ${oppScore} ${oppTeam}`,
            ]),
            ttl: 5500,
          }, m.id);
        }
      }

      // Keep snapshot fresh for card export
      const my = myIsHome ? m.homeScore : m.awayScore;
      const opp = myIsHome ? m.awayScore : m.homeScore;
      lastGameSnapshot = {
        myTeam, oppTeam, myScore: my, oppScore: opp,
        date: new Date().toLocaleDateString('zh-CN'),
        highlight: `${myTeam} ${my} - ${opp} ${oppTeam} (Q${m.period} ${m.clock})`,
        mood: my >= opp ? 'cheer' : 'sad',
      };
    }
  }
}

function collectNewScoringPlays(plays: EspnPlay[], lastSeenId: string | undefined): EspnPlay[] {
  if (!lastSeenId) {
    return plays.filter(p => p.scoringPlay).slice(-1);
  }
  const idx = plays.findIndex(p => p.id === lastSeenId);
  if (idx < 0) return plays.filter(p => p.scoringPlay).slice(-1);
  return plays.slice(idx + 1).filter(p => p.scoringPlay);
}

function playToGameEvent(
  play: EspnPlay,
  myTeamId: string,
  myTeam: string,
  oppTeam: string,
  homeScore: number,
  awayScore: number,
  myIsHome: boolean,
): GameEvent | null {
  const isMyTeam = play.teamId === myTeamId;
  const isThree = /three point|three-pointer/i.test(play.text);
  const isDunk = /dunk/i.test(play.text);
  const isFT = /free throw/i.test(play.text);
  const isLayup = /layup/i.test(play.text);
  const scorer = parsePlayerName(play.text);
  const my = myIsHome ? homeScore : awayScore;
  const opp = myIsHome ? awayScore : homeScore;

  let prefix: string;
  if (isThree) {
    prefix = isMyTeam
      ? pick(['🔥 三分球!', '🎯 外线开火!', '💥 三分命中!', '⛹️ 大号三分!'])
      : pick(['😬 对面三分', '🥶 被三分了', '😤 又一记三分']);
  } else if (isDunk) {
    prefix = isMyTeam
      ? pick(['🔨 暴扣!', '💪 隔扣!', '🚀 飞起来扣!'])
      : pick(['😱 被扣了!', '💥 对面暴扣', '😣 被隔扣']);
  } else if (isFT) {
    prefix = isMyTeam
      ? pick(['🆓 罚球进', '✅ 站上罚球线得分', '🎯 一罚一中'])
      : pick(['🆓 对面罚球进', '⚠️ 对面加 1', '🥶 罚球被对面罚进']);
  } else if (isLayup) {
    prefix = isMyTeam
      ? pick(['🪜 上篮得手!', '🏀 突破上篮!', '🎯 篮下打成'])
      : pick(['💢 对面上篮', '🥶 被打篮下']);
  } else {
    prefix = isMyTeam
      ? pick(['⛹️ 得分!', '🎯 命中!', '🏀 得手!'])
      : pick(['💢 失分', '😤 对面进了', '🥶 又被打成']);
  }

  const scoreStr = `${myTeam} ${my} - ${opp} ${oppTeam}`;
  const message = scorer
    ? `${prefix} ${scorer} | ${scoreStr}`
    : `${prefix} ${scoreStr}`;

  const mood: Mood = isMyTeam
    ? (isThree || isDunk ? 'dance' : 'cheer')
    : 'sad';

  return { mood, message, ttl: isThree || isDunk ? 7000 : 5500 };
}

function parsePlayerName(text: string): string | null {
  const m = text.match(/^([A-ZÀ-Ž][\p{L}'.\-]+(?:\s+[A-ZÀ-Ž][\p{L}'.\-]+){0,3})\s+(makes|misses|hits|drains|throws|dunks|blocks|steals)/u);
  return m ? m[1] : null;
}

async function fetchEspnScoreboard(): Promise<EspnEvent[]> {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
  const json = await httpGetJson(url);
  const out: EspnEvent[] = [];
  for (const ev of (json?.events ?? [])) {
    const comp = ev?.competitions?.[0];
    if (!comp) continue;
    const cs = comp?.competitors ?? [];
    if (cs.length < 2) continue;
    const home = cs.find((c: any) => c.homeAway === 'home') ?? cs[0];
    const away = cs.find((c: any) => c.homeAway === 'away') ?? cs[1];
    const status = ev?.status?.type ?? {};

    // Series / playoff data
    const ser = comp?.series;
    let seriesWinsByTeamId: Record<string, number> | undefined;
    if (ser?.competitors?.length) {
      seriesWinsByTeamId = {};
      for (const sc of ser.competitors) {
        seriesWinsByTeamId[String(sc.id)] = Number(sc.wins ?? 0);
      }
    }
    // Game number from notes headline "NBA Finals - Game 1"
    let gameNumber: number | undefined;
    let gameHeadline: string | undefined;
    for (const note of (comp?.notes ?? [])) {
      if (note?.headline) {
        gameHeadline = note.headline;
        const m = String(note.headline).match(/Game\s+(\d+)/i);
        if (m) gameNumber = Number(m[1]);
        break;
      }
    }

    out.push({
      id: String(ev.id),
      home: home?.team?.displayName ?? '?',
      away: away?.team?.displayName ?? '?',
      homeAbbr: home?.team?.abbreviation ?? '?',
      awayAbbr: away?.team?.abbreviation ?? '?',
      homeLogo: home?.team?.logo ?? '',
      awayLogo: away?.team?.logo ?? '',
      homeId: String(home?.team?.id ?? ''),
      awayId: String(away?.team?.id ?? ''),
      homeScore: Number(home?.score ?? 0),
      awayScore: Number(away?.score ?? 0),
      status: status?.name ?? 'STATUS_SCHEDULED',
      statusText: status?.description ?? '',
      period: Number(ev?.status?.period ?? 0),
      clock: ev?.status?.displayClock ?? '',
      utcDate: ev?.date ?? '',
      seriesSummary: ser?.summary,
      seriesWinsByTeamId,
      seriesBestOf: ser?.totalCompetitions ? Number(ser.totalCompetitions) : undefined,
      gameNumber,
      gameHeadline,
    });
  }
  return out;
}

async function fetchEspnPlays(eventId: string): Promise<{ plays: EspnPlay[]; winProb: number[] }> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`;
  const json = await httpGetJson(url);
  const out: EspnPlay[] = [];
  for (const p of (json?.plays ?? [])) {
    out.push({
      id: String(p.id),
      text: p?.text ?? '',
      scoringPlay: !!p?.scoringPlay,
      homeScore: Number(p?.homeScore ?? 0),
      awayScore: Number(p?.awayScore ?? 0),
      teamId: p?.team?.id ? String(p.team.id) : undefined,
      typeText: p?.type?.text ?? '',
      period: Number(p?.period?.number ?? 0),
      clock: p?.clock?.displayValue ?? '',
    });
  }
  // Win probability: take last 30 points (home win pct, 0..1)
  const wpRaw = (json?.winprobability ?? []) as any[];
  const wpHomePct = wpRaw.map(p => Number(p?.homeWinPercentage ?? 0.5));
  const step = Math.max(1, Math.floor(wpHomePct.length / 30));
  const winProb: number[] = [];
  for (let i = 0; i < wpHomePct.length; i += step) winProb.push(wpHomePct[i]);
  if (wpHomePct.length && winProb[winProb.length - 1] !== wpHomePct[wpHomePct.length - 1]) {
    winProb.push(wpHomePct[wpHomePct.length - 1]);
  }
  return { plays: out, winProb };
}

function teamMatches(teamA: string, queryLower: string): boolean {
  const a = teamA.toLowerCase();
  if (a.includes(queryLower) || queryLower.includes(a)) return true;
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    const group = [canonical, ...aliases];
    if (group.some(g => a.includes(g)) && group.some(g => queryLower.includes(g) || g.includes(queryLower))) {
      return true;
    }
  }
  return false;
}

function httpGetJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'FanShrimp-NBA/0.1' } }, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(new Error('timeout')); });
  });
}
