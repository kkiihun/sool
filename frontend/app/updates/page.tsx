// frontend/app/updates/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";

interface UpdateItem {
  message: string;
  timestamp: string; // "2025-12-10 23:11:22"
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // frontend/app/updates/page.tsx (문제 라인 교체)
const fetchUpdates = async () => {
  try {
    const res = await fetch("/api/updates", { cache: "no-store" });
    const data = res.ok ? await res.json() : [];
    setUpdates(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error(e);
    setUpdates([]); // ✅ 실패해도 화면은 정상
  }
};


  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleAdd = async () => {
    if (!newMessage.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/updates/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (!res.ok) throw new Error("저장 실패");

      const created: UpdateItem = await res.json();

      // 화면 리스트에 바로 반영
      setUpdates((prev) => [created, ...prev]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
      alert("업데이트 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ padding: 40, color: "#fff" }}>
      {/* 🔙 홈으로 돌아가기 */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#6aaaff", fontSize: 14 }}>
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          홈으로 돌아가기
        </Link>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Updates</h1>

      {/* 입력 영역 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="예) 테이스팅 노트 입력 페이지 개선"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #444",
            background: "#111",
            color: "#eee",
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <PlusOutlined />
          추가
        </button>
      </div>

      {/* 업데이트 리스트 */}
      {updates.length === 0 ? (
        <p style={{ color: "#888" }}>아직 등록된 업데이트가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {updates.map((item, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span style={{ color: "#facc15", marginRight: 4 }}>⭐</span>
              <span style={{ color: "#e6e6e6" }}>{item.message}</span>
              <span style={{ color: "#888", fontSize: 14, marginLeft: 8 }}>
                ({item.timestamp})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
