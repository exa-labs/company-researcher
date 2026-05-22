// app/api/fetchfounders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const { websiteurl } = await req.json();

    if (!websiteurl) {
      return NextResponse.json({ error: 'websiteurl is required' }, { status: 400 });
    }

    // Extract the company name from the domain for content validation
    const companyName = websiteurl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('.')[0]
      .toLowerCase();

    // Fetch more candidates and include text content for validation
    const result = await exa.searchAndContents(
      `${websiteurl} founder LinkedIn profile`,
      {
        type: "keyword",
        numResults: 5,
        includeDomains: ["linkedin.com"],
        text: { maxCharacters: 1500 }
      }
    );

    // Keep only individual LinkedIn profiles (not company pages or posts)
    const individualProfiles = result.results.filter(r =>
      r.url.includes('/in/') &&
      !r.url.includes('/company/') &&
      !r.url.includes('/post/')
    );

    // Validate: profile content should mention "founder" and the company name
    const validated = individualProfiles.filter(r => {
      const text = (r.text || '').toLowerCase();
      return text.includes('founder') && text.includes(companyName);
    });

    // Fall back to URL-filtered results if validation produces nothing
    const founders = (validated.length > 0 ? validated : individualProfiles)
      .slice(0, 3)
      .map(r => ({ url: r.url, title: r.title }));

    return NextResponse.json({ results: founders });
  } catch (error) {
    return NextResponse.json({ error: `Failed to perform search | ${error}` }, { status: 500 });
  }
}
