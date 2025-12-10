"use client";

import { useState } from "react";
import { Input, Button, Typography } from "antd";
import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;

export default function UpdateCreatePage() {
  const [text, setText] = useState("");

  const handleSave = async () => {
    if (!text.trim()) return alert("내용을 입력해주세요.");

    try {
      await axios.post("http://127.0.0.1:8000/update-log/", {
        text,
      });

      alert("업데이트 로그가 파일에 저장되었습니다 ✅");
      setText("");
    } catch (e) {
      console.error(e);
      alert("저장 중 오류 발생");
    }
  };

  return (
    <div style={{ padding: 40, color: "#fff" }}>
      <Link href="/updates" style={{ color: "#6aaaff" }}>
        <ArrowLeftOutlined style={{ marginRight: 6 }} />
        업데이트 목록으로 돌아가기
      </Link>

      <Title level={2} style={{ color: "#fff", marginTop: 20 }}>
        새 업데이트 로그
      </Title>

      <Input.TextArea
        rows={4}
        placeholder="예) 2025-12-10: 테이스팅 노트 날짜 필드 추가"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ marginTop: 20 }}
      />

      <Button
        type="primary"
        onClick={handleSave}
        style={{ marginTop: 20 }}
      >
        파일로 저장하기
      </Button>
    </div>
  );
}
