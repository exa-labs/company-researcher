// app/api/fetchfounders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') ?? req.headers.get('referer');
    const host = req.headers.get('host');
    if (!host || !origin || !origin.includes(host)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { websiteurl } = await req.json();

    if (!websiteurl) {
      return NextResponse.json({ error: 'websiteurl is required' }, { status: 400 });
    }

    const result = await exa.search(
        `${websiteurl} founder's Linkedin page:`,
        {
          type: "keyword",
          numResults: 2,
          includeDomains: ["linkedin.com"]
        }
      )

    return NextResponse.json({ results: result.results });
  } catch (error) {
    return NextResponse.json({ error: `Failed to perform search | ${error}` }, { status: 500 });
  }
}