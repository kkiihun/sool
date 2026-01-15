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
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUpdates = async () => {
    setLoadingList(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/updates", { cache: "no-store" });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("GET /api/updates failed:", res.status, text);
        setUpdates([]);
        setErrorMsg(`목록 불러오기 실패 (status ${res.status})`);
        return;
      }

      const data = await res.json().catch(() => []);
      // 백엔드가 배열을 주는 형태를 기대. 혹시 {items: []} 형태면 대응.
      const items = Array.isArray(data) ? data : data?.items;

      setUpdates(Array.isArray(items) ? items : []);
    } catch (e) {
      console.error("GET /api/updates error:", e);
      setUpdates([]);
      setErrorMsg("목록 불러오기 실패 (네트워크/서버 확인)");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleAdd = async () => {
    if (saving) return; // 중복 클릭/중복 호출 방지
    const msg = newMessage.trim();
    if (!msg) {
      alert("내용을 입력해주세요.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || "저장 실패");
      }

      setNewMessage("");
      await fetchUpdates(); // 여기서만 동기화 (prepend 제거)
    } catch (e) {
      console.error("POST /api/updates error:", e);
      setErrorMsg("업데이트 저장 실패 (백엔드/DB/프록시 확인)");
      alert("업데이트 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

    // JSX input 부분만 수정
     
    <input
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="예) 2026-01-15: Updates POST 경로를 /api/updates로 통일"
      style={{ /* 동일 */ }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          // ✅ Enter 단독: 아무 반응 없게(또는 줄바꿈 안되게)
          if (!(e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            return;
          }
          // ✅ Ctrl+Enter(Win) / Cmd+Enter(Mac)만 저장
          e.preventDefault();
          handleAdd();
        }
      }}
    />

      // 수정 전
      /*
      const created = await res.json().catch(() => null);

      // created가 UpdateItem 형태면 바로 prepend, 아니면 재조회로 확실히 동기화
      if (created && typeof created?.message === "string") {
        setUpdates((prev) => [created as UpdateItem, ...prev]);
      } else {
        await fetchUpdates();
      }

      setNewMessage("");
    } catch (e) {
      console.error("POST /api/updates error:", e);
      setErrorMsg("업데이트 저장 실패 (백엔드/DB/프록시 확인)");
      alert("업데이트 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };
    */


  return (
    <div style={{ padding: 40, color: "#fff" }}>
      {/* 🔙 홈으로 돌아가기 */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#6aaaff", fontSize: 14 }}>
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          홈으로 돌아가기
        </Link>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
        Updates
      </h1>

      <p style={{ color: "#888", marginBottom: 24 }}>
        개발 이력/삽질 로그를 1줄씩 쌓는 페이지 (DB 저장)
      </p>

      {/* 에러 배너 */}
      {errorMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #7f1d1d",
            background: "#1f0b0b",
            color: "#fecaca",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* 입력 영역 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="예) 2026-MM-DD: Updates POST 경로를 /api/updates로 통일"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #444",
            background: "#111",
            color: "#eee",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAdd();
          }}
        />

        <button
          onClick={handleAdd}
          disabled={saving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: saving ? "#334155" : "#3b82f6",
            color: "#fff",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.75 : 1,
          }}
          title="Ctrl+Enter 로도 추가 가능"
        >
          <PlusOutlined />
          {saving ? "저장중..." : "추가"}
        </button>
      </div>

      {/* 리스트 */}
      {loadingList ? (
        <p style={{ color: "#888" }}>불러오는 중...</p>
      ) : updates.length === 0 ? (
        <p style={{ color: "#888" }}>아직 등록된 업데이트가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {updates.map((item, idx) => (
            <li
              key={`${item.timestamp}-${idx}`}
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

      <div style={{ marginTop: 18, color: "#666", fontSize: 12 }}>
        팁: 입력 후 <b>Ctrl+Enter</b> 로 빠르게 추가 가능
      </div>
    </div>
  );
}
