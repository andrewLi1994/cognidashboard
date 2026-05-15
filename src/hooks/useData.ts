import { useState, useEffect } from 'react';
import type { DashboardData, Conversation, AIInsight } from '../types';
import { sampleConversations, sampleInsights } from '../data/sample-conversations';

export function useDashboardData(): {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // In production, fetch from /data/conversations.json
        setData({
          conversations: sampleConversations,
          insights: sampleInsights,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return { data, loading, error };
}

export function useConversation(id: string): {
  conversation: Conversation | undefined;
  insights: AIInsight[];
} {
  const { data } = useDashboardData();
  return {
    conversation: data?.conversations.find((c) => c.id === id),
    insights: data?.insights.filter((i) => i.conversationId === id) || [],
  };
}
