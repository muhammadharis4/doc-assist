"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { DocumentList } from "@/components/documents/DocumentList";
import {
    createDocument,
    deleteDocument,
    listDocuments,
} from "@/lib/api/documents";
import { getErrorMessage } from "@/lib/types/api";
import type { CreateDocumentInput, DocumentItem } from "@/lib/types/documents";

/**
 * Hosts the document upload and list experience.
 */
export default function Home() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");

    const refreshDocuments = useCallback(async () => {
        setIsLoading(true);

        try {
            const nextDocuments = await listDocuments();
            setDocuments(nextDocuments);
            setErrorMessage("");
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshDocuments();
    }, [refreshDocuments]);

    const handleCreate = useCallback(
        async (payload: CreateDocumentInput) => {
            setIsSubmitting(true);
            setErrorMessage("");
            setSuccessMessage("");

            try {
                await createDocument(payload);
                setSuccessMessage("Document created successfully.");
                await refreshDocuments();
            } catch (error: unknown) {
                setErrorMessage(getUserFacingError(error));
            } finally {
                setIsSubmitting(false);
            }
        },
        [refreshDocuments],
    );

    const handleDelete = useCallback(
        async (id: string) => {
            setDeletingId(id);
            setErrorMessage("");
            setSuccessMessage("");

            try {
                await deleteDocument(id);
                setSuccessMessage("Document deleted successfully.");
                await refreshDocuments();
            } catch (error: unknown) {
                setErrorMessage(getUserFacingError(error));
            } finally {
                setDeletingId(null);
            }
        },
        [refreshDocuments],
    );

    return (
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:px-8">
            <section className="rounded-3xl bg-zinc-950 px-6 py-8 text-white shadow-lg shadow-zinc-200/60">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    DocAssist
                </span>
                <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
                    Documents
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 md:text-base">
                    Upload files, attach a category, and keep a simple list of
                    the documents stored for retrieval.
                </p>
            </section>

            {errorMessage ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </p>
            ) : null}

            {successMessage ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                </p>
            ) : null}

            <DocumentForm onSubmit={handleCreate} isSubmitting={isSubmitting} />

            <DocumentList
                documents={documents}
                isLoading={isLoading}
                onDelete={handleDelete}
                deletingId={deletingId}
            />
        </main>
    );
}

function getUserFacingError(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return "Something went wrong while handling the document.";
}
