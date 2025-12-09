"use client";

import Link from "next/link";
import { Timeline, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function UpdatesPage() {
  return (
    <div style={{ padding: "40px", color: "#fff" }}>

      {/* 🔙 홈 버튼 */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#6aaaff", fontSize: 14 }}>
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          홈으로 돌아가기
        </Link>
      </div>

      <Title level={2} style={{ color: "#fff" }}>Updates</Title>

      {/* ⭕ 올바른 Timeline 선언 방식 */}
      <Timeline
        style={{ marginTop: 20 }}
        items={[
          {
            color: "green",
            icon: "⭐",
            content: (
              <span style={{ color: "#e6e6e6", fontSize: "16px" }}>
                리뷰 시스템 추가 (2025-12-09)
              </span>
            ),
          },
          {
            color: "green",
            icon: "⭐",
            content: (
              <span style={{ color: "#e6e6e6", fontSize: "16px" }}>
                평점 기준 정렬 기능 준비중
              </span>
            ),
          },
          {
            color: "gray",
            icon: "🚧",
            content: (
              <span style={{ color: "#999", fontSize: "16px" }}>
                이미지 데이터 준비 예정
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
