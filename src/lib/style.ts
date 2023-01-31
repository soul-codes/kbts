import { block, inline, kb } from "./factory.js";

export interface InlineStyle {
  class: "emphasis" | "strikethrough" | "code";
}

export type BlockStyle = BlockStyle_Code | BlockStyle_Quote | BlockStyle_Remark;

export interface BlockStyle_Code {
  class: "code";
  language?: string | null;
}

export interface BlockStyle_Quote {
  class: "quote";
}

export interface BlockStyle_Remark {
  class: "remark";
  theme?: string | null;
}

/**
 * Creates an inline node that styles its content as emphasized, semantically
 * similar to bold or italic type for emphasis.
 */
export const em = inline<InlineStyle>({ class: "emphasis" });

/**
 * Creates an inline node that styles its content as deleted with
 * (from "strikethrough").
 */
export const s = inline<InlineStyle>({ class: "strikethrough" });

/**
 * Creates an inline node that styles its content as code.
 */
export const code = inline<InlineStyle>({ class: "code" });

/**
 * Creates an block that styles its content as quoted content.
 */
export const quote = block<BlockStyle>({ class: "quote" });

/**
 * Creates an block that styles its content as a code block without specifying
 * a language.
 */
export const codeBlock = block<BlockStyle>({ class: "code" });

/**
 * Creates an block that styles its content as a remark block.
 */
export const remark = (theme: string | null = null) =>
  block<BlockStyle>({ class: "remark", theme });

/**
 * Creates an block that styles its content as a code block formatted in a
 * specific language.
 */
export const codeBlockLang = (language: string) =>
  block<BlockStyle>({ class: "code", language });

/**
 * A type checker for an inline style. Returns the style if it is a valid
 * core inline style type, otherwise `null`.
 */
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

/**
 * A type checker for a block style. Returns the style if it is a valid
 * core block style type, otherwise `null`.
 */
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
    case "remark": {
      if (_style.theme == null || typeof _style.theme === "string") {
        return _style as BlockStyle;
      }
      return null;
    }
    default:
      return checkNever(_style.class, null);
  }
}

function checkNever<T>(_assert: never, result: T) {
  return result;
}
