"use client";

import Link from "next/link";
import { Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function CommunityPage() {
  return (
    <div style={{ padding: 40, color: "#fff" }}>

      {/* 🔥 홈 버튼 */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#6aaaff", fontSize: 14 }}>
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          홈으로 돌아가기
        </Link>
      </div>

      <Title level={2} style={{ color: "#fff" }}>Community</Title>

      <Paragraph style={{ color: "#aaa", maxWidth: 600 }}>
        🚧 커뮤니티 기능은 곧 추가됩니다.<br/>
        사용자 리뷰 피드, 컬렉션 공유, 토론 기능이 들어올 예정입니다.
      </Paragraph>
    </div>
  );
}
