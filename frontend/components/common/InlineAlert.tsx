interface InlineAlertProps {
    message: string;
    tone?: "error" | "success" | "info";
}

const toneMap: Record<NonNullable<InlineAlertProps["tone"]>, string> = {
    error: "border-red-300 bg-red-50 text-red-700",
    success: "border-emerald-300 bg-emerald-50 text-emerald-700",
    info: "border-sky-300 bg-sky-50 text-sky-700",
};

/**
 * Renders compact inline feedback for success, error, and info states.
 */
export function InlineAlert({ message, tone = "info" }: InlineAlertProps) {
    return (
        <p className={`rounded-lg border px-3 py-2 text-sm ${toneMap[tone]}`}>
            {message}
        </p>
    );
}
