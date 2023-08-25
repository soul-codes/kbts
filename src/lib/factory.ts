import { createFactory, TemplateInterface } from "./protofactory.js";
import {
  Block,
  Embed,
  EmbedCondition,
  ForceEmitCondition,
  Inline,
  KB,
  Link,
  LinkTarget,
  List,
  Node,
  NodeType,
  Series,
} from "./types.js";
import { isKb } from "./utils.js";

export function series(
  title: string,
  items: readonly KB[],
  options?: Partial<{
    index: Node;
    sequential: boolean;
  }>
): Series {
  return {
    title,
    items,
    index: options?.index ?? null,
    sequential: options?.sequential ?? false,
  };
}

export interface KbSettings {
  embedCondition: EmbedCondition;
  emitCondition: ForceEmitCondition;
}

/**
 * Creates a new KB.
 *
 * Note that each created KB is a separate instance. This becomes significant
 * when it comes to embedding KBs.
 *
 * @param title
 * @param settings
 * @returns
 */
export function kb(
  title: string,
  settings?: Partial<KbSettings>
): TemplateInterface<KBInstance> {
  return createFactory<KBInstance>((content) => {
    const kb: KBInstance = {
      type: NodeType.KB,
      title,
      content,
      embedCondition: settings?.embedCondition ?? null,
      forceEmitCondition: settings?.emitCondition ?? null,
      embed: (link, condition) => ({
        type: NodeType.Embed,
        target: kb,
        contentIfLink: link,
        condition,
      }),
      forceEmbed: () => ({
        type: NodeType.Embed,
        target: kb,
        contentIfLink: (link) => link(),
        condition: true,
      }),
    };
    return kb;
  });
}

/**
 * Creates a KB-lifting function. The resulting function either makes the
 * argument a KB if it isn't already, using the `title` and `settings`
 * supplied, otherwise it simply returns the KB.
 */
export function asKb(title: string, settings?: Partial<KbSettings>) {
  return (kbOrNode: KBInstance | Node): KBInstance => {
    return isKb(kbOrNode) ? kbOrNode : kb(title, settings)(kbOrNode);
  };
}

export interface KBInstance extends KB {
  /**
   * Creates a conditional `embed` node for the KB. The KB may be embedded into
   * the parent KB, or the node may instead generate a link in-place from the
   * parent KB to the target KB. The `condition` argument determines when to
   * embed the document defaulting to the target KB's embedding rule or, if that
   * is not defined, the renderer's default embedding rule.
   *
   * @param alternativeLink
   * @param condition
   */
  embed(
    alternativeLink: (createLink: (label?: string) => Node) => Node,
    condition: EmbedCondition
  ): Embed;

  /**
   * Creates a forced `embed` node for the KB. The KB will be embedded to the
   * parent KB no matter what.
   */
  forceEmbed(): Embed;
}

/**
 * Creates a documentation template.
 */
export const d = createFactory((node) => node);

/**
 * Creates a link to either an external URL or to another KB.
 * @param target
 * @param label
 */
export function link(target: LinkTarget, label: string | null = null): Link {
  return {
    type: NodeType.Link,
    target,
    label: label,
  };
}

/**
 * Creates a list node.
 * @param items
 */
export function list(...items: readonly (Node | KB)[]): List {
  return {
    type: NodeType.List,
    items: items.map(
      (item): Node =>
        isKb(item)
          ? {
              type: NodeType.Embed,
              target: item,
              condition: null,
              contentIfLink: (link) => link(),
            }
          : item
    ),
  };
}

/**
 * A higher-order function that can be used to create custom-styled blocks.
 * @param style
 */
export function block<T>(style: T) {
  return createFactory(
    (content): Block => ({
      type: NodeType.Block,
      content,
      style: style,
    })
  );
}

/**
 * A higher-order function that can be used to create custom-styled inline.
 * @param style
 */
export function inline<T>(style: T) {
  return createFactory(
    (content): Inline => ({
      type: NodeType.Inline,
      content,
      style: style,
    })
  );
}

declare global {
  // tslint:disable-next-line:no-unused-declaration
  interface ArrayConstructor {
    isArray(arg: ReadonlyArray<any> | any): arg is ReadonlyArray<any>;
  }
}
