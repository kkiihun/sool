"use client";

import Link from "next/link";
import { Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function AboutPage() {
  return (
    <div style={{ padding: 40, color: "#fff" }}>
      {/* 홈으로 돌아가기 버튼 */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#6aaaff", fontSize: 14 }}>
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          홈으로 돌아가기
        </Link>
      </div>

      {/* 제목 */}
      <Title level={2} style={{ color: "#fff" }}>
        About Sool
      </Title>

      {/* 소개 문구 */}
      <Paragraph style={{ color: "#aaa", fontSize: 16, maxWidth: 700 }}>
        Sool 프로젝트는 한국 전통주의 다양성과 감각 경험을 기록하고,
        사용자 리뷰 기반 추천 시스템을 제공하는 플랫폼입니다.
      </Paragraph>

      {/* 버전 / 업데이트 정보 */}
      <Paragraph style={{ color: "#777", marginTop: 20 }}>
        📍 Version: v0.1 Alpha <br />
        📅 Last Updated: {new Date().toLocaleDateString()}
      </Paragraph>
    </div>
  );
}
