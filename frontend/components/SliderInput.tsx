"use client";

type Props = {
  label: string;
  name: string;
  value: number;
  onChange: (v: number) => void;
};

export default function SliderInput({ label, name, value, onChange }: Props) {
  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">{label}: {value}</label>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
