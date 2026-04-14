"use client";

import type { DocumentFilters } from "@/lib/types/documents";

interface DocumentsToolbarProps {
    filters: DocumentFilters;
    onChange: (next: DocumentFilters) => void;
    onApply: () => Promise<void>;
    onReset: () => Promise<void>;
    isBusy: boolean;
}

/**
 * Controls list filters and pagination without coupling to page state internals.
 */
export function DocumentsToolbar({
    filters,
    onChange,
    onApply,
    onReset,
    isBusy,
}: DocumentsToolbarProps) {
    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
                <FilterInput
                    label="Keyword"
                    value={filters.keyword ?? ""}
                    placeholder="filename or text"
                    onChange={(value) =>
                        patchFilter(filters, onChange, "keyword", value)
                    }
                />
                <FilterInput
                    label="Project"
                    value={filters.project ?? ""}
                    placeholder="Core Docs"
                    onChange={(value) =>
                        patchFilter(filters, onChange, "project", value)
                    }
                />
                <FilterInput
                    label="Category"
                    value={filters.category ?? ""}
                    placeholder="Onboarding"
                    onChange={(value) =>
                        patchFilter(filters, onChange, "category", value)
                    }
                />
                <FilterInput
                    label="Skip"
                    value={String(filters.skip ?? 0)}
                    placeholder="0"
                    onChange={(value) =>
                        patchFilter(
                            filters,
                            onChange,
                            "skip",
                            parseNonNegativeInt(value, 0),
                        )
                    }
                />
                <FilterInput
                    label="Take"
                    value={String(filters.take ?? 20)}
                    placeholder="20"
                    onChange={(value) =>
                        patchFilter(
                            filters,
                            onChange,
                            "take",
                            parseNonNegativeInt(value, 20),
                        )
                    }
                />
            </div>

            <div className="mt-4 flex gap-2">
                <button
                    type="button"
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    onClick={() => {
                        void onApply();
                    }}
                    disabled={isBusy}
                >
                    Apply filters
                </button>
                <button
                    type="button"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
                    onClick={() => {
                        void onReset();
                    }}
                    disabled={isBusy}
                >
                    Reset
                </button>
            </div>
        </section>
    );
}

interface FilterInputProps {
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
}

function FilterInput({
    label,
    value,
    placeholder,
    onChange,
}: FilterInputProps) {
    return (
        <label className="min-w-[10rem]">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                {label}
            </span>
            <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-sky-300 transition focus:border-sky-500 focus:ring"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
            />
        </label>
    );
}

function patchFilter<K extends keyof DocumentFilters>(
    filters: DocumentFilters,
    onChange: (next: DocumentFilters) => void,
    key: K,
    value: DocumentFilters[K],
) {
    onChange({
        ...filters,
        [key]: value,
    });
}

function parseNonNegativeInt(value: string, fallback: number): number {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isNaN(parsed) || parsed < 0) {
        return fallback;
    }

    return parsed;
}
