# Domain 1 — daily article automation

One new SEO article per day for **店家會員指南** (`domain 1/`).

## Choose your method

| Method | Best for |
|--------|----------|
| **Cursor Automation** | Agent writes HTML + deploys on a schedule |
| **Manual deploy** | Run `deploy.ps1` after each article |

| Item | Value |
|------|--------|
| **Live URL** | https://mydigitalmembershipcard.hk |
| **Deploy repo** | `git@github.com:herbertshiu/mydigitalmembershipcard.git` |

## Quick start (Cursor Automation)

1. Commit and push `domain 1/` (including this folder) to GitHub.
2. Test once with the copy-paste block in **`DAILY_ARTICLE_PROMPT.md`**.
3. Schedule using **`CURSOR_DAILY_AUTOMATION.md`**.

## Quick start (GitHub Actions)

1. Add repo secret: `OPENROUTER_API_KEY`
2. Commit `.github/workflows/daily-article-domain1.yml`
3. Actions → **Daily article (domain 1)** → Run workflow

Local script test:

```powershell
cd "domain 1"
$env:OPENROUTER_API_KEY = "sk-or-..."
node automation/generate-page.js
git add article-*.html blog.html automation/article-topics-queue.json
git commit -m "Add article: (title)"
git push
```

## Files

| File | Purpose |
|------|---------|
| `DAILY_ARTICLE_PROMPT.md` | Full rules + copy-paste daily prompt |
| `CURSOR_DAILY_AUTOMATION.md` | Cursor Automations setup steps |
| `article-topics-queue.json` | Topic queue (one consumed per run) |
| `PROMPT_TEMPLATE.md` | AI system/user prompts for the script |
| `generate-page.js` | OpenRouter generator (optional) |

## Adding topics

Add objects to `pending[]` in `article-topics-queue.json`:

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

Filename becomes `article-my-topic.html`. Slugs already in `published[]` are skipped by the queue logic — do not reuse.

## Rules summary

- **Folder:** `domain 1/` only
- **Language:** formal 書面語 Traditional Chinese
- **Banned:** Mobile.Cards, mobile card(s), vendor names, sales CTAs
- **Keywords:** rotate from the pool in `DAILY_ARTICLE_PROMPT.md`
