import { assert } from "../helpers";

export class RangeImpl<T extends number> {
  private readonly leftValue: T;
  private readonly rightValue: T;

  public constructor(left: T, right: T) {
    assert(left <= right, "right should be >= left");
    this.leftValue = left;
    this.rightValue = right;
  }

  public left(): T {
    return this.leftValue;
  }

  public right(): T {
    return this.rightValue;
  }

  public count(): number {
    return this.rightValue - this.leftValue + 1;
  }

  public contains(index: T): boolean {
    return this.leftValue <= index && index <= this.rightValue;
  }

  public equals(other: RangeImpl<T>): boolean {
    return this.leftValue === other.left() && this.rightValue === other.right();
  }
}

export function areRangesEqual<T extends number>(
  first: RangeImpl<T> | null,
  second: RangeImpl<T> | null,
): boolean {
  if (first === null || second === null) {
    return first === second;
  }

  return first.equals(second);
}
