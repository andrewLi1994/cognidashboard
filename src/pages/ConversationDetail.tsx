import { useParams, Link } from 'react-router-dom';
import { useConversation } from '../hooks/useData';
import type { AIInsight } from '../types';

function InsightCard({ insight }: { insight: AIInsight }) {
  const typeConfig = {
    improvement: { label: '改进建议', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
    reflection: { label: '反思', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    connection: { label: '关联发现', color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  };
  const config = typeConfig[insight.type];

  return (
    <div className={`${config.bg} ${config.border} rounded-lg p-4 border`}>
      <div className={`${config.color} text-xs font-semibold uppercase tracking-wide mb-2`}>
        {config.label}
      </div>
      <p className="text-text-primary text-sm leading-relaxed">{insight.content}</p>
    </div>
  );
}

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const { conversation, insights } = useConversation(id || '');

  if (!conversation) {
    return (
      <div className="py-8 text-center">
        <p className="text-text-secondary">对话未找到</p>
        <Link to="/" className="text-accent-alt text-sm mt-2 inline-block hover:underline">返回概览</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="text-accent-alt text-sm mb-4 inline-block hover:underline">
        ← 返回概览
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">{conversation.title}</h1>
      <div className="flex items-center gap-3 text-text-secondary text-sm mb-6">
        <span>{conversation.date}</span>
        <span>·</span>
        <span>{conversation.entries.length} 条消息</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {conversation.entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-xl p-4 ${
                entry.role === 'user'
                  ? 'bg-accent/10 border border-accent/20 ml-4'
                  : 'bg-surface-alt border border-border-subtle mr-4'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  entry.role === 'user'
                    ? 'bg-accent/30 text-accent-alt'
                    : 'bg-surface text-text-secondary'
                }`}>
                  {entry.role === 'user' ? '你' : 'AI'}
                </span>
                {entry.topic && (
                  <span className="text-xs text-text-secondary">{entry.topic}</span>
                )}
              </div>
              <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold sticky top-16 bg-surface pb-2 z-10">
            AI 洞察 ({insights.length})
          </h2>
          {insights.length === 0 ? (
            <p className="text-text-secondary text-sm">暂无洞察</p>
          ) : (
            insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
