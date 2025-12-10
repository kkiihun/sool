"use client";

import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function TastingPage() {
  return (
    <div className="p-6 text-white">

      {/* 홈으로 돌아가기 */}
      <div className="mb-4">
        <Link href="/" className="text-blue-400 text-sm hover:text-blue-300">
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          홈으로 돌아가기
        </Link>
      </div>

      {/* 제목 */}
      <h1 className="text-2xl font-bold mb-3">Tasting Notes</h1>

      {/* 설명 */}
      <p className="text-gray-300 mb-6 leading-relaxed max-w-xl">
        전통주의 향, 맛, 질감 등 감각 데이터를 기록하고
        나만의 테이스팅 노트를 모아보세요.
        <br/><br/>
        감각 기반 데이터는 당신의 취향을 더 정확하게 이해하고
        새로운 전통주를 추천하는 데 중요한 역할을 합니다.
      </p>

      {/* 버튼 영역 */}
      <div className="flex flex-col gap-4 max-w-xs">

        {/* 새 테이스팅 기록하기 */}
        <Link
          href="/sense/new"
          className="bg-blue-600 px-4 py-2 rounded text-center text-white hover:bg-blue-500 transition"
        >
          🍶 새 테이스팅 노트 작성하기
        </Link>

        {/* 테이스팅 노트 목록 보기 */}
        <Link
          href="/sense/list"
          className="bg-gray-700 px-4 py-2 rounded text-center text-white hover:bg-gray-600 transition"
        >
          📋 기록된 테이스팅 노트 목록 보기
        </Link>

      </div>
    </div>
  );
}
