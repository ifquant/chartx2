import type { Coordinate } from "./coordinate";
import { PriceRangeImpl } from "./price-range-impl";

export class PriceScale {
  private height = 0;
  private priceRange: PriceRangeImpl | null = null;

  public applyOptions(options: {
    height?: number;
    priceRange?: PriceRangeImpl | null;
  }): void {
    if (options.height !== undefined) {
      this.height = options.height;
    }

    if (options.priceRange !== undefined) {
      this.priceRange = options.priceRange;
    }
  }

  public setHeight(height: number): void {
    this.height = height;
  }

  public setPriceRange(priceRange: PriceRangeImpl | null): void {
    this.priceRange = priceRange;
  }

  public getPriceRange(): PriceRangeImpl | null {
    return this.priceRange;
  }

  public priceToCoordinate(price: number): Coordinate | null {
    if (this.priceRange === null || this.height <= 0) {
      return null;
    }

    const length = this.priceRange.length();
    if (length === 0) {
      return (this.height * 0.5) as Coordinate;
    }

    const ratio = (this.priceRange.maxValue() - price) / length;
    return (ratio * this.height) as Coordinate;
  }

  public coordinateToPrice(coordinate: number): number | null {
    if (this.priceRange === null || this.height <= 0) {
      return null;
    }

    const length = this.priceRange.length();
    if (length === 0) {
      return this.priceRange.maxValue();
    }

    const ratio = coordinate / this.height;
    return this.priceRange.maxValue() - ratio * length;
  }
}
