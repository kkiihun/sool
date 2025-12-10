"use client";

import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function TastingPage() {
  return (
    <div className="p-6 text-white">

      {/* 🔙 홈으로 돌아가기 버튼 */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#6aaaff", fontSize: 14 }}>
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          홈으로 돌아가기
        </Link>
      </div>

      {/* 페이지 제목 */}
      <h1 className="text-2xl font-bold mb-4">Tasting Notes</h1>

      {/* 내용 */}
      <p className="text-gray-300">
        여기에 테이스팅 관련 콘텐츠 또는 기능을 넣을 수 있습니다.
      </p>
    </div>
  );
}
