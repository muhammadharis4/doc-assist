"use client";

import { useMemo } from "react";
import type {
    CreateDocumentInput,
    DocumentFormValues,
} from "@/lib/types/documents";

interface DocumentFormProps {
    values: DocumentFormValues;
    onChange: (next: DocumentFormValues) => void;
    onSubmit: (payload: CreateDocumentInput) => Promise<void>;
    isSubmitting: boolean;
}

/**
 * Collects document metadata and extracted content before ingestion.
 */
export function DocumentForm({
    values,
    onChange,
    onSubmit,
    isSubmitting,
}: DocumentFormProps) {
    const validationMessage = useMemo(() => {
        if (!values.filename.trim()) {
            return "Filename is required.";
        }

        if (!values.mimeType.trim()) {
            return "MIME type is required.";
        }

        if (!values.storagePath.trim()) {
            return "Storage path is required.";
        }

        if (!values.extractedText.trim()) {
            return "Extracted text is required.";
        }

        const parsedTake = parseOptionalPositiveInt(values.version);
        if (values.version.trim() && parsedTake === null) {
            return "Version must be a positive number.";
        }

        const parsedSize = parseOptionalPositiveInt(values.size);
        if (values.size.trim() && parsedSize === null) {
            return "Size must be a positive number.";
        }

        return "";
    }, [values]);

    const isDisabled = isSubmitting || Boolean(validationMessage);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (validationMessage) {
            return;
        }

        await onSubmit({
            filename: values.filename.trim(),
            mimeType: values.mimeType.trim(),
            storagePath: values.storagePath.trim(),
            extractedText: values.extractedText.trim(),
            project: normalizeOptionalText(values.project),
            category: normalizeOptionalText(values.category),
            version: parseOptionalPositiveInt(values.version) ?? undefined,
            size: parseOptionalPositiveInt(values.size) ?? undefined,
        });
    }

    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">
                Ingest document
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
                Add metadata and extracted text for retrieval.
            </p>

            <form
                onSubmit={handleSubmit}
                className="mt-4 grid gap-3 md:grid-cols-2"
            >
                <TextInput
                    label="Filename"
                    value={values.filename}
                    onChange={(value) =>
                        updateField(values, onChange, "filename", value)
                    }
                    placeholder="handbook.md"
                    required
                />
                <TextInput
                    label="MIME type"
                    value={values.mimeType}
                    onChange={(value) =>
                        updateField(values, onChange, "mimeType", value)
                    }
                    placeholder="text/markdown"
                    required
                />
                <TextInput
                    label="Storage path"
                    value={values.storagePath}
                    onChange={(value) =>
                        updateField(values, onChange, "storagePath", value)
                    }
                    placeholder="docs/handbook.md"
                    required
                />
                <TextInput
                    label="Size (bytes)"
                    value={values.size}
                    onChange={(value) =>
                        updateField(values, onChange, "size", value)
                    }
                    placeholder="4200"
                />
                <TextInput
                    label="Project"
                    value={values.project}
                    onChange={(value) =>
                        updateField(values, onChange, "project", value)
                    }
                    placeholder="Core Docs"
                />
                <TextInput
                    label="Category"
                    value={values.category}
                    onChange={(value) =>
                        updateField(values, onChange, "category", value)
                    }
                    placeholder="Onboarding"
                />
                <TextInput
                    label="Version"
                    value={values.version}
                    onChange={(value) =>
                        updateField(values, onChange, "version", value)
                    }
                    placeholder="1"
                />
                <label className="md:col-span-2">
                    <span className="mb-1 block text-sm font-medium text-zinc-700">
                        Extracted text
                    </span>
                    <textarea
                        className="h-32 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-sky-300 transition focus:border-sky-500 focus:ring"
                        value={values.extractedText}
                        onChange={(event) =>
                            updateField(
                                values,
                                onChange,
                                "extractedText",
                                event.target.value,
                            )
                        }
                        placeholder="Paste extracted content here"
                        required
                    />
                </label>

                <div className="md:col-span-2 flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-600">{validationMessage}</p>
                    <button
                        type="submit"
                        disabled={isDisabled}
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    >
                        {isSubmitting ? "Saving..." : "Create document"}
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
function TextInput({
    label,
    value,
    onChange,
    placeholder,
    required = false,
}: TextInputProps) {
    return (
        <label>
            <span className="mb-1 block text-sm font-medium text-zinc-700">
                {label}
            </span>
            <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-sky-300 transition focus:border-sky-500 focus:ring"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                required={required}
            />
        </label>
    );
}

function updateField(
    values: DocumentFormValues,
    onChange: (next: DocumentFormValues) => void,
    key: keyof DocumentFormValues,
    value: string,
) {
    onChange({
        ...values,
        [key]: value,
    });
}

function parseOptionalPositiveInt(value: string): number | null {
    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return null;
    }

    return parsed;
}

function normalizeOptionalText(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed || undefined;
}
