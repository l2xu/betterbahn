interface ErrorDisplayProps {
	error: string;
}

// Helper function to convert URLs in text to clickable links
function renderTextWithLinks(text: string) {
	const urlRegex = /(https?:\/\/[^\s]+)/g;
	const parts = text.split(urlRegex);

	return parts.map((part, index) => {
		if (urlRegex.test(part)) {
			return (
				<a
					key={index}
					href={part}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-600 hover:text-blue-800 underline"
				>
					{part}
				</a>
			);
		}
		return part;
	});
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
	return (
		<div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
			<div className="flex items-center">
				<div className="text-red-500 mr-3">⚠️</div>
				<div>
					<strong>Fehler:</strong> {renderTextWithLinks(error)}
				</div>
			</div>
		</div>
	);
}