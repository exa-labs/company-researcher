// app/api/fetchfounders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

const FOUNDER_KEYWORDS = /\b(founder|co-founder|cofounder|founding|started|established)\b/i;

export async function POST(req: NextRequest) {
  try {
    const { websiteurl } = await req.json();

    if (!websiteurl) {
      return NextResponse.json({ error: 'websiteurl is required' }, { status: 400 });
    }

    const result = await exa.search(
        `founder of ${websiteurl}`,
        {
          type: "auto",
          numResults: 10,
          category: "people" as any,
          includeDomains: ["linkedin.com"]
        }
      )

    const founders = result.results.filter((r: any) =>
      r.url?.includes('/in/') &&
      !r.url?.includes('/company/') &&
      !r.url?.includes('/post/') &&
      r.title && FOUNDER_KEYWORDS.test(r.title)
    );

    return NextResponse.json({ results: founders.slice(0, 3) });
  } catch (error) {
    return NextResponse.json({ error: `Failed to perform search | ${error}` }, { status: 500 });
  }
}
