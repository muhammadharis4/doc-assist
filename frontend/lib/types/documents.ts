export interface DocumentItem {
    id: string;
    filename: string;
    content: string;
    mimeType: string | null;
    createdAt: string;
}

export interface CreateDocumentInput {
    filename: string;
    content: string;
    mimeType?: string;
}

export const DEFAULT_DOCUMENT_TAKE = 20;
