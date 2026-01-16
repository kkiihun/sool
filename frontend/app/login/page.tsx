"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  const save = () => {
    const t = token.trim();
    if (!t) return;
    localStorage.setItem("access_token", t);
    router.replace("/Tasting");
  };

  const clear = () => {
    localStorage.removeItem("access_token");
    setToken("");
  };

  return (
    <div className="p-6 text-white max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Login (Temp)</h1>

      <p className="text-gray-300 mb-4">
        임시 로그인 페이지입니다. PowerShell에서 발급받은 <b>access_token(JWT)</b>을 붙여 넣고 저장하세요.
      </p>

      <textarea
        className="w-full h-40 p-3 rounded bg-zinc-900 text-white border border-zinc-700"
        placeholder='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (JWT)'
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={save}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
        >
          Save token & Go Tasting
        </button>

        <button
          onClick={clear}
          className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear token
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        저장 키: <code>access_token</code>
      </div>
    </div>
  );
}
