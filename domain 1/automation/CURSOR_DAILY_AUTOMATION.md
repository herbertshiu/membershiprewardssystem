# Cursor daily automation — domain 1

Publish **one new article per day** in `domain 1/`: generate HTML, update `blog.html`, commit, and push to GitHub.

| Item | Value |
|------|--------|
| **Live URL** | https://mydigitalmembershipcard.hk |
| **Deploy repo** | `git@github.com:herbertshiu/mydigitalmembershipcard.git` (branch `main`) |
| Source repo | `herbertshiu/membershiprewardssystem` |
| Site folder | **`domain 1/`** only |
| Rules file | `domain 1/automation/DAILY_ARTICLE_PROMPT.md` |
| Topic queue | `domain 1/automation/article-topics-queue.json` |
| Source branch | `cursor/loyaltyhk-landing-page` (or your working branch) |

---

## Step 1 — Commit automation files (one time)

Before scheduling, push `domain 1/` (including `automation/` and the `<!-- ARTICLE-LIST -->` marker in `blog.html`) so the agent can read them:

```powershell
cd "c:\Users\Kristy CHAN\.cursor\membershiprewardssystem"
git checkout cursor/loyaltyhk-landing-page
git pull
git add "domain 1/"
git commit -m "Add domain 1 site and daily article automation."
git push
```

---

## Step 2 — Test manually (once)

Open **Cursor Agent** on this repo and paste:

```
Read domain 1/automation/DAILY_ARTICLE_PROMPT.md and follow the Quick copy-paste section exactly.

Use today's date in Hong Kong time (Asia/Hong_Kong).

This is a one-off test run. Do not create a scheduled automation yet.
Execute fully: new article in domain 1/, update blog.html + queue, commit, push.
Report article title, commit hash, and next topic in queue.
```

**Check after the run:**
- New `domain 1/article-*.html`
- `domain 1/blog.html` — new card first (after `<!-- ARTICLE-LIST -->`)
- `domain 1/automation/article-topics-queue.json` — slug moved to `published[]`
- GitHub branch has the commit

---

## Step 3 — Schedule in Cursor Automations

1. Open **Cursor → Automations → New automation**
2. **Name:** `Daily article — domain 1`
3. **Trigger:** Cron — `30 0 * * *` (08:30 HKT = 00:30 UTC; set timezone to **Asia/Hong_Kong** in editor if using local time picker)
4. **Git:** repo `herbertshiu/membershiprewardssystem`, branch `cursor/loyaltyhk-landing-page`
5. **Instructions:** paste the block below
6. Save → **Run now** once to confirm

### Daily instruction (paste into Automations)

```
You are a scheduled Cloud Agent updating the static site in domain 1/ (店家會員指南).

Read and follow every rule in domain 1/automation/DAILY_ARTICLE_PROMPT.md.

Today's date: use current date in Asia/Hong_Kong (YYYY-MM-DD for machine fields; YYYY年M月D日 for visible text).

Workflow:
1. git pull (current branch)
2. Take the first entry in domain 1/automation/article-topics-queue.json → pending[]
3. If pending is empty, stop and report「佇列已空」
4. Create domain 1/article-{slug}.html (copy structure from domain 1/article-points-rewards.html)
5. Insert new blog card immediately AFTER <!-- ARTICLE-LIST --> in domain 1/blog.html
6. Move slug from pending[] to published[] in domain 1/automation/article-topics-queue.json
7. Commit only: new article, domain 1/blog.html, domain 1/automation/article-topics-queue.json
8. git push (membershiprewardssystem source repo)
9. Deploy live site:
   powershell -NoProfile -ExecutionPolicy Bypass -File "domain 1/automation/deploy.ps1" -Message "Add article: {Chinese title}"

Do not modify any folder outside domain 1/.
Do not ask for confirmation. If deploy push fails, report the error and stop.

When done, reply with:
- Live URL: https://mydigitalmembershipcard.hk/article-{slug}.html
- Chinese title
- Deploy commit hash on mydigitalmembershipcard main
- Next pending topic slug (or "queue empty")
```

---

## Step 4 — When the queue runs out

Ask the agent:

```
Add 10 new topics to domain 1/automation/article-topics-queue.json pending[].
Follow the keyword pool in domain 1/automation/DAILY_ARTICLE_PROMPT.md.
Formal written Traditional Chinese angles for HK F&B / retail / beauty owners.
No duplicate slugs or angles already in published[].
Commit and push to the current branch.
```

---

## Optional: GitHub Actions (fully hands-off)

1. Commit `.github/workflows/daily-article-domain1.yml`
2. Repo → **Settings → Secrets → Actions** → add `OPENROUTER_API_KEY`
3. **Actions → Daily article (domain 1) → Run workflow** to test once
4. Schedule runs daily at 08:30 HKT

The workflow runs `domain 1/automation/generate-page.js`, then commits and pushes.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent edited wrong folder | Instructions must say **`domain 1/`** only |
| blog card not inserted | Confirm `<!-- ARTICLE-LIST -->` exists in `domain 1/blog.html` |
| Push rejected | `git pull --rebase`, resolve conflicts |
| Bad article tone | Edit `domain 1/automation/PROMPT_TEMPLATE.md`, push, next run picks up changes |
| Queue empty | Add topics to `pending[]` (Step 4) |
| Local preview down | Run `domain 1/serve.ps1` → http://127.0.0.1:4173/ |

---

## Files reference

| File | Role |
|------|------|
| `domain 1/automation/DAILY_ARTICLE_PROMPT.md` | Full content rules, HTML templates, git workflow |
| `domain 1/automation/article-topics-queue.json` | What to write next (10 topics queued) |
| `domain 1/automation/PROMPT_TEMPLATE.md` | AI prompts for `generate-page.js` |
| `domain 1/automation/generate-page.js` | OpenRouter script (optional, for Actions) |
| `domain 1/automation/CURSOR_DAILY_AUTOMATION.md` | This setup guide |
