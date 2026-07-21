import type { Principle } from "@/generated/prisma/client";
import type { SearchDocument } from "@/features/search-index/types";

function getPrincipleUrl(section: string): string | null {
    if (section === "home") {
        return "/";
    }

    if (section === "about") {
        return "/about";
    }

    return null;
}

export function buildPrincipleDocuments(
    principle: Principle,
): SearchDocument[] {
    const url = getPrincipleUrl(principle.section);

    if (!url) {
        return [];
    }

    return [
        {
            sourceType: "principles",
            sourceId: principle.id,
            documentIndex: 0,
            title: principle.title,
            category: "Principle",
            url,
            content: principle.body,
            keywords: [principle.title, "Principle", principle.section].sort(),
        },
    ];
}