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
		const errorMessage =
			response.status === 500
				? `Server error (500). Diese Problem ist uns bekannt und wir arbeiten daran, es zu beheben. Ein Status über den Fehler finden Sie unter https://github.com/l2xu/betterbahn/issues/57`
				: `Failed to fetch ${url}: ${response.status} ${response.statusText}`;

		throw new Error(errorMessage);
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
