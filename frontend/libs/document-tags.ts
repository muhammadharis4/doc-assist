/**
 * Parses comma-separated user tag input (aligned with backend `normalize_document_tags`).
 * @param value - Raw comma-separated string.
 * @returns Normalized unique tag list.
 * @throws Error when a tag violates length, pattern, or count rules.
 */
export function parseDocumentTagsInput(value: string): string[] {
    const parts = value
        .split(",")
        .map((segment) => segment.trim())
        .filter(Boolean);
    const pattern = /^[\w.\- ]+$/u;
    const seen = new Set<string>();
    const out: string[] = [];
    for (const part of parts) {
        if (part.length > 48) {
            throw new Error("Each tag must be at most 48 characters.");
        }
        if (!pattern.test(part)) {
            throw new Error(
                "Tags may only contain letters, numbers, spaces, hyphen, dot, and underscore.",
            );
        }
        const key = part.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        out.push(part);
        if (out.length > 20) {
            throw new Error("At most 20 tags allowed.");
        }
    }
    return out;
}
