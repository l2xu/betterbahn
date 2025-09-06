type ErrorName = "API_ERROR"
	| `INPUT_ERROR`
	| `UNKNOWN_ERROR`

export class ProjectError extends Error {
	name: ErrorName;
	message: string;
	cause?: string;

	constructor({ name, message, cause }: { name: ErrorName, message: string, cause?: string }) {
		super();
		this.name = name;
		this.message = message;
		this.cause = cause;
	}
}