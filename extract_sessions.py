#!/usr/bin/env python3
"""
extract_sessions.py — 从 Hermes 会话 JSON 提取对话数据，生成前端 JSON。
运行方式:
  python3 extract_sessions.py                    # 提取所有会话
  python3 extract_sessions.py --since 7d          # 只提取最近 7 天
  python3 extract_sessions.py --since 2026-05-01  # 从指定日期开始

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

    # Extract user/assistant turns (skip tool messages)
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

    # Generate title from first meaningful user message
    user_msgs = [e for e in entries if e["role"] == "user"]
    title = user_msgs[0]["content"][:60].replace("\n", " ") if user_msgs else f"对话 {date}"
    # Skip very short first messages as titles
    if user_msgs and len(user_msgs[0]["content"]) < 10 and len(user_msgs) > 1:
        title = user_msgs[1]["content"][:60].replace("\n", " ")

    return {
        "id": session_id,
        "date": date,
        "title": title,
        "entries": entries,
        "tags": extract_tags(entries),
        "summary": generate_summary(entries),
        "model": session.get("model", ""),
    }


def extract_tags(entries: list) -> list[str]:
    """Extract tags from conversation content. Returns max 5 high-signal tags."""
    keyword_map = {
        "React/Vite": ["react", "vite", "jsx", "tailwind"],
        "TypeScript": ["typescript", "tsx", "tsconfig"],
        "Rust": ["rust", "cargo", "tokio", "pyo3"],
        "Python": ["python", "pytest", "pip"],
        "Git/GitHub": ["git commit", "git push", "github pages", "pull request"],
        "部署": ["deploy", "docker", "github actions", "pages"],
        "系统设计": ["架构", "微服务", "设计模式", "系统设计"],
        "前端开发": ["组件", "页面", "路由", "ui", "css"],
        "数据可视化": ["图表", "recharts", "饼图", "柱状图"],
        "命令行": ["cli", "terminal", "shell", "bash"],
        "学习路径": ["学习", "教程", "推荐", "入门", "路径"],
        "认知反思": ["思考", "反思", "改进", "认知"],
        "自动化": ["cron", "脚本", "workflow", "自动化", "自动部署"],
        "AI对话": ["ai", "llm", "claude", "gpt", "prompt", "洞察"],
    }

    all_text = " ".join(e["content"].lower() for e in entries)
    tags = []
    for tag, keywords in keyword_map.items():
        matches = [kw for kw in keywords if kw in all_text]
        # Require 2+ matches OR a very specific single match
        if len(matches) >= 2 or (len(matches) == 1 and len(keywords[0]) > 8):
            tags.append(tag)

    return tags[:5]


def generate_summary(entries: list) -> str:
    """Generate a brief summary of the conversation."""
    user_msgs = [e for e in entries if e["role"] == "user"]
    if not user_msgs:
        return f"共 {len(entries)} 条消息的对话"

    # First meaningful user message (skip "你可以干嘛" type one-liners)
    first = user_msgs[0]["content"]
    for msg in user_msgs:
        if len(msg["content"]) > 15:
            first = msg["content"]
            break

    last = user_msgs[-1]["content"]
    first = first[:50].replace("\n", " ")
    last = last[:50].replace("\n", " ")

    if first == last or len(user_msgs) == 1:
        return f"「{first}」的 {len(entries)} 轮对话"
    return f"从「{first}」到「{last}」的 {len(entries)} 轮对话"


# ============================================================
# 洞察生成
# ============================================================

def generate_insights(conversations: list) -> list:
    """Generate AI insights based on conversation patterns."""
    insights = []

    for conv in conversations:
        user_msgs = [e for e in conv["entries"] if e["role"] == "user"]
        assist_msgs = [e for e in conv["entries"] if e["role"] == "assistant"]

        # Insight 1: 深度对话
        if len(user_msgs) >= 5 and len(assist_msgs) >= 5:
            insights.append({
                "id": f"ins-{conv['id']}-d",
                "conversationId": conv["id"],
                "type": "reflection",
                "content": "你在这一轮中进行了深度追问和迭代讨论（多轮来回），这种探索式交流能产生更深层的认知。继续保持。",
                "createdAt": conv["date"] + "T12:30:00Z",
            })

        # Insight 2: 提问质量
        if user_msgs:
            avg_len = sum(len(e["content"]) for e in user_msgs) / len(user_msgs)
            if avg_len < 25:
                insights.append({
                    "id": f"ins-{conv['id']}-q",
                    "conversationId": conv["id"],
                    "type": "improvement",
                    "content": "你的提问偏短，平均每条约 " + str(int(avg_len)) + " 字。尝试提供更多上下文（目标、约束、现有方案），AI 能给出更精准的回答。格式：「我想做 X，当前用 Y，遇到了 Z，目标是 W」。",
                    "createdAt": conv["date"] + "T12:00:00Z",
                })
            elif avg_len > 80:
                insights.append({
                    "id": f"ins-{conv['id']}-q",
                    "conversationId": conv["id"],
                    "type": "reflection",
                    "content": "你的提问很详细（平均 " + str(int(avg_len)) + " 字），有丰富的上下文。这是高质量对话的基础——AI 越了解你的场景，回答越精准。",
                    "createdAt": conv["date"] + "T12:00:00Z",
                })

        # Insight 3: 行动导向
        action_keywords = ["帮我", "做", "创建", "生成", "构建", "跑", "执行", "安装", "部署"]
        action_count = sum(1 for e in user_msgs if any(kw in e["content"] for kw in action_keywords))
        if action_count >= 3:
            insights.append({
                "id": f"ins-{conv['id']}-a",
                "conversationId": conv["id"],
                "type": "reflection",
                "content": "你偏向行动导向——多次要求 AI 直接执行任务而非只是回答问题。这种「动手型」思维适合快速验证，但偶尔穿插「为什么」类问题能加深理解。",
                "createdAt": conv["date"] + "T13:00:00Z",
            })

    # Cross-conversation insight
    if len(conversations) >= 2:
        all_tags = [tag for conv in conversations for tag in conv["tags"]]
        tag_freq = Counter(all_tags)
        common = [tag for tag, count in tag_freq.most_common(3) if count >= 2]
        if common:
            insights.append({
                "id": "ins-cross-tags",
                "conversationId": conversations[0]["id"],
                "type": "connection",
                "content": f"你最近的对话都涉及 {', '.join(common)} 方向。考虑将这些知识系统化整理成笔记或博客，形成知识体系。",
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

    if not SESSION_DIR.exists():
        print(f"Session dir not found: {SESSION_DIR}")
        return

    session_files = sorted(
        SESSION_DIR.glob("session_*.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    conversations = []
    seen_ids = set()

    for filepath in session_files:
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

    insights = generate_insights(conversations)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_DIR / "conversations.json", "w", encoding="utf-8") as f:
        json.dump(conversations, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(conversations)} conversations to {OUTPUT_DIR / 'conversations.json'}")

    with open(OUTPUT_DIR / "insights.json", "w", encoding="utf-8") as f:
        json.dump(insights, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(insights)} insights to {OUTPUT_DIR / 'insights.json'}")


if __name__ == "__main__":
    main()