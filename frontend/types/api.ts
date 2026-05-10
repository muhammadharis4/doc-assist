/** JSON shape for API error responses that expose a `message` field. */
export interface ApiErrorPayload {
    message: string;
}

/**
 * Application error with HTTP `status` and optional structured `details`.
 */
export class ApiError extends Error {
    readonly status: number;

    readonly details?: unknown;

    /**
     * Creates an error you can `throw` from API code while preserving HTTP context.
     * @param status - HTTP status code to associate with the failure.
     * @param message - Human-readable message.
     * @param details - Optional raw error payload (e.g. validation issues).
     */
    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

/**
 * Converts `unknown` catch values into a string safe to show in UI toasts and alerts.
 * @param error - Typically `Error`, `ApiError`, or a thrown string-like value.
 * @returns A non-empty string; default `"An unexpected error occurred."` for unrecognized inputs.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "An unexpected error occurred.";
}
