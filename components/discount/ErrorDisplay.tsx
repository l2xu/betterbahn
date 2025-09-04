import { useState } from "react";
import { ProjectError } from "@/utils/projectError";

interface ErrorDisplayProps {
	error: ProjectError;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
	const [showDetails, setShowDetails] = useState(false);

	const formatCause = (cause: string) => {
		// Convert escaped "\n" into real newlines
		return cause.replace(/[^\\]\\n/g, "\n");
	};

	return (
		<div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
			<div className="flex items-center">
				<div className="text-red-500 mr-3">⚠️</div>
				<div>
					<strong>Fehler:</strong> {error.message}
					<p className="mt-2 text-sm">Bitte versuche es erneut.</p>
				</div>
			</div>

			{error.cause && (
				<div className="mt-4 text-sm">
					<button
						onClick={() => setShowDetails(prev => !prev)}
						className="text-blue-600 hover:underline focus:outline-none"
					>
						{showDetails ? "Weniger Details anzeigen" : "Mehr Details anzeigen"}
					</button>

					{showDetails && (
						<pre className="mt-2 bg-white border border-gray-300 p-3 rounded text-gray-800 overflow-x-auto">
							{formatCause(error.cause)}
						</pre>
					)}
				</div>
			)}
		</div>
	);
}