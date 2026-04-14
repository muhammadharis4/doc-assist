export interface ApiErrorPayload {
    message: string;
}

export class ApiError extends Error {
    readonly status: number;

    readonly details?: unknown;

    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

/**
 * Normalizes unknown failure values into a user-facing message.
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
