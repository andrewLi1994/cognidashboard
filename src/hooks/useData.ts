import { useState, useEffect } from 'react';
import type { DashboardData, Conversation, AIInsight } from '../types';

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
        const [convsRes, insRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/conversations.json`),
          fetch(`${import.meta.env.BASE_URL}data/insights.json`),
        ]);

        if (!convsRes.ok || !insRes.ok) {
          throw new Error('Failed to load data files');
        }

        const conversations: Conversation[] = await convsRes.json();
        const insights: AIInsight[] = await insRes.json();

        setData({ conversations, insights });
      } catch (err) {
        console.error('Load error:', err);
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