// app/api/fetchfounders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

const FOUNDER_TITLE_RE = /\b(founder|co-founder|cofounder)\b/i;

function isFounderAtCompany(result: any, domain: string): boolean {
  const domainRoot = domain.replace(/\.(com|org|net|io|ai|co)$/i, '').toLowerCase();

  const entities = result.entities ?? [];
  for (const entity of entities) {
    const workHistory = entity?.properties?.workHistory ?? [];
    for (const job of workHistory) {
      const companyName = (job?.company?.name ?? '').toLowerCase();
      const jobTitle = (job?.title ?? '').toLowerCase();
      if (companyName.includes(domainRoot) && FOUNDER_TITLE_RE.test(jobTitle)) {
        return true;
      }
    }
  }

  const title = (result.title ?? '').toLowerCase();
  if (title.includes(domainRoot) && FOUNDER_TITLE_RE.test(title)) {
    return true;
  }

  return false;
}

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
      r.url?.includes('/in/') && isFounderAtCompany(r, websiteurl)
    );

    return NextResponse.json({ results: founders.slice(0, 3) });
  } catch (error) {
    return NextResponse.json({ error: `Failed to perform search | ${error}` }, { status: 500 });
  }
}
