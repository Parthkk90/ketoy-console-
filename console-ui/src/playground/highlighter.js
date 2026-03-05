/**
 * K-DSL Syntax Highlighter
 * Produces HTML with span-wrapped tokens styled for an XCode-like dark theme.
 */

const COMPONENT_NAMES = new Set([
  'KColumn', 'KRow', 'KBox', 'KCard', 'KText', 'KButton', 'KImage', 'KSpacer',
  'KIcon', 'KIconButton', 'KComponent',
]);

const HELPER_FUNCTIONS = new Set([
  'kModifier', 'LModifier', 'kMargin', 'kPadding', 'kBorder', 'kRounded',
  'kImageUrl', 'kImageRes', 'listOf', 'mapOf',
]);

const ENUM_NAMESPACES = new Set([
  'KArrangements', 'KAlignments', 'KFontWeights', 'KTextAlign',
  'KScaleType', 'KShapes', 'KGradients',
]);

const KEYWORDS = new Set(['val', 'true', 'false', 'to']);

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Highlight K-DSL code into HTML with CSS class spans.
 * @param {string} code - raw K-DSL source
 * @returns {string} HTML with <span class="hl-*"> wrappers
 */
export function highlightDSL(code) {
  let html = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    // ── Single-line comment ──
    if (code[i] === '/' && i + 1 < len && code[i + 1] === '/') {
      let end = code.indexOf('\n', i);
      if (end === -1) end = len;
      html += `<span class="hl-comment">${escapeHTML(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // ── Multi-line comment ──
    if (code[i] === '/' && i + 1 < len && code[i + 1] === '*') {
      let end = code.indexOf('*/', i);
      if (end === -1) end = len; else end += 2;
      html += `<span class="hl-comment">${escapeHTML(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // ── String literal ──
    if (code[i] === '"') {
      let end = i + 1;
      while (end < len && code[end] !== '"') {
        if (code[end] === '\\') end++;
        end++;
      }
      if (end < len) end++; // include closing "
      html += `<span class="hl-string">${escapeHTML(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // ── Number literal (with optional f suffix) ──
    if (/[0-9]/.test(code[i]) || (code[i] === '-' && i + 1 < len && /[0-9]/.test(code[i + 1]))) {
      let end = i;
      if (code[end] === '-') end++;
      while (end < len && /[0-9.]/.test(code[end])) end++;
      if (end < len && (code[end] === 'f' || code[end] === 'F')) end++;
      html += `<span class="hl-number">${escapeHTML(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // ── Identifier / keyword ──
    if (/[a-zA-Z_]/.test(code[i])) {
      let end = i;
      while (end < len && /[a-zA-Z0-9_]/.test(code[end])) end++;
      const word = code.slice(i, end);

      if (KEYWORDS.has(word)) {
        html += `<span class="hl-keyword">${escapeHTML(word)}</span>`;
      } else if (COMPONENT_NAMES.has(word)) {
        html += `<span class="hl-component">${escapeHTML(word)}</span>`;
      } else if (ENUM_NAMESPACES.has(word)) {
        html += `<span class="hl-enum">${escapeHTML(word)}</span>`;
      } else if (HELPER_FUNCTIONS.has(word)) {
        html += `<span class="hl-function">${escapeHTML(word)}</span>`;
      } else {
        // Check if this is a named param (word followed by whitespace then =)
        let look = end;
        while (look < len && code[look] === ' ') look++;
        if (look < len && code[look] === '=' && (look + 1 >= len || code[look + 1] !== '=')) {
          html += `<span class="hl-param">${escapeHTML(word)}</span>`;
        } else {
          html += `<span class="hl-ident">${escapeHTML(word)}</span>`;
        }
      }
      i = end;
      continue;
    }

    // ── Operators / punctuation ──
    if ('(){}=,.'.includes(code[i])) {
      html += `<span class="hl-punct">${escapeHTML(code[i])}</span>`;
      i++;
      continue;
    }

    // ── Plain text (whitespace, newlines, etc.) ──
    html += escapeHTML(code[i]);
    i++;
  }

  return html;
}
