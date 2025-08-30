import { parseHinfahrtReconWithAPI } from "@/utils/parseHinfahrtRecon";
import type { ExtractedData } from "@/utils/types";
import { z } from "zod/v4";
import { apiErrorHandler } from "../_lib/error-handler";

// POST-Route für URL-Parsing
const handler = async (request: Request) => {
	// Request-Body extrahieren
	const body = await request.json();
	const { url } = body;

	// Überprüfe ob URL vorhanden ist
	if (!url) {
		return Response.json(
			{ error: "Missing required parameter: url" },
			{ status: 400 }
		);
	}

	let finalUrl;
	try {
		finalUrl = await getResolvedUrlBrowserless(url);
	} catch {
		console.log("Resolving URL failed, trying to parse original URL directly");
		finalUrl = url;
	}

	// Reisedetails aus der aufgelösten URL extrahieren
	const journeyDetails = extractJourneyDetails(finalUrl);

	if ("error" in journeyDetails) {
		return Response.json({
			error: journeyDetails.error,
		});
	}

	if (!journeyDetails.fromStationId || !journeyDetails.toStationId) {
		return Response.json({
			error: "journeyDetails is missing fromStationId or toStationId",
		});
	}

	// Vereinfachte Reiseinformationen anzeigen
	displayJourneyInfo(journeyDetails);

	return Response.json({
		success: true,
		journeyDetails: journeyDetails,
	});
};

export async function POST(request: Request) {
	return apiErrorHandler(() => handler(request));
}

function extractJourneyDetails(url: string) {
	try {
		const urlObj = new URL(url);
		const hash = urlObj.hash;
		const searchParams = urlObj.searchParams;

		const details: ExtractedData = {
			fromStation: null,
			fromStationId: null,
			toStation: null,
			toStationId: null,
			date: null,
			time: null,
			class: null,
		};

		// Helper functions for extraction
		const extractStationId = (paramValue: string | null) => {
			if (!paramValue) return null;
			const match = paramValue.match(/@L=(\d+)/);
			return match ? match[1] : null;
		};

		const extractStationName = (paramValue: string | null) => {
			if (!paramValue) return null;
			const oMatch = paramValue.match(/@O=([^@]+)/);
			if (oMatch) {
				return decodeURIComponent(oMatch[1]).replace(/\+/g, " ").trim();
			}
			const parts = paramValue.split("@L=");
			if (parts.length > 0) {
				return decodeURIComponent(parts[0]).replace(/\+/g, " ").trim();
			}
			return decodeURIComponent(paramValue);
		};

		// Extract from hash
		if (hash) {
			const soidMatch = hash.match(/soid=([^&]+)/);
			const zoidMatch = hash.match(/zoid=([^&]+)/);
			const dateMatch = hash.match(/hd=([^&]+)/);
			const timeMatch = hash.match(/ht=([^&]+)/);
			const classMatch = hash.match(/kl=([^&]+)/);

			if (soidMatch) {
				const soidValue = decodeURIComponent(soidMatch[1]);
				details.fromStationId = extractStationId(soidValue);
				details.fromStation = extractStationName(soidValue);
			}

			if (zoidMatch) {
				const zoidValue = decodeURIComponent(zoidMatch[1]);
				details.toStationId = extractStationId(zoidValue);
				details.toStation = extractStationName(zoidValue);
			}

			if (dateMatch) {
				const dateValue = decodeURIComponent(dateMatch[1]);
				if (dateValue.includes("T")) {
					const [datePart, timePart] = dateValue.split("T");
					details.date = datePart;
					if (timePart && !details.time) {
						details.time = timePart.replace(":00", "");
					}
				} else {
					details.date = dateValue;
				}
			}

			if (timeMatch && !details.time) {
				details.time = decodeURIComponent(timeMatch[1]);
			}

			if (classMatch) {
				details.class = parseInt(classMatch[1]);
			}

			// Legacy fallbacks
			const fromMatch = hash.match(/so=([^&]+)/);
			const toMatch = hash.match(/zo=([^&]+)/);
			if (fromMatch && !details.fromStation) {
				details.fromStation = decodeURIComponent(fromMatch[1]);
			}
			if (toMatch && !details.toStation) {
				details.toStation = decodeURIComponent(toMatch[1]);
			}
		}

		// Extract from search params as fallback
		if (searchParams.has("soid")) {
			const soidValue = searchParams.get("soid");
			details.fromStationId = extractStationId(soidValue);
			details.fromStation = extractStationName(soidValue);
		}
		if (searchParams.has("zoid")) {
			const zoidValue = searchParams.get("zoid");
			details.toStationId = extractStationId(zoidValue);
			details.toStation = extractStationName(zoidValue);
		}
		if (searchParams.has("hd")) details.date = searchParams.get("hd");
		if (searchParams.has("ht")) details.time = searchParams.get("ht");
		if (searchParams.has("kl"))
			details.class = parseInt(searchParams.get("kl")!);
		if (searchParams.has("so") && !details.fromStation)
			details.fromStation = searchParams.get("so");
		if (searchParams.has("zo") && !details.toStation)
			details.toStation = searchParams.get("zo");

		// Normalize class to 1 or 2
		if (details.class && (details.class === 1 || details.class === 2)) {
			// Keep as is
		} else {
			details.class = 2; // Default to second class
		}

		return details;
	} catch (error) {
		const typedError = error as { message: string };
		console.error("❌ Error extracting journey details:", error);
		return {
			error: "Failed to extract journey details",
			details: typedError.message,
		};
	}
}

// Helper function to display simplified journey information
function displayJourneyInfo(journeyDetails: ExtractedData) {
	if (!journeyDetails || journeyDetails.error) {
		console.log("❌ Failed to extract journey information");
		return;
	}

	const from = journeyDetails.fromStation || "Unknown";
	const fromId = journeyDetails.fromStationId || "N/A";
	const to = journeyDetails.toStation || "Unknown";
	const toId = journeyDetails.toStationId || "N/A";
	const date = journeyDetails.date || "N/A";
	const time = journeyDetails.time || "N/A";
	const travelClass =
		journeyDetails.class === 1
			? "First"
			: journeyDetails.class === 2
			? "Second"
			: "N/A";

	console.log(
		`From: ${from} (${fromId}) → To: ${to} (${toId}) | Date: ${date} | Time: ${time} | Class: ${travelClass}`
	);
}

async function getResolvedUrlBrowserless(url: string) {
	const response = await fetch(
		`https://www.bahn.de/web/api/angebote/verbindung/${new URL(
			url
		).searchParams.get("vbid")}`
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch journey data: ${response.status} ${response.statusText}`);
	}

	const json = await response.json();

	const parsed = z
		.object({
			hinfahrtRecon: z.string(),
			hinfahrtDatum: z.string(),
		})
		.parse(json);

	const data = await parseHinfahrtReconWithAPI(
		parsed.hinfahrtRecon,
		parsed.hinfahrtDatum
	);

	const newUrl = new URL("https://www.bahn.de/buchung/fahrplan/suche");

	const soid = data.verbindungen
		.at(0)
		?.verbindungsAbschnitte.at(0)
		?.halte.at(0)?.id;

	const zoid = data.verbindungen
		.at(0)
		?.verbindungsAbschnitte.at(-1)
		?.halte.at(-1)?.id;

	if (soid === undefined || zoid === undefined) {
		throw new Error("Could not find soid or zoid in recon response");
	}

	newUrl.searchParams.set("soid", soid);
	newUrl.searchParams.set("zoid", zoid);

	return newUrl.toString();
}
