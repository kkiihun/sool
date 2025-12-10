"use client";

import Link from "next/link";
import { Typography } from "antd";
import {
  ArrowLeftOutlined,
  GithubOutlined,
  InstagramOutlined,
  BookOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function AboutPage() {
  return (
    <div style={{ padding: 40, color: "#fff" }}>
      {/* 돌아가기 버튼 */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#6aaaff", fontSize: 14 }}>
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          홈으로 돌아가기
        </Link>
      </div>

      {/* 제목 */}
      <Title level={2} style={{ color: "#fff" }}>
        About Me
      </Title>

      {/* 소개 문구 */}
      <Paragraph style={{ color: "#ccc", fontSize: 16, maxWidth: 720 }}>
        안녕하세요. 김기훈입니다.<br />
        저는 감각 데이터를 기반으로 한 <b>SENSE JOURNEY</b> 프로젝트와
        전통주 기록/추천 시스템 <b>SOOL</b>,
        그리고 드론·로봇팔 기반 자동화 실험실 <b>LUNARLINE</b>을 만드는
        1인 개발자입니다.
        <br />
        <br />
        데이터 · 감각 · 자동화라는 세 가지 축을 기반으로,
        “사람의 경험을 데이터로 기록하고 새로운 가치를 만드는 시스템”을
        구축하는 것이 제 목표입니다.
      </Paragraph>

      {/* 주요 링크 */}
      <Title level={4} style={{ color: "#fff", marginTop: 40 }}>
        🔗 Links
      </Title>

      <div className="flex gap-6 mt-2 text-lg">
        {/* 네이버 블로그 */}
        <a
          href="https://blog.naver.com/sensedatalab"
          target="_blank"
          className="hover:text-blue-400 transition"
        >
          <BookOutlined /> Blog
        </a>

        {/* GitHub */}
        <a
          href="https://github.com/kkiihun"
          target="_blank"
          className="hover:text-gray-300 transition"
        >
          <GithubOutlined /> GitHub
        </a>

        {/* Instagram */}
        <a
          href="https://instagram.com/yourinstagram"
          target="_blank"
          className="hover:text-pink-400 transition"
        >
          <InstagramOutlined /> Instagram
        </a>
      </div>

      {/* 프로젝트 소개 */}
      <Title level={4} style={{ color: "#fff", marginTop: 40 }}>
        🚀 Projects
      </Title>

      <ul style={{ color: "#aaa", fontSize: 15, lineHeight: "1.8" }}>
        <li>
          <b>SOOL</b> — 전통주 데이터 기록, 감각 기반 테이스팅 노트, 사용자 리뷰
          추천 시스템
        </li>
        <li>
          <b>SENSE JOURNEY</b> — 감각 데이터 자동 수집·시각화 플랫폼, 감정/향/공간
          기반 경험 기록
        </li>
        <li>
          <b>LUNARLINE</b> — 로봇팔·드론 기반 1인 자동화 실험실 + 스마트 MES 시스템
        </li>
      </ul>

      {/* 버전 / 업데이트 정보 */}
      <Paragraph style={{ color: "#777", marginTop: 40 }}>
        📍 Version: v0.1 Alpha <br />
        📅 Last Updated: {new Date().toLocaleDateString()}
      </Paragraph>
    </div>
  );
}
