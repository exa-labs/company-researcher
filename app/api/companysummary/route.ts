// /app/api/companysummary/route.ts 
import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 100;

export async function POST(req: NextRequest) {
  try {
    const { subpages, mainpage, websiteurl } = await req.json();
    
    if (!subpages || !mainpage) {
      return NextResponse.json({ error: 'Mainpage or subpage content is required' }, { status: 400 });
    }

    const subpagesText = JSON.stringify(subpages, null, 2);
    const mainpageText = JSON.stringify(mainpage, null, 2);

    // Define the schema as an object with a 'sections' array
    const summarySchema = z.object({
      sections: z.array(z.object({
        heading: z.string(),
        text: z.string()
      }))
    });

    const { object } = await generateObject({
      model: anthropic('claude-3-7-sonnet-latest'),
      schema: summarySchema,
      output: 'object',
      system: "All the output content should be in simple english. Don't use any difficult words. Keep sentences short and simple.  Use unique emojis for each heading.",
      prompt: `You are an expert at writing important points about a company.
      Here are the content from a company's website so you can understand about the company in detail.
      
      SUBPAGES CONTENT (includes about, pricing, faq, blog, etc):
      ${subpagesText}
      
      MAIN WEBSITE CONTENT:
      ${mainpageText}
      
      Now, after understanding about this company whose url is ${websiteurl}, give me headings and the relevant content about it.

      Headings could be the companys's: Main Product, Target Users, Pricing, Goal, Strengths, and more key points, whichever are relevant. Don't have to include a specific heading if it doesn't have enough source about it, and you can also make up your own headings whichever seems apt.
      
      Don't make up any information yourself, only use the information which is given in the above content.

      It should be (an emoji with heading) and then text with it. Give maximum 6 headings (the most important ones).

      The text/description should be short, simple and easy to understand.

      All the output content should be in simple english.

      Use unique emojis for each heading.
      
      Output the result as JSON.`
    });
    
    // Return the sections array from the response
    return NextResponse.json({ result: object.sections });

  } catch (error) {
    console.error('Company summary API error:', error);
    return NextResponse.json({ error: `Company summary API Failed | ${error}` }, { status: 500 });
  }
}