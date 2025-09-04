import type { ProgressInfo } from "@/utils/types";

import { ProjectError } from "@/utils/projectError";

interface StatusBoxProps {
	statusMessage: string;
	isLoading: boolean;
	progressInfo?: ProgressInfo;
	error?: ProjectError;
}

export function StatusBox({ statusMessage, isLoading, progressInfo, error }: StatusBoxProps) {
	const isError = Boolean(error);
	const message = isError ? `Fehler: ${error?.message}` : statusMessage;
	const showLoading = !isError && isLoading;

	return (
		<div className="w-full mb-6">
			<div
				className={`rounded-lg p-3 flex flex-col items-center justify-center py-8 ${
					isError
						? "bg-red-600 text-white border border-red-800 shadow-md"
						: "bg-primary text-white"
				}`}
			>
				<div className="flex items-center justify-center mb-2">
					{showLoading && (
						<div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent mr-3" />
					)}
					<span
						className={`text-xl italic ${
							isError ? "font-bold underline decoration-white/70" : "font-medium"
						}`}
					>
						{message}
					</span>
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