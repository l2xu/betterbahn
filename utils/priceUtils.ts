export const formatPriceDE = (price: number): string => {
	return `${price.toFixed(2).replace(".", ",")} €`;
};
