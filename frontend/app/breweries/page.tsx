"use client";

// 공개 양조장 지도: 파이프라인이 모은 양조장 위치·찾아가는 양조장·제품 목록
import { Typography } from "antd";
import PlaceMap from "@/components/PlaceMap";

const { Title, Text } = Typography;

export default function BreweriesPage() {
  return (
    <div className="bg-[#050505] min-h-screen">
      <div className="max-w-[1600px] mx-auto py-16 px-6 md:px-16">
        <Title className="!text-white !text-5xl !font-black !mb-2">양조장 지도</Title>
        <Text className="!text-white/50 !text-lg block mb-10">
          어디서 맛볼 수 있을까요? 전국 양조장과 직접 방문할 수 있는 <span className="text-cyan-400">찾아가는 양조장</span>을 확인하세요.
        </Text>
        <PlaceMap endpoint="/explore/places" diagnostics={false} />
      </div>
    </div>
  );
}
