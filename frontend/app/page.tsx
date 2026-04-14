"use client";

import { useCallback, useEffect, useState } from "react";
import { InlineAlert } from "@/components/common/InlineAlert";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentsToolbar } from "@/components/documents/DocumentsToolbar";
import {
    createDocument,
    deleteDocument,
    listDocuments,
} from "@/lib/api/documents";
import { getErrorMessage } from "@/lib/types/api";
import type {
    CreateDocumentInput,
    DocumentFilters,
    DocumentFormValues,
    DocumentItem,
} from "@/lib/types/documents";
import { DEFAULT_DOCUMENT_TAKE } from "@/lib/types/documents";

const INITIAL_FORM_VALUES: DocumentFormValues = {
    filename: "",
    mimeType: "",
    storagePath: "",
    extractedText: "",
    size: "",
    project: "",
    category: "",
    version: "1",
};

const INITIAL_FILTERS: DocumentFilters = {
    skip: 0,
    take: DEFAULT_DOCUMENT_TAKE,
    project: "",
    category: "",
    keyword: "",
};

/**
 * Hosts the first DocAssist frontend slice: document create/list/delete.
 */
export default function Home() {
    const [formValues, setFormValues] =
        useState<DocumentFormValues>(INITIAL_FORM_VALUES);
    const [filters, setFilters] = useState<DocumentFilters>(INITIAL_FILTERS);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");

    const refreshDocuments = useCallback(
        async (nextFilters?: DocumentFilters) => {
            setIsLoading(true);
            setErrorMessage("");
            const activeFilters = nextFilters ?? filters;

            try {
                const nextDocuments = await listDocuments(activeFilters);
                setDocuments(nextDocuments);
            } catch (error: unknown) {
                setErrorMessage(getErrorMessage(error));
            } finally {
                setIsLoading(false);
            }
        },
        [filters],
    );

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
                setFormValues(INITIAL_FORM_VALUES);
                setSuccessMessage("Document created successfully.");
                await refreshDocuments();
            } catch (error: unknown) {
                setErrorMessage(getErrorMessage(error));
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
                setErrorMessage(getErrorMessage(error));
            } finally {
                setDeletingId(null);
            }
        },
        [refreshDocuments],
    );

    const handleResetFilters = useCallback(async () => {
        const resetFilters: DocumentFilters = { ...INITIAL_FILTERS };
        setFilters(resetFilters);
        setErrorMessage("");
        setSuccessMessage("Filters reset.");
        await refreshDocuments(resetFilters);
    }, [refreshDocuments]);

    return (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
            <section className="mb-6 rounded-3xl bg-zinc-900 p-6 text-white">
                <h1 className="text-2xl font-semibold md:text-3xl">
                    DocAssist Workspace
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-zinc-200 md:text-base">
                    Manage source documents for retrieval. This first slice
                    includes create, filter, list, and delete flows with strict
                    typing and shared API logic.
                </p>
            </section>

            <div className="grid gap-4">
                {errorMessage ? (
                    <InlineAlert message={errorMessage} tone="error" />
                ) : null}
                {successMessage ? (
                    <InlineAlert message={successMessage} tone="success" />
                ) : null}

                <DocumentForm
                    values={formValues}
                    onChange={setFormValues}
                    onSubmit={handleCreate}
                    isSubmitting={isSubmitting}
                />

                <DocumentsToolbar
                    filters={filters}
                    onChange={setFilters}
                    onApply={refreshDocuments}
                    onReset={handleResetFilters}
                    isBusy={isLoading || isSubmitting || Boolean(deletingId)}
                />

                <DocumentList
                    documents={documents}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                />
            </div>
        </main>
    );
}
