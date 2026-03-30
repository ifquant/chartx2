import { isNumber } from "../helpers";

export interface RawPriceRange {
  minValue: number;
  maxValue: number;
}

function computeFiniteResult(
  method: (...values: number[]) => number,
  first: number,
  second: number,
  fallback: number,
): number {
  const firstFinite = Number.isFinite(first);
  const secondFinite = Number.isFinite(second);

  if (firstFinite && secondFinite) {
    return method(first, second);
  }

  return !firstFinite && !secondFinite ? fallback : firstFinite ? first : second;
}

export class PriceRangeImpl {
  private min: number;
  private max: number;

  public constructor(minValue: number, maxValue: number) {
    this.min = minValue;
    this.max = maxValue;
  }

  public minValue(): number {
    return this.min;
  }

  public maxValue(): number {
    return this.max;
  }

  public equals(other: PriceRangeImpl | null): boolean {
    return other !== null && this.min === other.min && this.max === other.max;
  }

  public clone(): PriceRangeImpl {
    return new PriceRangeImpl(this.min, this.max);
  }

  public length(): number {
    return this.max - this.min;
  }

  public isEmpty(): boolean {
    return this.max === this.min || Number.isNaN(this.max) || Number.isNaN(this.min);
  }

  public merge(other: PriceRangeImpl | null): PriceRangeImpl {
    if (other === null) {
      return this;
    }

    return new PriceRangeImpl(
      computeFiniteResult(Math.min, this.minValue(), other.minValue(), -Infinity),
      computeFiniteResult(Math.max, this.maxValue(), other.maxValue(), Infinity),
    );
  }

  public scaleAroundCenter(coefficient: number): void {
    if (!isNumber(coefficient)) {
      return;
    }

    const delta = this.max - this.min;
    if (delta === 0) {
      return;
    }

    const center = (this.max + this.min) * 0.5;
    let maxDelta = this.max - center;
    let minDelta = this.min - center;
    maxDelta *= coefficient;
    minDelta *= coefficient;
    this.max = center + maxDelta;
    this.min = center + minDelta;
  }

  public shift(delta: number): void {
    if (!isNumber(delta)) {
      return;
    }

    this.max += delta;
    this.min += delta;
  }

  public toRaw(): RawPriceRange {
    return { minValue: this.min, maxValue: this.max };
  }

  public static fromRaw(raw: RawPriceRange | null): PriceRangeImpl | null {
    return raw === null ? null : new PriceRangeImpl(raw.minValue, raw.maxValue);
  }
}
