#!/usr/bin/env node
/**
 * generate-page.js — domain 1 daily article generator
 *
 * Pops the next topic from automation/article-topics-queue.json, calls OpenRouter,
 * writes domain 1/article-<slug>.html, prepends card to blog.html, updates queue.
 *
 * Run from domain 1/:
 *   OPENROUTER_API_KEY=sk-... node automation/generate-page.js
 */

const fs = require("fs");
const path = require("path");

const SITE_ROOT = path.join(__dirname, "..");
const AUTOMATION = path.join(__dirname);
const QUEUE_PATH = path.join(AUTOMATION, "article-topics-queue.json");
const PROMPT_PATH = path.join(AUTOMATION, "PROMPT_TEMPLATE.md");
const BLOG_PATH = path.join(SITE_ROOT, "blog.html");
const EXAMPLE_PAGE = path.join(SITE_ROOT, "article-points-rewards.html");
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) fail(`Queue not found: ${QUEUE_PATH}`);
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + "\n");
}

function loadPromptParts() {
  const md = fs.readFileSync(PROMPT_PATH, "utf8");
  const extract = (heading) => {
    const idx = md.indexOf(heading);
    if (idx === -1) fail(`Missing "${heading}" in PROMPT_TEMPLATE.md`);
    const fenceStart = md.indexOf("```", idx) + 3;
    const fenceEnd = md.indexOf("```", fenceStart);
    return md.slice(fenceStart, fenceEnd).trim();
  };
  return { system: extract("## System prompt"), userTemplate: extract("## User prompt") };
}

function loadExampleHtml() {
  if (fs.existsSync(EXAMPLE_PAGE)) return fs.readFileSync(EXAMPLE_PAGE, "utf8");
  const fallback = fs
    .readdirSync(SITE_ROOT)
    .find((f) => /^article-.*\.html$/.test(f));
  if (fallback) return fs.readFileSync(path.join(SITE_ROOT, fallback), "utf8");
  fail("No article-*.html found in domain 1/");
}

function fillTemplate(str, vars) {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.split(`{{${key}}}`).join(val),
    str
  );
}

async function callOpenRouter(system, user) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) fail("OPENROUTER_API_KEY is not set.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) fail(`OpenRouter ${res.status}: ${await res.text()}`);

  const data = await res.json();
  let html = data.choices?.[0]?.message?.content?.trim();
  if (!html) fail("Empty model response.");
  return html.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "");
}

function extractMatch(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : "";
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkIntoBlog(slug, title, topic, html) {
  const marker = "<!-- ARTICLE-LIST -->";
  if (!fs.existsSync(BLOG_PATH)) {
    console.warn("blog.html not found — skipping.");
    return;
  }

  const tag = topic.tag || extractMatch(html, /<p class="eyebrow">(.*?)<\/p>/is) || topic.primary_keyword;
  const blurb =
    topic.blurb ||
    extractMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i) ||
    "香港店家會員經營實務參考。";
  const readMinutes = topic.read_minutes || "5";

  const entry = `          <a class="blog-card" href="article-${slug}.html">
            <p class="blog-card__tag">${escapeHtml(tag)}</p>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(blurb)}</p>
            <p class="blog-card__meta">約 ${readMinutes} 分鐘閱讀</p>
          </a>
${marker}`;

  let blog = fs.readFileSync(BLOG_PATH, "utf8");
  if (!blog.includes(marker)) {
    console.warn(`blog.html missing "${marker}" — card not inserted.`);
    return;
  }
  fs.writeFileSync(BLOG_PATH, blog.replace(marker, entry));
  console.log("Updated blog.html");
}

async function main() {
  const queue = loadQueue();
  if (!queue.pending?.length) {
    console.log("Queue empty — add topics to pending[] in article-topics-queue.json.");
    process.exit(0);
  }

  const topic = queue.pending.shift();
  const { system, userTemplate } = loadPromptParts();
  const exampleHtml = loadExampleHtml();
  const today = new Date().toISOString().slice(0, 10);

  const vars = {
    EXAMPLE_HTML: exampleHtml,
    SLUG: topic.slug,
    TOPIC_EN: topic.topic_en,
    PRIMARY_KEYWORD: topic.primary_keyword,
    SECONDARY_KEYWORDS: (topic.secondary_keywords || []).join(", "),
    VIBE: topic.vibe || "consistent with the existing site",
    TODAY: today,
  };

  console.log(`Generating article-${topic.slug}.html (${topic.primary_keyword})...`);
  const html = await callOpenRouter(fillTemplate(system, vars), fillTemplate(userTemplate, vars));

  const outPath = path.join(SITE_ROOT, `article-${topic.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`Wrote ${outPath}`);

  const title = extractMatch(html, /<h1[^>]*>(.*?)<\/h1>/is) || topic.topic_en;
  linkIntoBlog(topic.slug, title, topic, html);

  queue.published = queue.published || [];
  queue.published.push(topic.slug);
  saveQueue(queue);
  console.log("Updated article-topics-queue.json");

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${topic.slug}\ntitle=${title}\n`);
  }
}

main().catch((err) => fail(err.stack || String(err)));
