export type DocumentType =
    | "rental_contract"
    | "work_contract"
    | "salary_slip"
    | "insurance"
    | "tax"
    | "registration"
    | "other";

export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export const DOCUMENT_TYPE_OPTIONS: Array<{
    value: DocumentType;
    label: string;
}> = [
    { value: "rental_contract", label: "Rental contract" },
    { value: "work_contract", label: "Work contract" },
    { value: "salary_slip", label: "Salary slip" },
    { value: "insurance", label: "Insurance" },
    { value: "tax", label: "Tax" },
    { value: "registration", label: "Registration" },
    { value: "other", label: "Other" },
];

export interface DocumentItem {
    id: string;
    filename: string;
    content: string;
    mimeType: string | null;
    documentType: DocumentType;
    createdAt: string;
    status: DocumentStatus;
    errorMessage: string | null;
    indexedAt: string | null;
    tags: string[];
}

export interface CreateDocumentInput {
    filename: string;
    content: string;
    mimeType?: string;
    documentType: DocumentType;
    tags?: string[];
}

/** Query params for `GET /documents` (Paperless-style filters). */
export interface DocumentListParams {
    /** Case-insensitive substring on filename. */
    q?: string;
    documentType?: DocumentType | "";
    /** Exact status, `inbox` (pending + processing), or empty for all. */
    status?: DocumentStatus | "inbox" | "";
    /** Tag that must be present (case-insensitive). */
    tag?: string;
    /** ISO date string (date-only ok) lower bound on `createdAt`. */
    createdFrom?: string;
    /** ISO date string upper bound on `createdAt`. */
    createdTo?: string;
}

export const DEFAULT_DOCUMENT_TAKE = 20;

/** True when any list filter is active (for empty-state copy). */
export function hasDocumentListFilters(f: DocumentListParams): boolean {
    return Boolean(
        (f.q && f.q.trim()) ||
            f.documentType ||
            f.status ||
            (f.tag && f.tag.trim()) ||
            f.createdFrom ||
            f.createdTo,
    );
}
