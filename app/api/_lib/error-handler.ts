function safeStringifyError(error: unknown): string {
	if (error instanceof Error) {
		return JSON.stringify({
			name: error.name,
			message: error.message,
			stack: error.stack
		});
	}
	
	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
}

export const apiErrorHandler = async (routeHandler: () => Promise<Response>) => {
	try {
		return await routeHandler();
	} catch (error) {
		console.error('API Error:', safeStringifyError(error));
		
		return Response.json({
			error: safeStringifyError(error),
		}, { status: 500 });
	}
};
