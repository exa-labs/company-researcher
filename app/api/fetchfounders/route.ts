// app/api/fetchfounders/route.ts
//
// Uses Exa people category search to find company founders on LinkedIn.
// Verifies each result against entity workHistory to ensure the person
// actually holds a founder or exec role at the target company.
// Written by devin-ai-integration.
import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

const FOUNDER_RE = /\b(founder|co-founder|cofounder)\b/i;
const EXEC_RE = /\b(ceo|chairman|president)\b/i;
const NON_FOUNDER_PREFIX_RE = /\b(director|executive|head|manager|lead|vp|vice)\b/i;

function isLeadershipFounder(jobTitle: string): boolean {
  if (!FOUNDER_RE.test(jobTitle)) return false;
  const founderIdx = jobTitle.search(FOUNDER_RE);
  const prefix = jobTitle.slice(0, founderIdx).trim();
  if (prefix && NON_FOUNDER_PREFIX_RE.test(prefix)) return false;
  return true;
}

function companyMatchesDomain(companyName: string, domainRoot: string): boolean {
  if (!companyName) return false;
  const cleaned = companyName.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
  if (!cleaned) return false;
  const domainRe = new RegExp(`\\b${domainRoot}\\b`, 'i');
  return domainRe.test(cleaned);
}

interface ScoredResult {
  result: any;
  isFounder: boolean;
}

function scoreResult(result: any, domainRoot: string): ScoredResult | null {
  let isFounder = false;
  let isExec = false;

  const entities = result.entities ?? [];
  for (const entity of entities) {
    const workHistory = entity?.properties?.workHistory ?? [];
    for (const job of workHistory) {
      const companyName = job?.company?.name ?? '';
      const jobTitle = job?.title ?? '';
      if (!companyMatchesDomain(companyName, domainRoot)) continue;
      if (isLeadershipFounder(jobTitle)) isFounder = true;
      if (EXEC_RE.test(jobTitle)) isExec = true;
    }
  }

  if (isFounder) return { result, isFounder: true };
  if (isExec) return { result, isFounder: false };
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { websiteurl } = await req.json();

    if (!websiteurl) {
      return NextResponse.json({ error: 'websiteurl is required' }, { status: 400 });
    }

    const domainRoot = websiteurl.replace(/\.[^.]+$/, '').toLowerCase();

    const result = await exa.search(
        `${websiteurl} founder's Linkedin page`,
        {
          type: "auto",
          numResults: 10,
          category: "people" as any,
          includeDomains: ["linkedin.com"]
        }
      )

    const profiles = result.results.filter((r: any) =>
      r.url?.includes('/in/') && !r.url?.includes('/company/')
    );

    const scored: ScoredResult[] = [];
    const seenUrls = new Set<string>();
    for (const r of profiles) {
      const s = scoreResult(r, domainRoot);
      if (s && !seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        scored.push(s);
      }
    }

    const founders = scored.filter(s => s.isFounder).map(s => s.result);
    const execs = scored.filter(s => !s.isFounder).map(s => s.result);
    const final = founders.length > 0 ? founders : execs;

    return NextResponse.json({ results: final.slice(0, 3) });
  } catch (error) {
    return NextResponse.json({ error: `Failed to perform search | ${error}` }, { status: 500 });
  }
}
