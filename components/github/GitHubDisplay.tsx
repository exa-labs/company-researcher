"use client";
import { useEffect, useState } from 'react';
import { FaGithub, FaUsers, FaBook, FaStar, FaMapMarkerAlt, FaLink } from 'react-icons/fa';

// Language colors matching GitHub's colors
const LANGUAGE_COLORS: { [key: string]: string } = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#F18E33',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  default: '#808080'
};

interface GitHubProfile {
  name: string;
  login: string;
  description: string;
  bio: string;
  followers: number;
  following: number;
  public_repos: number;
  avatar_url: string;
  html_url: string;
  location?: string;
  blog?: string;
  stargazers_count?: number;
  repositories?: any[];
}

interface GitHubDisplayProps {
  githubUrl: string;
}

export default function GitHubDisplay({ githubUrl }: GitHubDisplayProps) {
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        // Extract username from GitHub URL
        const username = githubUrl.split('/').pop();
        if (!username) throw new Error('Invalid GitHub URL');

        // Fetch through the server-side API route so the token stays on the server
        const response = await fetch(`/api/github?username=${username}`);
        if (!response.ok) throw new Error('Failed to fetch GitHub data');
        const data = await response.json();

        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch GitHub data');
      } finally {
        setLoading(false);
      }
    };

    if (githubUrl) {
      fetchGitHubData();
    }
  }, [githubUrl]);

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="rounded-full bg-gray-200 h-16 w-16"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 rounded-lg p-6 mb-6">
        <h3 className="text-red-800 font-semibold flex items-center gap-2">
          <FaGithub className="text-xl" />
          Error Loading GitHub Data
        </h3>
        <p className="text-red-600 mt-2">{error || 'Failed to load GitHub profile'}</p>
      </div>
    );
  }

  return (
    <div>
    <div className="bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl">
      <div className="flex items-center gap-2 text-gray-800 mb-6">
        <FaGithub className="text-2xl" />
        <h3 className="text-xl font-semibold">GitHub</h3>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-shrink-0">
          <img
            src={profile.avatar_url}
            alt={`${profile.login}'s avatar`}
            className="w-24 h-24 rounded-full border-2 border-gray-100"
          />
        </div>
        <div className="flex-grow">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <p className="text-xl">{profile.name}</p>
            <span className="text-gray-600">@{profile.login}</span>
          </div>
          <p className="text-gray-700 mb-4">{profile.bio}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            {profile.location && (
              <span className="flex items-center gap-1">
                <FaMapMarkerAlt />
                {profile.location}
              </span>
            )}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <FaUsers/>
                <strong>{profile.followers}</strong> followers
              </span>
            </div>
          </div>
          <a
            href={profile.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            View Full Github Profile
          </a>
        </div>
      </div>

      {/* Repositories Section */}
      <div>
        <p className="text-md font-semibold mb-4 flex items-center gap-2">
          Popular Repositories
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.repositories?.map((repo: any) => (
            <a 
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg p-4 hover:border-gray-400 transition-colors bg-gray-50 block"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-blue-600 hover:text-blue-800 font-semibold">
                  {repo.name}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                  {repo.visibility}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {repo.description || 'No description provided'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ 
                        backgroundColor: LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.default 
                      }}
                    />
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && (
                  <span className="flex items-center gap-1">
                    <FaStar className="text-yellow-400" />
                    {repo.stargazers_count}
                  </span>
                )}
                {repo.forks_count > 0 && (
                  <span className="flex items-center gap-1">
                    <FaUsers className="text-gray-400" />
                    {repo.forks_count}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
} 