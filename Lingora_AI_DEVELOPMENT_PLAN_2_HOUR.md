# Lingora AI — 2-Hour Incremental Development Plan

**Version:** 1.0  
**Purpose:** Build the Lingora AI MVP incrementally using small AI-coding prompts.  
**Target:** First working end-to-end prototype in approximately 2 hours.  
**Development style:** One prompt → implement → run → verify → next prompt.

---

# 1. Important Development Strategy

Do NOT give Claude Code one huge prompt such as:

> "Build the complete Lingora AI application."

Instead, use small prompts.

Each prompt should:

1. Inspect the current project.
2. Understand existing code before changing it.
3. Make only the requested change.
4. Preserve working functionality.
5. Run the appropriate checks.
6. Report files changed.
7. Report errors honestly.
8. Stop after completing that phase.

Use the prompts below in order.

---

# 2. 2-Hour MVP Scope

The first 2-hour version should NOT attempt the entire production platform.

Build this working vertical slice:

```text
Landing Page
    ↓
Translator Workspace
    ↓
Upload Text / Audio
    ↓
Choose Source Language
    ↓
Choose Target Language
    ↓
Process Translation
    ↓
Show Transcript/Translation
    ↓
Copy / Download
    ↓
Translation History
```

The architecture should already leave room for:

```text
Video
PDF
DOCX
PPTX
OCR
TTS
Dubbing
AI Assistant
Glossary
Translation Memory
Billing
Teams
```

These should be implemented in later phases.

---

# 3. Recommended 2-Hour Time Allocation

| Phase | Time | Goal |
|---|---:|---|
| 0 | 5 min | Project audit |
| 1 | 7 min | Project foundation |
| 2 | 8 min | Backend API foundation |
| 3 | 8 min | Database foundation |
| 4 | 8 min | Frontend shell |
| 5 | 10 min | Translator UI |
| 6 | 8 min | Language system |
| 7 | 12 min | Text translation |
| 8 | 12 min | File upload |
| 9 | 12 min | Audio pipeline foundation |
| 10 | 8 min | Job status |
| 11 | 7 min | History |
| 12 | 8 min | Polish + validation |
| **Total** | **~113 min** | **MVP vertical slice** |

The remaining ~7 minutes are intentionally reserved for fixes and integration issues.

---

# 4. Ground Rules for Every AI Coding Prompt

Paste this instruction at the beginning of each Claude Code session/phase if necessary:

```text
You are working on Lingora AI.

Follow the existing PRD.md, SRS.md, SYSTEM_ARCHITECTURE.md, and UI_UX_SPECIFICATION.md.

Before modifying anything:
1. Inspect the existing project structure.
2. Identify the current frontend and backend technology.
3. Reuse existing working code where possible.
4. Do not rewrite the entire project.
5. Do not introduce unnecessary libraries.
6. Do not implement future features unless requested in this phase.
7. Keep the code production-oriented and modular.
8. Use environment variables for secrets.
9. Never hardcode API keys.
10. Run validation/tests after changes.
11. At the end, report:
   - files created
   - files modified
   - commands run
   - test/build result
   - remaining issues
```

---

# 5. PHASE 0 — PROJECT AUDIT

## Time: 5 minutes

### Objective

Understand the existing `Translator AI` project before changing code.

### Prompt

```text
PHASE 0 — PROJECT AUDIT

Inspect the complete existing Translator AI project.

Do NOT modify any files.

Identify:

1. Frontend technology and version.
2. Backend technology and version.
3. Existing routes/pages.
4. Existing components.
5. Existing APIs.
6. Existing database configuration.
7. Existing AI integrations.
8. Existing file upload functionality.
9. Existing translation functionality.
10. Existing authentication.
11. Existing environment variables.
12. Existing package/dependency configuration.
13. Existing problems/errors.
14. What can be reused for Lingora AI.

Compare the current project against:

- PRD.md
- SRS.md
- SYSTEM_ARCHITECTURE.md
- UI_UX_SPECIFICATION.md

Create a concise implementation gap report.

Do not modify the project.

At the end, provide:
- Current architecture
- Reusable modules
- Missing modules
- Critical issues
- Recommended next phase
```

### Expected result

You should know exactly what already exists.

---

# 6. PHASE 1 — PROJECT FOUNDATION

## Time: 7 minutes

### Objective

Prepare the project for incremental development.

### Prompt

```text
PHASE 1 — PROJECT FOUNDATION

Using the audit from Phase 0, prepare the project foundation.

Requirements:

1. Preserve existing working functionality.
2. Do not rewrite the application.
3. Create missing standard configuration files only where needed.
4. Create/update .env.example.
5. Add clear development scripts/commands.
6. Ensure frontend and backend can run locally.
7. Add a basic README development section if missing.
8. Ensure secrets are not hardcoded.
9. Add .gitignore entries for:
   - .env
   - node_modules
   - Python virtual environments
   - build output
   - temporary uploaded files
   - generated media

Run the frontend/backend startup checks.

Do not implement translation yet.

Report all changes.
```

---

# 7. PHASE 2 — BACKEND API FOUNDATION

## Time: 8 minutes

### Objective

Create a clean FastAPI backend structure without implementing all business logic.

### Prompt

```text
PHASE 2 — BACKEND FOUNDATION

Create or improve the FastAPI backend foundation according to SYSTEM_ARCHITECTURE.md.

Implement:

1. FastAPI application entry point.
2. /api/health endpoint.
3. Configuration management.
4. Environment variable loading.
5. CORS configuration for local frontend.
6. Central API router.
7. Standard error handling.
8. Basic logging.
9. Pydantic schema structure.
10. Service-layer structure.

Recommended structure:

app/
  main.py
  core/
  api/
  schemas/
  services/
  models/
  providers/
  workers/

Do not implement authentication, translation, video, OCR, or billing yet.

Run:
- backend startup
- /api/health check

Keep the implementation minimal and clean.
```

### Expected API

```text
GET /api/health

{
  "status": "ok"
}
```

---

# 8. PHASE 3 — DATABASE FOUNDATION

## Time: 8 minutes

### Objective

Create the initial database foundation.

### Prompt

```text
PHASE 3 — DATABASE FOUNDATION

Implement the initial PostgreSQL database layer according to SRS.md and SYSTEM_ARCHITECTURE.md.

Implement:

1. SQLAlchemy configuration.
2. Database session management.
3. Alembic configuration.
4. User model.
5. Project model.
6. File model.
7. TranslationJob model.
8. TranslationResult model.
9. Basic relationships.
10. UUID primary keys where appropriate.
11. created_at and updated_at timestamps.
12. Useful indexes.

Do not implement billing or complex translation memory yet.

Create and run the initial migration.

Verify:
- database connection
- migration
- application startup

If PostgreSQL is not available locally, provide a clear setup instruction rather than silently switching architecture.
```

---

# 9. PHASE 4 — FRONTEND APPLICATION SHELL

## Time: 8 minutes

### Objective

Create the initial Lingora AI visual shell.

### Prompt

```text
PHASE 4 — FRONTEND SHELL

Build the Lingora AI application shell according to UI_UX_SPECIFICATION.md.

Requirements:

1. Use the existing frontend stack if already configured.
2. Create responsive application layout.
3. Add top navigation.
4. Add Lingora AI branding.
5. Add:
   - Dashboard
   - Translator
   - Projects
   - History
   - Settings
6. Create reusable Button, Input, Select, Modal and EmptyState components if missing.
7. Add responsive mobile navigation.
8. Establish CSS/design tokens.
9. Use a premium modern AI SaaS visual style.
10. Avoid excessive cards and excessive gradients.
11. Keep accessibility in mind.

Do not implement actual translation yet.

Make the application visually usable before moving forward.
```

---

# 10. PHASE 5 — TRANSLATOR WORKSPACE

## Time: 10 minutes

### Objective

Create the core translator screen.

### Prompt

```text
PHASE 5 — TRANSLATOR WORKSPACE

Create the main Lingora AI Translator workspace.

Layout:

- Page heading: Translate Your Content
- Upload/drop zone
- Source language selector
- Target language selector
- Swap language button
- Translation options area
- Primary Translate button
- Result area

The upload area should support:
- Drag and drop
- Browse files
- File preview
- Remove file
- Replace file

Create proper empty/loading/error/success states.

At this stage, the Translate button can use mock processing.

Do not connect a real AI provider yet.

Make the UI responsive for desktop, tablet and mobile.

Do not modify unrelated pages.
```

---

# 11. PHASE 6 — LANGUAGE SYSTEM

## Time: 8 minutes

### Objective

Create a reusable language system.

### Prompt

```text
PHASE 6 — LANGUAGE SYSTEM

Implement the Lingora AI language selection system.

Requirements:

1. Create a centralized supported-language configuration.
2. Include at least:
   - Gujarati
   - Hindi
   - English
   - Marathi
   - Bengali
   - Tamil
   - Telugu
   - Kannada
   - Malayalam
   - Punjabi
   - French
   - German
   - Spanish
   - Arabic
   - Japanese
3. Language selector must be searchable.
4. Show native language names where useful.
5. Support source/target swapping.
6. Prevent selecting the same source and target where appropriate.
7. Keep the language configuration reusable by:
   - text
   - audio
   - video
   - documents
   - OCR
8. Backend should expose supported languages through an API endpoint.

Do not implement translation in this phase.
```

---

# 12. PHASE 7 — TEXT TRANSLATION

## Time: 12 minutes

### Objective

Create the first real end-to-end translation capability.

### Prompt

```text
PHASE 7 — TEXT TRANSLATION

Implement text translation end-to-end.

Flow:

Frontend
  ↓
POST /api/translate/text
  ↓
Translation Service
  ↓
Translation Provider
  ↓
Translated text
  ↓
Frontend result

Requirements:

1. Create translation request schema.
2. Create translation response schema.
3. Create TranslationProvider interface.
4. Create provider implementation using the configured AI/translation provider.
5. Read provider credentials from environment variables.
6. Never hardcode API keys.
7. Add timeout handling.
8. Add safe error handling.
9. Validate source and target languages.
10. Show loading state in frontend.
11. Show translated result.
12. Add Copy button.
13. Add Download as TXT.
14. Save successful translation metadata/history.

If no provider credentials exist:
- implement a mock provider for development
- make provider selection configurable
- do not fake production success

Test at least:
Gujarati → English
English → Gujarati
Hindi → English
```

---

# 13. PHASE 8 — FILE UPLOAD

## Time: 12 minutes

### Objective

Build the foundation for media processing.

### Prompt

```text
PHASE 8 — FILE UPLOAD

Implement secure file upload for the Translator workspace.

For this phase support:

- TXT
- MP3
- WAV
- M4A
- MP4
- PDF
- DOCX
- JPG
- PNG

Requirements:

1. Validate extension.
2. Validate MIME type.
3. Validate maximum file size.
4. Generate a safe storage key.
5. Do not trust the original filename as a storage path.
6. Save metadata to PostgreSQL.
7. Store binary files using the configured storage abstraction.
8. For local development, support a local storage adapter.
9. Create an object-storage adapter interface for future S3/R2 support.
10. Return file ID.
11. Return file metadata.
12. Show upload progress.
13. Show validation errors.
14. Allow remove/replace before processing.

Do not implement video translation yet.

Keep storage provider abstract.
```

---

# 14. PHASE 9 — AUDIO TRANSLATION FOUNDATION

## Time: 12 minutes

### Objective

Create the first media pipeline.

### Prompt

```text
PHASE 9 — AUDIO TRANSLATION FOUNDATION

Implement the first Gujarati audio → English translation pipeline.

Architecture:

Upload
 ↓
File record
 ↓
Translation Job
 ↓
Background Worker
 ↓
Speech-to-Text
 ↓
Transcript
 ↓
Translation
 ↓
Result

Requirements:

1. Create SpeechToTextProvider interface.
2. Add configurable STT provider.
3. Extract audio metadata.
4. Create TranslationJob.
5. Add asynchronous processing architecture.
6. Create worker task.
7. Process Gujarati audio.
8. Generate Gujarati transcript.
9. Translate transcript to selected language.
10. Save transcript and translated text.
11. Update job status.
12. Return job ID to frontend.

For this phase, do NOT generate dubbed audio yet.

Use a mock provider if credentials are unavailable, but clearly label it as development/mock mode.
```

---

# 15. PHASE 10 — JOB STATUS AND PROGRESS

## Time: 8 minutes

### Objective

Make long-running processing understandable.

### Prompt

```text
PHASE 10 — JOB STATUS

Implement job status tracking.

Supported states:

PENDING
PROCESSING
TRANSCRIBING
TRANSLATING
GENERATING_AUDIO
RENDERING
COMPLETED
FAILED
CANCELLED

Requirements:

1. Create GET /api/jobs/{job_id}.
2. Return:
   - status
   - progress
   - current_stage
   - error information
   - created_at
   - completed_at
3. Frontend should poll job status.
4. Show a clear processing timeline.
5. Never use fake progress.
6. Progress should reflect actual known stages.
7. Show retry action for recoverable failures.
8. Show final result when completed.

Keep polling simple. SSE can be added later.
```

---

# 16. PHASE 11 — TRANSLATION HISTORY

## Time: 7 minutes

### Objective

Allow users to find previous work.

### Prompt

```text
PHASE 11 — TRANSLATION HISTORY

Implement translation history.

Backend:

1. Create GET /api/history.
2. Support pagination.
3. Filter by:
   - file type
   - source language
   - target language
   - status
4. Return:
   - filename
   - media type
   - language pair
   - status
   - created date
   - result/job ID

Frontend:

1. Build History page.
2. Add search.
3. Add filters.
4. Add status indicators.
5. Add Open Result action.
6. Add Download action where available.
7. Add empty state.

Do not implement advanced analytics.
```

---

# 17. PHASE 12 — 2-HOUR POLISH AND VALIDATION

## Time: 8 minutes

### Objective

Make the prototype stable enough to demonstrate.

### Prompt

```text
PHASE 12 — MVP POLISH AND VALIDATION

Perform a focused quality pass on the Lingora AI MVP.

Check:

1. Frontend build.
2. Backend startup.
3. API health endpoint.
4. Database connection.
5. File upload.
6. Language selection.
7. Text translation.
8. Audio job creation.
9. Job status polling.
10. Translation history.
11. Mobile layout.
12. Console errors.
13. Backend exceptions.
14. Broken imports.
15. Missing environment variables.
16. Loading states.
17. Error states.
18. Empty states.

Fix only issues related to the implemented MVP.

Do not add new large features.

After validation provide:

- Working features
- Known issues
- Commands executed
- Test/build results
- Recommended next phase
```

---

# 18. Expected Result After 2 Hours

At the end of these phases, the prototype should demonstrate:

```text
                  LINGORA AI
                       |
                       v
                Translator Page
                       |
             +---------+---------+
             |                   |
             v                   v
          Text Input          Upload
             |                   |
             v                   v
        Language Select     File Validation
             |                   |
             v                   v
        Translation API      Create Job
             |                   |
             v                   v
        Translation         Background Worker
             |                   |
             +---------+---------+
                       |
                       v
                    Result
                       |
             +---------+---------+
             |                   |
             v                   v
           Copy              Download
             |
             v
          History
```

---

# 19. PHASE 13 — AUDIO DUBBING

**Do this after the first 2-hour MVP.**

### Prompt

```text
PHASE 13 — AUDIO DUBBING

Extend the existing audio pipeline.

Flow:

Audio
 ↓
STT
 ↓
Transcript
 ↓
Translation
 ↓
TTS
 ↓
Translated Audio

Implement:

1. TextToSpeechProvider interface.
2. Configurable TTS provider.
3. Voice/language selection.
4. Generate translated audio.
5. Store output.
6. Add audio player.
7. Add download.
8. Keep original audio.
9. Show transcript and translated transcript.
10. Update job stages.

Do not implement video dubbing in this phase.
```

---

# 20. PHASE 14 — VIDEO TRANSLATION

### Prompt

```text
PHASE 14 — VIDEO TRANSLATION

Extend the existing media architecture to video.

Flow:

Video
 ↓
FFmpeg audio extraction
 ↓
STT
 ↓
Timestamped transcript
 ↓
Translation
 ↓
Subtitle generation
 ↓
Optional TTS
 ↓
Final output

Support:

- MP4 input
- SRT output
- VTT output
- translated transcript
- optional translated audio

Do not implement lip-sync yet.

Use background workers.

Do not block the HTTP request during processing.
```

---

# 21. PHASE 15 — DOCUMENT TRANSLATION

### Prompt

```text
PHASE 15 — DOCUMENT TRANSLATION

Implement document translation.

Support:

- PDF
- DOCX
- PPTX

Pipeline:

Upload
 ↓
Detect document type
 ↓
Extract text
 ↓
Segment text
 ↓
Translate
 ↓
Reconstruct document
 ↓
Output

Requirements:

1. Preserve basic structure.
2. Preserve paragraphs.
3. Preserve tables where feasible.
4. Keep original file unchanged.
5. Generate a translated output file.
6. Store output metadata.
7. Use background jobs.
8. Handle extraction errors safely.

Do not implement complex document layout recreation beyond the MVP.
```

---

# 22. PHASE 16 — OCR TRANSLATION

### Prompt

```text
PHASE 16 — OCR TRANSLATION

Implement image and scanned-document OCR translation.

Flow:

Image/PDF
 ↓
OCR
 ↓
Detected Text
 ↓
Translation
 ↓
Result

Requirements:

1. OCRProvider abstraction.
2. Configurable OCR provider.
3. Extract text.
4. Preserve page information where available.
5. Translate detected text.
6. Display original detected text.
7. Display translated text.
8. Add copy/download.
9. Support JPG/PNG.
10. Support scanned PDF through the document pipeline.
```

---

# 23. PHASE 17 — AI CONTENT ASSISTANT

### Prompt

```text
PHASE 17 — AI CONTENT ASSISTANT

Implement an AI assistant for uploaded content.

Users should be able to:

- Summarize
- Ask questions
- Extract key points
- Explain content
- Generate FAQ
- Extract action items

Architecture:

File
 ↓
Text extraction
 ↓
Chunking
 ↓
Embeddings
 ↓
Vector storage
 ↓
Relevant retrieval
 ↓
LLM
 ↓
Answer

For small files, direct context may be used.

For large files, use retrieval.

Do not send entire large documents to the LLM unnecessarily.
```

---

# 24. PHASE 18 — GLOSSARY

### Prompt

```text
PHASE 18 — TRANSLATION GLOSSARY

Implement user/project glossary support.

Fields:

- source term
- target term
- source language
- target language
- project
- notes

Requirements:

1. CRUD API.
2. Search.
3. Add/edit/delete UI.
4. Apply glossary terms during translation.
5. Keep glossary project-specific where configured.
6. Prevent unauthorized access to another user's glossary.
```

---

# 25. PHASE 19 — TRANSLATION MEMORY

### Prompt

```text
PHASE 19 — TRANSLATION MEMORY

Implement reusable translation memory.

When a translation is approved:

1. Store source segment.
2. Store target segment.
3. Store language pair.
4. Store project/user association.
5. Search for matching or similar previous translations.
6. Offer reusable suggestions.
7. Allow user approval before applying suggestions.

Do not automatically overwrite user translations.
```

---

# 26. PHASE 20 — AUTHENTICATION

If authentication is not already implemented:

### Prompt

```text
PHASE 20 — AUTHENTICATION

Implement production-oriented authentication.

Requirements:

1. Registration.
2. Login.
3. Logout.
4. Password hashing.
5. JWT access token.
6. Protected API routes.
7. Current-user endpoint.
8. Frontend auth state.
9. Route protection.
10. Resource ownership checks.

Every project, file, job, glossary entry and history record must be scoped to the authenticated user.

Never trust user_id supplied by the client for authorization.
```

---

# 27. PHASE 21 — USAGE LIMITS

### Prompt

```text
PHASE 21 — USAGE LIMITS

Implement basic usage tracking.

Track:

- translation count
- audio duration
- video duration
- document count
- storage usage
- AI assistant usage

Create:

GET /api/usage

Display basic usage in the dashboard.

Do not implement payment integration yet.
```

---

# 28. PHASE 22 — BILLING

### Prompt

```text
PHASE 22 — BILLING FOUNDATION

Design subscription/billing architecture.

Plans:

FREE
PRO
BUSINESS

Implement:

1. Plan configuration.
2. User subscription state.
3. Usage enforcement.
4. Billing provider abstraction.
5. Webhook architecture.
6. Subscription status.

Do not hardcode payment secrets.

Do not mark a subscription active based only on a frontend response.
```

---

# 29. PHASE 23 — ADMIN

### Prompt

```text
PHASE 23 — ADMIN DASHBOARD

Create an admin area.

Show:

- users
- jobs
- failed jobs
- storage usage
- provider failures
- processing statistics
- supported languages
- system health

Protect admin routes using backend authorization.

Do not expose private user files unnecessarily.
```

---

# 30. PHASE 24 — PRODUCTION HARDENING

### Prompt

```text
PHASE 24 — PRODUCTION HARDENING

Review the entire Lingora AI application for production readiness.

Check:

Security
Performance
File validation
Authentication
Authorization
Database indexes
Background jobs
Retries
Provider timeouts
Storage access
Secrets
CORS
Rate limiting
Logging
Error handling
Temporary file cleanup
Resource ownership
Large-file handling

Fix high-risk issues first.

Do not introduce unnecessary architecture changes.
```

---

# 31. PHASE 25 — DEPLOYMENT

### Prompt

```text
PHASE 25 — DEPLOYMENT

Prepare Lingora AI for deployment.

Requirements:

Frontend:
- production build
- environment configuration

Backend:
- production server
- environment configuration
- health endpoint

Worker:
- production worker process

Infrastructure:
- PostgreSQL
- Redis
- Object storage

Create:

- Dockerfile where appropriate
- docker-compose for local development
- production deployment documentation
- .env.example
- health checks

Do not put real credentials into source control.
```

---

# 32. AI CODING AGENT RULES

When using Claude Code or another coding agent, use these rules.

## Rule 1 — One Phase at a Time

Never ask the agent to implement Phase 1–25 in one request.

Use:

```text
Phase 1
↓
Run
↓
Check
↓
Phase 2
↓
Run
↓
Check
```

---

## Rule 2 — Do Not Accept Blind Rewrites

If the agent says:

> "I rewrote the entire frontend."

Stop and review.

The application should evolve incrementally.

---

## Rule 3 — Require Verification

Every phase should end with:

```text
Build
Test
Run
Verify
Report
```

---

## Rule 4 — Keep Provider Abstraction

Never tightly couple the application to one AI provider.

Use:

```text
Provider Interface
       ↓
Implementation
```

---

## Rule 5 — Never Hardcode Secrets

Bad:

```python
API_KEY = "sk-xxxxx"
```

Good:

```python
API_KEY = settings.AI_API_KEY
```

---

# 33. Suggested Git Workflow

After every successful phase:

```bash
git add .
git commit -m "feat: complete phase 01 project foundation"
```

Examples:

```text
feat: complete phase 02 backend foundation
feat: complete phase 05 translator workspace
feat: complete phase 07 text translation
feat: complete phase 08 file upload
feat: complete phase 09 audio pipeline
```

This makes rollback easy.

---

# 34. Phase Completion Template

After every prompt, ask the coding agent to report:

```text
PHASE COMPLETION REPORT

Phase:
Status:

Files Created:
-

Files Modified:
-

Dependencies Added:
-

Database Changes:
-

API Changes:
-

UI Changes:
-

Tests:
-

Commands Run:
-

Build:
PASS / FAIL

Known Issues:
-

Next Recommended Phase:
-
```

---

# 35. MVP Demonstration Script

After the first 2-hour build, demonstrate the product using this scenario:

```text
1. Open Lingora AI.
2. Click Start Translating.
3. Select Gujarati.
4. Select English.
5. Upload a Gujarati audio file.
6. Show upload progress.
7. Start translation.
8. Show processing stages.
9. Show Gujarati transcript.
10. Show English translation.
11. Copy translation.
12. Download transcript.
13. Open History.
14. Show completed job.
```

This is the first meaningful product demo.

---

# 36. What NOT to Build During the First 2 Hours

Do not spend the first 2 hours building:

```text
❌ Billing
❌ Stripe/payment integration
❌ Team management
❌ Complex admin dashboard
❌ Lip-sync
❌ Advanced RAG
❌ Fine-tuning
❌ Kubernetes
❌ Microservices
❌ Complex analytics
❌ Mobile native app
❌ Enterprise SSO
❌ Advanced subscription management
```

The first objective is a working product loop.

---

# 37. Recommended Final Product Roadmap

```text
                    LINGORA AI
                        |
        +---------------+---------------+
        |                               |
      MVP                         Production
        |                               |
 Text Translation                  Auth
 Audio STT                        Usage
 Upload                            Billing
 History                           Security
        |                               |
        +---------------+---------------+
                        |
                  Media Platform
                        |
              +---------+---------+
              |         |         |
             Audio     Video    Documents
              |         |         |
             TTS      Dubbing     OCR
                        |
                        v
                  AI Intelligence
                        |
              +---------+---------+
              |         |         |
             RAG     Glossary   Memory
              |
              v
             Teams
              |
              v
             API
```

---

# 38. Definition of MVP Done

The 2-hour MVP is considered successful when:

- Frontend starts.
- Backend starts.
- `/api/health` works.
- Translator screen works.
- Language selection works.
- Text translation works or clearly operates in configured mock mode.
- File upload works.
- Audio job can be created.
- Job status can be checked.
- Processing states are displayed.
- Translation result can be displayed.
- Result can be copied/downloaded.
- History displays completed work.
- No critical console errors remain.
- No secrets are committed.
- Existing project functionality is preserved.

---

# 39. The Most Important Development Rule

Build the **smallest complete vertical slice first**.

Do not think:

```text
"I need to build a translation platform."
```

Think:

```text
"I need to make one Gujarati audio file become
an English transcript successfully."
```

Then:

```text
Gujarati Audio
      ↓
STT
      ↓
Gujarati Text
      ↓
English Translation
      ↓
English Text
```

Then add:

```text
English Text
      ↓
TTS
      ↓
English Audio
```

Then:

```text
Gujarati Video
      ↓
STT
      ↓
Translation
      ↓
Subtitles
      ↓
Dubbing
      ↓
English Video
```

Then documents, OCR, AI assistant, glossary, memory, billing and teams.

That sequence dramatically reduces development risk.

---

# 40. Master Build Sequence

Use this exact order:

```text
PHASE 0   Audit
   ↓
PHASE 1   Foundation
   ↓
PHASE 2   FastAPI
   ↓
PHASE 3   Database
   ↓
PHASE 4   Frontend Shell
   ↓
PHASE 5   Translator UI
   ↓
PHASE 6   Languages
   ↓
PHASE 7   Text Translation
   ↓
PHASE 8   Upload
   ↓
PHASE 9   Audio Pipeline
   ↓
PHASE 10  Job Status
   ↓
PHASE 11  History
   ↓
PHASE 12  Validation
   ↓
       MVP
   ↓
PHASE 13  Audio Dubbing
   ↓
PHASE 14  Video
   ↓
PHASE 15  Documents
   ↓
PHASE 16  OCR
   ↓
PHASE 17  AI Assistant
   ↓
PHASE 18  Glossary
   ↓
PHASE 19  Translation Memory
   ↓
PHASE 20  Authentication
   ↓
PHASE 21  Usage
   ↓
PHASE 22  Billing
   ↓
PHASE 23  Admin
   ↓
PHASE 24  Production Hardening
   ↓
PHASE 25  Deployment
```

---

# 41. Final Development Principle

Lingora AI should be developed as:

> **Small prompt → small feature → test → commit → next feature.**

The first goal is not to build every feature.

The first goal is to prove the core product promise:

> **Upload content → choose a language → AI processes it → receive useful translated content.**

Once that loop is stable, expand from text to audio, audio to video, video to documents, and finally AI-powered content intelligence.
