import FirecrawlApp from '@mendable/firecrawl-js';

const apiKey = process.env.FIRECRAWL_API_KEY;

if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not defined in environment variables');
}

export const firecrawl = new FirecrawlApp({
    apiKey: apiKey,
});
