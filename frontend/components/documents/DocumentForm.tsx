"use client";

import { useMemo, useState } from "react";
import type { CreateDocumentInput } from "@/lib/types/documents";

interface DocumentFormProps {
    onSubmit: (payload: CreateDocumentInput) => Promise<void>;
    isSubmitting: boolean;
}

/**
 * Collects a file and metadata before saving it as a document record.
 */
export function DocumentForm({ onSubmit, isSubmitting }: DocumentFormProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    const validationMessage = useMemo(() => {
        if (!selectedFile) {
            return "Choose a document file to upload.";
        }

        if (!extractedText.trim()) {
            return "The selected file could not be read as text.";
        }

        return "";
    }, [extractedText, selectedFile]);

    const isDisabled = isSubmitting || Boolean(validationMessage);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (validationMessage) {
            return;
        }

        const file = selectedFile;
        if (!file) {
            return;
        }

        await onSubmit(buildPayload(file, extractedText));
        setStatusMessage(`Uploaded ${file.name}.`);
        setSelectedFile(null);
        setExtractedText("");
    }

    return (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-zinc-900">
                        Upload document
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                        Choose a file and save the text you want searchable.
                    </p>
                </div>
                {statusMessage ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        {statusMessage}
                    </span>
                ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
                <label className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-700">
                        File
                    </span>
                    <input
                        type="file"
                        className="w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:border-zinc-400"
                        onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            setSelectedFile(file);

                            if (file) {
                                void loadFileText(file, setExtractedText);
                            }
                        }}
                    />
                </label>

                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-600">{validationMessage}</p>
                    <button
                        type="submit"
                        disabled={isDisabled}
                        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    >
                        {isSubmitting ? "Uploading..." : "Upload document"}
                    </button>
                </div>
            </form>
        </section>
    );
}

interface TextInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    required?: boolean;
}

/**
 * Keeps text input rendering consistent across document form fields.
 */
function buildPayload(file: File, extractedText: string): CreateDocumentInput {
    return {
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        storagePath: `uploads/${file.name}`,
        extractedText: extractedText.trim(),
        version: 1,
        size: file.size,
    };
}

async function loadFileText(file: File, onLoaded: (content: string) => void) {
    const content = await file.text();
    onLoaded(content.slice(0, 20000));
}
