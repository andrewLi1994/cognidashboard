#!/usr/bin/env python3
"""
extract_sessions.py — 从 Hermes 会话 JSON 提取对话数据，生成前端 JSON。
运行方式:
  python extract_sessions.py                    # 提取所有会话
  python extract_sessions.py --since 7d          # 只提取最近 7 天
  python extract_sessions.py --since 2026-05-01  # 从指定日期开始

输出: cognidashboard/public/data/conversations.json
      cognidashboard/public/data/insights.json
"""

import json
import os
import re
import hashlib
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path
from collections import Counter
from typing import Optional

SESSION_DIR = Path.home() / ".hermes" / "sessions"
OUTPUT_DIR = Path(__file__).resolve().parent / "public" / "data"

# ============================================================
# 数据提取
# ============================================================

def parse_session(filepath: Path) -> Optional[dict]:
    """Parse a Hermes session JSON file into our data format."""
    try:
        with open(filepath) as f:
            session = json.load(f)
    except (json.JSONDecodeError, IOError):
        return None

    messages = session.get("messages", [])
    if not messages:
        return None

    # Extract user/assistant turns (skip tool messages for content, keep for context)
    entries = []
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")

        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            entries.append({
                "id": hashlib.md5(content.encode()).hexdigest()[:12],
                "timestamp": (datetime.fromtimestamp(filepath.stat().st_mtime, tz=timezone.utc)
                              .isoformat()),
                "role": role,
                "content": content.strip(),
            })

    if len(entries) < 2:
        return None

    # Determine date from session filename or fallback to file mtime
    session_id = session.get("session_id", filepath.stem.replace("session_", ""))
    try:
        date = datetime.strptime(session_id[:8], "%Y%m%d").strftime("%Y-%m-%d")
    except ValueError:
        date = datetime.fromtimestamp(filepath.stat().st_mtime).strftime("%Y-%m-%d")

    # Generate title from first user message
    first_user = next((e for e in entries if e["role"] == "user"), None)
    title = (first_user["content"][:60].replace("\n", " ") if first_user
             else f"对话 {date}")

    return {
        "id": session_id,
        "date": date,
        "title": title,
        "entries": entries,
        "tags": extract_tags(entries),
        "summary": generate_summary(entries),
        "model": session.get("model", ""),
    }


def extract_tags(entries: list[dict]) -> list[str]:
    """Extract tags from conversation content using simple keyword detection."""
    keyword_map = {
        "Python": ["python", "pytest", "pip", "django", "flask", "fastapi", "pandas", "numpy"],
        "Rust": ["rust", "cargo", "borrow", "lifetime", "traits"],
        "JavaScript": ["javascript", "typescript", "react", "vue", "node", "npm", "pnpm"],
        "Git": ["git", "github", "commit", "branch", "pr", "merge"],
        "AI/LLM": ["llm", "gpt", "claude", "模型", "prompt", "token", "fine-tune"],
        "架构": ["架构", "微服务", "设计模式", "系统设计", "api"],
        "部署": ["docker", "kubernetes", "k8s", "ci/cd", "deploy", "部署"],
        "数据分析": ["数据", "分析", "可视化", "sql", "pandas"],
        "前端": ["css", "html", "tailwind", "组件", "ui", "ux"],
        "命令行": ["cli", "terminal", "shell", "bash", "zsh"],
        "学习": ["学习", "教程", "文档", "入门", "推荐", "路径"],
        "调试": ["debug", "报错", "error", "bug", "修复"],
        "认知": ["思考", "认知", "反思", "想法", "输出", "笔记"],
        "自动化": ["自动化", "cron", "脚本", "workflow", "自动"],
    }

    all_text = " ".join(e["content"].lower() for e in entries)
    tags = []
    for tag, keywords in keyword_map.items():
        if any(kw in all_text for kw in keywords):
            tags.append(tag)
    return tags


def generate_summary(entries: list[dict]) -> str:
    """Generate a brief summary of the conversation."""
    user_entries = [e for e in entries if e["role"] == "user"]
    if len(user_entries) >= 2:
        return f"从「{user_entries[0]['content'][:40]}」到「{user_entries[-1]['content'][:40]}」的 {len(entries)} 轮对话"
    return f"共 {len(entries)} 条消息的对话"


# ============================================================
# 洞察生成 (规则引擎)
# ============================================================

def generate_insights(conversations: list[dict]) -> list[dict]:
    """Generate AI insights based on conversation patterns."""
    insights = []

    for conv in conversations:
        user_msgs = [e for e in conv["entries"] if e["role"] == "user"]
        assist_msgs = [e for e in conv["entries"] if e["role"] == "assistant"]

        # Insight 1: 提问质量
        if user_msgs:
            avg_len = sum(len(e["content"]) for e in user_msgs) / len(user_msgs)
            if avg_len < 30:
                insights.append({
                    "id": f"ins-{conv['id']}-q",
                    "conversationId": conv["id"],
                    "type": "improvement",
                    "content": "你的提问偏短。尝试提供更多上下文（如目标、约束、现有方案），AI 能给出更精准的回答。格式：「我想做 X，当前用 Y，遇到了 Z 问题，目标是 W」。",
                    "createdAt": conv["date"] + "T12:00:00Z",
                })

        # Insight 2: 深度对话
        if len(user_msgs) >= 3 and len(assist_msgs) >= 3:
            insights.append({
                "id": f"ins-{conv['id']}-d",
                "conversationId": conv["id"],
                "type": "reflection",
                "content": "你在这一轮中进行了深度追问和迭代讨论，这种多轮对话能产生更深层的认知。继续保持这种探索式的交流习惯。",
                "createdAt": conv["date"] + "T12:30:00Z",
            })

        # Insight 3: 行动倾向
        action_keywords = ["帮我", "做", "创建", "生成", "构建", "跑", "执行", "安装", "部署"]
        action_count = sum(
            1 for e in user_msgs
            if any(kw in e["content"] for kw in action_keywords)
        )
        if action_count >= 2:
            insights.append({
                "id": f"ins-{conv['id']}-a",
                "conversationId": conv["id"],
                "type": "reflection",
                "content": "你偏向行动导向——多次要求 AI 直接执行任务而非只是回答问题。这种「动手型」思维适合快速验证想法，但可以偶尔穿插「为什么」类问题来加深理解。",
                "createdAt": conv["date"] + "T13:00:00Z",
            })

    # Cross-conversation insights
    if len(conversations) >= 2:
        all_tags = [tag for conv in conversations for tag in conv["tags"]]
        tag_freq = Counter(all_tags)
        common_tags = [tag for tag, count in tag_freq.most_common(3) if count >= 2]
        if common_tags:
            insights.append({
                "id": "ins-cross-tags",
                "conversationId": conversations[0]["id"],
                "type": "connection",
                "content": f"你最近的多轮对话都涉及 {', '.join(common_tags)} 方向。考虑将这些知识系统化整理成个人笔记或博客，形成你的知识体系。",
                "relatedConversationIds": [c["id"] for c in conversations[1:3]],
                "createdAt": max(c["date"] for c in conversations) + "T14:00:00Z",
            })

    return insights


# ============================================================
# 主流程
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Extract Hermes session data for CogniBoard")
    parser.add_argument("--since", default=None, help="Only process sessions since (e.g., '7d' or '2026-05-01')")
    args = parser.parse_args()

    # Parse time filter
    since_dt = None
    if args.since:
        if args.since.endswith("d"):
            days = int(args.since[:-1])
            since_dt = datetime.now() - timedelta(days=days)
        else:
            since_dt = datetime.fromisoformat(args.since)

    # Find all session files
    if not SESSION_DIR.exists():
        print(f"Session dir not found: {SESSION_DIR}")
        return

    session_files = sorted(
        SESSION_DIR.glob("session_*.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    # Process sessions
    conversations = []
    seen_ids = set()

    for filepath in session_files:
        # Time filter
        if since_dt:
            mtime = datetime.fromtimestamp(filepath.stat().st_mtime)
            if mtime < since_dt:
                continue

        conv = parse_session(filepath)
        if conv and conv["id"] not in seen_ids:
            seen_ids.add(conv["id"])
            conversations.append(conv)

    print(f"Processed {len(conversations)} conversations from {len(session_files)} session files")

    if not conversations:
        print("No conversations found.")
        return

    # Generate insights
    insights = generate_insights(conversations)

    # Write output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_DIR / "conversations.json", "w", encoding="utf-8") as f:
        json.dump(conversations, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(conversations)} conversations to {OUTPUT_DIR / 'conversations.json'}")

    with open(OUTPUT_DIR / "insights.json", "w", encoding="utf-8") as f:
        json.dump(insights, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(insights)} insights to {OUTPUT_DIR / 'insights.json'}")


if __name__ == "__main__":
    main()