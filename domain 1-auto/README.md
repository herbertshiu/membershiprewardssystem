# Domain 1 — auto article generator (sandbox)

Experimental copy of `domain 1` for daily AI-generated articles. **The original `domain 1` folder is not modified by this setup** (unless you change the workflow `working-directory`).

## Quick start

| Method | Best for |
|--------|----------|
| **GitHub Actions** | Fully hands-off: one new page + push every day |
| **Cursor Automation** | Use `DAILY_AGENT_PROMPT.md` with a daily schedule |
| **Local test** | `node generate-page.js` before enabling automation |

## What runs

1. `keywords-queue.json` — topic queue (one entry consumed per run)
2. `PROMPT_TEMPLATE.md` — AI system/user prompts (edit to tune tone, SEO, banned words)
3. `DAILY_AGENT_PROMPT.md` — copy-paste prompt for Cursor Agent / Automations
4. `generate-page.js` — calls OpenRouter, writes `article-<slug>.html`, prepends card to `blog.html`
5. `.github/workflows/daily-article-domain1-auto.yml` — scheduled GitHub Action

## GitHub setup (recommended)

1. **Commit and push** this folder plus `.github/workflows/daily-article-domain1-auto.yml`
2. Repo → **Settings → Secrets and variables → Actions**
3. Add secret: `OPENROUTER_API_KEY` ([openrouter.ai](https://openrouter.ai))
4. Optional variable: `OPENROUTER_MODEL` (default: `anthropic/claude-3.5-sonnet`)
5. **Actions → Daily article (domain 1-auto) → Run workflow** to test once
6. After you are happy, either merge articles into `domain 1` manually, or change the workflow `working-directory` to `domain 1`

## Local test

```powershell
cd "domain 1-auto"
$env:OPENROUTER_API_KEY = "sk-or-..."
node generate-page.js
```

Preview (port **4174** so it does not clash with `domain 1`):

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
# Open http://127.0.0.1:4174/
```

## Adding topics

Add objects to `pending` in `keywords-queue.json`:

```json
{
  "slug": "my-topic",
  "topic_en": "English description for the model",
  "primary_keyword": "會員卡",
  "secondary_keywords": ["會員系統", "會員經營"],
  "tag": "會員卡",
  "vibe": "optional angle",
  "read_minutes": "5"
}
```

Slug becomes the filename: `article-my-topic.html`.

## Prompt tuning

Edit `PROMPT_TEMPLATE.md` — especially system rules (formal 書面語, banned brands, length). No code change needed; the script reloads the file each run.

For Cursor Automations, use the full step-by-step block in `DAILY_AGENT_PROMPT.md`.
