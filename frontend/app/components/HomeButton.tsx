"use client";

import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function HomeButton() {
  return (
    <div style={{ marginBottom: 20 }}>
      <Link href="/" style={{ color: "#6aaaff", fontSize: 14 }}>
        <ArrowLeftOutlined style={{ marginRight: 6 }} />
        홈으로 돌아가기
      </Link>
    </div>
  );
}
