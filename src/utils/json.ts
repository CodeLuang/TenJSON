export interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

export function validateJson(text: string): ValidationResult {
  let i = 0;
  let line = 1;
  let col = 1;
  const n = text.length;

  const fail = (msg: string): ValidationResult => ({
    valid: false,
    error: msg,
    line,
    column: col,
  });

  const failAt = (msg: string, l: number, c: number): ValidationResult => ({
    valid: false,
    error: msg,
    line: l,
    column: c,
  });

  const peek = (): string => text[i];

  const skipWs = () => {
    while (i < n) {
      const c = text[i];
      if (c === ' ' || c === '\t' || c === '\r') {
        i++;
        col++;
      } else if (c === '\n') {
        i++;
        line++;
        col = 1;
      } else {
        break;
      }
    }
  };

  const parseString = (): ValidationResult | null => {
    const startLine = line;
    const startCol = col;
    if (peek() !== '"') return fail('Expected a string');
    i++;
    col++;
    while (i < n) {
      const c = text[i];
      if (c === '\\') {
        i++;
        col++;
        if (i >= n) break;
        const e = text[i];
        if (e === 'u') {
          for (let k = 0; k < 4; k++) {
            i++;
            col++;
            if (i >= n) return failAt('Unterminated string', startLine, startCol);
            if (!/[0-9a-fA-F]/.test(text[i])) {
              return failAt('Invalid unicode escape in string', line, col);
            }
          }
          i++;
          col++;
        } else {
          i++;
          col++;
        }
      } else if (c === '"') {
        i++;
        col++;
        return null;
      } else if (c === '\n') {
        return failAt('Unterminated string', startLine, startCol);
      } else {
        i++;
        col++;
      }
    }
    return failAt('Unterminated string', startLine, startCol);
  };

  const parseNumber = (): ValidationResult | null => {
    const startLine = line;
    const startCol = col;
    const re = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
    const rest = text.slice(i);
    const m = re.exec(rest);
    if (!m) return fail('Invalid number');
    i += m[0].length;
    col += m[0].length;
    const next = text[i];
    if (next !== undefined && /[0-9a-zA-Z_]/.test(next)) {
      return failAt('Invalid number', startLine, startCol);
    }
    return null;
  };

  const parseLiteral = (): ValidationResult | null => {
    const rest = text.slice(i);
    if (rest.startsWith('true')) {
      const after = text[i + 4];
      if (after !== undefined && /[0-9a-zA-Z_]/.test(after))
        return fail('Invalid literal');
      i += 4;
      col += 4;
      return null;
    }
    if (rest.startsWith('false')) {
      const after = text[i + 5];
      if (after !== undefined && /[0-9a-zA-Z_]/.test(after))
        return fail('Invalid literal');
      i += 5;
      col += 5;
      return null;
    }
    if (rest.startsWith('null')) {
      const after = text[i + 4];
      if (after !== undefined && /[0-9a-zA-Z_]/.test(after))
        return fail('Invalid literal');
      i += 4;
      col += 4;
      return null;
    }
    return fail(`Unexpected token '${text[i] ?? 'end of input'}'`);
  };

  const parseValue = (): ValidationResult | null => {
    skipWs();
    if (i >= n) return fail('Unexpected end of input');
    const c = peek();
    if (c === '"') return parseString();
    if (c === '{') return parseObject();
    if (c === '[') return parseArray();
    if (c === '-' || (c >= '0' && c <= '9')) return parseNumber();
    if (c === 't' || c === 'f' || c === 'n') return parseLiteral();
    if (c === '}' || c === ']') return fail(`Unexpected '${c}'`);
    return fail(`Unexpected token '${c}'`);
  };

  const parseObject = (): ValidationResult | null => {
    i++;
    col++;
    skipWs();
    if (i < n && peek() === '}') {
      i++;
      col++;
      return null;
    }
    for (;;) {
      skipWs();
      if (i >= n) return fail('Unexpected end of input in object');
      if (peek() !== '"') {
        if (peek() === '}') return fail("Missing property name or ','");
        return fail('Expected a property name (string)');
      }
      const s = parseString();
      if (s) return s;
      skipWs();
      if (i >= n) return fail('Unexpected end of input in object');
      if (peek() !== ':') return fail("Expected ':' after property name");
      i++;
      col++;
      const v = parseValue();
      if (v) return v;
      skipWs();
      if (i >= n) return fail('Unexpected end of input in object');
      const c = peek();
      if (c === ',') {
        i++;
        col++;
        continue;
      }
      if (c === '}') {
        i++;
        col++;
        return null;
      }
      return fail("Expected ',' or '}'");
    }
  };

  const parseArray = (): ValidationResult | null => {
    i++;
    col++;
    skipWs();
    if (i < n && peek() === ']') {
      i++;
      col++;
      return null;
    }
    for (;;) {
      const v = parseValue();
      if (v) return v;
      skipWs();
      if (i >= n) return fail('Unexpected end of input in array');
      const c = peek();
      if (c === ',') {
        i++;
        col++;
        continue;
      }
      if (c === ']') {
        i++;
        col++;
        return null;
      }
      return fail("Expected ',' or ']'");
    }
  };

  const root = parseValue();
  if (root) return root;
  skipWs();
  if (i < n) return fail('Unexpected trailing content');
  return { valid: true };
}

export function formatJson(text: string): string | null {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return null;
  }
}

export function tryParseJson(text: string): { value: unknown; ok: boolean } {
  try {
    return { value: JSON.parse(text), ok: true };
  } catch {
    return { value: null, ok: false };
  }
}

export type TokenType =
  | 'punct'
  | 'key'
  | 'string'
  | 'number'
  | 'literal'
  | 'error';

export interface Token {
  start: number;
  end: number;
  type: TokenType;
}

export interface LineScanResult {
  tokens: Token[];
  inString: boolean;
  unclosed: boolean;
}

export function scanLine(
  line: string,
  inString: boolean
): LineScanResult {
  const tokens: Token[] = [];
  let unclosed = false;
  let i = 0;
  const n = line.length;

  if (inString) {
    const end = line.indexOf('"');
    if (end === -1) {
      tokens.push({ start: 0, end: n, type: 'string' });
      return { tokens, inString: true, unclosed: false };
    }
    tokens.push({ start: 0, end: end + 1, type: 'string' });
    i = end + 1;
    inString = false;
  }

  while (i < n) {
    const c = line[i];
    if (c === ' ' || c === '\t' || c === '\r') {
      i++;
      continue;
    }
    if (c === '{' || c === '}' || c === '[' || c === ']' || c === ':' || c === ',') {
      tokens.push({ start: i, end: i + 1, type: 'punct' });
      i++;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let closed = false;
      while (j < n) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === '"') {
          j++;
          closed = true;
          break;
        }
        j++;
      }
      if (!closed) {
        tokens.push({ start: i, end: n, type: 'string' });
        unclosed = true;
        i = n;
      } else {
        tokens.push({ start: i, end: j, type: 'string' });
        i = j;
      }
      continue;
    }
    if (c === '-' || (c >= '0' && c <= '9')) {
      const m = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(line.slice(i));
      if (m && m[0].length > 0) {
        tokens.push({ start: i, end: i + m[0].length, type: 'number' });
        i += m[0].length;
      } else {
        tokens.push({ start: i, end: i + 1, type: 'error' });
        i++;
      }
      continue;
    }
    if (c === 't' || c === 'f' || c === 'n') {
      const rest = line.slice(i);
      const literal = rest.startsWith('true')
        ? 'true'
        : rest.startsWith('false')
          ? 'false'
          : rest.startsWith('null')
            ? 'null'
            : null;
      if (literal) {
        const after = line[i + literal.length];
        if (after === undefined || /[\s,}\]:]/.test(after)) {
          tokens.push({ start: i, end: i + literal.length, type: 'literal' });
          i += literal.length;
          continue;
        }
      }
      tokens.push({ start: i, end: i + 1, type: 'error' });
      i++;
      continue;
    }
    tokens.push({ start: i, end: i + 1, type: 'error' });
    i++;
  }

  if (unclosed) {
    return { tokens, inString: true, unclosed };
  }
  return { tokens, inString: false, unclosed };
}

export function classifyStringTokens(tokens: Token[], line: string): void {
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (tok.type !== 'string') continue;
    let j = tok.end;
    while (j < line.length && (line[j] === ' ' || line[j] === '\t')) j++;
    if (line[j] === ':') {
      tok.type = 'key';
    }
  }
}

export type JsonType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null';

export function valueType(v: unknown): JsonType {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'object') return 'object';
  if (typeof v === 'string') return 'string';
  if (typeof v === 'number') return 'number';
  return 'boolean';
}

export interface TreeItem {
  id: string;
  key: string | null;
  path: string;
  value: unknown;
  type: JsonType;
  depth: number;
  childCount: number;
  last: boolean;
}

const JSON_LITERAL_RE = /^[{\[\]}\s,:"eE+tfnulr0-9.-]+$/;

export function looksLikeJson(text: string): boolean {
  if (text.trim().length === 0) return false;
  return JSON_LITERAL_RE.test(text);
}

export function prettyValue(v: unknown): string {
  if (typeof v === 'string') return `"${v}"`;
  if (v === null) return 'null';
  return String(v);
}

export function summarize(text: string, max = 72): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length > max ? trimmed.slice(0, max) + '…' : trimmed;
}
