// app/api/findcompetitors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

interface FindCompetitorsRequest {
  websiteurl: string;
  summaryText?: string;
}

interface ProcessedResult {
  title: string;
  url: string;
  summary: string;
}

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const body: FindCompetitorsRequest = await req.json();
    const { websiteurl, summaryText } = body;
    if (!websiteurl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    let apiResults = await exa.findSimilarAndContents(websiteurl, {
      text: true,
      highlights: true,
      numResults: 5,
      excludeSourceDomain: true
    });

    if (apiResults.results.length < 3 && summaryText) {
      const fallbackResults = await exa.searchAndContents(
        `${summaryText}`,
        {
          type: "auto",
          highlights: true,
          livecrawl: "fallback",
          excludeDomains: [new URL(websiteurl).hostname]
        }
      );
      apiResults.results = [...apiResults.results, ...fallbackResults.results];
    }

    const processedResults: ProcessedResult[] = apiResults.results
      .slice(0, 10)
      .map((r: { title: string; url: string; highlights?: string[]; text?: string }) => ({
        title: r.title,
        url: r.url,
        summary: r.highlights?.[0] || (r.text ? `${r.text.slice(0, 150)}...` : '')
      }))
      .filter((r: ProcessedResult) => r.summary); // Remove empty summaries

    // Deduplicate by hostname
    const uniqueResults = processedResults.filter((result, index, self) =>
      index === self.findIndex(r => new URL(r.url).hostname === new URL(result.url).hostname)
    );

    return NextResponse.json({ results: uniqueResults });
  } catch (error) {
    return NextResponse.json({ error: `Failed to perform search | ${error}` }, { status: 500 });
  }
}