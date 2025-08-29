import type { VendoJourney } from "./schemas";

interface Station {
	id?: string;
	stationId?: string;
	uicCode?: string;
	evaId?: string;
	name: string;
	longitude?: number;
	latitude?: number;
	x?: number;
	y?: number;
}

/**
 * Erstellt eine Such-URL für die offizielle DB-Website
 * @param params - Suchparameter
 * @param params.from - Name der Startstation
 * @param params.to - Name der Zielstation
 * @param params.date - Abfahrtsdatum im ISO-Format
 * @param params.class - Reiseklasse (1 oder 2)
 * @param params.fromStation - Startstation-Objekt mit ID und Koordinaten
 * @param params.toStation - Zielstation-Objekt mit ID und Koordinaten
 * @returns DB-Website Such-URL
 */
export function createDBSearchUrl({
	from,
	to,
	date,
	class: travelClass = 2,
	fromStation = null,
	toStation = null,
	discount = "none",
	hasDeutschlandTicket = false,
}: {
	from: string;
	to: string;
	date: string;
	class?: number;
	fromStation?: Station | null;
	toStation?: Station | null;
	discount?: string | string[];
	hasDeutschlandTicket?: boolean;
}) {
	// Datum formatieren für DB-URL
	const formattedDate = formatDate(date);
	
	// Generate r parameter with discount codes
	const discounts = [];
	if (hasDeutschlandTicket) {
		discounts.push("deutschlandticket");
	}
	if (discount && discount !== "none") {
		discounts.push(discount);
	}
	
	const rParam = discounts.length > 0 
		? mapDiscountToDBFormat(discounts, travelClass)
		: (travelClass === 1 ? "13:0:KLASSE_1:1" : "13:0:KLASSE_2:1");
	
	const parts = [
		"sts=true",
		`so=${encodeURIComponent(from)}`,
		`zo=${encodeURIComponent(to)}`,
		`kl=${travelClass}`,
		`r=${rParam}`,
	];

	// Hilfsfunktion zum Hinzufügen von Stationsdaten
	const addStation = (prefix: string, station: Station | null) => {
		if (!station?.id) return;
		parts.push(`${prefix}oid=${createStationId(station)}`);
		parts.push(`${prefix}ei=${station.id}`);
	};

	// Start- und Zielstation hinzufügen
	addStation("so", fromStation);
	addStation("zo", toStation);
	parts.push("sot=ST", "zot=ST");

	// Weitere Parameter für die DB-Suche hinzufügen
	parts.push(
		`hd=${formattedDate}`,
		"hza=D",
		"hz=%5B%5D",
		"ar=false",
		"s=false",
		"d=false",
		"vm=00,01,02,03,04,05,06,07,08,09",
		"fm=false",
		"bp=false",
		"dlt=false",
		hasDeutschlandTicket ? "dltv=true" : "dltv=false"
	);
	return `https://www.bahn.de/buchung/fahrplan/suche#${parts.join("&")}`;
}

/**
 * Formats a date string for DB URL parameters
 * @param {string} date - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(date: string): string {
	if (typeof date !== "string") return date;
	let formatted = date
		.replace(/\+\d{2}:\d{2}$/, "")
		.replace(/Z$/, "")
		.replace(/\.\d{3}/, "");
	if (/T\d{2}:\d{2}$/.test(formatted)) formatted += ":58"; // ensure seconds
	if (!formatted.includes("T")) formatted += "T08:32:58"; // default time
	return formatted;
}

/**
 * Creates a station ID string in DB format
 * @param {Object} station - Station object with name, id, and coordinates
 * @returns {string} Encoded station ID
 */
function createStationId(station: Station): string {
	const stationString = Object.entries({
		A: "1",
		O: station.name,
		X: station.x ?? station.longitude ?? "",
		Y: station.y ?? station.latitude ?? "",
		U: "80",
		L: station.id,
		B: "1",
		p: "1750104613",
		i: `U×${String(station.id).padStart(9, "0")}`,
	})
		.map(([k, v]) => `${k}=${v}`)
		.join("@");
	return encodeURIComponent(stationString);
}

/**
 * Maps BetterBahn discount values to DB website format
 * @param discountTypes - Discount type from BetterBahn form
 * @param travelClass - Travel class (1 or 2)
 * @returns DB-compatible discount parameter
 */
function mapDiscountToDBFormat(discountTypes: string | string[], travelClass: number): string | null {
	// Handle single discount or array of discounts (max 4)
	const discounts = Array.isArray(discountTypes) ? discountTypes : [discountTypes];
	if (discounts.length > 4) {
		throw new Error("Maximum 4 discounts allowed simultaneously");
	}
	
	const classString = travelClass === 1 ? "KLASSE_1" : "KLASSE_2";
	
	// DB r= parameter codes for discount types
	const rCodeMapping: Record<string, string> = {
		// German BahnCards
		"25": `17:${classString}`,
		"50": `23:${classString}`,
		"business25": `19:${classString}`,
		"business50": `18:${classString}`,
		
		// Deutschland-Ticket
		"deutschlandticket": `16:KLASSENLOS`,
		
		// International discounts
		"ch-general": `1:${classString}`,
		"ch-halbtax": `21:KLASSENLOS`,
		"at-vorteil": `20:KLASSENLOS`,
		"nl-40": `22:KLASSENLOS`,
		"klimaticket": `7:${classString}`
	};
	
	const validDiscounts = discounts.filter(d => d && d !== "none" && rCodeMapping[d]);
	if (validDiscounts.length === 0) return null;
	
	if (validDiscounts.length === 1) {
		// Single discount: r=13:CODE:KLASSE:1
		return `13:${rCodeMapping[validDiscounts[0]]}:1`;
	} else {
		// Multiple discounts: r=13:MAIN[EXTRA1|EXTRA2|EXTRA3]:1
		const mainCode = rCodeMapping[validDiscounts[0]];
		const extraCodes = validDiscounts.slice(1).map(d => rCodeMapping[d]).join("|");
		return `13:${mainCode}[${extraCodes}]:1`;
	}
}

/**
 * Creates a DB search URL for a journey segment
 * @param {Object} segment - Journey segment object
 * @param {number} travelClass - Travel class (1 or 2)
 * @returns {string} DB website search URL
 */
export function createSegmentSearchUrl(
	segment: VendoJourney,
	travelClass: number = 2,
	discount: string | string[] = "none",
	hasDeutschlandTicket: boolean = false
): string {
	if (!segment?.legs?.length)
		throw new Error("Invalid segment: missing legs data");
	const legs = segment.legs;
	const firstLeg = legs[0];
	const lastLeg = legs[legs.length - 1];
	const cleanDate = formatDate(firstLeg.departure);

	// Generate r parameter with discount codes
	const discountCodes: string[] = [];
	
	if (hasDeutschlandTicket) {
		discountCodes.push("deutschlandticket");
	}
	if (discount && discount !== "none") {
		const discountArray = Array.isArray(discount) ? discount : [discount];
		discountCodes.push(...discountArray);
	}
	
	const rParam = discountCodes.length > 0
		? mapDiscountToDBFormat(discountCodes, travelClass)
		: (travelClass === 1 ? "13:0:KLASSE_1:1" : "13:0:KLASSE_2:1");
	const parts = [
		"sts=true",
		`so=${encodeURIComponent(firstLeg.origin.name)}`,
		`zo=${encodeURIComponent(lastLeg.destination.name)}`,
		`kl=${travelClass}`,
		`r=${rParam}`,
	];

	const originId = addStationId(firstLeg.origin, "s", parts);
	const destId = addStationId(lastLeg.destination, "z", parts);

	parts.push("sot=ST", "zot=ST");

	if (originId && firstLeg.origin.name) {
		parts.push(`soei=${originId}`);
	}

	if (destId && lastLeg.destination.name) {
		parts.push(`zoei=${destId}`);
	}

	parts.push(
		`hd=${cleanDate}`,
		"hza=D",
		"hz=%5B%5D",
		"ar=false",
		"s=false",
		"d=false",
		"vm=00,01,02,03,04,05,06,07,08,09",
		"fm=false",
		"bp=false",
		"dlt=false",
		hasDeutschlandTicket ? "dltv=true" : "dltv=false"
	);

	return `https://www.bahn.de/buchung/fahrplan/suche#${parts.join("&")}`;
}

/**
 * Helper function to add station ID to URL parameters
 * @param {Object} station - Station object
 * @param {string} type - Station type ('s' for origin, 'z' for destination)
 * @param {Array} parts - URL parts array to modify
 * @returns {string|null} Station ID if found
 */
/**
 * Known problematic station mappings - station IDs that don't match expected names
 */
const PROBLEMATIC_STATION_IDS: Record<string, string> = {
	// Add known problematic mappings here
	8002235: "Senden", // This ID seems to resolve to Senden instead of Gengenbach
};

/**
 * Validates if a station ID should be used based on the station name
 * @param stationId - The station ID
 * @param stationName - The station name
 * @returns Whether the station ID is safe to use
 */
function shouldUseStationId(stationId: string, stationName: string) {
	if (!stationId || !stationName) return false;
	const problematicName = PROBLEMATIC_STATION_IDS[stationId];
	if (
		problematicName &&
		!stationName.toLowerCase().includes(problematicName.toLowerCase())
	) {
		console.warn(
			`Skipping problematic station ID ${stationId} for ${stationName} (maps to ${problematicName})`
		);
		return false;
	}
	return true;
}

function addStationId(station: Station, type: string, parts: string[]): string | null {
	const stationId =
		station.id || station.stationId || station.uicCode || station.evaId;

	if (stationId && shouldUseStationId(stationId, station.name)) {
		const stationData = createStationId({
			name: station.name,
			id: stationId,
			x: station.longitude || station.x,
			y: station.latitude || station.y,
		});
		parts.push(`${type}oid=${stationData}`);
		return stationId;
	}

	return null;
}
