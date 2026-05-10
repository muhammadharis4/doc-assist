export type DocumentType =
    | "rental_contract"
    | "work_contract"
    | "salary_slip"
    | "insurance"
    | "tax"
    | "registration"
    | "other";

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
    status: "pending" | "processing" | "ready" | "failed";
    errorMessage: string | null;
    indexedAt: string | null;
}

export interface CreateDocumentInput {
    filename: string;
    content: string;
    mimeType?: string;
    documentType: DocumentType;
}

export const DEFAULT_DOCUMENT_TAKE = 20;
