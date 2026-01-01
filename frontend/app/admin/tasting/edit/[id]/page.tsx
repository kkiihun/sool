"use client";

import { useEffect, useState } from "react";
import SliderInput from "@/components/SliderInput";

export default function EditTastingPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/v2/tasting/note/${params.id}`)
      .then((res) => res.json())
      .then(setForm);
  }, [params.id]);

  const save = async () => {
    await fetch(`http://127.0.0.1:8000/v2/tasting/note/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    alert("수정 완료");
    location.href = "/admin/tasting/list";
  };

  if (!form) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold mb-4">✏ 테이스팅 수정 #{params.id}</h1>

      {/* 점수 슬라이더 */}
      <SliderInput label="Aroma"     value={form.aroma}     onChange={(v)=>setForm({...form, aroma:v})}/>
      <SliderInput label="Sweetness" value={form.sweetness} onChange={(v)=>setForm({...form, sweetness:v})}/>
      <SliderInput label="Acidity"   value={form.acidity}   onChange={(v)=>setForm({...form, acidity:v})}/>
      <SliderInput label="Body"      value={form.body}      onChange={(v)=>setForm({...form, body:v})}/>
      <SliderInput label="Finish"    value={form.finish}    onChange={(v)=>setForm({...form, finish:v})}/>

      {/* 코멘트만 일반 input(또는 textarea) 유지 */}
      <textarea
        value={form.comment}
        onChange={(e)=>setForm({...form, comment:e.target.value})}
        className="border p-2 w-full text-black rounded"
        placeholder="Comment"
      />

      <button
        onClick={save}
        className="bg-green-600 text-white px-4 py-2 rounded font-semibold"
      >
        저장
      </button>
    </div>
  );
}
