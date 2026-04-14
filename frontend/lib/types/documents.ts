export interface DocumentItem {
    id: string;
    filename: string;
    mimeType: string;
    storagePath: string;
    extractedText: string;
    size: number | null;
    project: string | null;
    category: string | null;
    version: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDocumentInput {
    filename: string;
    mimeType: string;
    storagePath: string;
    extractedText: string;
    size?: number;
    project?: string;
    category?: string;
    version?: number;
}

export interface DocumentFilters {
    skip?: number;
    take?: number;
    project?: string;
    category?: string;
    keyword?: string;
}

export interface DocumentFormValues {
    filename: string;
    mimeType: string;
    storagePath: string;
    extractedText: string;
    size: string;
    project: string;
    category: string;
    version: string;
}

export const DEFAULT_DOCUMENT_TAKE = 20;
