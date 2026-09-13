// Renders repo cards (dark + light) from the GitHub API into dist/.
// Runs in the "Contribution snake" workflow; no dependencies.
const fs = require("fs");
const path = require("path");

const OWNER = process.env.OWNER || "mmvinfo28";
const REPOS = (process.env.REPOS || "crewboard,neetcode-submissions").split(",");
const OUT = process.env.OUT || "dist";
const TOKEN = process.env.GH_TOKEN;

const THEMES = {
  dark:  { bg: "#161b22", border: "#30363d", title: "#58a6ff", text: "#c9d1d9", muted: "#8b949e" },
  light: { bg: "#f6f8fa", border: "#d0d7de", title: "#0969da", text: "#1f2328", muted: "#57606a" },
};
const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", PowerShell: "#012456", Go: "#00ADD8", Rust: "#dea584",
};

const W = 400, PAD = 22, LINE = 17;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function wrap(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines) break;
    } else cur = (cur + " " + w).trim();
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\W*$/, "") + "…";
  }
  return lines;
}

function card(r, theme) {
  const t = THEMES[theme];
  const desc = wrap(r.description, 56, 2);
  const H = PAD + 20 + 12 + 2 * LINE + 14 + 20 + PAD - 8; // fixed: always reserve 2 description lines so cards align
  const footY = H - PAD + 2;
  const lang = r.language;
  const langColor = LANG_COLORS[lang] || t.muted;
  let fx = PAD;
  let footer = "";
  if (lang) {
    footer += `<circle cx="${fx + 6}" cy="${footY - 4}" r="6" fill="${langColor}"/>
    <text x="${fx + 18}" y="${footY}" class="muted">${esc(lang)}</text>`;
    fx += 18 + lang.length * 7 + 22;
  }
  footer += `<g transform="translate(${fx}, ${footY - 13})" fill="${t.muted}"><path fill-rule="evenodd" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></g>
    <text x="${fx + 22}" y="${footY}" class="muted">${r.stargazers_count}</text>`;
  fx += 22 + String(r.stargazers_count).length * 7 + 22;
  footer += `<g transform="translate(${fx}, ${footY - 13})" fill="${t.muted}"><path fill-rule="evenodd" d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></g>
    <text x="${fx + 22}" y="${footY}" class="muted">${r.forks_count}</text>`;

  const descSvg = desc.map((l, i) => `<tspan x="${PAD}" dy="${i === 0 ? 0 : LINE}">${esc(l)}</tspan>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(r.name)}: ${esc(r.description || "")}">
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 13px; fill: ${t.text}; }
    .title { font-size: 16px; font-weight: 600; fill: ${t.title}; }
    .muted { font-size: 12px; fill: ${t.muted}; }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="8" fill="${t.bg}" stroke="${t.border}"/>
  <g transform="translate(${PAD}, ${PAD - 2})" fill="${t.title}"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></g>
  <text x="${PAD + 24}" y="${PAD + 11}" class="title">${esc(r.name)}</text>
  <text x="${PAD}" y="${PAD + 40}">${descSvg}</text>
  ${footer}
</svg>
`;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const name of REPOS) {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${name}`, {
      headers: { Accept: "application/vnd.github+json", ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
    });
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    const r = await res.json();
    for (const theme of Object.keys(THEMES)) {
      const file = path.join(OUT, `card-${name}-${theme}.svg`);
      fs.writeFileSync(file, card(r, theme));
      console.log(`wrote ${file}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
