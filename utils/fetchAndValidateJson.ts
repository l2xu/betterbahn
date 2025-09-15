import { prettifyError, type ZodType } from "zod/v4";
import { ProjectError } from "@/utils/projectError";

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
		throw new ProjectError({
			name: "API_ERROR",
			message: `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
			cause: JSON.stringify(await response.json().then((value) => value.error), null, 2),
		});
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
