"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // 메인에서는 숨김
  if (pathname === "/") return null;

  return (
    <button
      type="button"
      aria-label="뒤로가기"
      onClick={() => {
        // ✅ 히스토리가 없으면(새 탭 등) 홈으로 이동
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="
        inline-flex items-center
        bg-transparent border-0 shadow-none
        p-0 m-0
        text-blue-400 hover:text-blue-300
        focus:outline-none focus:ring-0
      "
    >
      <ArrowLeftOutlined />
    </button>
  );
}
