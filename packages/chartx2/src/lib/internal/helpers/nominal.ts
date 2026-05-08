export type Nominal<T, Name extends string> = T & {
  [Symbol.species]: Name;
};
