"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function HomeButton() {
  const pathname = usePathname();

  // 홈에서는 굳이 안 보이게(원하면 삭제)
  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      style={{
        color: "#6aaaff",
        fontSize: 14,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <ArrowLeftOutlined />
      홈
    </Link>
  );
}
