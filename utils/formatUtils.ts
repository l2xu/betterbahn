import type { VendoJourney, VendoPrice } from "@/utils/schemas";

/**
 * Formatiert Zeit für deutsche Anzeige (HH:MM)
 */
export const formatTime = (dateTime?: string) => {
	if (!dateTime) return "";
	return new Date(dateTime).toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

/**
 * Formatiert Reisedauer basierend auf Legs
 */
export const formatDuration = (journey: VendoJourney) => {
	if (!journey?.legs || journey.legs.length === 0) return null;
	const departure = new Date(journey.legs[0].departure);
	const arrival = new Date(journey.legs[journey.legs.length - 1].arrival);
	const durationMs = arrival.getTime() - departure.getTime();
	const hours = Math.floor(durationMs / (1000 * 60 * 60));
	const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
	return `${hours}h ${minutes}m`;
};

/**
 * Zählt Anzahl der Umstiege
 */
export const getChangesCount = (journey: VendoJourney) => {
	if (!journey?.legs) return 0;
	return Math.max(0, journey.legs.length - 1);
};

/**
 * Formatiert Preis mit zwei Dezimalstellen und deutschen Komma
 */
export const formatPriceWithTwoDecimals = (price?: VendoPrice | number) => {
	if (!price && price !== 0) {
		return null;
	}

	let amount;

	if (price && typeof price === "object") {
		amount = price.amount;
	} else {
		amount = price;
	}

	if (isNaN(amount)) {
		return null;
	}

	return `${amount.toFixed(2).replace(".", ",")}€`;
};