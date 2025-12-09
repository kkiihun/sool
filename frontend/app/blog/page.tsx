"use client";

import Link from "next/link";
import { Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function BlogPage() {
  return (
    <div style={{ padding: 40, color: "#fff" }}>

      {/* 🔥 홈 버튼 */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#6aaaff", fontSize: 14 }}>
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          홈으로 돌아가기
        </Link>
      </div>

      <Title level={2} style={{ color: "#fff" }}>Blog</Title>

      <Paragraph style={{ color: "#aaa" }}>
        곧 전통주 경험, 양조장 기록, 데이터 기반 인사이트가 업로드됩니다.
      </Paragraph>
    </div>
  );
}
