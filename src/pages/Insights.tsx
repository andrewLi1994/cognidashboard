import { useDashboardData } from '../hooks/useData';
import { Link } from 'react-router-dom';

const TYPE_LABELS: Record<string, string> = {
  improvement: '改进建议',
  reflection: '反思',
  connection: '关联发现',
};

const TYPE_COLORS: Record<string, string> = {
  improvement: 'border-l-amber-400',
  reflection: 'border-l-emerald-400',
  connection: 'border-l-violet-400',
};

export default function Insights() {
  const { data, loading } = useDashboardData();

  if (loading || !data) return null;

  const convTitles = new Map(data.conversations.map((c) => [c.id, c.title]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">AI 洞察</h1>
      <p className="text-text-secondary text-sm mb-6">
        AI 基于你的对话内容生成的所有反思、改进建议和关联发现
      </p>

      <div className="space-y-4">
        {data.insights
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((insight) => (
            <div
              key={insight.id}
              className={`bg-surface-alt rounded-xl p-5 border border-border-subtle border-l-4 ${TYPE_COLORS[insight.type]}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {TYPE_LABELS[insight.type]}
                </span>
                <span className="text-text-secondary text-xs">
                  {new Date(insight.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed">{insight.content}</p>
              <Link
                to={`/conversation/${insight.conversationId}`}
                className="inline-block mt-3 text-accent-alt text-xs hover:underline"
              >
                查看对话: {convTitles.get(insight.conversationId) || insight.conversationId} →
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}
