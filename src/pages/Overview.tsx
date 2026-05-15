import { Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useData';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface-alt rounded-xl p-5 border border-border-subtle hover:border-accent/30 transition-colors">
      <div className="text-text-secondary text-sm mb-1">{label}</div>
      <div className="text-3xl font-bold text-accent-alt">{value}</div>
      {sub && <div className="text-text-secondary text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const { data, loading } = useDashboardData();

  if (loading) return <div className="text-text-secondary py-8">加载中...</div>;
  if (!data) return <div className="text-text-secondary py-8">暂无数据</div>;

  const totalEntries = data.conversations.reduce((sum, c) => sum + c.entries.length, 0);
  const totalUserEntries = data.conversations.reduce(
    (sum, c) => sum + c.entries.filter((e) => e.role === 'user').length, 0
  );
  const totalAssistantEntries = totalEntries - totalUserEntries;
  const allTags = data.conversations.flatMap((c) => c.tags);
  const uniqueTags = [...new Set(allTags)];
  const topTags = [...new Set(allTags)]
    .map((tag) => ({ tag, count: allTags.filter((t) => t === tag).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">认知概览</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="总对话" value={data.conversations.length} />
        <StatCard label="总消息" value={totalEntries} sub={`${totalUserEntries} 条输入 · ${totalAssistantEntries} 条回复`} />
        <StatCard label="话题标签" value={uniqueTags.length} sub="去重后" />
        <StatCard label="AI 洞察" value={data.insights.length} sub="改进建议 & 反思" />
      </div>

      <div className="bg-surface-alt rounded-xl p-5 border border-border-subtle mb-8">
        <h2 className="text-lg font-semibold mb-4">热门话题</h2>
        <div className="flex flex-wrap gap-2">
          {topTags.map(({ tag, count }) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-accent/20 text-accent-alt text-sm border border-accent/30"
            >
              {tag} ({count})
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">最近对话</h2>
        <div className="space-y-3">
          {data.conversations
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((conv) => (
              <Link
                key={conv.id}
                to={`/conversation/${conv.id}`}
                className="block bg-surface-alt rounded-xl p-4 border border-border-subtle hover:border-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-primary">{conv.title}</h3>
                    <p className="text-text-secondary text-sm mt-1 line-clamp-2">{conv.summary}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {conv.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-surface text-text-secondary text-xs border border-border-subtle">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-text-secondary text-xs whitespace-nowrap">{conv.date}</div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
