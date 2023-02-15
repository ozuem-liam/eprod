function round(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const getPercentageFromDiscountedPrice = (price: number, discountedPrice: number): number => {
    const percentage: number = (100 * (price - discountedPrice)) / price;
    return round(percentage);
};