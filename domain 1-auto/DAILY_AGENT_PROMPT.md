# Daily agent prompt (Cursor Automation / manual run)

Copy everything below the line into a **Cursor Automation** (daily schedule) or paste as a one-shot agent instruction.

---

## Prompt (copy from here)

Run the **daily article job** for「店家會員指南」.

**Working folder:** `domain 1-auto` (do not modify `domain 1`, `domain 3`, or other site folders).

### Steps

1. Read `domain 1-auto/keywords-queue.json`. If `pending` is empty, stop and report that the queue needs more topics.
2. Take the **first** object from `pending` as today's topic (`slug`, `topic_en`, `primary_keyword`, etc.).
3. Read `domain 1-auto/PROMPT_TEMPLATE.md` (system + user rules) and `domain 1-auto/article-digital-membership.html` as the HTML style reference.
4. Create `domain 1-auto/article-<slug>.html`:
   - Formal written Traditional Chinese (書面語), neutral guide tone for HK shop owners.
   - Match existing nav, footer, and `post__*` CSS classes.
   - ~500–750 characters body, 3–5 `<h2>` sections.
   - **Never** mention Mobile.Cards, mobile card(s), or any vendor/product brand.
   - Weave today's keywords naturally; primary keyword must appear in `<h1>` or lead.
   - Today's date in `<time>` (ISO + 繁體 visible date).
5. Update `domain 1-auto/blog.html`: insert a new `<a class="blog-card">` **immediately after** the `<!-- ARTICLE-LIST -->` marker (newest article on top). Use `tag`, title from `<h1>`, short blurb from meta description, and `read_minutes` from the queue entry.
6. Update `domain 1-auto/keywords-queue.json`: remove the topic from `pending`, append `{ slug, generated_at }` to `done`.
7. **Commit and push** to GitHub:
   - Stage only: `domain 1-auto/article-<slug>.html`, `domain 1-auto/blog.html`, `domain 1-auto/keywords-queue.json`
   - Commit message: `Add article: <article title in Chinese>`
   - Push to the current branch (`git push`)

### Do not

- Edit files outside `domain 1-auto` unless explicitly asked.
- Add contact forms, external CTAs, or brand names.
- Create empty commits if generation failed.

### After push

Reply with: article filename, Chinese title, primary keyword, and GitHub commit hash.

---

## Cursor Automation settings (suggested)

| Field | Value |
|-------|--------|
| **Name** | Daily article — domain 1-auto |
| **Trigger** | Every day at 8:30 AM HKT (`cron: 30 0 * * *` UTC) |
| **Repo** | `herbertshiu/membershiprewardssystem` |
| **Branch** | `cursor/loyaltyhk-landing-page` (or your deploy branch) |
| **Tools** | Git write + push (or full agent shell with git) |

## Alternative: GitHub Actions (no Cursor needed daily)

If `OPENROUTER_API_KEY` is set in repo secrets, workflow `.github/workflows/daily-article-domain1-auto.yml` runs the same job automatically:

1. Settings → Secrets → `OPENROUTER_API_KEY`
2. Actions → **Daily article (domain 1-auto)** → Run workflow (test once)
3. Schedule: daily 08:30 HKT

Local test:

```powershell
cd "domain 1-auto"
$env:OPENROUTER_API_KEY = "sk-or-..."
node generate-page.js
```

## Topic queue

Add entries to `pending` in `keywords-queue.json`. Each run consumes one entry. Current queue has 8 topics pre-loaded.
