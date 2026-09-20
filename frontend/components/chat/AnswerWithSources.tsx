import { Link } from "@mui/material";
import { splitCitations } from "@/libs/citations";
import type { QuerySource } from "@/types/queries";

/**
 * Renders an answer with each `[n]` marker replaced by the cited file's name, linked to the file.
 * @param props.answer - Model answer text.
 * @param props.sources - Sources in the same order as the `[n]` labels.
 */
export function AnswerWithSources({ answer, sources }: { answer: string; sources: QuerySource[] }) {
    return (
        <>
            {splitCitations(answer).map((part, index) => {
                if (typeof part === "string") {
                    return part;
                }
                const source = sources[part - 1];
                if (!source?.documentId) {
                    return `[${part}]`;
                }
                return (
                    <Link
                        key={index}
                        href={`/api/documents/${source.documentId}/file`}
                        target="_blank"
                        rel="noopener"
                        title={source.snippet}
                    >
                        {source.filename ?? `source ${part}`}
                    </Link>
                );
            })}
        </>
    );
}
