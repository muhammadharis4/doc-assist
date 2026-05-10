import { describe, expect, it } from "vitest";
import { ApiError, getErrorMessage } from "@/types/api";

describe("getErrorMessage", () => {
    it("returns ApiError message", () => {
        expect(getErrorMessage(new ApiError(404, "not found"))).toBe("not found");
    });

    it("returns generic Error message", () => {
        expect(getErrorMessage(new Error("boom"))).toBe("boom");
    });

    it("returns fallback for non-Error values", () => {
        expect(getErrorMessage(null)).toBe("An unexpected error occurred.");
        expect(getErrorMessage(42)).toBe("An unexpected error occurred.");
    });
});
