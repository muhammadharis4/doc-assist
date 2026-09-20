import { describe, expect, it } from "vitest";
import { splitCitations } from "./citations";

describe("splitCitations", () => {
    it("turns [n] markers into numbers between the text parts", () => {
        expect(splitCitations("Net is 526,19 [1] and tax 12 [2].")).toEqual([
            "Net is 526,19 ",
            1,
            " and tax 12 ",
            2,
            ".",
        ]);
    });

    it("leaves text without markers alone", () => {
        expect(splitCitations("Not found in the documents.")).toEqual(["Not found in the documents."]);
    });
});
