"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4"
    >
      <ArrowLeftOutlined />
      이전으로 돌아가기
    </button>
  );
}
