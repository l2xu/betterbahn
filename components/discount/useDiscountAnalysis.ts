import { useState, useCallback } from "react";
import { LOADING_MESSAGES, STATUS, type Status } from "./constants";
import type { VendoJourney } from "@/utils/schemas";
import type { ExtractedData, ProgressInfo, SplitOption } from "@/utils/types";

export function useDiscountAnalysis() {
	const [status, setStatus] = useState<Status>(STATUS.LOADING);
	const [journeys, setJourneys] = useState<VendoJourney[]>([]);
	const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
	const [error, setError] = useState("");
	const [selectedJourney, setSelectedJourney] = useState<VendoJourney | null>(null);
	const [splitOptions, setSplitOptions] = useState<SplitOption[] | null>(null);
	const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES.initial);
	const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);

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
						bahnCard: journeyData?.bahnCard || "none",
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
								console.error(
									"Error parsing SSE data:",
									parseError,
									"Line:",
									line
								);
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

	return {
		// State
		status,
		journeys,
		extractedData,
		error,
		selectedJourney,
		splitOptions,
		loadingMessage,
		progressInfo,
		// Actions
		setStatus,
		setJourneys,
		setExtractedData,
		setError,
		setSelectedJourney,
		setSplitOptions,
		setLoadingMessage,
		setProgressInfo,
		// Handlers
		analyzeSplitOptions,
		handleJourneySelect,
	};
}