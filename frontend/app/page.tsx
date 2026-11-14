export const dynamic = "force-dynamic";

type Catalogue = { total: number; status: string };
export default async function Home() {
  let catalogue: Catalogue | null = null;
  try {
    const response = await fetch(`${process.env.BACKEND_URL || "http://localhost:8000"}/api/investigations`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Backend unavailable");
    catalogue = await response.json();
  } catch { /* Render an explicit connection state. */ }
  return <main>
    <p className="eyebrow">THE FLAMELS · RESEARCH WORKSPACE</p>
    <h1>Flame<span>Atlas</span></h1>
    <p className="intro">Khám phá bằng chứng về cháy trong môi trường vi trọng lực.</p>
    <section aria-labelledby="status"><h2 id="status">Trạng thái dữ liệu</h2>
      <p>{catalogue ? `${catalogue.total} nghiên cứu trong bộ dữ liệu hiện tại.` : "Chưa kết nối được backend. Kiểm tra dịch vụ và tải lại trang."}</p>
      <p>Chưa nhập dữ liệu thực nghiệm đã xác minh. Danh mục nguồn và yêu cầu sản phẩm nằm trong thư mục docs của dự án.</p>
      <a href="/">Tải lại trạng thái</a>
    </section>
    <section><h2>Lộ trình sản phẩm</h2><ol>
      <li>Xác minh nguồn và nhập nghiên cứu có provenance.</li>
      <li>Tìm kiếm, xem chi tiết và so sánh điều kiện thí nghiệm.</li>
      <li>Scenario Explorer và xếp hạng có giải thích.</li>
      <li>Evidence Assistant có dẫn nguồn và xuất báo cáo.</li>
    </ol></section>
    <footer>Research support tool. Not a certified fire safety assessment.</footer>
  </main>;
}
