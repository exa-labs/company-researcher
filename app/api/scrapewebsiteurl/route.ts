// app/api/scrapewebsiteurl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const { websiteurl } = await req.json();
    if (!websiteurl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    const result = await exa.getContents(
        [websiteurl],
        {
          text: true,
          summary: {
            query: "Describe what the company does in few word. It should be very simple and explicity tell what does the company do/is. Do not include the name of the company at all. Make sure never to include the name of the company in the summary."
          }
        }
      );

    return NextResponse.json({ results: result.results });
  } catch (error) {
    return NextResponse.json({ error: `Failed to perform search | ${error}` }, { status: 500 });
  }
}