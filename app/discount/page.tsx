"use client";
import { JourneyResults } from "@/components/JourneyResults";
import { StatusBox } from "@/components/discount/StatusBox";
import { OriginalJourneyCard } from "@/components/discount/OriginalJourneyCard";
import { SplitOptionsCard } from "@/components/discount/SplitOptionsCard";
import { ErrorDisplay } from "@/components/discount/ErrorDisplay";
import { useDiscountAnalysis } from "@/components/discount/useDiscountAnalysis";
import { LOADING_MESSAGES, STATUS } from "@/components/discount/constants";
import { fetchAndValidateJson } from "@/utils/fetchAndValidateJson";
import { searchForJourneys } from "@/utils/journeyUtils";
import type { VendoJourney } from "@/utils/schemas";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { z } from "zod/v4";

function Discount() {
	const searchParams = useSearchParams();
	const {
		status,
		journeys,
		extractedData,
		error,
		selectedJourney,
		splitOptions,
		loadingMessage,
		progressInfo,
		setStatus,
		setJourneys,
		setExtractedData,
		setError,
		setSelectedJourney,
		setLoadingMessage,
		analyzeSplitOptions,
		handleJourneySelect,
	} = useDiscountAnalysis();

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

				// yes, the following is some ugly and probably redundant client-side validation, but imo this will help us progressively narrow down certain bugs
				const parseUrlRequest = await fetchAndValidateJson({
					url: "/api/parse-url",
					method: "POST",
					body: { url: urlFromParams },
					schema: z.object({
						success: z.literal(true),
						journeyDetails: z.object({
							fromStation: z.string().nullable().optional(),
							toStation: z.string().nullable().optional(),
							fromStationId: z.string().nullable().optional(),
							toStationId: z.string().nullable().optional(),
							date: z.unknown().optional(),
							time: z.string().nullable().optional(),
							class: z.number().nullable().optional(),
						}),
					}),
				});

				const { journeyDetails } = parseUrlRequest.data;

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
