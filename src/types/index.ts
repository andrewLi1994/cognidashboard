export interface ConversationEntry {
  id: string;
  timestamp: string; // ISO 8601
  role: 'user' | 'assistant';
  content: string;
  topic?: string;
}

export interface Conversation {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  entries: ConversationEntry[];
  tags: string[];
  summary: string;
}

export interface AIInsight {
  id: string;
  conversationId: string;
  type: 'improvement' | 'reflection' | 'connection';
  content: string;
  targetEntryId?: string;
  relatedConversationIds?: string[];
  createdAt: string;
}

export interface DashboardData {
  conversations: Conversation[];
  insights: AIInsight[];
}

export interface TopicNode {
  name: string;
  count: number;
  color: string;
}

export interface TimelineItem {
  date: string;
  conversationCount: number;
  entryCount: number;
}
