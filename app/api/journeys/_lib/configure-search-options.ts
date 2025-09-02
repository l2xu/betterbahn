import type { SearchJourneysOptions } from "db-vendo-client";
import type { JourneyUrlParams } from "./extract-url-params";
import { data as loyaltyCards } from "db-vendo-client/format/loyalty-cards";

export const configureSearchOptions = (urlParams: JourneyUrlParams) => {
	const options: SearchJourneysOptions = {
		results: urlParams.departure ? 5 : parseInt(urlParams.results, 10), // Weniger Ergebnisse bei genauer Zeit um Rauschen zu reduzieren
		stopovers: true,
		// Bei genauer Abfahrtszeit wollen wir exakte Treffer, nicht verschiedene Alternativen
		notOnlyFastRoutes: !urlParams.departure, // Nur schnelle Routen bei genauer Zeit
		remarks: true, // Verbindungshinweise einschließen
		transfers: -1, // System entscheidet über optimale Anzahl Umstiege
		// Reiseklasse-Präferenz setzen - verwende firstClass boolean Parameter
		firstClass: parseInt(urlParams.travelClass, 10) === 1, // true für erste Klasse, false für zweite Klasse
	};

	// Abfahrtszeit hinzufügen falls angegeben
	if (urlParams.departure) {
		options.departure = new Date(urlParams.departure);
	}

	// Discount-Rabattkarte hinzufügen falls angegeben
	if (urlParams.discount !== "none") {
		const discount = parseInt(urlParams.discount, 10);
		if ([25, 50, 100].includes(discount)) {
			options.loyaltyCard = {
				type: loyaltyCards.BAHNCARD,
				discount: discount,
				class: parseInt(urlParams.travelClass, 10), // 1 für erste Klasse, 2 für zweite Klasse
			};
		}
	}

	// Passagieralter für angemessene Preisgestaltung hinzufügen
	if (urlParams.passengerAge && !isNaN(parseInt(urlParams.passengerAge, 10))) {
		options.age = parseInt(urlParams.passengerAge, 10);
	}

	// Deutschland-Ticket Optionen für genauere Preisgestaltung
	if (urlParams.hasDeutschlandTicket) {
		options.deutschlandTicketDiscount = true;
		// Diese Option kann helfen, genauere Preise zurückzugeben wenn Deutschland-Ticket verfügbar ist
		options.deutschlandTicketConnectionsOnly = false; // Wir wollen alle Verbindungen, aber mit genauen Preisen
	}

	return options;
};
