# Prompt Package

<img width="748" height="221" alt="Prompt Package Logo" src="https://github.com/user-attachments/assets/764edff7-1d60-4da2-b6e2-4c04c400ba0f" />

> **[English](#english) | [简体中文](#简体中文) | [Deutsch](#deutsch)** · Release notes: [CHANGELOG.md](CHANGELOG.md)

---

<a name="english"></a>
## English

### Overview
**Prompt Package** is an AI project memory tool designed for individual users of OpenRouter, DeepSeek, and OpenAI. It turns transient AI conversations into a reusable knowledge base: **Context Packs** (structured, database-backed context you can attach to later chats), **Wrap** (Markdown memory files saved on disk per project), Bla Notes, and summaries help the next session pick up where you left off.

**Current release: v0.2.0**

### Deployment & Availability
- **Live Demo**: Try it online at **[prompt-p.cc](http://prompt-p.cc/)** — no signup tricks, just register and start building your project memory.
- **Global Model Access**: The cloud instance is hosted on an overseas node, so models from OpenAI, Google (Gemini), and Anthropic (Claude) — as well as OpenRouter and DeepSeek — all work directly in the browser without a VPN.

### What's New in v0.2.0
- **Wrap (on-disk project memory)**: From the chat **Wrap** menu, export a conversation to Markdown under each project’s memory folder (YAML frontmatter). **Quick Wrap** for a fast draft and save; **Advanced Wrap** for model choice, per-category filters, optional topic hints, and editable Markdown before save; **Routine Wrap** for weekly / bi-weekly / monthly reminders with **mandatory review** (no silent auto-save in this release).
- **Dashboard**: Project cards show **wrap count**, **total wrap size**, and **last wrapped** (or “Never” when there are no wrap files).
- **Streaming chat & retry**: Assistant replies stream over SSE. **Retry** rewrites only the targeted assistant message in place; **later messages stay** in the thread (OpenRouter-style semantics).
- **Settings**: Three panels — **API keys**, **Chat models** (composer picker), and **Wrap model** (default for wrap generation).
- **Chat UX**: Colored context chips for attached notes; improved CJK IME handling so **Enter** sends reliably after composition.
- **Still in the product**: **Context Zoo**, **Bla Notes**, **+ Context** in chat, and **Context Packs**. Legacy **“Wrap Up”** shortcuts on the project page and chat tab were removed in favor of Wrap; Context Pack flows remain wherever the app still exposes them.

### Earlier highlights (v0.1.x)
- **Context Zoo**, **Bla Notes**, **Chat Context Picker**, and Context Pack **versioning / structured content / visibility / usage** tracking.

### Tech Stack
- **Frontend**: Vue 3 (Composition API), Vite, Vue Router, Axios.
- **Backend**: Flask, Flask-SQLAlchemy (ORM), PyJWT, Fernet (Encrypted keys).
- **Database**: SQLite (MVP/Dev) / PostgreSQL (Prod).
- **Styling**: Custom Material-inspired system with responsive CSS Grid layouts.

### Quick Start
1. **Backend**: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python app.py`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. **Setup**: Add your API keys in the Settings page.

### Docker Deployment (Recommended)

One-command deployment via Docker Compose. Both the Flask backend
(gunicorn, 4 workers) and the Vue frontend (nginx with `/api` reverse
proxy) run as separate containers on a private network.

```bash
# 1) Generate the environment file and fill in real secrets
cp .env.docker.example .env
# Edit .env → SECRET_KEY / JWT_SECRET_KEY / ENCRYPTION_KEY

# 2) Build and start
docker compose up -d --build

# 3) Open
# http://<host>:8080 — change HOST_PORT in .env if 8080 is taken
```

Key features of the Docker setup:

- **Persistent data**: the SQLite DB and uploaded attachments live on
  a named volume (`prompt-package-data`), so container rebuilds don't
  lose your projects.
- **Same-origin by default**: the frontend nginx proxies `/api/*` to
  the backend container, so CORS and `VITE_API_BASE_URL` can both
  stay empty in the default topology.
- **Health checks** on both services drive `depends_on` — the frontend
  starts accepting traffic only after the backend reports healthy.
- **Non-root** backend user, `tini` as PID 1 for clean signal handling.

For production:

```bash
# Generate strong secrets once, store in .env, never commit them
python -c "import secrets; print(secrets.token_urlsafe(48))"        # SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(48))"        # JWT_SECRET_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"  # ENCRYPTION_KEY

# Flip to production mode (will refuse to boot with dev defaults)
echo 'FLASK_ENV=production' >> .env

docker compose up -d --build
```

Upgrading on the Alibaba Cloud box (or any server) later:

```bash
git pull origin main
docker compose up -d --build          # rebuilds only what changed
docker compose logs -f backend        # tail logs to confirm healthy boot
```

Want Postgres instead of the bundled SQLite? Add a `db` service to
`docker-compose.yml` and set `DATABASE_URL=postgresql://...` in `.env`
— the backend picks it up on next restart.

---

<a name="简体中文"></a>
## 简体中文

### 概览
**Prompt Package** 是一款面向 OpenRouter、DeepSeek 和 OpenAI 个人用户的 AI 项目记忆工具。它将零散的 AI 对话转化为可复用的项目知识库：**Context Pack**（数据库中的结构化上下文包）、**Wrap**（按项目写入磁盘的 Markdown 记忆）、Bla Note 与摘要等能力，让下一次会话无缝承接上一次进度。

**当前版本：v0.2.0**

### 部署与可用性
- **线上演示**：访问 **[prompt-p.cc](http://prompt-p.cc/)** 直接体验，注册账号即可开始构建您的项目知识库。
- **海外模型直连**：由于实例部署在海外节点，OpenAI、Google（Gemini）、Anthropic（Claude）以及 OpenRouter、DeepSeek 的模型均可在网页中直接使用，**无需 VPN**。

### v0.2.0 新功能
- **Wrap（项目磁盘记忆）**：在对话 **Wrap** 菜单中，将会话导出为带 YAML frontmatter 的 Markdown，保存到各项目 memory 目录。**Quick Wrap** 快速出稿并保存；**Advanced Wrap** 可选模型、按类别过滤、主题分析提示、保存前可编辑正文；**Routine Wrap** 支持每周 / 双周 / 每月到期提醒，**必须 Review 后才能保存**（本版不做静默自动保存）。
- **Dashboard**：项目卡片展示 **Wrap 数量**、**Wrap 占用总大小**、**上次 Wrap 时间**（无文件时显示 Never）。
- **流式对话与 Retry**：助手回复通过 SSE 流式输出；**Retry** 只就地重写当前选中的那条助手回复，**后续对话全部保留**（类似 OpenRouter 的就地重生成语义）。
- **设置页三块**：**API 密钥**、**Chat 模型**（对话里模型选择器展示哪些模型）、**Wrap 模型**（Wrap 生成默认模型）。
- **对话体验**：已选 Context 芯片颜色区分；中文等 IME 下 **回车发送** 更可靠。
- **仍保留**：**Context Zoo**、**Bla Notes**、对话 **+ Context**、数据库内的 **Context Pack**。原先项目页 / 对话侧栏上的旧版 **「Wrap Up」** 入口已移除，由 Wrap 替代；Context Pack 相关能力在应用中其它入口仍可使用。

### v0.1.x 已有能力
- **Context Zoo**、**Bla Notes**、**+ Context** 引用、Context Pack 的**版本 / 结构化内容 / 可见性 / 使用统计**。

### 技术栈
- **前端**: Vue 3 (Composition API), Vite, Vue Router, Axios。
- **后端**: Flask, Flask-SQLAlchemy (ORM), PyJWT, Fernet (API 密钥加密存储)。
- **数据库**: SQLite (开发/MVP) / PostgreSQL (生产)。
- **样式**: 自研类 Material 风格系统，采用响应式 CSS Grid 布局。

### 快速开始
1. **后端**: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python app.py`
2. **前端**: `cd frontend && npm install && npm run dev`
3. **配置**: 在 Settings 页面添加您的 provider API key。

---

<a name="deutsch"></a>
## Deutsch

### Überblick
**Prompt Package** ist ein KI-Projekt-Gedächtnistool für Einzelnutzer von OpenRouter, DeepSeek und OpenAI. Es verwandelt flüchtige KI-Gespräche in eine wiederverwendbare Wissensdatenbank: **Context Packs** (strukturiert in der Datenbank), **Wrap** (Markdown-Dateien pro Projekt auf der Festplatte), Bla Notes und Zusammenfassungen schließen die Lücke zwischen den Sitzungen.

**Aktuelle Version: v0.2.0**

### Bereitstellung & Verfügbarkeit
- **Live-Demo**: Online ausprobieren unter **[prompt-p.cc](http://prompt-p.cc/)** — einfach registrieren und sofort loslegen.
- **Globaler Modellzugriff**: Da die Instanz auf einem Übersee-Knoten läuft, funktionieren Modelle von OpenAI, Google (Gemini) und Anthropic (Claude) — sowie OpenRouter und DeepSeek — direkt im Browser, **ohne VPN**.

### Neu in v0.2.0
- **Wrap (Datei-Gedächtnis)**: Über das **Wrap**-Menü im Chat werden Gespräche als Markdown mit YAML-Frontmatter im Projektordner gespeichert. **Quick Wrap** für schnellen Entwurf; **Advanced Wrap** für Modellwahl, Filter, Themenhinweise und bearbeitbares Markdown; **Routine Wrap** mit Erinnerung (wöchentlich / zweiwöchentlich / monatlich) und **verpflichtender Review** (kein stilles Auto-Save).
- **Dashboard**: Projektkarten zeigen **Wrap-Anzahl**, **Gesamtgröße** und **zuletzt gewrappt** (oder „Never“).
- **Streaming & Retry**: Antworten per SSE gestreamt. **Retry** ersetzt nur die gewählte Assistentennachricht; **alle folgenden Nachrichten bleiben** (OpenRouter-ähnlich).
- **Einstellungen**: Drei Bereiche — **API-Keys**, **Chat-Modelle**, **Wrap-Modell**.
- **Chat-UX**: Farbige Kontext-Chips; zuverlässigeres **Enter** nach IME-Eingabe (CJK).

### Bereits in v0.1.x
- **Context Zoo**, **Bla Notes**, **Chat-Context-Picker**, Context-Pack-**Versionierung / Struktur / Sichtbarkeit / Nutzung**. Alte **„Wrap Up“**-Buttons auf Projekt- und Chat-Seite wurden durch Wrap ersetzt; Context-Pack-Funktionen bleiben erhalten, wo die App sie anbietet.

### Technologie-Stack
- **Frontend**: Vue 3 (Composition API), Vite, Vue Router, Axios.
- **Backend**: Flask, Flask-SQLAlchemy (ORM), PyJWT, Fernet (verschlüsselte API-Keys).
- **Datenbank**: SQLite (Entwicklung) / PostgreSQL (Produktion).
- **Styling**: Eigenes Material-inspiriertes System mit responsivem CSS-Grid-Layout.

### Schnellstart
1. **Backend**: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python app.py`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. **Einrichtung**: Fügen Sie Ihre API-Keys auf der Einstellungsseite (Settings) hinzu.
