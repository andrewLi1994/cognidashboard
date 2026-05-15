import { useDashboardData } from '../hooks/useData';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'];

export default function Topics() {
  const { data, loading } = useDashboardData();

  if (loading || !data) return null;

  const allTags = data.conversations.flatMap((c) => c.tags);
  const tagCounts = [...new Set(allTags)]
    .map((name) => ({ name, count: allTags.filter((t) => t === name).length }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">话题图谱</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-alt rounded-xl p-5 border border-border-subtle">
          <h2 className="text-lg font-semibold mb-4">话题分布</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={tagCounts}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={({ name, count }: any) => `${name} (${count})`}
              >
                {tagCounts.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">标签详情</h2>
          {tagCounts.map(({ name, count }) => (
            <div key={name} className="bg-surface-alt rounded-xl p-4 border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{name}</span>
                <span className="text-accent-alt text-sm font-medium">{count} 次对话</span>
              </div>
              <div className="w-full bg-surface rounded-full h-1.5">
                <div
                  className="bg-accent h-1.5 rounded-full transition-all"
                  style={{ width: `${(count / data.conversations.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
