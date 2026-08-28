#!/usr/bin/env node
/**
 * generate-page.js
 *
 * Pops the next topic off keywords-queue.json, asks an AI model (via OpenRouter)
 * to write a full HTML article page matching the site's existing style, saves it
 * as article-<slug>.html, links it into blog.html, and updates the queue file.
 *
 * Requires: Node 18+ (uses built-in fetch), env var OPENROUTER_API_KEY.
 * Run manually with:  OPENROUTER_API_KEY=sk-... node generate-page.js
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = process.cwd();
const QUEUE_PATH = path.join(REPO_ROOT, "keywords-queue.json");
const PROMPT_PATH = path.join(REPO_ROOT, "PROMPT_TEMPLATE.md");
const BLOG_PATH = path.join(REPO_ROOT, "blog.html");
const EXAMPLE_PAGE_NAME = "article-digital-membership.html";
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) fail(`keywords-queue.json not found at ${QUEUE_PATH}`);
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + "\n");
}

function loadPromptParts() {
  if (!fs.existsSync(PROMPT_PATH)) fail(`PROMPT_TEMPLATE.md not found at ${PROMPT_PATH}`);
  const md = fs.readFileSync(PROMPT_PATH, "utf8");

  const extract = (heading) => {
    const idx = md.indexOf(heading);
    if (idx === -1) fail(`Could not find "${heading}" section in PROMPT_TEMPLATE.md`);
    const fenceStart = md.indexOf("```", idx) + 3;
    const fenceEnd = md.indexOf("```", fenceStart);
    return md.slice(fenceStart, fenceEnd).trim();
  };

  return {
    system: extract("## System prompt"),
    userTemplate: extract("## User prompt"),
  };
}

function loadExampleHtml() {
  const examplePath = path.join(REPO_ROOT, EXAMPLE_PAGE_NAME);
  if (fs.existsSync(examplePath)) return fs.readFileSync(examplePath, "utf8");

  const fallback = fs
    .readdirSync(REPO_ROOT)
    .find((f) => /^article-.*\.html$/.test(f));
  if (fallback) {
    console.warn(`WARN: ${EXAMPLE_PAGE_NAME} not found, using ${fallback} as style reference instead.`);
    return fs.readFileSync(path.join(REPO_ROOT, fallback), "utf8");
  }
  fail("No existing article-*.html file found to use as a style reference.");
}

function fillTemplate(str, vars) {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.split(`{{${key}}}`).join(val),
    str
  );
}

async function callOpenRouter(system, user) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) fail("OPENROUTER_API_KEY environment variable is not set.");

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

  if (!res.ok) {
    const text = await res.text();
    fail(`OpenRouter API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  let html = data.choices?.[0]?.message?.content?.trim();
  if (!html) fail("OpenRouter response did not contain any content.");

  html = html.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "");
  return html;
}

function extractMatch(html, pattern) {
  const match = html.match(pattern);
  if (!match) return "";
  return match[1].replace(/<[^>]+>/g, "").trim();
}

function extractTitle(html, fallback) {
  return extractMatch(html, /<h1[^>]*>(.*?)<\/h1>/is) || fallback;
}

function extractDescription(html) {
  return extractMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
}

function extractEyebrow(html) {
  return extractMatch(html, /<p class="eyebrow">(.*?)<\/p>/is);
}

function extractReadMinutes(html) {
  const match = html.match(/約\s*(\d+)\s*分鐘閱讀/);
  return match ? match[1] : "5";
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkIntoBlog(slug, title, topic, html) {
  if (!fs.existsSync(BLOG_PATH)) {
    console.warn("WARN: blog.html not found — skipping link insertion.");
    return;
  }

  const marker = "<!-- ARTICLE-LIST -->";
  const tag = topic.tag || extractEyebrow(html) || topic.primary_keyword;
  const blurb = topic.blurb || extractDescription(html) || "香港店家會員經營實務參考。";
  const readMinutes = topic.read_minutes || extractReadMinutes(html);

  const entry = `          <a class="blog-card" href="article-${slug}.html">
            <p class="blog-card__tag">${escapeHtml(tag)}</p>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(blurb)}</p>
            <p class="blog-card__meta">約 ${readMinutes} 分鐘閱讀</p>
          </a>
${marker}`;

  let blog = fs.readFileSync(BLOG_PATH, "utf8");
  if (!blog.includes(marker)) {
    console.warn(
      `WARN: blog.html has no "${marker}" marker — link not inserted automatically.`
    );
    return;
  }

  blog = blog.replace(marker, entry);
  fs.writeFileSync(BLOG_PATH, blog);
  console.log("Linked new page into blog.html");
}

async function main() {
  const queue = loadQueue();
  if (!queue.pending || queue.pending.length === 0) {
    console.log("No pending topics left in keywords-queue.json. Add more entries to keep the daily job running.");
    return;
  }

  const topic = queue.pending.shift();
  const { system, userTemplate } = loadPromptParts();
  const exampleHtml = loadExampleHtml();

  const vars = {
    EXAMPLE_HTML: exampleHtml,
    SLUG: topic.slug,
    TOPIC_EN: topic.topic_en,
    PRIMARY_KEYWORD: topic.primary_keyword,
    SECONDARY_KEYWORDS: (topic.secondary_keywords || []).join(", "),
    VIBE: topic.vibe || "consistent with the existing site",
    TODAY: new Date().toISOString().slice(0, 10),
  };
  const systemPrompt = fillTemplate(system, vars);
  const userPrompt = fillTemplate(userTemplate, vars);

  console.log(`Generating article-${topic.slug}.html (keyword: ${topic.primary_keyword})...`);
  const html = await callOpenRouter(systemPrompt, userPrompt);

  const outPath = path.join(REPO_ROOT, `article-${topic.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`Wrote ${outPath}`);

  const title = extractTitle(html, topic.topic_en);
  linkIntoBlog(topic.slug, title, topic, html);

  queue.done = queue.done || [];
  queue.done.push({ slug: topic.slug, generated_at: new Date().toISOString() });
  saveQueue(queue);
  console.log("Updated keywords-queue.json");

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${topic.slug}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `title=${title}\n`);
  }
}

main().catch((err) => fail(err.stack || String(err)));
