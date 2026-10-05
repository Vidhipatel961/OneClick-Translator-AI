# Lingora AI (OneClick Translator AI) - Rebuild Prompts

Here is a step-by-step sequence of prompts to recreate the project from scratch while maintaining the exact same frontend UI and tech stack. You can feed these prompts one by one to your AI coding assistant (like Claude, ChatGPT, or Cursor).

## Initial Context (Provide this first)
```text
I want to build a multilingual media localization platform called Lingora AI (OneClick Translator AI) from scratch. 
The application allows users to upload text, audio, video, documents, and images and transform the content into a selected target language using AI.

Tech Stack:
- Frontend: React 19, Vite, Tailwind CSS 4, Framer Motion, Lucide React, React Router DOM, Plyr React.
- Backend: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL.

UI/UX Guidelines:
- Premium, modern AI SaaS visual style. Minimalist and clean.
- Dark mode support or a sleek dark-themed UI.
- Avoid excessive cards and gradients. Use strong typography and subtle animations (Framer Motion).
- Core pages: Dashboard, Translator Workspace, Projects, History, Glossary, AI Assistant, Settings.

Please act as an expert full-stack developer. I will give you instructions in small phases. Wait for my next prompt after completing each phase.
```

---

## Phase 1: Project & Backend Foundation
```text
PHASE 1: BACKEND FOUNDATION

Initialize the Python backend using FastAPI. 
1. Create a virtual environment and standard folder structure: `app/core`, `app/api`, `app/models`, `app/schemas`, `app/services`.
2. Set up `requirements.txt` with fastapi, uvicorn, sqlalchemy, alembic, pydantic.
3. Create a basic FastAPI entry point (`main.py`) with CORS configured for local frontend development.
4. Add a `GET /api/health` endpoint that returns `{"status": "ok"}`.
5. Set up SQLAlchemy with PostgreSQL and Alembic for migrations.
6. Create initial database models for `User`, `Project`, `File`, and `TranslationJob` with UUID primary keys and created_at timestamps.
7. Generate the initial Alembic migration.

Do not implement business logic yet. Just ensure the API starts successfully.
```

---

## Phase 2: Frontend Shell & Navigation
```text
PHASE 2: FRONTEND SHELL

Initialize the frontend using Vite + React (TypeScript).
1. Install dependencies: tailwindcss@4, framer-motion, lucide-react, react-router-dom.
2. Configure Tailwind CSS.
3. Build the core Application Shell with a top navigation bar or sidebar. Navigation links should include: Dashboard, Translator, Projects, History, AI Assistant, Settings.
4. Implement routing using `react-router-dom`.
5. Create empty placeholder pages for the routes.
6. Add reusable UI components: `Button`, `Input`, `Select`, `Card`, and a `LoadingSpinner`. Use modern, premium SaaS styling (clean borders, good spacing, subtle hover effects).

Make sure the app runs locally without errors.
```

---

## Phase 3: Translator UI (Visuals Only)
```text
PHASE 3: TRANSLATOR WORKSPACE UI

Build the main Translator Workspace UI (the core screen of the app) in the frontend.
Layout requirements:
1. Upload/Drop zone area that visually supports dragging and dropping files (drag-and-drop logic not needed yet).
2. A Source Language dropdown and a Target Language dropdown. Include a "Swap" button (with a Lucide icon) between them.
3. A large primary "Translate" button.
4. A split-pane or side-by-side view for Text input (left) and Translation output (right) for text translation.
5. Provide skeleton loaders or empty states for the result area.

Ensure the design is responsive and looks premium using Tailwind CSS and subtle Framer Motion transitions.
```

---

## Phase 4: File Upload & State Management
```text
PHASE 4: FILE UPLOAD INTEGRATION

Implement the file upload mechanism.
1. In the frontend Translator UI, implement the drag-and-drop logic to capture files (Text, Audio, Video, PDFs).
2. Create a backend API endpoint `POST /api/upload` to receive files.
3. The backend should validate file extensions, generate a unique storage key, save the file locally in an `uploads/` directory, and save file metadata to the database.
4. Return the `file_id` and metadata to the frontend.
5. Update the frontend to show the selected file name, size, and an option to "Remove" the file before translating.
```

---

## Phase 5: Text Translation Pipeline
```text
PHASE 5: TEXT TRANSLATION PIPELINE

Implement end-to-end Text Translation.
1. Create a backend endpoint `POST /api/translate/text` that accepts `source_language`, `target_language`, and `text`.
2. Implement a mock Translation Service (or use a free tier AI provider if API keys are available in `.env`) to process the text.
3. Save the translation request and result in the database.
4. Connect the frontend text area and "Translate" button to this endpoint.
5. Display loading states while translating, and populate the right-hand panel with the translated text upon success.
6. Add "Copy to Clipboard" and "Download as TXT" buttons to the result panel.
```

---

## Phase 6: Audio Processing Foundation
```text
PHASE 6: AUDIO TRANSLATION FOUNDATION

Implement the background processing pipeline for Audio (e.g., MP3/WAV).
1. Create a translation job mechanism. When an audio file is uploaded for translation, create a `TranslationJob` record in the database with status `PENDING`.
2. Implement a background task (using FastAPI `BackgroundTasks` or standard Python `asyncio` for MVP) to:
   - Run Speech-to-Text (STT) to generate a transcript (use a mock STT service for now).
   - Translate the transcript text.
   - Update the `TranslationJob` status to `COMPLETED`.
3. Create a `GET /api/jobs/{job_id}` endpoint to poll job status and progress.
```

---

## Phase 7: History & Polish
```text
PHASE 7: TRANSLATION HISTORY & POLISH

1. Backend: Create a `GET /api/history` endpoint that returns a list of past translation jobs and their statuses, sorted by created date.
2. Frontend: Implement the History page UI to fetch and display this list in a clean table or list layout. Include status badges (e.g., Pending, Completed, Failed).
3. Do a final UI polish: fix any alignment issues, ensure dark/light mode consistency, and verify error handling (e.g., showing toast notifications on API failures).
```
