"use client";

type Props = {
  label: string;
  name?: string;
  max?: number;
  value: number;
  onChange: (v: number) => void;
};

export default function SliderInput({ label, value, onChange, max = 5 }: Props) {
  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">{label}: {value}</label>
      <input
        type="range"
        min="0"
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
