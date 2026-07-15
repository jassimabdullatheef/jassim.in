import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("svelte", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);

/**
 * @param {string} str
 */
function escapeHtml(str) {
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]
  );
}

/**
 * Renders a fenced code block as a read-only, editor-style widget: a
 * titlebar with the language + a copy button, a line-number gutter, and
 * syntax-highlighted source underneath.
 * @param {string} code
 * @param {string | undefined} lang
 */
export function renderCodeBlock(code, lang) {
  const text = code.replace(/\n$/, "");
  const requested = (lang || "").trim().toLowerCase().split(/\s+/)[0] || "";
  const known = requested && hljs.getLanguage(requested);

  let html;
  try {
    html = known
      ? hljs.highlight(text, { language: requested }).value
      : escapeHtml(text);
  } catch {
    html = escapeHtml(text);
  }

  const lineCount = text.split("\n").length;
  let gutter = "";
  for (let i = 1; i <= lineCount; i++) gutter += `<span>${i}</span>`;

  const label = known ? requested : "text";

  return `<div class="code-block" data-lang="${label}">
  <div class="code-block-bar">
    <span class="code-block-dots"><i></i><i></i><i></i></span>
    <span class="code-block-lang">${label}</span>
    <button type="button" class="code-block-copy" data-copy aria-label="Copy code">copy</button>
  </div>
  <div class="code-block-body">
    <div class="code-block-gutter" aria-hidden="true">${gutter}</div>
    <pre class="code-block-pre"><code class="hljs language-${label}">${html}</code></pre>
  </div>
</div>`;
}
