import { useState, useMemo } from 'react';
import { useDashboardData } from '../hooks/useData';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Conversation } from '../types';

const COLORS = ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#8b5cf6',
                '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#ec4899'];

export default function Topics() {
  const { data, loading } = useDashboardData();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { tagCounts, filteredConvs } = useMemo(() => {
    if (!data) return { tagCounts: [], filteredConvs: [] };

    const allTags = data.conversations.flatMap((c) => c.tags);
    const tagCounts = [...new Set(allTags)]
      .map((name) => ({ name, count: allTags.filter((t) => t === name).length }))
      .sort((a, b) => b.count - a.count);

    const filteredConvs: Conversation[] = selectedTag
      ? data.conversations
          .filter((c) => c.tags.includes(selectedTag))
          .sort((a, b) => b.date.localeCompare(a.date))
      : [];

    return { tagCounts, filteredConvs };
  }, [data, selectedTag]);

  if (loading || !data) return null;

  const totalConvs = data.conversations.length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">话题图谱</h1>

      {tagCounts.length === 0 ? (
        <div className="bg-surface-alt rounded-xl p-8 border border-border-subtle text-center">
          <p className="text-text-secondary text-lg mb-2">暂无话题数据</p>
          <p className="text-text-secondary text-sm">
            随着你与 AI 对话增多，标签和话题会自动在这里出现
          </p>
        </div>
      ) : (
        <>
          {/* 饼图 + 标签列表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 饼图 */}
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
                    innerRadius={45}
                    paddingAngle={2}
                    onClick={(_, index) => {
                      if (index !== undefined) {
                        setSelectedTag(
                          selectedTag === tagCounts[index].name
                            ? null
                            : tagCounts[index].name
                        );
                      }
                    }}
                    label={({ name, count }: any) => `${name} (${count})`}
                    style={{ cursor: 'pointer' }}
                  >
                    {tagCounts.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={COLORS[idx % COLORS.length]}
                        opacity={selectedTag && tagCounts[idx].name !== selectedTag ? 0.35 : 1}
                        stroke={selectedTag === tagCounts[idx].name ? '#f1f5f9' : 'transparent'}
                        strokeWidth={selectedTag === tagCounts[idx].name ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-text-secondary text-xs text-center mt-2">
                点击扇形筛选对话
              </p>
            </div>

            {/* 标签详情列表 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold mb-1">
                所有标签
                <span className="text-text-secondary text-sm font-normal ml-2">
                  {tagCounts.length} 个
                </span>
              </h2>
              {tagCounts.map(({ name, count }, idx) => {
                const pct = Math.round((count / totalConvs) * 100);
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedTag(selectedTag === name ? null : name)}
                    className={`w-full text-left bg-surface-alt rounded-xl p-4 border transition-all duration-200 ${
                      selectedTag === name
                        ? 'border-accent/60 ring-1 ring-accent/30'
                        : 'border-border-subtle hover:border-accent/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-semibold">{name}</span>
                      </div>
                      <span className="text-accent-alt text-sm font-medium">
                        {count} 次 · {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 筛选后的对话列表 */}
          {selectedTag && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">
                  包含「{selectedTag}」的对话
                </h2>
                <span className="text-text-secondary text-sm">
                  ({filteredConvs.length} 条)
                </span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-accent-alt text-xs hover:underline ml-auto"
                >
                  清除筛选
                </button>
              </div>

              {filteredConvs.length === 0 ? (
                <p className="text-text-secondary text-sm">暂无匹配对话</p>
              ) : (
                <div className="space-y-3">
                  {filteredConvs.map((conv) => (
                    <Link
                      key={conv.id}
                      to={`/conversation/${conv.id}`}
                      className="block bg-surface-alt rounded-xl p-4 border border-border-subtle hover:border-accent/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-text-primary">
                            {conv.title}
                          </h3>
                          <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                            {conv.summary}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {conv.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`px-2 py-0.5 rounded text-xs border ${
                                  tag === selectedTag
                                    ? 'bg-accent/20 text-accent-alt border-accent/30'
                                    : 'bg-surface text-text-secondary border-border-subtle'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-text-secondary text-xs whitespace-nowrap">
                          {conv.date}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}