"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Layout,
  Menu,
  Typography,
  Card,
  Row,
  Col,
} from "antd";
import {
  AppstoreOutlined,
  CompassOutlined,
  StarOutlined,
  HeartOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ---- Sidebar ---- */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(v) => setCollapsed(v)}
        theme="dark"
        style={{ background: "#111", borderRight: "1px solid #333" }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <div
            style={{
              color: "#fff",
              padding: 20,
              fontSize: collapsed ? 18 : 22,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🥃 {collapsed ? "" : "Sool"}
          </div>
        </Link>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={["4"]}
          items={[
            { key: "1", icon: <AppstoreOutlined />, label: <Link href="/about">About</Link> },
            { key: "2", icon: <CompassOutlined />, label: <Link href="/updates">Updates</Link> },
            { key: "3", icon: <StarOutlined />, label: <Link href="/Tasting">Tasting</Link> },
            {
              key: "4",
              icon: <BarChartOutlined />,
              label: <Link href="/dashboard">Analytics</Link>,
            },
            { key: "5", icon: <HeartOutlined />, label: <Link href="/community">Community</Link> },
          ]}
        />
      </Sider>

      {/* ---- Main ---- */}
      <Layout>
        <Header
          style={{
            background: "#111",
            borderBottom: "1px solid #333",
            padding: "20px 30px",
          }}
        >
          <Title level={3} style={{ color: "#fff", margin: 0 }}>
            📊 전통주 분석 대시보드
          </Title>
          <Text style={{ color: "#aaa" }}>
            데이터 기반 전통주 트렌드 & 인사이트
          </Text>
        </Header>

        <Content style={{ padding: 30, background: "#000" }}>
          {/* KPI 영역 */}
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card style={cardStyle}>
                <Text style={{ color: "#aaa" }}>전체 전통주</Text>
                <Title level={3} style={kpiStyle}>1,249</Title>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={cardStyle}>
                <Text style={{ color: "#aaa" }}>평균 도수</Text>
                <Title level={3} style={kpiStyle}>12.4%</Title>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={cardStyle}>
                <Text style={{ color: "#aaa" }}>리뷰 수</Text>
                <Title level={3} style={kpiStyle}>770</Title>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={cardStyle}>
                <Text style={{ color: "#aaa" }}>지역 수</Text>
                <Title level={3} style={kpiStyle}>15</Title>
              </Card>
            </Col>
          </Row>

          {/* 차트 영역 */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Card style={cardStyle}>
                <Title level={4} style={{ color: "#fff" }}>
                  연도별 전통주 출시 추이
                </Title>
                <div style={chartPlaceholder}>
                  📈 (Line Chart 예정)
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col span={12}>
              <Card style={cardStyle}>
                <Title level={4} style={{ color: "#fff" }}>
                  지역별 분포
                </Title>
                <div style={chartPlaceholder}>📊 (Bar Chart)</div>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={cardStyle}>
                <Title level={4} style={{ color: "#fff" }}>
                  주종 비율
                </Title>
                <div style={chartPlaceholder}>🥧 (Pie Chart)</div>
              </Card>
            </Col>
          </Row>
        </Content>

        <Footer
          style={{
            textAlign: "center",
            background: "#111",
            color: "#555",
            borderTop: "1px solid #222",
          }}
        >
          Sool Analytics • Powered by Sense Journey
        </Footer>
      </Layout>
    </Layout>
  );
}

/* ---- Styles ---- */

const cardStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: 10,
    color: "#fff",
};

const kpiStyle = {
  color: "#ffffff",
  marginTop: 6,
};

const chartPlaceholder = {
  height: 260,
  border: "1px dashed #333",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#999",
    fontSize: 14,
};
