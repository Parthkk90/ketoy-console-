/**
 * K-DSL Parser
 * Converts Ketoy DSL code into JSON UI tree compatible with UIRenderer.
 *
 * Supported components: KColumn, KRow, KBox, KCard, KText, KButton, KImage, KSpacer
 * Supported helpers: kModifier, kMargin, kPadding, kBorder, kRounded, kImageUrl, kImageRes, listOf, mapOf
 * Supported enums: KArrangements, KAlignments, KFontWeights, KTextAlign, KScaleType, KShapes, KGradients
 */

// ─── Token Types ─────────────────────────────────────────────
const T = {
  IDENT: 'IDENT',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOL: 'BOOL',
  LPAREN: '(',
  RPAREN: ')',
  LBRACE: '{',
  RBRACE: '}',
  EQ: '=',
  COMMA: ',',
  DOT: '.',
  EOF: 'EOF',
};

// ─── Tokenizer ───────────────────────────────────────────────
function tokenize(input) {
  const tokens = [];
  let pos = 0;
  const len = input.length;

  while (pos < len) {
    const ch = input[pos];

    // Whitespace
    if (/\s/.test(ch)) { pos++; continue; }

    // Single-line comment
    if (ch === '/' && pos + 1 < len && input[pos + 1] === '/') {
      while (pos < len && input[pos] !== '\n') pos++;
      continue;
    }

    // Multi-line comment
    if (ch === '/' && pos + 1 < len && input[pos + 1] === '*') {
      pos += 2;
      while (pos < len - 1 && !(input[pos] === '*' && input[pos + 1] === '/')) pos++;
      pos += 2;
      continue;
    }

    // String literal
    if (ch === '"') {
      pos++;
      let str = '';
      while (pos < len && input[pos] !== '"') {
        if (input[pos] === '\\' && pos + 1 < len) {
          pos++;
          switch (input[pos]) {
            case 'n': str += '\n'; break;
            case 't': str += '\t'; break;
            case '\\': str += '\\'; break;
            case '"': str += '"'; break;
            default: str += input[pos];
          }
        } else {
          str += input[pos];
        }
        pos++;
      }
      pos++; // closing "
      tokens.push({ type: T.STRING, value: str });
      continue;
    }

    // Number literal (including negative, decimals, `f` suffix)
    if (/[0-9]/.test(ch) || (ch === '-' && pos + 1 < len && /[0-9]/.test(input[pos + 1]))) {
      let num = '';
      if (ch === '-') { num += '-'; pos++; }
      while (pos < len && /[0-9.]/.test(input[pos])) { num += input[pos]; pos++; }
      if (pos < len && (input[pos] === 'f' || input[pos] === 'F')) pos++; // skip f suffix
      tokens.push({ type: T.NUMBER, value: parseFloat(num) });
      continue;
    }

    // Identifier / keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let id = '';
      while (pos < len && /[a-zA-Z0-9_]/.test(input[pos])) { id += input[pos]; pos++; }
      if (id === 'true' || id === 'false') {
        tokens.push({ type: T.BOOL, value: id === 'true' });
      } else {
        tokens.push({ type: T.IDENT, value: id });
      }
      continue;
    }

    // Single-character tokens
    switch (ch) {
      case '(': tokens.push({ type: T.LPAREN }); pos++; continue;
      case ')': tokens.push({ type: T.RPAREN }); pos++; continue;
      case '{': tokens.push({ type: T.LBRACE }); pos++; continue;
      case '}': tokens.push({ type: T.RBRACE }); pos++; continue;
      case '=': tokens.push({ type: T.EQ }); pos++; continue;
      case ',': tokens.push({ type: T.COMMA }); pos++; continue;
      case '.': tokens.push({ type: T.DOT }); pos++; continue;
    }

    // Unknown character – skip
    pos++;
  }

  tokens.push({ type: T.EOF });
  return tokens;
}

// ─── Component name mapping ──────────────────────────────────
const COMPONENT_MAP = {
  KColumn: 'Column', KRow: 'Row', KBox: 'Box', KCard: 'Card',
  KText: 'Text', KButton: 'Button', KImage: 'Image', KSpacer: 'Spacer',
  KIcon: 'Icon', KIconButton: 'IconButton', KComponent: 'Component',
};

const COMPONENT_NAMES = new Set(Object.keys(COMPONENT_MAP));

// ─── Enum value resolution ───────────────────────────────────
const ENUM_MAP = {
  KFontWeights: {
    Bold: 'bold', SemiBold: 'semiBold', Medium: 'medium',
    Light: 'light', Normal: 'normal',
  },
  KArrangements: {
    Center: 'center', SpaceEvenly: 'spaceEvenly', SpaceAround: 'spaceAround',
    SpaceBetween: 'spaceBetween', Start: 'start', End: 'end',
  },
  KAlignments: {
    CenterHorizontally: 'centerHorizontally', CenterVertically: 'centerVertically',
    Center: 'center', Start: 'start', End: 'end', Bottom: 'bottom', Top: 'top',
    BottomCenter: 'bottomCenter', TopCenter: 'topCenter',
  },
  KTextAlign: {
    Center: 'center', Start: 'start', End: 'end', Left: 'left', Right: 'right',
  },
  KScaleType: {
    FillBounds: 'fillBounds', CenterCrop: 'centerCrop', Fit: 'fit',
  },
};

function resolveEnum(namespace, prop) {
  if (namespace === 'KShapes') {
    const m = prop.match(/^Rounded(\d+)$/);
    if (m) return `rounded_${m[1]}`;
    return prop.charAt(0).toLowerCase() + prop.slice(1);
  }
  const ns = ENUM_MAP[namespace];
  if (ns && ns[prop] !== undefined) return ns[prop];
  return prop.charAt(0).toLowerCase() + prop.slice(1);
}

// ─── Parser ──────────────────────────────────────────────────
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) { return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)]; }
  advance() { return this.tokens[this.pos++]; }
  expect(type) {
    const tok = this.advance();
    if (tok.type !== type) throw new Error(`Expected ${type} but got ${tok.type} ("${tok.value ?? ''}")`);
    return tok;
  }

  // Check if the next two tokens form "IDENT =" (named param pattern)
  isNamedParam() {
    return this.peek().type === T.IDENT && this.peek(1).type === T.EQ;
  }

  // ── Entry point ────────────────────────────────────────────
  parse() {
    this.skipValDeclaration();
    const root = this.parseComponent();
    return root;
  }

  // Skip optional "val name = " prefix
  skipValDeclaration() {
    if (this.peek().type === T.IDENT && this.peek().value === 'val') {
      this.advance(); // val
      this.advance(); // name
      if (this.peek().type === T.EQ) this.advance(); // =
    }
  }

  // ── Parse a component invocation ───────────────────────────
  parseComponent() {
    const nameToken = this.expect(T.IDENT);
    const name = nameToken.value;

    // Handle method calls like `screen.toJson()` – skip them
    if (this.peek().type === T.DOT) {
      this.skipMethodCall();
      return null;
    }

    const type = COMPONENT_MAP[name] || name;
    let params = {};
    let children = [];

    // Parse parenthesised parameters
    if (this.peek().type === T.LPAREN) {
      this.advance(); // (
      params = this.parseNamedParams();
      this.expect(T.RPAREN); // )
    }

    // Parse children block
    if (this.peek().type === T.LBRACE) {
      this.advance(); // {
      children = this.parseChildren();
      this.expect(T.RBRACE); // }
    }

    return this.buildNode(type, params, children);
  }

  // ── Skip a method call chain ───────────────────────────────
  skipMethodCall() {
    while (this.peek().type === T.DOT) {
      this.advance(); // .
      if (this.peek().type === T.IDENT) this.advance(); // method name
      if (this.peek().type === T.LPAREN) {
        this.advance(); // (
        let depth = 1;
        while (depth > 0 && this.peek().type !== T.EOF) {
          if (this.peek().type === T.LPAREN) depth++;
          if (this.peek().type === T.RPAREN) depth--;
          if (depth > 0) this.advance();
        }
        if (this.peek().type === T.RPAREN) this.advance(); // )
      }
    }
  }

  // ── Parse key = value, key = value, ... ────────────────────
  parseNamedParams() {
    const params = {};
    while (this.peek().type !== T.RPAREN && this.peek().type !== T.EOF) {
      if (this.peek().type === T.COMMA) { this.advance(); continue; }
      const key = this.expect(T.IDENT).value;
      this.expect(T.EQ);
      params[key] = this.parseValue();
    }
    return params;
  }

  // ── Parse children (component list) ────────────────────────
  parseChildren() {
    const children = [];
    while (this.peek().type !== T.RBRACE && this.peek().type !== T.EOF) {
      // Skip "val name =" inside children
      if (this.peek().type === T.IDENT && this.peek().value === 'val') {
        this.advance(); // val
        this.advance(); // name
        if (this.peek().type === T.EQ) this.advance(); // =
        continue;
      }
      // Skip stray commas
      if (this.peek().type === T.COMMA) { this.advance(); continue; }
      const child = this.parseComponent();
      if (child) children.push(child);
    }
    return children;
  }

  // ── Parse a single value ───────────────────────────────────
  parseValue() {
    const tok = this.peek();

    if (tok.type === T.STRING) { this.advance(); return tok.value; }
    if (tok.type === T.NUMBER) { this.advance(); return tok.value; }
    if (tok.type === T.BOOL) { this.advance(); return tok.value; }

    // Lambda block { ... } (for onClick etc.)
    if (tok.type === T.LBRACE) return this.parseLambda();

    if (tok.type === T.IDENT) {
      const name = this.advance().value;

      // Function call: name(...)
      if (this.peek().type === T.LPAREN) return this.parseFunctionCall(name);

      // Namespace.Property or Namespace.method(...)
      if (this.peek().type === T.DOT) {
        this.advance(); // .
        const prop = this.expect(T.IDENT).value;
        if (this.peek().type === T.LPAREN) return this.parseNamespaceCall(name, prop);
        return resolveEnum(name, prop);
      }

      // Bare identifier
      return name;
    }

    throw new Error(`Unexpected token: ${tok.type}`);
  }

  // ── Parse a lambda/block value { ... } ─────────────────────
  parseLambda() {
    this.expect(T.LBRACE);
    let depth = 1;
    while (depth > 0 && this.peek().type !== T.EOF) {
      if (this.peek().type === T.LBRACE) depth++;
      if (this.peek().type === T.RBRACE) depth--;
      if (depth > 0) this.advance();
    }
    this.expect(T.RBRACE);
    return '__action__';
  }

  // ── Parse function call value ──────────────────────────────
  parseFunctionCall(name) {
    this.advance(); // (

    switch (name) {
      case 'kModifier': case 'LModifier': {
        const p = this.parseNamedParams();
        this.expect(T.RPAREN);
        return { __kModifier: true, ...p };
      }
      case 'kMargin': case 'kPadding': {
        const p = this.parseNamedParams();
        this.expect(T.RPAREN);
        return p;
      }
      case 'kBorder': {
        const p = this.parseNamedParams();
        this.expect(T.RPAREN);
        return p;
      }
      case 'kRounded': {
        const p = this.parseNamedParams();
        this.expect(T.RPAREN);
        const { topStart = 0, topEnd = 0, bottomEnd = 0, bottomStart = 0 } = p;
        return `rounded_corners_${topStart}_${topEnd}_${bottomEnd}_${bottomStart}`;
      }
      case 'kImageUrl': {
        const args = this.parsePositionalArgs();
        this.expect(T.RPAREN);
        return { type: 'url', value: args[0] || '' };
      }
      case 'kImageRes': {
        const args = this.parsePositionalArgs();
        this.expect(T.RPAREN);
        return { type: 'res', value: args[0] || '' };
      }
      case 'listOf': {
        const args = this.parsePositionalArgs();
        this.expect(T.RPAREN);
        return args;
      }
      case 'mapOf': {
        const map = this.parseMapEntries();
        this.expect(T.RPAREN);
        return map;
      }
      default: {
        // Unknown function – attempt named params
        if (this.isNamedParam()) {
          const p = this.parseNamedParams();
          this.expect(T.RPAREN);
          return p;
        }
        const args = this.parsePositionalArgs();
        this.expect(T.RPAREN);
        return args.length === 1 ? args[0] : args;
      }
    }
  }

  // ── Parse Namespace.method(...) ────────────────────────────
  parseNamespaceCall(ns, method) {
    this.advance(); // (

    if (ns === 'KShapes' && method === 'rounded') {
      if (this.isNamedParam()) {
        const p = this.parseNamedParams();
        this.expect(T.RPAREN);
        const { topStart = 0, topEnd = 0, bottomEnd = 0, bottomStart = 0 } = p;
        return `rounded_corners_${topStart}_${topEnd}_${bottomEnd}_${bottomStart}`;
      }
      const args = this.parsePositionalArgs();
      this.expect(T.RPAREN);
      return `rounded_${args[0] || 0}`;
    }

    if (ns === 'KGradients') {
      const p = this.parseNamedParams();
      this.expect(T.RPAREN);
      return { type: method.toLowerCase(), ...p };
    }

    // Generic
    const p = this.isNamedParam() ? this.parseNamedParams() : { args: this.parsePositionalArgs() };
    this.expect(T.RPAREN);
    return { type: method.charAt(0).toLowerCase() + method.slice(1), ...p };
  }

  // ── Parse positional arguments ─────────────────────────────
  parsePositionalArgs() {
    const args = [];
    while (this.peek().type !== T.RPAREN && this.peek().type !== T.EOF) {
      if (this.peek().type === T.COMMA) { this.advance(); continue; }
      args.push(this.parseValue());
    }
    return args;
  }

  // ── Parse mapOf entries: "key" to value, ... ───────────────
  parseMapEntries() {
    const map = {};
    while (this.peek().type !== T.RPAREN && this.peek().type !== T.EOF) {
      if (this.peek().type === T.COMMA) { this.advance(); continue; }
      const key = this.parseValue();
      // expect 'to' keyword
      if (this.peek().type === T.IDENT && this.peek().value === 'to') {
        this.advance(); // skip 'to'
      }
      const value = this.parseValue();
      map[key] = value;
    }
    return map;
  }

  // ── Build the final JSON node ──────────────────────────────
  buildNode(type, params, children) {
    const modifier = {};
    const props = {};

    for (const [key, value] of Object.entries(params)) {
      if (key === 'modifier' && value && value.__kModifier) {
        const { __kModifier, ...modProps } = value;
        Object.assign(modifier, modProps);
      } else {
        props[key] = value;
      }
    }

    const node = { type, props: { ...props }, children };

    if (Object.keys(modifier).length > 0) {
      node.props.modifier = modifier;
    }
    if (!children || children.length === 0) {
      delete node.children;
    }

    return node;
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Parse K-DSL code string into a JSON UI tree.
 * @param {string} code – K-DSL source code
 * @returns {{ json: object|null, error: string|null }}
 */
export function parseDSL(code) {
  try {
    const tokens = tokenize(code);
    const parser = new Parser(tokens);
    const json = parser.parse();
    return { json, error: null };
  } catch (err) {
    return { json: null, error: err.message };
  }
}

/**
 * Parse K-DSL and return pretty-printed JSON string.
 */
export function dslToJSON(code) {
  const { json, error } = parseDSL(code);
  if (error) return { jsonString: null, error };
  return { jsonString: JSON.stringify(json, null, 2), error: null };
}
