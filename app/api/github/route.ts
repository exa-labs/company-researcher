import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }

  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'company-researcher',
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const [profileResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(
        `https://api.github.com/users/${username}/repos?sort=stars&direction=desc&per_page=6`,
        { headers }
      ),
    ]);

    if (!profileResponse.ok) {
      const details = await profileResponse.text();
      return NextResponse.json(
        { error: 'Failed to fetch GitHub profile', details },
        { status: profileResponse.status }
      );
    }

    if (!reposResponse.ok) {
      const details = await reposResponse.text();
      return NextResponse.json(
        { error: 'Failed to fetch GitHub repositories', details },
        { status: reposResponse.status }
      );
    }

    const profile = await profileResponse.json();
    const repositories = await reposResponse.json();

    return NextResponse.json({ ...profile, repositories });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to fetch GitHub data: ${message}` },
      { status: 500 }
    );
  }
}
