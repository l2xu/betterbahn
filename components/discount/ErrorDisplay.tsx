interface ErrorDisplayProps {
	error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
	return (
		<div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
			<div className="flex items-center">
				<div className="text-red-500 mr-3">⚠️</div>
				<div>
					<strong>Fehler:</strong> {error}
					<p className="mt-2 text-sm">Bitte versuche es erneut.</p>
				</div>
			</div>
		</div>
	);
}