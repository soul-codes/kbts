import { kb, KBInstance, KbSettings } from "./factory.js";
import { codeBlockLang } from "./style.js";
import { Node } from "./types.js";

const apiFactoryCache = new Map<string, ApiKbFactory>();
const apiKbCache = new Map<string, KBInstance>();

namespace _ {
  export const sourceFileKey = "sourceFile";
  export const startKey = "start";
  export const endKey = "end";
  export const jsdocKey = "jsdoc";
  export const nameKey = "name";
  export const hashKey = "hash";
}

interface CompileArgs {
  [_.sourceFileKey]: string;
  [_.startKey]: string;
  [_.endKey]: string;
  [_.jsdocKey]: string;
  [_.nameKey]: string;
  [_.hashKey]: string;
}

export type ApiKbFactory = (ref: Node) => Node;

export const api = Object.assign(
  /**
   * @param targetSymbol
   * @param factory
   * @param settings
   */
  function api<T>(
    targetSymbol?: unknown,
    factory?: (ref: Node) => Node,
    settings?: Partial<KbSettings>
  ): KBInstance {
    throw Error("api() must be used with the transformation plugin.");
  },
  {
    __compiled__: (
      arg: CompileArgs,
      factory?: ApiKbFactory | null,
      settings?: Partial<KbSettings>
    ): KBInstance => {
      const reference = codeBlockLang("ts")(arg[_.jsdocKey]);

      let currentFactory = apiFactoryCache.get(arg[_.hashKey]);
      if (!currentFactory && factory) {
        apiFactoryCache.set(arg[_.hashKey], factory);
      }

      let instance = apiKbCache.get(arg[_.hashKey]);
      if (!instance) {
        instance = kb(
          arg[_.nameKey],
          settings
        )(() => {
          const factory = apiFactoryCache.get(arg[_.hashKey]) || identity;
          return factory(reference);
        });
        apiKbCache.set(arg[_.hashKey], instance);
      }
      return instance;
    },
  } as unknown
);

function identity<T>(value: T) {
  return value;
}
