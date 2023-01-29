export interface Leaf<T> {
  leaf: true;
  value: T;
}

export interface Branch<T> {
  leaf: false;
  left: Semigroup<T>;
  right: Semigroup<T>;
}

export type Semigroup<T> = Leaf<T> | Branch<T>;

export function leaf<T>(value: T): Leaf<T> {
  return { leaf: true, value };
}

export function branch<T>(left: Semigroup<T>, right: Semigroup<T>): Branch<T> {
  return { leaf: false, left, right };
}

export function concat<T>(
  left: Semigroup<T> | null,
  right: Semigroup<T> | null
): Semigroup<T> | null {
  return left ? (right ? branch(left, right) : left) : right;
}
