import { block, inline, kb } from "./factory.js";

export interface InlineStyle {
  class: "emphasis" | "strikethrough" | "code";
}

export type BlockStyle = BlockStyle_Code | BlockStyle_Quote;

export interface BlockStyle_Code {
  class: "code";
  language?: string | null;
}

export interface BlockStyle_Quote {
  class: "quote";
}

export const em = kb("em").definition(
  inline<InlineStyle>({ class: "emphasis" })
);

export const s = kb("s").definition(
  inline<InlineStyle>({ class: "strikethrough" })
);
export const code = kb("code").definition(
  inline<InlineStyle>({ class: "code" })
);

export const quote = kb("quote").definition(
  block<BlockStyle>({ class: "quote" })
);

export const codeBlock = kb("codeBlock").definition(
  block<BlockStyle>({ class: "code" })
);

export const codeBlockLang = (language: string) =>
  block<BlockStyle>({ class: "code", language });

export function decodeInlineStyle(style: unknown): InlineStyle | null {
  if (typeof style !== "object" || !style) return null;
  const _style = style as InlineStyle;

  if (!_style.class) return null;
  switch (_style.class) {
    case "emphasis":
    case "strikethrough":
    case "code":
      return _style;
    default:
      return checkNever(_style.class, null);
  }
}

export function decodeBlockStyle(style: unknown): BlockStyle | null {
  if (typeof style !== "object" || !style) return null;
  const _style = style as Partial<BlockStyle>;

  if (!_style.class) return null;
  switch (_style.class) {
    case "quote": {
      return _style as BlockStyle;
    }
    case "code": {
      if (_style.language == null || typeof _style.language === "string") {
        return _style as BlockStyle;
      }
      return null;
    }
    default:
      return checkNever(_style.class, null);
  }
}

function checkNever<T>(assert: never, result: T) {
  return result;
}
