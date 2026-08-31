# Daily article prompt — domain 1（店家會員指南）

Use this prompt **once per day** (Cursor Agent, Cloud Agent, or Cursor Automation) to publish **one new SEO article** in `domain 1/`, update the blog listing, and **deploy to the live site**.

| Item | Value |
|------|--------|
| **Live URL** | https://mydigitalmembershipcard.hk |
| **Deploy repo** | `git@github.com:herbertshiu/mydigitalmembershipcard.git` (branch `main`) |
| **Source folder** | `domain 1/` in `membershiprewardssystem` |

**Site folder:** `domain 1/` only — do not modify `domain 3/`, `domain 4/`, `domain 5/`, repo root, or other folders.

---

## Quick copy-paste (daily run)

Paste into the agent. Use **today's date in Asia/Hong_Kong** (YYYY-MM-DD and YYYY年M月D日).

```
You are updating the static site in domain 1/ (店家會員指南).

Read and follow every rule in domain 1/automation/DAILY_ARTICLE_PROMPT.md.

Today's date: current date in Asia/Hong_Kong.

Tasks:
1. git pull (current branch)
2. Take the first entry in domain 1/automation/article-topics-queue.json → pending[]
3. Create domain 1/article-{slug}.html (match article-points-rewards.html structure)
4. Insert new blog card immediately AFTER <!-- ARTICLE-LIST --> in domain 1/blog.html (newest first)
5. Move slug from pending[] to published[] in article-topics-queue.json
6. Commit domain 1 changes to membershiprewardssystem (optional but recommended)
7. Deploy live site: powershell -NoProfile -ExecutionPolicy Bypass -File "domain 1/automation/deploy.ps1" -Message "Add article: {short Chinese title}"

Do not modify any folder outside domain 1/.
Do not ask for confirmation. Execute fully, then report: article title, commit hash, files changed, next pending slug.
```

---

## Site rules (mandatory)

### Brand and tone
- Site name: **店家會員指南** — independent informational site for HK F&B, retail, beauty owners.
- Language: **formal written Traditional Chinese (書面語)**. Complete sentences; short paragraphs; lists OK.
- Audience: busy shop owners — practical, not academic.

### Forbidden (never in copy, titles, meta, or filenames)
- Any vendor/product brand name (e.g. Mobile.Cards).
- The phrases **mobile card**, **mobile cards** (use 數碼會員卡 / 會員卡 app instead).
- Sales CTAs: 立即查詢, 提交查詢, 查詢方案, 官方網站 (for a product).
- Keyword **bolding** (`<strong>`) for SEO stuffing.

### Allowed
- Neutral guides, checklists, industry practices.
- CTAs: 閱讀文章, 瀏覽指南, links to other articles on this site.
- Generic mention of comparing market options; no push to a specific vendor.

### SEO keywords (rotate naturally; do not repeat the same angle within 7 days)
會員卡, 會員系統app, 會員app, 會員卡 app, 會員系統, 會員卡app, 會員經營, 會員, 會員制度, 店家儲值系統, 線上訂單系統, app製作, 手機app開發工具, Customer loyalty program, customer retention strategies

---

## Topic selection

1. Open `domain 1/automation/article-topics-queue.json`.
2. Take the **first object** in `pending[]`.
3. If `pending` is empty, stop and report:「佇列已空，請補充新主題。」Do not invent topics unless the user asked you to refill the queue.
4. After publish, append the slug to `published[]` and remove that object from `pending[]`.

---

## Files to create / update

| Action | File |
|--------|------|
| **Create** | `domain 1/article-{slug}.html` |
| **Update** | `domain 1/blog.html` — insert new `<a class="blog-card">` immediately **after** `<!-- ARTICLE-LIST -->` |
| **Update** | `domain 1/automation/article-topics-queue.json` — move slug to `published[]` |

Do **not** modify: `domain 1/styles.css`, `domain 1/index.html`, `domain 1/serve.ps1`, or any folder outside `domain 1/` unless fixing a broken link.

---

## Style reference

Before writing, read and match:

| File | Purpose |
|------|---------|
| `domain 1/article-points-rewards.html` | Article HTML template (nav, post layout, footer) |
| `domain 1/blog.html` | Blog card format |
| `domain 1/styles.css` | Do not edit unless broken |

---

## New article structure

Copy shell from `article-points-rewards.html`. Replace content only.

| Field | Rule |
|-------|------|
| `<title>` | `{Chinese headline}｜{keyword cluster}｜店家會員指南` or similar |
| `meta description` | 1–2 sentences, ~80–160 characters, natural keyword use |
| `meta keywords` | comma-separated from topic |
| `<p class="eyebrow">` | short category (from queue `tag`) |
| `<h1>` | specific headline; must relate to `primary_keyword` |
| `<p class="post__meta">` | `<time datetime="{DATE_ISO}">{DATE_ZH}</time> · 約 {READ_MINS} 分鐘閱讀` |
| `<p class="post__lead">` | 1–2 sentence summary |
| Body | 3–5 `<h2>` sections, ~500–750 Chinese characters total |
| `<aside class="post__next">` | link to one related existing article |

Required body skeleton:

```html
<main class="post">
  <article class="container post__inner">
    <p class="post__crumb"><a href="index.html">首頁</a> / <a href="blog.html">指南</a> / 本篇</p>
    <p class="eyebrow">{TAG}</p>
    <h1>{TITLE}</h1>
    <p class="post__meta"><time datetime="{DATE_ISO}">{DATE_ZH}</time> · 約 {READ_MINS} 分鐘閱讀</p>
    <p class="post__lead">...</p>
    <!-- 3–5 h2 sections -->
    <aside class="post__next">
      <p>...</p>
      <a class="btn btn--primary" href="article-....html">閱讀相關文章</a>
    </aside>
  </article>
</main>
```

Use the **standard header + footer** from any existing article in `domain 1/`.

---

## blog.html card snippet (prepend)

Insert immediately **after** `<!-- ARTICLE-LIST -->`:

```html
          <a class="blog-card" href="article-{slug}.html">
            <p class="blog-card__tag">{TAG}</p>
            <h2>{TITLE}</h2>
            <p>{CARD_TEASER — one formal sentence, max ~40 字}</p>
            <p class="blog-card__meta">約 {READ_MINS} 分鐘閱讀</p>
          </a>
```

---

## Git workflow (source repo — optional)

Track changes in `membershiprewardssystem`:

```powershell
cd "c:\Users\Kristy CHAN\.cursor\membershiprewardssystem"
git pull
git add "domain 1/article-{slug}.html" "domain 1/blog.html" "domain 1/automation/article-topics-queue.json"
git commit -m "Add article: {short Chinese title}"
git push
```

## Deploy workflow (live site — required)

Push the public site to **mydigitalmembershipcard.hk**:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "domain 1/automation/deploy.ps1" -Message "Add article: {short Chinese title}"
```

This copies `domain 1/` (excluding `automation/`) to `.deploy-mydigitalmembershipcard/` and pushes to `git@github.com:herbertshiu/mydigitalmembershipcard.git` → GitHub Pages updates the live site.

If push is rejected: pull in the deploy folder, resolve conflicts, run deploy again.

---

## Quality checklist (before commit)

- [ ] New file at `domain 1/article-{slug}.html`; slug matches queue entry
- [ ] No forbidden words; no `<strong>` in article body
- [ ] Formal 書面語; readable for shop owners
- [ ] `post__next` internal link works
- [ ] `blog.html` shows new article first (after marker)
- [ ] `article-topics-queue.json` updated
- [ ] Pushed to remote

---

## Alternative: script + GitHub Actions (no Cursor daily)

If `OPENROUTER_API_KEY` is set as a repo secret:

```powershell
cd "domain 1"
$env:OPENROUTER_API_KEY = "sk-or-..."
node automation/generate-page.js
```

Then commit and push the changed files. See `domain 1/automation/README.md` and `.github/workflows/daily-article-domain1.yml`.

---

## Example agent report

```
Published: https://mydigitalmembershipcard.hk/article-birthday-rewards.html
Title: 生日禮遇與季節性會員活動：小店也能做什麼？
Deploy commit: a1b2c3d on herbertshiu/mydigitalmembershipcard main
Files: article-birthday-rewards.html, blog.html, article-topics-queue.json
Next topic: tiered-membership
```
