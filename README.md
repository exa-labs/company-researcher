# 🔎 Company Researcher
### Powered by [Exa.ai](https://exa.ai) - The fastest and most accurate web search API for AI

![Screenshot](https://companyresearcher.exa.ai/opengraph-image.jpg)

<br>

## 🎯 What is Company Researcher?

Company Researcher is a free and open-source tool that helps you instantly understand any company inside out. Simply input a company's URL, and the tool gathers comprehensive information from across the web, presenting you with detailed insights about the organization, its products, funding, social presence, and more.

<br>

## 📊 Data Sources & API Endpoints
> All data is fetched using Exa's powerful search API. Each section below includes a direct link to try the API call in Exa's playground.

1. **Website Information**
   - Company Website Content ([Try API](https://dashboard.exa.ai/playground/get-contents?filters=%7B%22ids%22%3A%5B%22https%3A%2F%2Fexa.ai%22%5D%2C%22text%22%3A%22true%22%2C%22summary%22%3Atrue%7D))
   - Subpages (About, FAQs, Pricing, Blog) ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai&c=company&filters=%7B%22type%22%3A%22neural%22%2C%22text%22%3A%22true%22%2C%22numResults%22%3A1%2C%22livecrawl%22%3A%22always%22%2C%22subpages%22%3A10%2C%22subpageTarget%22%3A%5B%22about%22%2C%22pricing%22%2C%22faq%22%2C%22blog%22%5D%2C%22includeDomains%22%3A%5B%22exa.ai%22%5D%7D))

2. **LinkedIn Data**
   - Company Profile ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20company%20linkedin%20profile%3A&filters=%7B%22text%22%3A%22true%22%2C%22includeDomains%22%3A%5B%22linkedin.com%22%5D%2C%22numResults%22%3A1%7D))
   - Founders' Profiles ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20founder%27s%20Linkedin%20page%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22numResults%22%3A5%2C%22includeDomains%22%3A%5B%22linkedin.com%22%5D%7D))

3. **Financial Information**
   - Funding Details ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20Funding%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22text%22%3A%22true%22%2C%22numResults%22%3A1%2C%22livecrawl%22%3A%22always%22%2C%22summary%22%3A%7B%22query%22%3A%22Tell%20me%20all%20about%20the%20funding%20(and%20if%20available%2C%20the%20valuation)%20of%20this%20company%20in%20detail.%20Do%20not%20tell%20me%20about%20the%20company%2C%20just%20give%20all%20the%20funding%20information%20in%20detail.%20If%20funding%20or%20valuation%20info%20is%20not%20preset%2C%20just%20reply%20with%20one%20word%20%5C%22NO%5C%22.%22%7D%2C%22includeText%22%3A%5B%22exa.ai%22%5D%7D))
   - Crunchbase Profile ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20crunchbase%20profile%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22numResults%22%3A1%2C%22includeText%22%3A%5B%22exa.ai%22%5D%2C%22includeDomains%22%3A%5B%22crunchbase.com%22%5D%7D))
   - PitchBook Profile ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20pitchbook%20profile%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22numResults%22%3A1%2C%22includeText%22%3A%5B%22exa.ai%22%5D%2C%22includeDomains%22%3A%5B%22pitchbook.com%22%5D%7D))
   - Tracxn Profile ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20tracxn%20profile%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22numResults%22%3A1%2C%22includeDomains%22%3A%5B%22tracxn.com%22%5D%2C%22includeText%22%3A%5B%22exa.ai%22%5D%7D))
   - 10K Financial Reports ([Try API](https://dashboard.exa.ai/playground/search?q=airbnb.com%2010k%20financial%20report%3A&c=financial%20report&filters=%7B%22type%22%3A%22keyword%22%2C%22livecrawl%22%3A%22always%22%2C%22text%22%3A%22true%22%2C%22includeText%22%3A%5B%22airbnb.com%22%5D%7D))

4. **Market Intelligence**
   - News Coverage ([Try API](https://dashboard.exa.ai/playground/search?q=https%3A%2F%2Fexa.ai%20News%3A&c=news&filters=%7B%22type%22%3A%22keyword%22%2C%22text%22%3A%22true%22%2C%22livecrawl%22%3A%22always%22%2C%22includeText%22%3A%5B%22exa.ai%22%5D%7D))
   - Competitor Analysis ([Try API](https://dashboard.exa.ai/playground/search?q=web%20search%20API&filters=%7B%22type%22%3A%22neural%22%2C%22useAutoprompt%22%3Atrue%2C%22text%22%3A%22true%22%2C%22summary%22%3A%7B%22query%22%3A%22Explain%20in%20one%2Ftwo%20lines%20what%20does%20this%20company%20do%20in%20simple%20english.%20Don%27t%20use%20any%20diffcult%20words.%22%7D%2C%22livecrawl%22%3A%22always%22%2C%22excludeDomains%22%3A%5B%22exa.ai%22%5D%7D))
   - Wikipedia Information ([Try API](https://dashboard.exa.ai/playground/search?q=openai.com%20company%20wikipedia%20page%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22numResults%22%3A1%2C%22includeDomains%22%3A%5B%22wikipedia.org%22%5D%2C%22includeText%22%3A%5B%22openai.com%22%5D%2C%22text%22%3A%22true%22%7D))

5. **Social Media Presence**
   - Twitter/X Profile ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20Twitter%20(X)%20profile%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22numResults%22%3A1%2C%22text%22%3A%22true%22%2C%22livecrawl%22%3A%22always%22%2C%22includeDomains%22%3A%5B%22x.com%22%2C%22twitter.com%22%5D%2C%22includeText%22%3A%5B%22exa.ai%22%5D%7D))
   - Recent Tweets ([Try API](https://dashboard.exa.ai/playground/search?q=from%3Aexaailabs&c=tweet&filters=%7B%22type%22%3A%22keyword%22%2C%22text%22%3A%22true%22%2C%22livecrawl%22%3A%22always%22%2C%22numResults%22%3A100%2C%22includeDomains%22%3A%5B%22twitter.com%22%2C%22x.com%22%5D%2C%22includeText%22%3A%5B%22exaailabs%22%5D%7D))
   - YouTube Videos ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai&filters=%7B%22type%22%3A%22keyword%22%2C%22includeDomains%22%3A%5B%22youtube.com%22%5D%2C%22numResults%22%3A10%2C%22includeText%22%3A%5B%22exa.ai%22%5D%7D))
   - TikTok Presence ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20Tiktok%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22numResults%22%3A1%2C%22includeDomains%22%3A%5B%22tiktok.com%22%5D%2C%22includeText%22%3A%5B%22exa.ai%22%5D%7D))
   - Reddit Discussions ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai&filters=%7B%22type%22%3A%22keyword%22%2C%22includeDomains%22%3A%5B%22reddit.com%22%5D%2C%22includeText%22%3A%5B%22exa.ai%22%5D%7D))
   - GitHub Profile ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20Github%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22numResults%22%3A1%2C%22includeDomains%22%3A%5B%22github.com%22%5D%7D))

<br>

## 💻 Tech Stack
- **Search Engine**: [Exa.ai](https://exa.ai) - Web search API optimized for AI applications
- **Frontend**: [Next.js](https://nextjs.org/docs) with App Router, [TailwindCSS](https://tailwindcss.com), TypeScript
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs/ai-sdk-core)
- **Hosting**: [Vercel](https://vercel.com/)

<br>

## 🚀 Getting Started

### Prerequisites
- Node.js
- Exa.ai API key
- Anthropic API key
- (Optional) YouTube API key
- (Optional) GitHub token

### Installation

1. Clone the repository
```bash
git clone https://github.com/exa-labs/company-researcher.git
cd company-researcher
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables as described in the section below

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open http://localhost:3000 in your browser

<br>

## 🔑 API Keys & Environment Setup

### Required API Keys
* **Exa API Key**: Get from [Exa Dashboard](https://dashboard.exa.ai/api-keys)
* **Anthropic API Key**: Get from [Anthropic Console](https://console.anthropic.com/)

### Optional API Keys (for additional features)
* **YouTube API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (for YouTube video fetching)
* **GitHub Token**: Get from [GitHub Settings](https://github.com/settings/tokens) (for GitHub repository data)

> Note: The application can run without the optional API keys. YouTube and GitHub features can be disabled by commenting out their respective code sections.

### Environment Setup

Create a `.env.local` file in the root directory with the following structure:

```env
# Required
EXA_API_KEY=your_exa_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional - for additional features
YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_GITHUB_TOKEN=your_github_token
```

> For deployment on platforms like Vercel, add these environment variables in your platform's settings.

Alternatively, you can create a copy of our example environment file:
```bash
cp .env.example .env.local
```
Then fill in your API keys in the newly created `.env.local` file.

<br>

## ⭐ About [Exa.ai](https://exa.ai)

This project is powered by [Exa.ai](https://exa.ai), a powerful search engine and web search API designed specifically for AI applications. Exa provides:

* Advanced semantic search capabilities
* Clean web content extraction
* Real-time data retrieval
* Comprehensive web search functionality
* Superior search accuracy for AI applications

[Try Exa search](https://exa.ai/search)

<br>

---

Built with ❤️ by team Exa
