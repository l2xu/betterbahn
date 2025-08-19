"use client";
// Importiere notwendige React-Hooks und Komponenten
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import JourneyResults from "@/components/JourneyResults";
import SplitOptions from "@/components/SplitOptions";
import { searchForJourneys, validateJourneyData } from "@/utils/journeyUtils";
import { isLegCoveredByDeutschlandTicket } from "@/utils/deutschlandTicketUtils";

// Konstanten für Lademeldungen
const LOADING_MESSAGES = {
	parsing: "Wir analysieren die URL...",
	searching: "Wir suchen nach deiner Verbindung...",
	analyzing: "Analysiere Split-Ticket Optionen...",
	single_journey_flow:
		"Wir haben eine Verbindung gefunden und suchen nach Split-Ticket Optionen...",
	initial: "Wir extrahieren deine Reisedaten...",
};

// Status-Konstanten für den App-Zustand
const STATUS = {
	LOADING: "loading",
	SELECTING: "selecting",
	ANALYZING: "analyzing",
	DONE: "done",
	ERROR: "error",
};

// Hilfsfunktionen für Formatierung

// Formatiere Zeit für deutsche Anzeige
const formatTime = (dateTime) => {
	if (!dateTime) return "";
	return new Date(dateTime).toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

// Formatiere Reisedauer
const formatDuration = (journey) => {
	if (!journey?.legs || journey.legs.length === 0) return "";
	const departure = new Date(journey.legs[0].departure);
	const arrival = new Date(journey.legs[journey.legs.length - 1].arrival);
	const durationMs = arrival - departure;
	const hours = Math.floor(durationMs / (1000 * 60 * 60));
	const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
	return `${hours}h ${minutes}m`;
};

// Zähle Anzahl der Umstiege
const getChangesCount = (journey) => {
	if (!journey?.legs) return 0;
	return Math.max(0, journey.legs.length - 1);
};

// Formatiere Preis für Anzeige
const formatPrice = (price) => {
	if (typeof price === "object") {
		return `${price.amount} ${price.currency || "€"}`;
	}
	return `${price}€`;
};

const formatPriceWithTwoDecimals = (price) => {
    let amount;
    if (price && typeof price === "object") {
        amount = parseFloat(price.amount);
    } else {
        amount = parseFloat(price);
    }

    if (isNaN(amount)) {
        return null;
    }

    return `${amount.toFixed(2).replace(".", ",")}€`;
};

// --- Component: Status Box ---
function StatusBox({ message, isLoading, progressInfo }) {
	return (
		<div className="w-full mb-6">
			<div className="bg-primary text-white rounded-lg p-3 flex flex-col items-center justify-center py-8">
				<div className="flex items-center justify-center mb-2">
					{isLoading && (
						<div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent mr-3" />
					)}
					<span className="text-xl font-medium italic">{message}</span>
				</div>

				{/* Progress information */}
				{progressInfo && (
					<div className="mt-3 text-center">
						<div className="text-sm opacity-90 mb-2">
							{progressInfo.checked} von {progressInfo.total} Stationen geprüft
						</div>
						{progressInfo.currentStation && (
							<div className="text-xs opacity-75">
								Aktuelle Station: {progressInfo.currentStation}
							</div>
						)}
						{/* Progress bar */}
						<div className="w-64 bg-white bg-opacity-20 rounded-full h-2 mt-2">
							<div
								className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
								style={{
									width: `${
										(progressInfo.checked / progressInfo.total) * 100
									}%`,
								}}
							></div>
						</div>
						<div className="text-xs opacity-75 mt-1">
							{Math.round((progressInfo.checked / progressInfo.total) * 100)}%
							abgeschlossen
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// --- Component: Journey Icon ---
function JourneyIcon() {
	return (
		<div className="flex flex-col items-center mr-4 pt-1">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-6 w-6 text-gray-600"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth="1.5"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M6 20h12M6 16h12M8 16V9a4 4 0 014-4h0a4 4 0 014 4v7"
				/>
			</svg>
			<div className="h-16 w-px bg-gray-300 my-2" />
			<div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
		</div>
	);
}

// --- Component: Journey Info Row ---
function JourneyInfoRow({ children }) {
	return (
		<div className="text-sm text-gray-500 my-2 pl-1 flex items-center">
			{children}
		</div>
	);
}

// --- Component: Original Journey Card ---
function OriginalJourneyCard({ extractedData, selectedJourney }) {
	if (!extractedData) return null;

    const { hasDeutschlandTicket } = extractedData;
    const trainLegs = selectedJourney.legs?.filter((leg) => !leg.walking) || [];
    const isFullyCoveredByDticket =
        hasDeutschlandTicket &&
        trainLegs.length > 0 &&
        trainLegs.every((leg) =>
            isLegCoveredByDeutschlandTicket(leg, hasDeutschlandTicket)
        );

    const formattedPrice = formatPriceWithTwoDecimals(selectedJourney.price);
    let priceDisplay;

    if (formattedPrice !== null) {
        priceDisplay = formattedPrice;
    } else if (isFullyCoveredByDticket) {
        priceDisplay = "0,00€";
    } else {
        priceDisplay = "Preis auf Anfrage";
    }

	const renderSelectedJourney = () => (
		<div className="border rounded-lg overflow-hidden shadow-sm bg-white border-gray-200">
			<div className="p-4">
				<div className="flex items-start">
					<JourneyIcon />
					<div className="flex-grow">
						{/* Departure */}
						<div className="flex justify-between items-start">
							<div>
								<span className="font-bold text-xl">
									{selectedJourney.legs?.[0]
										? formatTime(selectedJourney.legs[0].departure)
										: extractedData.time || ""}
								</span>
								<span className="ml-3 text-lg">
									{extractedData.fromStation}
								</span>
							</div>
							<div className="text-right">
								<div className="font-bold text-lg text-red-600">Original</div>
								<div className="text-xl font-bold text-gray-900">
                                    {priceDisplay}
								</div>
							</div>
						</div>

						{/* Journey details */}
						<JourneyInfoRow>
							<span>{formatDuration(selectedJourney)}</span>
							<span className="">·</span>
							<span>
								{getChangesCount(selectedJourney)} Zwischenstopp
								{getChangesCount(selectedJourney) !== 1 ? "s" : ""}
							</span>
							<span className="ml-2 inline-block px-1.5 py-0.5 text-xs font-semibold text-red-700 border border-red-400 rounded-sm">
								DB
							</span>
						</JourneyInfoRow>

						{/* Arrival */}
						<div className="flex justify-between items-start mt-2">
							<div>
								<span className="font-bold text-xl">
									{selectedJourney.legs?.[selectedJourney.legs.length - 1]
										? formatTime(
												selectedJourney.legs[selectedJourney.legs.length - 1]
													.arrival
										  )
										: ""}
								</span>
								<span className="ml-3 text-lg">{extractedData.toStation}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Additional details */}
				<div className="mt-4 pt-4 border-t border-gray-100">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-gray-600">Klasse</p>
							<p className="text-gray-800">
								{extractedData.travelClass || "2"}. Klasse
							</p>
						</div>
						<div>
							<p className="text-gray-600">BahnCard</p>
							<p className="text-gray-800">
								{extractedData.bahnCard === "none"
									? "Keine"
									: `BahnCard ${extractedData.bahnCard}`}
							</p>
						</div>
					</div>

					{extractedData.hasDeutschlandTicket && (
						<div className="mt-2">
							<p className="text-gray-600 text-sm">Deutschland-Ticket</p>
							<p className="text-green-600 font-medium">✓ Vorhanden</p>
						</div>
					)}

					{selectedJourney.price?.hint && (
						<div className="mt-2">
							<p className="text-xs text-gray-500">
								{selectedJourney.price.hint}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			<h3 className="font-semibold text-lg text-gray-800">Deine Verbindung</h3>
			{selectedJourney ? (
				renderSelectedJourney()
			) : (
				<div className="text-center text-gray-500 py-4">
					Deine Verbindung wird geladen...
				</div>
			)}
		</div>
	);
}

// --- Component: Split Options Card ---
function SplitOptionsCard({
	splitOptions,
	selectedJourney,
	extractedData,
	status,
}) {
	const renderContent = () => {
		if (status === STATUS.SELECTING) {
			return (
				<p className="text-gray-600">
					Bitte wählen Sie eine Verbindung aus der Liste links aus.
				</p>
			);
		}

		if (!selectedJourney) {
			return <p className="text-gray-600">Keine Verbindung ausgewählt.</p>;
		}

		if (!splitOptions || status === STATUS.ANALYZING) {
			return (
				<div className="flex items-center justify-center py-8">
					<div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-b-transparent mr-3" />
					<span className="text-gray-600">Analysiere Optionen...</span>
				</div>
			);
		}

		if (splitOptions.length > 0) {
			return (
				<SplitOptions
					splitOptions={splitOptions}
					originalJourney={selectedJourney}
					loadingSplits={false}
					hasDeutschlandTicket={extractedData?.hasDeutschlandTicket || false}
					bahnCard={extractedData?.bahnCard || "none"}
				/>
			);
		}

		return (
			<div className="bg-gray-50 rounded-lg p-4 text-center">
				<p className="text-gray-600">
					Für diese Verbindung konnten keine günstigeren Split-Ticket Optionen
					gefunden werden.
				</p>
				<p className="text-sm text-gray-500 mt-2">
					Das ursprüngliche Ticket ist bereits die beste Option.
				</p>
			</div>
		);
	};

	return (
		<div className="space-y-6">
			<h3 className="font-semibold text-lg text-gray-800">
				Split-Ticket Optionen
			</h3>
			{renderContent()}
		</div>
	);
}

// --- Component: Error Display ---
function ErrorDisplay({ error }) {
	return (
		<div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
			<div className="flex items-center">
				<div className="text-red-500 mr-3">⚠️</div>
				<div>
					<strong>Fehler:</strong> {error}
					<p className="mt-2 text-sm">
						Bitte versuche es erneut oder kontaktiere unseren Support.
					</p>
				</div>
			</div>
		</div>
	);
}

// --- Main Component ---
function Discount() {
	const searchParams = useSearchParams();

	// State
	const [status, setStatus] = useState(STATUS.LOADING);
	const [journeys, setJourneys] = useState([]);
	const [extractedData, setExtractedData] = useState(null);
	const [error, setError] = useState("");
	const [selectedJourney, setSelectedJourney] = useState(null);
	const [splitOptions, setSplitOptions] = useState(null);
	const [loadingMessage, setLoadingMessage] = useState(
		LOADING_MESSAGES.initial
	);
	const [progressInfo, setProgressInfo] = useState(null); // New state for progress tracking

	// Handlers
	const analyzeSplitOptions = useCallback(async (journey, journeyData) => {
		setStatus(STATUS.ANALYZING);
		setLoadingMessage(LOADING_MESSAGES.analyzing);
		setProgressInfo(null);

		try {
			const response = await fetch("/api/split-journey", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					originalJourney: journey,
					bahnCard: journeyData?.bahnCard || "none",
					hasDeutschlandTicket: journeyData?.hasDeutschlandTicket || false,
					passengerAge: journeyData?.passengerAge?.trim()
						? parseInt(journeyData.passengerAge.trim())
						: null,
					travelClass: journeyData?.travelClass || "2",
					useStreaming: true, // Enable streaming for progress updates
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to analyze split options");
			}

			// Handle Server-Sent Events
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop(); // Keep incomplete line in buffer

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						try {
							const data = JSON.parse(line.slice(6));

							if (data.type === "progress") {
								setProgressInfo({
									checked: data.checked,
									total: data.total,
									currentStation: data.currentStation,
								});
								setLoadingMessage(data.message);
							} else if (data.type === "complete") {
								setSplitOptions(data.splitOptions || []);
								setStatus(STATUS.DONE);
								setProgressInfo(null);
							} else if (data.type === "error") {
								throw new Error(data.error);
							}
						} catch (parseError) {
							console.error("Error parsing SSE data:", parseError);
						}
					}
				}
			}
		} catch (err) {
			console.error("Error analyzing split options:", err);
			setError(err.message || "Fehler bei der Analyse der Split-Optionen.");
			setStatus(STATUS.ERROR);
			setProgressInfo(null);
		}
	}, []);

	const handleJourneySelect = useCallback(
		(journey) => {
			setSelectedJourney(journey);
			setSplitOptions(null);

			if (extractedData) {
				analyzeSplitOptions(journey, extractedData);
			} else {
				setError("Reisedaten nicht gefunden, um Split-Analyse zu starten.");
				setStatus(STATUS.ERROR);
			}
		},
		[extractedData, analyzeSplitOptions]
	);

	// Effects
	useEffect(() => {
		const initializeFlow = async () => {
			try {
				const urlFromParams = searchParams.get("url");
				if (!urlFromParams) {
					throw new Error("No URL provided for parsing.");
				}

				// Parse URL
				setLoadingMessage(LOADING_MESSAGES.parsing);
				const parseResponse = await fetch("/api/parse-url", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ url: urlFromParams }),
				});

				const parseData = await parseResponse.json();
				if (!parseResponse.ok) {
					throw new Error(parseData.error || "Failed to parse URL");
				}

				// Create journey data
				const { journeyDetails } = parseData;
				const journeyData = {
					fromStation: journeyDetails.fromStation,
					toStation: journeyDetails.toStation,
					fromStationId: journeyDetails.fromStationId,
					toStationId: journeyDetails.toStationId,
					date: journeyDetails.date,
					time: journeyDetails.time,
					travelClass:
						journeyDetails.class?.toString() ||
						searchParams.get("travelClass") ||
						"2",
					bahnCard: searchParams.get("bahnCard") || "none",
					hasDeutschlandTicket:
						searchParams.get("hasDeutschlandTicket") === "true",
					passengerAge: searchParams.get("passengerAge") || "",
				};

				setExtractedData(journeyData);

				if (!validateJourneyData(journeyData)) {
					throw new Error("Unvollständige Reisedaten nach der URL-Analyse");
				}

				// Search for journeys
				setLoadingMessage(LOADING_MESSAGES.searching);
				const foundJourneys = await searchForJourneys(journeyData);

				if (foundJourneys.length === 1) {
					setLoadingMessage(LOADING_MESSAGES.single_journey_flow);
					setSelectedJourney(foundJourneys[0]);
					await analyzeSplitOptions(foundJourneys[0], journeyData);
				} else if (foundJourneys.length > 1) {
					setJourneys(foundJourneys);
					setStatus(STATUS.SELECTING);
				} else {
					setJourneys([]);
					setStatus(STATUS.DONE);
				}
			} catch (err) {
				setError(err.message);
				setStatus(STATUS.ERROR);
			}
		};

		initializeFlow();
	}, [searchParams, analyzeSplitOptions]);

	// Computed values
	const getStatusMessage = () => {
		if (status === STATUS.ERROR) return `Fehler: ${error}`;
		if (status === STATUS.DONE) return "Analyse abgeschlossen";
		return loadingMessage;
	};

	const isLoading = status === STATUS.LOADING || status === STATUS.ANALYZING;

	// Render helpers
	const renderContent = () => {
		if (status === STATUS.ERROR) {
			return (
				<div className="w-full">
					<ErrorDisplay error={error} />
				</div>
			);
		}

		return (
			<div className="w-full space-y-6">
				{/* Journey Selection */}
				{status === STATUS.SELECTING && (
					<div className="bg-white rounded-lg shadow p-6">
						<h3 className="font-semibold text-lg mb-4 text-gray-800">
							Wähle deine Verbindung
						</h3>
						<JourneyResults
							journeys={journeys}
							bahnCard={extractedData?.bahnCard || "none"}
							hasDeutschlandTicket={
								extractedData?.hasDeutschlandTicket || false
							}
							passengerAge={extractedData?.passengerAge || ""}
							travelClass={extractedData?.travelClass || "2"}
							onJourneySelect={handleJourneySelect}
							selectedJourney={selectedJourney}
						/>
					</div>
				)}

				{/* Comparison View */}
				{selectedJourney && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="bg-white rounded-lg shadow p-6">
							<OriginalJourneyCard
								extractedData={extractedData}
								selectedJourney={selectedJourney}
							/>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<SplitOptionsCard
								splitOptions={splitOptions}
								selectedJourney={selectedJourney}
								extractedData={extractedData}
								status={status}
							/>
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<section className="mt-16 w-full max-w-7xl mx-auto ">
			<StatusBox
				message={getStatusMessage()}
				isLoading={isLoading}
				progressInfo={progressInfo}
			/>
			{renderContent()}
		</section>
	);
}

export default function DiscountPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Discount />
		</Suspense>
	);
}
