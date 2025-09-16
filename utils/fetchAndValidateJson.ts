import { type ZodType, prettifyError } from "zod/v4";

export const fetchAndValidateJson = async <
	T extends ZodType,
	Method extends "GET" | "POST"
>({
	url,
	method,
	schema,
	body,
	headers,
}: {
	url: string;
	method?: Method;
	schema: T;
	body?: Method extends "GET" ? never : unknown;
	headers?: HeadersInit;
}) => {
	const init: RequestInit = {
		method: method ?? "GET",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			...headers,
		},
	};

	if (method !== "GET") {
		init.body = JSON.stringify(body);
	}

	const response = await fetch(url, init);

	if (!response.ok) {
		if (response.status === 403) {
			console.error(`403 Forbidden error accessing ${url}`);
			console.error(`Request headers:`, init.headers);
			
			// Try to get response body for additional error details
			let responseText = '';
			try {
				responseText = await response.text();
				console.error(`Response body: ${responseText.substring(0, 500)}`);
			} catch (e) {
				console.error(`Could not read response body: ${e}`);
			}
			
			throw new Error(
				`Access forbidden (403) to ${url} - API may have blocked the request due to missing authentication or anti-scraping measures`
			);
		}
		
		throw new Error(
			`Failed to fetch ${url}: ${response.status} ${response.statusText}`
		);
	}

	let json: unknown;

	try {
		json = await response.json();
	} catch {
		throw new Error(`Failed to parse JSON of fetch ${url}`);
	}

	const validationResult = schema.safeParse(json);

	if (!validationResult.success) {
		throw new Error(
			`Validation of fetch ${url} failed: ${prettifyError(
				validationResult.error
			)}`
		);
	}

	return {
		response,
		data: validationResult.data,
	};
};
