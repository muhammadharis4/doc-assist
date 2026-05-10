/**
 * Static marketing copy and structured data for the home page.
 * (No React — safe to import from both server and client components.)
 */

/** Example document types shown in the “problem” card (emoji + line). */
export const exampleDocuments = [
    { emoji: "📋", text: "Tax documents (Steuererklärung)" },
    { emoji: "🏠", text: "Rental agreements (Mietvertrag)" },
    { emoji: "🛂", text: "Visa and residence permits" },
    { emoji: "🏥", text: "Health insurance documents" },
    { emoji: "💼", text: "Employment contracts" },
    { emoji: "📝", text: "Government forms and letters" },
] as const;

/** Body copy under the example list in the problem card. */
export const problemBlurb =
    "All of that is easy to misread in a rush—or when German is not your first language.";

/** Legibility-only disclaimer; not a substitute for professional advice. */
export const legalDisclaimer =
    "Not legal, tax, or immigration advice—confirm important decisions with a professional.";

/** Numbered steps for the “flow” card. */
export const flowSteps = [
    {
        n: 1,
        title: "Upload",
        body: "Add files; they are indexed for semantic search.",
    },
    {
        n: 2,
        title: "Ask",
        body: "Chat in German or English about your docs.",
    },
    {
        n: 3,
        title: "Verify",
        body: "Answers can include source excerpts.",
    },
] as const;
