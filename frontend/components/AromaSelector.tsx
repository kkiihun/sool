"use client";

import { Tag, Typography, Space } from "antd";
import { useState } from "react";

const { Text } = Typography;

const AROMA_PROFILES = [
  { label: "Floral", icon: "🌸", color: "#eb2f96" },
  { label: "Fruity", icon: "🍎", color: "#f5222d" },
  { label: "Nutty", icon: "🥜", color: "#874d00" },
  { label: "Grainy", icon: "🌾", color: "#faad14" },
  { label: "Earthy", icon: "🌲", color: "#52c41a" },
  { label: "Spicy", icon: "🌶️", color: "#cf1322" },
  { label: "Medicinal", icon: "🧪", color: "#13c2c2" },
  { label: "Sweet", icon: "🍯", color: "#fa8c16" },
  { label: "Smoky", icon: "💨", color: "#595959" },
  { label: "Citrus", icon: "🍋", color: "#fadb14" },
];

type Props = {
  selected: string[];
  onChange: (tags: string[]) => void;
};

export default function AromaSelector({ selected, onChange }: Props) {
  const toggleTag = (label: string) => {
    const next = selected.includes(label)
      ? selected.filter((t) => t !== label)
      : [...selected, label];
    onChange(next);
  };

  return (
    <div className="py-6">
      <div className="flex flex-wrap gap-4">
        {AROMA_PROFILES.map((profile) => {
          const isSelected = selected.includes(profile.label);
          return (
            <Tag.CheckableTag
              key={profile.label}
              checked={isSelected}
              onChange={() => toggleTag(profile.label)}
              className={`
                !px-6 !py-3 !rounded-2xl !text-sm !font-bold transition-all !m-0
                ${isSelected 
                  ? "!bg-amber-500 !text-black shadow-lg shadow-amber-500/20" 
                  : "!bg-white/5 !text-white/40 !border-white/10 hover:!bg-white/10"
                }
              `}
            >
              <span className="mr-2">{profile.icon}</span>
              {profile.label}
            </Tag.CheckableTag>
          );
        })}
      </div>
    </div>
  );
}
