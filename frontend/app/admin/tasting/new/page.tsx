"use client";
import { useState } from "react";

export default function NewTastingNotePage() {
  const [form, setForm] = useState({
    sool_id: "",
    aroma: "",
    sweetness: "",
    acidity: "",
    body: "",
    finish: "",
    comment: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitForm = async () => {
    const res = await fetch("http://127.0.0.1:8000/v2/tasting/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sool_id: Number(form.sool_id),
        aroma: Number(form.aroma),
        sweetness: Number(form.sweetness),
        acidity: Number(form.acidity),
        body: Number(form.body),
        finish: Number(form.finish),
      }),
    });

    if (res.ok) alert("등록 완료!");
    else alert("실패했습니다.");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🍶 Tasting Note 등록</h1>

      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        {Object.keys(form).map((key) => (
          <div key={key}>
            <label className="mr-2 capitalize">{key}</label>
            <input
              name={key}
              value={(form as any)[key]}
              onChange={handleChange}
              className="border px-2 py-1 rounded text-black"
            />
          </div>
        ))}

        <button
          onClick={submitForm}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          저장하기
        </button>
      </form>
    </div>
  );
}
