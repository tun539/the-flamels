# FlameAtlas — The Flamels

Dashboard hỗ trợ nghiên cứu cháy trong môi trường vi trọng lực.

## Trạng thái

Đây là bộ khung khởi tạo, chưa phải MVP hoàn chỉnh. Chưa nhập hoặc xác minh dữ liệu thực nghiệm. Không có số đo hoặc kết luận khoa học giả trong demo.

## Chạy bằng Docker

```sh
cp .env.example .env
docker compose up --build
```

- Giao diện: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

## Chạy backend local

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

## Chạy frontend local

```sh
cd frontend
npm ci
npm run dev
```

## Kiểm tra

```sh
python -m unittest discover -s backend/tests
cd frontend
npm ci
npm run typecheck
npm run build
```

## Tài liệu

- [Yêu cầu sản phẩm](docs/product-requirements.txt)
- [Danh mục nguồn](docs/sources.md): snapshot liên kết, không phải dữ liệu khoa học đã xác minh.
- [Lộ trình](docs/roadmap.md)

Research support tool. Not a certified fire safety assessment.
