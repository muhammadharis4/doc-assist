/**
 * Splits an answer on `[n]` citation markers.
 * @param answer - Model answer text.
 * @returns Alternating parts: text, then a 1-based source number, then text, and so on.
 */
export function splitCitations(answer: string): (string | number)[] {
    return answer.split(/\[(\d+)\]/).map((part, index) => (index % 2 === 1 ? Number(part) : part));
}
