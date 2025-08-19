"use client";

// Importiere notwendige React-Hooks und Next.js-Router
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

// Konstanten für Formular-Initialwerte
const INITIAL_FORM_STATE = {
	fromStation: "",
	toStation: "",
	fromStationId: "",
	toStationId: "",
	date: "",
	time: "",
	bahnCard: "none",
	hasDeutschlandTicket: true,
	passengerAge: "",
	travelClass: "2",
};

// Fehlermeldungen für URL-Parsing
const ERROR_MESSAGES = {
	EMPTY_URL:
		"Please enter text containing a DB booking URL or paste a direct DB booking link",
	INVALID_URL:
		"No valid DB booking URL found. Please paste text containing a Deutsche Bahn booking link (from bahn.de with /buchung/start path) or check that your URL is correct.",
	PARSE_FAILED: "Failed to parse URL",
};

// Haupt-Suchformular-Komponente
const SearchForm = () => {
	const router = useRouter();

	// UI-Zustand verwalten
	const [url, setUrl] = useState("");
	const [isParsingUrl, setIsParsingUrl] = useState(false);
	const [urlParseError, setUrlParseError] = useState(null);
	const [showHelp, setShowHelp] = useState(false);

	// Formulardaten-Zustand
	const [formData, setFormData] = useState(INITIAL_FORM_STATE);

	// URL-Validierungs-Hilfsfunktionen
	const isValidDBBookingUrl = useCallback((url) => {
		try {
			const urlObj = new URL(url);

			// Überprüfe ob es eine gültige Bahn.de Buchungs-URL ist
			if (!urlObj.hostname.includes("bahn.de")) return false;
			if (!urlObj.pathname.includes("/buchung/start")) return false;

			const requiredParams = ["vbid"];
			const commonParams = ["ot", "rt", "dt", "so", "zo"];

			const hasRequiredParams = requiredParams.some((param) =>
				urlObj.searchParams.has(param)
			);

			if (!hasRequiredParams) {
				return commonParams.some((param) => urlObj.searchParams.has(param));
			}

			return true;
		} catch (error) {
			return false;
		}
	}, []);

	const extractUrlFromText = useCallback(
		(text) => {
			const urlRegex = /https?:\/\/[^\s\n\r]+/gi;
			const matches = text.match(urlRegex);

			if (matches?.length > 0) {
				for (let foundUrl of matches) {
					foundUrl = foundUrl.replace(/[.,;!?\s]*$/, "");
					if (isValidDBBookingUrl(foundUrl)) {
						console.log("🔍 Found valid DB booking URL:", foundUrl);
						return foundUrl;
					}
				}
			}

			const trimmedText = text.trim();
			if (trimmedText.startsWith("http") && isValidDBBookingUrl(trimmedText)) {
				return trimmedText;
			}

			return null;
		},
		[isValidDBBookingUrl]
	);

	// Utility functions
	const updateFormData = (updates) => {
		// save updated form fields to local Storage for convenience
		if (updates.bahnCard != null) {
			localStorage.setItem("betterbahn/settings/bahnCard", updates.bahnCard);
		}
		if (updates.hasDeutschlandTicket != null) {
			localStorage.setItem(
				"betterbahn/settings/hasDeutschlandTicket",
				updates.hasDeutschlandTicket
			);
		}
		if (updates.passengerAge != null) {
			localStorage.setItem(
				"betterbahn/settings/passengerAge",
				updates.passengerAge
			);
		}
		setFormData((prev) => ({ ...prev, ...updates }));
	};

	// Handle URL parsing and navigation
	const handleUrlSubmit = async (e) => {
		e.preventDefault();

		if (!url.trim()) {
			setUrlParseError(ERROR_MESSAGES.EMPTY_URL);
			return;
		}

		const extractedUrl = extractUrlFromText(url);
		if (!extractedUrl) {
			setUrlParseError(ERROR_MESSAGES.INVALID_URL);
			return;
		}

		const searchParams = new URLSearchParams({
			url: extractedUrl,
			bahnCard: formData.bahnCard,
			hasDeutschlandTicket: formData.hasDeutschlandTicket.toString(),
			passengerAge: formData.passengerAge,
			travelClass: formData.travelClass,
			// autoSearch: "true", // Flag to indicate auto-search should happen
		});

		// Navigate to discount page with search parameters
		router.push(`/discount?${searchParams.toString()}`);
	};

	// Load saved settings from localStorage on component mount
	useEffect(() => {
		console.log(localStorage.getItem("betterbahn/settings/bahnCard"));
		const storageBahnCard = localStorage.getItem(
			"betterbahn/settings/bahnCard"
		);
		const storageAge = localStorage.getItem("betterbahn/settings/passengerAge");
		const storageDTicket = localStorage.getItem(
			"betterbahn/settings/hasDeutschlandTicket"
		);
		const updates = {};
		if (storageBahnCard != null) {
			updates.bahnCard = storageBahnCard;
		}
		if (storageAge != null) {
			updates.passengerAge = parseInt(storageAge);
		}
		if (storageDTicket != null) {
			updates.hasDeutschlandTicket = storageDTicket === "true";
		}

		// Update form data with values from localStorage
		setFormData((prev) => ({ ...prev, ...updates }));
	}, []);

	return (
		<section className="  ">
			{/* Unified Input and Search Section */}

			<form onSubmit={handleUrlSubmit} className="space-y-6">
				{/* URL Input */}
				<div className="relative">
					<div className="flex items-center gap-2 mb-2">
						<label htmlFor="url" className="text-sm font-medium opacity-80">
							Deutsche Bahn "Verbindung Teilen Text"
						</label>
						<button
							type="button"
							onClick={() => setShowHelp(!showHelp)}
							className="inline-flex items-center justify-center w-5 h-5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
							aria-label="Hilfe anzeigen"
						>
							?
						</button>
					</div>
					<input
						id="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder={`Dein "Teilen"-Text von der Deutschen Bahn`}
						className="w-full px-3 py-2 resize-vertical border-b-2 border-gray-300 focus:ring-2 focus:ring-primary   "
						disabled={isParsingUrl}
					/>

					{/* Help Section */}
					{showHelp && (
						<div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<h4 className="font-semibold text-blue-900 mb-2">
								So findest du den Text zum Teilen:
							</h4>
							<ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
								<li>
									Gehe auf <strong>bahn.de</strong> und plane deine Verbindung
								</li>
								<li>Wähle deine gewünschte Verbindung aus</li>
								<li>
									Klicke auf die drei kleinen Punkte oben in der Ecke der
									Verbindung
								</li>
								<li>
									Klicke auf <strong>"Verbindung Teilen"</strong>
								</li>
								<li>
									Klicke auf <strong>"Infos Kopieren"</strong>
								</li>
								<li>Füge den kompletten kopierten Text hier ein</li>
							</ol>
						</div>
					)}
				</div>
				<div className="flex flex-col md:flex-row gap-8">
					<select
						value={formData.bahnCard}
						onChange={(e) => updateFormData({ bahnCard: e.target.value })}
						className="w-full px-3 py-2 resize-vertical border-b-2 border-gray-300 focus:ring-2 focus:ring-primary"
						disabled={isParsingUrl}
					>
						<option value="none">Keine BahnCard</option>
						<option value="25">BahnCard 25 </option>
						<option value="50">BahnCard 50 </option>
					</select>
					<input
						type="number"
						value={formData.passengerAge}
						onChange={(e) => updateFormData({ passengerAge: e.target.value })}
						placeholder="Alter des Reisenden"
						min="0"
						max="120"
						className="w-full px-3 py-2 resize-vertical border-b-2 border-gray-300 focus:ring-2 focus:ring-primary"
						disabled={isParsingUrl}
					/>
					<select
						value={formData.hasDeutschlandTicket}
						onChange={(e) =>
							updateFormData({
								hasDeutschlandTicket: e.target.value === "true",
							})
						}
						className="w-full px-3 py-2 resize-vertical border-b-2 border-gray-300 focus:ring-2 focus:ring-primary"
						disabled={isParsingUrl}
					>
						<option value="true">Deutschlandticket</option>
						<option value="false">Kein Deutschlandticket</option>
					</select>
				</div>

				<button
					type="submit"
					disabled={isParsingUrl || !url.trim()}
					className="w-full bg-primary text-white py-3 px-4 rounded-full hover:primaryfocus:outline-none  disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
				>
					{isParsingUrl
						? "Deine Verbindung wird gesucht."
						: "Bessere Verbindung suchen"}
				</button>
			</form>

			{urlParseError && (
				<div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					<strong>Error:</strong> {urlParseError}
				</div>
			)}
		</section>
	);
};

export default SearchForm;
