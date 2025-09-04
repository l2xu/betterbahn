"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractUrlFromText } from "./extractUrlFromText";
import { URLInput } from "./URLInput";
import { useSearchFormData } from "./useSearchFormData";

export const SearchForm = () => {
	const router = useRouter();
	const [url, setUrl] = useState("");
	const [urlParseError, setUrlParseError] = useState<string | null>(null);
	const { formData, updateFormData } = useSearchFormData();

	const handleUrlParsingAndNavigation = (e: React.FormEvent) => {
		e.preventDefault();

		if (!url.trim()) {
			setUrlParseError(
				"Please enter text containing a DB booking URL or paste a direct DB booking link"
			);
			return;
		}

		const extractedUrl = extractUrlFromText(url);

		if (!extractedUrl) {
			setUrlParseError(
				"No valid DB booking URL found. Please paste text containing a Deutsche Bahn booking link (from bahn.de with /buchung/start path) or check that your URL is correct."
			);
			return;
		}

		const searchParams = new URLSearchParams({
			url: extractedUrl,
			bahnCard: formData.bahnCard,
			hasDeutschlandTicket: String(formData.hasDeutschlandTicket),
			passengerAge: String(formData.passengerAge),
			travelClass: formData.travelClass,
			// autoSearch: "true", // Flag to indicate auto-search should happen
		});

		router.push(`/discount?${searchParams.toString()}`);
	};

	// Generate the target URL for the link (when form is valid)
	const getTargetUrl = () => {
		if (!url.trim()) return null;

		const extractedUrl = extractUrlFromText(url);
		if (!extractedUrl) return null;

		const searchParams = new URLSearchParams({
			url: extractedUrl,
			bahnCard: formData.bahnCard,
			hasDeutschlandTicket: String(formData.hasDeutschlandTicket),
			passengerAge: String(formData.passengerAge),
			travelClass: formData.travelClass,
		});

		return `/discount?${searchParams.toString()}`;
	};

	const targetUrl = getTargetUrl();

	return (
		<section>
			{/* Unified Input and Search Section */}
			<form onSubmit={handleUrlParsingAndNavigation}>
				<div className="space-y-6">
					<URLInput url={url} setUrl={setUrl} />
					<div className="flex flex-col md:flex-row gap-8">
						<select
							value={formData.bahnCard}
							onChange={(e) => updateFormData({ bahnCard: e.target.value })}
							className="w-full px-3 py-2 resize-vertical border-b-2 border-gray-300 focus:ring-2 focus:ring-primary"
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
						/>
						<select
							value={String(formData.hasDeutschlandTicket)}
							onChange={(e) =>
								updateFormData({
									hasDeutschlandTicket: e.target.value === "true",
								})
							}
							className="w-full px-3 py-2 resize-vertical border-b-2 border-gray-300 focus:ring-2 focus:ring-primary"
						>
							<option value="true">Deutschlandticket</option>
							<option value="false">Kein Deutschlandticket</option>
						</select>
						<select
							value={String(formData.travelClass)}
							onChange={(e) =>
								updateFormData({
									travelClass: e.target.value,
								})
							}
							className="w-full px-3 py-2 resize-vertical border-b-2 border-gray-300 focus:ring-2 focus:ring-primary"
						>
							<option value="1">Erste Klasse</option>
							<option value="2">Zweite Klasse</option>
						</select>
					</div>

					{targetUrl ? (
						<a
							href={targetUrl}
							onClick={(e) => {
								e.preventDefault();
								handleUrlParsingAndNavigation(e);
							}}
							className="w-full bg-primary text-white py-3 px-4 rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors text-lg font-semibold inline-block text-center no-underline"
						>
							Bessere Verbindung suchen
						</a>
					) : (
						<button
							type="submit"
							disabled={!url.trim()}
							className="w-full bg-primary text-white py-3 px-4 rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
						>
							Bessere Verbindung suchen
						</button>
					)}
				</div>

				{urlParseError && (
					<div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
						<strong>Error:</strong> {urlParseError}
					</div>
				)}
			</form>
		</section>
	);
};
