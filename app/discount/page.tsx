"use client";
import { JourneyResults } from "@/components/JourneyResults";
import { SplitOptions } from "@/components/SplitOptions/SplitOptions";
import { isLegCoveredByDeutschlandTicket } from "@/utils/deutschlandTicketUtils";
import { discountLabels } from "@/utils/discountLabels";
import { searchForJourneys } from "@/utils/journeyUtils";
import type { VendoJourney, VendoPrice } from "@/utils/schemas";
import type { ExtractedData, ProgressInfo, SplitOption } from "@/utils/types";
import { useSearchParams } from "next/navigation";
import {
	Suspense,
	useCallback,
	useEffect,
	useState,
	type ReactNode,
} from "react";

const formatDiscountDisplay = (
	discount: string,
	hasDeutschlandTicket: boolean
) => {
	const discounts = [];
	if (discount !== "none") {
		discounts.push(discountLabels[discount] || discount);
	}
	if (hasDeutschlandTicket) {
		discounts.push(
			<span className="text-green-600 whitespace-nowrap">
				✓ Deutschland-Ticket
			</span>
		);
	}

	if (discounts.length === 0) {
		return "Keine Ermäßigung";
	}

	return discounts.map((discount, index) => (
		<span key={index}>
			{index > 0 && ", "}
			{discount}
		</span>
	));
};

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
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];

// Hilfsfunktionen für Formatierung

// Formatiere Zeit für deutsche Anzeige
const formatTime = (dateTime?: string) => {
	if (!dateTime) return "";
	return new Date(dateTime).toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

// Formatiere Reisedauer
const formatDuration = (journey: VendoJourney) => {
	if (!journey?.legs || journey.legs.length === 0) return "";
	const departure = new Date(journey.legs[0].departure);
	const arrival = new Date(journey.legs[journey.legs.length - 1].arrival);
	const durationMs = arrival.getTime() - departure.getTime();
	const hours = Math.floor(durationMs / (1000 * 60 * 60));
	const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
	return `${hours}h ${minutes}m`;
};

// Zähle Anzahl der Umstiege
const getChangesCount = (journey: VendoJourney) => {
	if (!journey?.legs) return 0;
	return Math.max(0, journey.legs.length - 1);
};

const formatPriceWithTwoDecimals = (price: VendoPrice | number) => {
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

function StatusBox({
	message,
	isLoading,
	progressInfo,
}: {
	message: string;
	isLoading: boolean;
	progressInfo?: ProgressInfo;
}) {
	return (
		<div className="w-full mb-6">
			<div className="bg-primary text-white rounded-lg p-3 flex flex-col items-center justify-center py-8">
				<div className="flex items-center justify-center mb-2">
					{isLoading && (
						<div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-foreground border-b-transparent mr-3" />
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
						<div className="w-64 bg-foreground/20 rounded-full h-2 mt-2">
							<div
								className="bg-foreground h-2 rounded-full transition-all duration-300 ease-out"
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
				className="h-6 w-6 text-foreground/70"
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
			<div className="h-16 w-px bg-foreground/30 my-2"></div>
			<div className="w-2.5 h-2.5 rounded-full bg-foreground/60"></div>
		</div>
	);
}

// --- Component: Journey Info Row ---
function JourneyInfoRow({ children }: { children: ReactNode }) {
	return (
		<div className="text-sm text-text-secondary my-2 pl-1 flex items-center">
			{children}
		</div>
	);
}

// --- Component: Original Journey Card ---
function OriginalJourneyCard({
	extractedData,
	selectedJourney,
}: {
	extractedData: ExtractedData;
	selectedJourney: VendoJourney;
}) {
	if (!extractedData) return null;

	const { hasDeutschlandTicket } = extractedData;
	const trainLegs = selectedJourney.legs?.filter((leg) => !leg.walking) || [];
	const isFullyCoveredByDticket =
		hasDeutschlandTicket &&
		trainLegs.length > 0 &&
		trainLegs.every((leg) =>
			isLegCoveredByDeutschlandTicket(leg, hasDeutschlandTicket)
		);

	/**
	 * TODO formatPriceWithTwoDecimals doesn't handle undefined values,
	 * but the property on journey (VendoJourney) may not be present.
	 * this is either an oversight in the implementation or the schema / type defs i wrote.
	 */

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
		<div className="border rounded-lg overflow-hidden shadow-sm bg-card-bg border-card-border">
			<div className="p-4">
				<div className="flex items-start">
					<JourneyIcon />
					<div className="flex-grow">
						{/* Departure */}
						<div className="flex justify-between items-start">
							<div>
								<span className="font-bold text-xl text-text-primary">
									{selectedJourney.legs?.[0]
										? formatTime(selectedJourney.legs[0].departure)
										: extractedData.time || ""}
								</span>
								<span className="ml-3 text-lg text-text-primary">
									{extractedData.fromStation}
								</span>
							</div>
							<div className="text-right">
								<div className="font-bold text-lg text-red-600">Original</div>
								<div className="text-xl font-bold text-text-primary">
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
								{getChangesCount(selectedJourney) === 1 ? "" : "s"}
							</span>
							<span className="ml-2 inline-block px-1.5 py-0.5 text-xs font-semibold text-red-700 border border-red-400 rounded-sm">
								DB
							</span>
						</JourneyInfoRow>

						{/* Arrival */}
						<div className="flex justify-between items-start mt-2">
							<div>
								<span className="font-bold text-xl text-text-primary">
									{selectedJourney.legs?.[selectedJourney.legs.length - 1]
										? formatTime(
												selectedJourney.legs[selectedJourney.legs.length - 1]
													.arrival
										  )
										: ""}
								</span>
								<span className="ml-3 text-lg text-text-primary">
									{extractedData.toStation}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Additional details */}
				<div className="mt-4 pt-4 border-t border-card-border">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-text-secondary">Klasse</p>
							<p className="text-text-primary">
								{extractedData.travelClass || "2"}. Klasse
							</p>
						</div>
						<div>
							<p className="text-text-secondary">Ermäßigung</p>
							<p className="text-text-primary">
								{formatDiscountDisplay(extractedData.discount || "none", extractedData.hasDeutschlandTicket || false)}
							</p>
						</div>
					</div>

					{selectedJourney.price?.hint && (
						<div className="mt-2">
							<p className="text-xs text-text-muted">
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
			<h3 className="font-semibold text-lg text-text-primary">
				Deine Verbindung
			</h3>
			{selectedJourney ? (
				renderSelectedJourney()
			) : (
				<div className="text-center text-text-secondary py-4">
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
}: {
	splitOptions?: SplitOption[];
	extractedData?: ExtractedData;
	selectedJourney?: VendoJourney;
	status?: Status;
}) {
	const renderContent = () => {
		if (status === STATUS.SELECTING) {
			return (
				<p className="text-text-secondary">
					Bitte wählen Sie eine Verbindung aus der Liste links aus.
				</p>
			);
		}

		if (!selectedJourney) {
			return (
				<p className="text-text-secondary">Keine Verbindung ausgewählt.</p>
			);
		}

		if (!splitOptions || status === STATUS.ANALYZING) {
			return (
				<div className="flex items-center justify-center py-8">
					<div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-b-transparent mr-3" />
					<span className="text-text-secondary">Analysiere Optionen...</span>
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
				/>
			);
		}

		return (
			<div className="bg-background border border-card-border rounded-lg p-4 text-center">
				<p className="text-text-secondary">
					Für diese Verbindung konnten keine günstigeren Split-Ticket Optionen
					gefunden werden.
				</p>
				<p className="text-sm text-text-muted mt-2">
					Das ursprüngliche Ticket ist bereits die beste Option.
				</p>
			</div>
		);
	};

	return (
		<div className="space-y-6">
			<h3 className="font-semibold text-lg text-text-primary">
				Split-Ticket Optionen
			</h3>
			{renderContent()}
		</div>
	);
}

// --- Component: Error Display ---
function ErrorDisplay({ error }: { error: string }) {
	return (
		<div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
			<div className="flex items-center">
				<div className="text-red-500 mr-3">⚠️</div>
				<div>
					<strong>Fehler:</strong> {error}
					<p className="mt-2 text-sm">
						Bitte versuche es erneut.
					</p>
				</div>
			</div>
		</div>
	);
}

function Discount() {
	const searchParams = useSearchParams();

	// State
	const [status, setStatus] = useState<Status>(STATUS.LOADING);
	const [journeys, setJourneys] = useState<VendoJourney[]>([]);
	const [extractedData, setExtractedData] = useState<ExtractedData | null>(
		null
	);
	const [error, setError] = useState("");
	const [selectedJourney, setSelectedJourney] = useState<VendoJourney | null>(
		null
	);
	const [splitOptions, setSplitOptions] = useState<SplitOption[] | null>(null);
	const [loadingMessage, setLoadingMessage] = useState(
		LOADING_MESSAGES.initial
	);
	const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null); // New state for progress tracking

	// Handlers
	const analyzeSplitOptions = useCallback(
		async (journey: VendoJourney, journeyData: ExtractedData) => {
			setStatus(STATUS.ANALYZING);
			setLoadingMessage(LOADING_MESSAGES.analyzing);
			setProgressInfo(null);

			try {
				const response = await fetch("/api/split-journey", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						originalJourney: journey,
						discount: journeyData?.discount || "none",
						hasDeutschlandTicket: journeyData?.hasDeutschlandTicket || false,
						passengerAge: journeyData?.passengerAge?.trim()
							? parseInt(journeyData.passengerAge.trim(), 10)
							: null,
						travelClass: journeyData?.travelClass || "2",
						useStreaming: true, // Enable streaming for progress updates
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to analyze split options");
				}

				// Handle Server-Sent Events
				const reader = response.body!.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop()!; // Keep incomplete line in buffer

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							try {
								const jsonData = line.slice(6).trim();
								if (!jsonData) continue; // Skip empty data lines
								
								const data = JSON.parse(jsonData);

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
								console.error("Error parsing SSE data:", parseError, "Line:", line);
								// Continue processing other lines instead of failing completely
							}
						}
					}
				}
			} catch (err) {
				const typedErr = err as { message?: string };
				console.error("Error analyzing split options:", err);
				setError(
					typedErr.message || "Fehler bei der Analyse der Split-Optionen."
				);
				setStatus(STATUS.ERROR);
				setProgressInfo(null);
			}
		},
		[]
	);

	const handleJourneySelect = useCallback(
		(journey: VendoJourney) => {
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
					discount: searchParams.get("discount") || "none",
					hasDeutschlandTicket:
						searchParams.get("hasDeutschlandTicket") === "true",
					passengerAge: searchParams.get("passengerAge") || "",
				};

				setExtractedData(journeyData);

				// Search for journeys
				setLoadingMessage(LOADING_MESSAGES.searching);
				const foundJourneys = (await searchForJourneys(
					journeyData
				)) as VendoJourney[];

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
				const typedErr = err as { message: string };
				setError(typedErr.message);
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
					<div className="bg-background rounded-lg shadow p-6">
						<h3 className="font-semibold text-lg mb-4 text-foreground">
							Wähle deine Verbindung
						</h3>
						<JourneyResults
							journeys={journeys}
							travelClass={extractedData?.travelClass || "2"}
							onJourneySelect={handleJourneySelect}
							selectedJourney={selectedJourney}
						/>
					</div>
				)}

				{/* Comparison View */}
				{selectedJourney && extractedData && splitOptions && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="bg-background rounded-lg shadow p-6">
							<OriginalJourneyCard
								extractedData={extractedData}
								selectedJourney={selectedJourney}
							/>
						</div>
						<div className="bg-background rounded-lg shadow p-6">
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
				progressInfo={progressInfo ?? undefined}
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
