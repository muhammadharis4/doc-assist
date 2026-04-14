"use client";

import type { DocumentItem } from "@/lib/types/documents";

interface DocumentListProps {
    documents: DocumentItem[];
    isLoading: boolean;
    onDelete: (id: string) => Promise<void>;
    deletingId: string | null;
}

/**
 * Displays document results with contextual metadata and delete action.
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
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-600">
                    No documents found for this filter set.
                </p>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Documents</h2>
            <ul className="mt-4 grid gap-3">
                {documents.map((document) => {
                    const isDeleting = deletingId === document.id;

                    return (
                        <li
                            key={document.id}
                            className="rounded-xl border border-zinc-200 p-4 transition hover:border-zinc-300"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium text-zinc-900">
                                        {document.filename}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {document.id}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-red-200 disabled:text-red-300"
                                    onClick={() => {
                                        void onDelete(document.id);
                                    }}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>

                            <dl className="mt-3 grid gap-1 text-sm text-zinc-700 md:grid-cols-2">
                                <MetaItem
                                    label="MIME"
                                    value={document.mimeType}
                                />
                                <MetaItem
                                    label="Storage"
                                    value={document.storagePath}
                                />
                                <MetaItem
                                    label="Project"
                                    value={document.project ?? "Not specified"}
                                />
                                <MetaItem
                                    label="Category"
                                    value={document.category ?? "Not specified"}
                                />
                                <MetaItem
                                    label="Size"
                                    value={
                                        document.size !== null
                                            ? `${document.size.toLocaleString()} bytes`
                                            : "Unknown"
                                    }
                                />
                                <MetaItem
                                    label="Version"
                                    value={String(document.version)}
                                />
                            </dl>

                            <p className="mt-3 text-sm text-zinc-600">
                                {document.extractedText}
                            </p>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

interface MetaItemProps {
    label: string;
    value: string;
}

function MetaItem({ label, value }: MetaItemProps) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
                {label}
            </dt>
            <dd className="text-sm text-zinc-700">{value}</dd>
        </div>
    );
}
