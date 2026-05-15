import { useDashboardData } from '../hooks/useData';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Timeline() {
  const { data, loading } = useDashboardData();

  if (loading || !data) return null;

  const dailyMap = new Map<string, { date: string; conversations: number; entries: number }>();
  data.conversations.forEach((conv) => {
    const existing = dailyMap.get(conv.date) || { date: conv.date, conversations: 0, entries: 0 };
    existing.conversations++;
    existing.entries += conv.entries.length;
    dailyMap.set(conv.date, existing);
  });
  const chartData = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  const sorted = [...data.conversations].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">对话时间线</h1>

      <div className="bg-surface-alt rounded-xl p-5 border border-border-subtle mb-8">
        <h2 className="text-lg font-semibold mb-4">每日活动趋势</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Bar dataKey="entries" fill="#6366f1" radius={[4, 4, 0, 0]} name="消息数" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="relative pl-8 border-l-2 border-border-subtle space-y-6">
        {sorted.map((conv) => (
          <div key={conv.id} className="relative">
            <div className="absolute top-1 -left-[calc(2rem+5px)] w-2.5 h-2.5 rounded-full bg-accent border-2 border-surface" />
            <Link
              to={`/conversation/${conv.id}`}
              className="block bg-surface-alt rounded-xl p-4 border border-border-subtle hover:border-accent/40 transition-colors"
            >
              <div className="text-text-secondary text-xs mb-1">{conv.date}</div>
              <h3 className="font-semibold">{conv.title}</h3>
              <p className="text-text-secondary text-sm mt-1">{conv.entries.length} 条消息</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
