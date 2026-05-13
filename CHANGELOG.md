# Changelog

All notable changes to this project are documented here. The app version is mirrored in `backend/config.py` (`APP_VERSION`), `frontend/package.json`, and `frontend/src/constants/appVersion.js`.

## [0.2.0] — 2026-05-14

### Added

- **Wrap (project memory)**: Markdown files with frontmatter under per-project memory, via Quick Wrap, Advanced Wrap (model, filters, topic hints, editable body), and Routine Wrap (scheduled reminder, review required, no silent auto-save).
- **Dashboard**: Per-project wrap count, wrap storage size, last wrapped time.
- **Streaming chat**: SSE streaming for new messages and retry; UTF-8-safe decoding on the backend.
- **In-place retry**: Regenerating an assistant reply updates that message only; later messages are preserved.
- **Settings**: Three sections — API keys, Chat models, Wrap model default.
- **Tests**: Wrap phases, streaming, and regenerate semantics.

### Changed

- Chat UX: context chip tones, IME-friendly Enter to send, consolidated copy control on assistant bubbles.
- Removed legacy **Wrap Up** buttons from the project detail page and chat tab (Wrap replaces that entry path for the new workflow).

### Notes

- **Context Packs** (database) remain available alongside **Wrap** (files on disk); they serve different workflows.

## [0.1.0] — earlier

Initial public MVP: projects, chat, Bla Notes, Context Packs, Context Zoo, search, multi-provider keys, and related infrastructure.
