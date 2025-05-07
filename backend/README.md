# Backend API (FastAPI)

## Getting Started

**Run the backend (from repo root):**

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

- The API will be available at `http://localhost:8000`.
- The OpenAPI docs are at `http://localhost:8000/docs`.

---

## Development vs. Production
- Use `--reload` for development (auto-reloads on code changes).
- For production, remove `--reload` and consider using a process manager (e.g., systemd, Docker, or Gunicorn with Uvicorn workers).

---

## Project Structure
- `backend/main.py`: FastAPI app entrypoint
- `backend/endpoints/`: API route modules (use one file per resource/feature)
- `backend/state.py`: Global state for model/tokenizer

---

## Notes
- Update CORS settings in `main.py` before deploying to production.
- All dependencies are managed in `requirements.txt` at the repo root.