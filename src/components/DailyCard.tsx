import { useEffect, useState } from 'react';

type CardData = {
  date: string;
  myTeam: string;
  oppTeam: string;
  myTeamLogo?: string;
  oppTeamLogo?: string;
  myScore: number;
  oppScore: number;
  highlight: string;
  mood: 'cheer' | 'sad' | 'watch';
  todayMs?: number;
  sessionMs?: number;
  status?: string;     // STATUS_IN_PROGRESS / STATUS_FINAL / ...
  period?: number;
  clock?: string;
};

function statusBadge(d: CardData): string {
  if (!d.status) return '';
  if (d.status === 'STATUS_IN_PROGRESS') return `Q${d.period ?? '?'} ${d.clock ?? ''} 进行中`;
  if (d.status === 'STATUS_HALFTIME') return '半场';
  if (d.status === 'STATUS_END_PERIOD') return `Q${d.period ?? '?'} 末`;
  if (d.status === 'STATUS_FINAL' || d.status === 'STATUS_END_OF_GAME') return '终场';
  if (d.status === 'STATUS_SCHEDULED') return '未开赛';
  return '';
}

function fmtMs(ms?: number): string {
  if (!ms || ms <= 0) return '— —';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${total}s`;
}

export function DailyCard({ data }: { data: CardData }) {
  const won = data.myScore > data.oppScore;
  const moodEmoji = won ? '🎉' : data.myScore === data.oppScore ? '🤝' : '😭';
  const tagline = won
    ? '虾仔今天笑开花'
    : data.myScore === data.oppScore
    ? '虾仔感觉有点暧昧'
    : '虾仔今天哭哭';

  return (
    <div className="card-stage">
      <div className="card">
        <div className="card-header">
          <div className="card-date">{data.date}</div>
          <div className="card-title">🏀 篮球虾仔 · 今日战报</div>
        </div>

        <div className="card-score">
          <div className="team">
            {data.myTeamLogo && (
              <img className="team-logo" src={data.myTeamLogo} alt={data.myTeam} crossOrigin="anonymous" />
            )}
            <div className="team-name">{data.myTeam}</div>
            <div className={`team-score ${won ? 'win' : ''}`}>{data.myScore}</div>
          </div>
          <div className="vs">
            <div className="vs-label">VS</div>
            {statusBadge(data) && <div className="vs-status">{statusBadge(data)}</div>}
          </div>
          <div className="team">
            {data.oppTeamLogo && (
              <img className="team-logo" src={data.oppTeamLogo} alt={data.oppTeam} crossOrigin="anonymous" />
            )}
            <div className="team-name">{data.oppTeam}</div>
            <div className={`team-score ${!won && data.myScore !== data.oppScore ? 'win' : ''}`}>{data.oppScore}</div>
          </div>
        </div>

        <div className="card-shrimp">
          <div className={`big-emoji mood-${data.mood}`}>🦐</div>
          <div className="big-mood-emoji">{moodEmoji}</div>
        </div>

        <div className="card-highlight">"{data.highlight}"</div>

        <div className="card-tagline">{tagline}</div>

        <div className="card-stats">
          <div>
            <div className="stat-label">本次陪伴</div>
            <div className="stat-value">{fmtMs(data.sessionMs)}</div>
          </div>
          <div>
            <div className="stat-label">今日累计</div>
            <div className="stat-value">{fmtMs(data.todayMs)}</div>
          </div>
        </div>

        <div className="card-footer">
          篮球虾仔 · 你的桌面看球搭子 · FanShrimp NBA
        </div>
      </div>
    </div>
  );
}

export function DailyCardRoute({ encoded }: { encoded: string }) {
  const [data, setData] = useState<CardData | null>(null);
  useEffect(() => {
    try {
      setData(JSON.parse(encoded));
    } catch {
      setData({
        date: new Date().toLocaleDateString('zh-CN'),
        myTeam: 'San Antonio Spurs',
        oppTeam: 'New York Knicks',
        myScore: 0,
        oppScore: 0,
        highlight: '今天没比赛,虾仔陪你工作',
        mood: 'cheer',
      });
    }
  }, [encoded]);
  if (!data) return null;
  return <DailyCard data={data} />;
}
