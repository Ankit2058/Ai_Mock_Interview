# Ai_Mock_Interview
An AI-powered mock interview system that simulates real interview scenarios.

See the [PROJECT_CHARTER](PROJECT_CHARTER.md) for goals, architecture, and milestones.

## Demo CLI
A small command-line demo shows how LangChain can power an interview bot.

```bash
pip install -r requirements.txt
python demo_app.py
```
If you set the `OPENAI_API_KEY` environment variable the summary will use OpenAI; otherwise a mock LLM is used and a placeholder summary is returned. A JSON transcript is written to `transcript.json`.

## Backend API
A minimal FastAPI backend exposes interview endpoints.

```bash
pip install -r requirements.txt
uvicorn backend.app:app --reload
```
Endpoints:
- `GET /questions` – list of interview questions
- `POST /responses` – submit answers
- `GET /summary` – summarise the transcript

## Frontend
A lightweight HTML/JS frontend lives in `frontend/index.html`.
Serve it with any static web server, e.g.:

```bash
python -m http.server 5500
```
Then open http://localhost:5500/frontend/index.html in your browser while the backend runs on port 8000.
