import type { Conversation, AIInsight } from '../types';

export const sampleConversations: Conversation[] = [
  {
    id: 'conv-1',
    date: '2026-05-10',
    title: '如何用 Rust 重写核心模块',
    entries: [
      { id: 'e1', timestamp: '2026-05-10T09:00:00Z', role: 'user', content: '我在考虑用 Rust 重写现有的 Python 数据处理模块，你觉得值得吗？目前瓶颈是 CPU 密集计算。', topic: '技术选型' },
      { id: 'e2', timestamp: '2026-05-10T09:00:05Z', role: 'assistant', content: '这取决于几个因素：1) 现有 Python 模块有多少行代码？2) 性能提升预期是多少？3) 团队有 Rust 经验吗？如果只是 CPU 密集部分，可以考虑用 PyO3 做混合方案，不用全量重写。', topic: '技术选型' },
      { id: 'e3', timestamp: '2026-05-10T09:01:00Z', role: 'user', content: '团队没有 Rust 经验，但我个人想借这个机会推动。核心瓶颈在数据清洗那块，大概 2000 行，单线程跑一次要 40 分钟。', topic: '技术选型' },
      { id: 'e4', timestamp: '2026-05-10T09:01:30Z', role: 'assistant', content: '2000 行、40 分钟单线程——这是很典型的适合 Rust 的场景。建议先用 PyO3 把数据清洗部分替换成 Rust，不需要动其他代码。预估能把 40 分钟压到 5 分钟以内。你团队的阻力主要在哪？', topic: '技术选型' },
    ],
    tags: ['Rust', 'Python', '性能优化', '技术选型'],
    summary: '探讨用 Rust + PyO3 混合方案优化 Python 数据处理瓶颈',
  },
  {
    id: 'conv-2',
    date: '2026-05-11',
    title: '设计系统架构评审',
    entries: [
      { id: 'e5', timestamp: '2026-05-11T14:00:00Z', role: 'user', content: '这是我画的微服务架构图，帮我看一下有没有问题。API Gateway -> User Service / Order Service / Payment Service，消息队列用 Kafka。', topic: '系统设计' },
      { id: 'e6', timestamp: '2026-05-11T14:00:10Z', role: 'assistant', content: '整体方向没问题。三个注意点：1) Payment Service 建议单独部署，不要和 Order Service 共享数据库；2) Kafka 要考虑 exactly-once 语义，支付场景不能丢消息；3) 缺少一个 BFF 层处理前端聚合请求。', topic: '系统设计' },
    ],
    tags: ['架构', '微服务', 'Kafka'],
    summary: '评审微服务架构，AI 指出支付隔离、消息可靠性和 BFF 缺失三个问题',
  },
  {
    id: 'conv-3',
    date: '2026-05-13',
    title: '学习编译器前端',
    entries: [
      { id: 'e7', timestamp: '2026-05-13T20:00:00Z', role: 'user', content: '我想系统学习编译原理的前端部分——词法分析、语法分析、语义分析。有什么好的学习路径推荐？', topic: '学习路径' },
      { id: 'e8', timestamp: '2026-05-13T20:00:15Z', role: 'assistant', content: '建议按这个顺序：1) 先用 Python 手写一个 JSON parser 理解递归下降；2) 学 ANTLR 做一个简单的计算器 DSL；3) 读 Crafting Interpreters 前两章做 Lox 语言。整个过程大概 3-4 周。', topic: '学习路径' },
      { id: 'e9', timestamp: '2026-05-13T20:02:00Z', role: 'user', content: '好，我先从 JSON parser 开始。做完再找你 Review。', topic: '学习路径' },
    ],
    tags: ['编译原理', '学习', 'Parser'],
    summary: '规划编译原理学习路径，从 JSON parser 到 Lox 语言实现',
  },
];

export const sampleInsights: AIInsight[] = [
  {
    id: 'ins-1',
    conversationId: 'conv-1',
    type: 'improvement',
    content: '你在表达技术方案时更结构化会更好。尝试用「问题→方案→收益→风险」的框架来描述提案，这样更容易说服团队。比如这次你可以说："当前 40 分钟的瓶颈让每次迭代等待太久→PyO3 混合方案只需改 2000 行→预计降到 5 分钟→风险是团队需要补充 Rust 知识"。',
    targetEntryId: 'e3',
    createdAt: '2026-05-10T10:00:00Z',
  },
  {
    id: 'ins-2',
    conversationId: 'conv-1',
    type: 'reflection',
    content: '你这轮对话展现了一个很好的思维模式——从抽象问题（值不值得）逐步具体化（2000行、40分钟），让讨论变得可执行。保持这个习惯。',
    createdAt: '2026-05-10T10:05:00Z',
  },
  {
    id: 'ins-3',
    conversationId: 'conv-2',
    type: 'connection',
    content: '这次架构评审和你 5月10日 讨论的数据处理模块有关——如果 Order Service 需要实时聚合数据，之前计划的 Rust 模块可以作为计算引擎嵌入。考虑把 Rust 模块抽象成独立的 sidecar。',
    relatedConversationIds: ['conv-1'],
    createdAt: '2026-05-11T15:00:00Z',
  },
  {
    id: 'ins-4',
    conversationId: 'conv-2',
    type: 'improvement',
    content: '画架构图时，建议标注数据流向（读/写方向）和调用关系（同步/异步）。现在只有模块名，缺少关键的交互语义。',
    targetEntryId: 'e5',
    createdAt: '2026-05-11T15:05:00Z',
  },
  {
    id: 'ins-5',
    conversationId: 'conv-3',
    type: 'reflection',
    content: '你有一个很好的习惯：学习新领域时先找最小可执行项目作为起点。JSON parser 选得很好——简单到不会放弃，但有足够的深度覆盖核心概念。',
    createdAt: '2026-05-13T21:00:00Z',
  },
];
