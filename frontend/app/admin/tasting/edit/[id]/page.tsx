"use client";

import { useEffect, useState } from "react";

export default function EditTastingPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/v2/tasting/note/${params.id}`)
      .then(res => res.json())
      .then(setForm);
  }, [params.id]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const save = async () => {
    await fetch(`http://127.0.0.1:8000/v2/tasting/note/${params.id}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(form),
    });
    alert("수정완료");
    location.href = "/admin/tasting/list";
  };

  if (!form) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">✏ 수정 #{params.id}</h1>

      {Object.keys(form).map(key => (
        key !== "id" && (
          <div key={key}>
            <label className="mr-2">{key}</label>
            <input
              name={key}
              value={form[key]}
              onChange={handleChange}
              className="border px-2 py-1 text-black"
            />
          </div>
        )
      ))}

      <button onClick={save} className="bg-green-600 text-white px-4 py-2 rounded">저장</button>
    </div>
  );
}
