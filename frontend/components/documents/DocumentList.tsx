"use client";

import type { DocumentItem } from "@/lib/types/documents";

interface DocumentListProps {
    documents: DocumentItem[];
    isLoading: boolean;
    onDelete: (id: string) => Promise<void>;
    deletingId: string | null;
}

/**
 * Displays uploaded documents with the fields users care about most.
 */
export function DocumentList({
    documents,
    isLoading,
    onDelete,
    deletingId,
}: DocumentListProps) {
    if (isLoading) {
        return (
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-600">Loading documents...</p>
            </section>
        );
    }

    if (documents.length === 0) {
        return (
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-600">
                    No documents uploaded yet.
                </p>
            </section>
        );
    }

    return (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900">
                Uploaded files
            </h2>
            <ul className="mt-4 grid gap-4">
                {documents.map((document) => {
                    const isDeleting = deletingId === document.id;

                    return (
                        <li
                            key={document.id}
                            className="rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-300"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-base font-semibold text-zinc-900">
                                        {document.filename}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {document.storagePath}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-xl border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-red-200 disabled:text-red-300"
                                    onClick={() => {
                                        void onDelete(document.id);
                                    }}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                                <Badge>
                                    {document.category ?? "Uncategorized"}
                                </Badge>
                                <Badge>
                                    {document.project ?? "No project"}
                                </Badge>
                                <Badge>{document.mimeType}</Badge>
                            </div>

                            <p className="mt-4 line-clamp-3 text-sm text-zinc-600">
                                {document.extractedText ?? "No extracted text."}
                            </p>

                            <p className="mt-3 text-xs text-zinc-500">
                                Added {document.createdAt}
                            </p>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function Badge({ children }: { children: string }) {
    return (
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">
            {children}
        </span>
    );
}
