import { memo, useMemo } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import {
  scanLine,
  classifyStringTokens,
  Token,
} from '../utils/json';

export interface SyntaxColors {
  key: string;
  str: string;
  num: string;
  lit: string;
  punct: string;
  error: string;
}

interface Props {
  text: string;
  fontSize: number;
  colors: SyntaxColors;
  style?: StyleProp<TextStyle>;
}

interface LinePart {
  text: string;
  color: string;
}

interface Line {
  parts: LinePart[];
  hasError: boolean;
  errorIndex: number;
}

function tokenToColor(t: Token, colors: SyntaxColors): string {
  switch (t.type) {
    case 'key':
      return colors.key;
    case 'string':
      return colors.str;
    case 'number':
      return colors.num;
    case 'literal':
      return colors.lit;
    case 'punct':
      return colors.punct;
    case 'error':
      return colors.error;
  }
}

export const SyntaxLines = memo(function SyntaxLines({
  text,
  fontSize,
  colors,
  style,
}: Props) {
  const lines: Line[] = useMemo(() => {
    if (text.length === 0) return [];
    const raw = text.split('\n');
    let inString = false;
    const out: Line[] = [];
    for (const line of raw) {
      const res = scanLine(line, inString);
      inString = res.inString;
      classifyStringTokens(res.tokens, line);
      const parts: LinePart[] = [];
      let hasError = false;
      let errorIndex = -1;
      let cursor = 0;
      for (const t of res.tokens) {
        if (t.start > cursor) {
          parts.push({ text: line.slice(cursor, t.start), color: colors.punct });
        }
        parts.push({ text: line.slice(t.start, t.end), color: tokenToColor(t, colors) });
        if (t.type === 'error') {
          hasError = true;
          if (errorIndex === -1) errorIndex = parts.length - 1;
        }
        cursor = t.end;
      }
      if (cursor < line.length) {
        parts.push({ text: line.slice(cursor), color: colors.punct });
      }
      out.push({ parts, hasError, errorIndex });
    }
    return out;
  }, [text, colors]);

  const lineHeight = Math.round(fontSize * 1.55);

  return (
    <Text
      style={[
        { fontFamily: 'JetBrainsMono_400Regular', fontSize, lineHeight },
        style,
      ]}
    >
      {lines.map((l, idx) => (
        <Text key={idx}>
          {l.parts.map((p, i) => (
            <Text key={i} style={{ color: p.color }}>
              {p.text}
            </Text>
          ))}
          {idx < lines.length - 1 ? '\n' : ''}
        </Text>
      ))}
    </Text>
  );
});
