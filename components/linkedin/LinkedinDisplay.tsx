// LinkedInDisplay.tsx
import { Building2, Globe, MapPin, Users, Link as LinkIcon, UserCircle2, Users2 } from 'lucide-react';
import Image from 'next/image';

interface LinkedInData {
  text: string;
  url: string;
  image: string;
  title: string;
}

interface ProcessedData {
  name: string;
  description: string;
  industry: string;
  companySize: string;
  headquarters: string;
  type: string;
  website?: string | undefined;
  linkedinUrl: string;
  logo: string;
  specialties: string[];
  followers?: string;
}

function processLinkedInText(data: LinkedInData): ProcessedData {
  const extract = (marker: string): string => {
    const index = data.text.indexOf(marker);
    if (index === -1) return '';
    
    // Find the start of the actual content after the marker
    const start = index + marker.length;
    
    // Look for the next marker or section
    const possibleEndMarkers = ['Industry', 'Company size', 'Headquarters', 'Type', 'Locations', 'Employees at', 'Updates', '\n\n'];
    let end = data.text.length;
    
    for (const endMarker of possibleEndMarkers) {
      const nextIndex = data.text.indexOf(endMarker, start);
      if (nextIndex !== -1 && nextIndex < end && nextIndex > start) {
        end = nextIndex;
      }
    }
    
    return data.text.substring(start, end).trim();
  };

  // Extract followers using regex
  const followersMatch = data.text.match(/(\d+(?:,\d+)*)\s+followers/);
  const followers = followersMatch ? followersMatch[1] : undefined;

  // Extract description from "About us" section
  const aboutIndex = data.text.indexOf('About us');
  const description = aboutIndex !== -1
    ? extract('About us').split('\n')[0].trim()
    : '';

  // Extract other fields
  const industry = extract('Industry');
  const companySize = extract('Company size');
  const headquarters = extract('Headquarters');
  const type = extract('Type');
  
  // Get company name from title or the beginning of the text
  const name = data.title.replace(/\s*(-|\|)\s*LinkedIn\s*$/, '').trim();

  // For now, we'll skip specialties as they're not clearly marked in the new format
  const specialties: string[] = [];

  return {
    name,
    description,
    industry,
    companySize,
    headquarters,
    type,
    linkedinUrl: data.url,
    specialties,
    logo: data.image,
    website: undefined,
    followers
  };
}

export default function LinkedInDisplay({ data }: { data: LinkedInData }) {
  const processedData = processLinkedInText(data);

  return (
    <div className="bg-white p-6 md:p-8 w-full mx-auto border shadow-sm">
      <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
        {processedData.logo && (
          <div className="w-20 h-20 md:w-24 md:h-24 relative flex-shrink-0 mx-0">
            <Image
              src={processedData.logo}
              alt={`${processedData.name} logo`}
              fill
              className="object-contain"
            />
          </div>
        )}
        <div className="text-left">
          <h2 className="text-2xl font-bold mb-4">{processedData.name}</h2>
            <p className="text-lg text-gray-800 leading-relaxed line-clamp-6">
              {processedData.description}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {processedData.companySize && (
            <InfoItem
            icon={<Users2 className="w-5 h-5" />}
            label="Company Size"
            value={processedData.companySize}
            />
        )}
        {processedData.headquarters && (
            <InfoItem
            icon={<MapPin className="w-5 h-5" />}
            label="Headquarters"
            value={processedData.headquarters}
            />
        )}
        {processedData.followers && (
          <InfoItem
            icon={<UserCircle2 className="w-5 h-5" />}
            label="LinkedIn Followers"
            value={`${processedData.followers} followers`}
          />
        )}
        {processedData.industry && (
            <InfoItem
            icon={<Globe className="w-5 h-5" />}
            label="Industry"
            value={processedData.industry}
            maxLines={2}
            />
        )}
        {/* {processedData.type && (
            <InfoItem
            icon={<Building2 className="w-5 h-5" />}
            label="Company Type"
            value={processedData.type}
            maxLines={2}
            />
        )} */}
        {processedData.linkedinUrl && (
            <InfoItem
            icon={<LinkIcon className="w-5 h-5" />}
            label="Profile Link"
            value={processedData.linkedinUrl}
            isLink
            />
        )}
      </div>

      {processedData.specialties.length > 0 && (
        <div className="mt-8">

          <div className="flex flex-wrap gap-2">
            {processedData.specialties.map((specialty, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const InfoItem = ({
  icon,
  label,
  value,
  isLink = false,
  maxLines
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLink?: boolean;
  maxLines?: number;
}) => (
  <div className="flex items-start gap-3">
    <div className="text-blue-600 mt-1">{icon}</div>
    <div>
      <h3 className="font-medium text-gray-700">{label}</h3>

      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className={`text-gray-600 break-words ${maxLines ? 'line-clamp-' + maxLines : ''}`}>{value}</p>
      )}

    </div>
  </div>
);