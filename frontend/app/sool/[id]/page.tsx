async function getSool(id: string) {
  const res = await fetch(`http://127.0.0.1:8000/sool/${id}`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function SoolDetail({ params }: { params: { id: string } }) {
  const data = await getSool(params.id);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{data.name}</h1>

      <p className="mb-2">🍶 도수: {data.abv ?? "?"}%</p>
      <p className="mb-2">📍 지역: {data.region ?? "미등록"}</p>
      <p className="mb-2">📦 카테고리: {data.category ?? "미분류"}</p>

      <a href="/" className="block mt-6 underline text-blue-400">
        ← 목록으로 돌아가기
      </a>
    </div>
  );
}
