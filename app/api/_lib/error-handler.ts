export const apiErrorHandler = async (routeHandler: () => Promise<Response>) => {
	try {
		return await routeHandler();
	} catch (error) {
		console.error('API Error:', error);
		
		if (typeof error === "object" && error !== null && "message" in error) {
			return Response.json({
				error: (error as Error).message,
			}, { status: 500 });
		}

		return Response.json({
			error: "Internal server error",
		}, { status: 500 });
	}
};
