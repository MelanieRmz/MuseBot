import { TwitterApi } from 'twitter-api-v2';

// const twitterClient = new TwitterApi({
//   appKey: process.env.TWITTER_API_KEY!,
//   appSecret: process.env.TWITTER_API_SECRET!,
// });

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);


function mockGetTwitterTrendingHashtags(
    region: 'global' | 'us' | 'uk' | 'jp' | 'in' = 'global',
    count: number = 10
): string[] {
    // This function would typically fetch trending hashtags from Twitter's API.
    // For the sake of this example, we'll return a static list.
    return [
        '#AI',
        '#MachineLearning',
        '#DataScience',
        '#OpenAI',
        '#ChatGPT',
        '#DALL_E',
        '#Innovation',
        '#TechTrends',
        '#FutureOfWork',
        '#DigitalTransformation'
    ];
}

async function realGetTwitterTrendingHashtags(region: 'global' | 'us' | 'uk' | 'jp' | 'in' = 'global', count = 10) {
    const woeidMap = {
        global: 1,
        us: 23424977,
        uk: 23424975,
        jp: 23424856,
        in: 23424848
    };

    const woeid = woeidMap[region];
    
    const trends = await twitterClient.v1.trendsByPlace(woeid);
    return trends[0].trends
        .filter(trend => trend.name.startsWith('#'))
        .slice(0, count)
        .map(trend => trend.name);

}

async function fallBackScraper(): Promise<string[]> {
    return fetch("https://getdaytrends.com/united-states/")
        .then(r => r.text())
        .then(t => {
            const matches = [...t.matchAll(/href="\/united-states\/trend\/([^/]+)\//g)];
            const trends = matches.map(m => decodeURIComponent(m[1]));
            return trends
        });
}

export async function getTwitterTrendingHashtags(
    region: 'global' | 'us' | 'uk' | 'jp' | 'in' = 'global',
    count: number = 10
): Promise<string[]> {
    if (process.env.NODE_ENV !== 'production') {
        return mockGetTwitterTrendingHashtags(region, count);
    } else {
        try {
            return await realGetTwitterTrendingHashtags(region, count);
        } catch (error) {
            console.error('Error fetching Twitter trends, falling back to scraper:', error);
            return await fallBackScraper();
        }
    }
}

