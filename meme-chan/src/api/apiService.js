/**
 * API service for backend communication
 */

// Use environment variable or default to localhost:4000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Fetch trending hashtags from the backend
 * @param {Object} options - Options for fetching trending hashtags
 * @param {string} options.region - Region to fetch hashtags for (global, us, uk, jp, in)
 * @param {number} options.count - Number of hashtags to fetch
 * @returns {Promise<Array<{id: string, label: string, popularity: number}>>} - Array of trending hashtags
 */
export const fetchTrendingHashtags = async ({region = 'global', count = 10} = {}) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/get-trending-hashtags?region=${region}&count=${count}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch trending hashtags: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to match the expected format in the TrendSelector component
    return data.hashtags.map((hashtag, index) => {
      // Extract the hashtag text without the # symbol for the ID
      const id = hashtag.startsWith('#') ? hashtag.substring(1).toLowerCase() : hashtag.toLowerCase();

      // Calculate a "popularity" score (100 to 70 descending by position)
      const popularity = Math.max(70, Math.round(100 - (index * (30 / data.hashtags.length))));

      return {
        id,
        label: hashtag,
        popularity
      };
    });
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    // Rethrow the error to be handled by the component
    throw error;
  }
};

/**
 * Generate meme images using selected hashtags, keywords, and spice words
 * @param {Object} options - Options for generating meme images
 * @param {string[]} options.hashtags - Array of selected hashtags
 * @param {string[]} options.keywords - Array of custom keywords
 * @param {string[]} options.spice - Array of spice words for added flair
 * @returns {Promise<Array<string>>} - Array of image URLs
 */
export const generateMemeImages = async ({hashtags = [], keywords = [], spice = []}) => {
  try {
    // return [
    //   "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-63066534-2438-4632-b20a-5bdd923f4941.jpeg",
    //   "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-50532bb8-5636-4000-828c-f959dce3cf9c.jpeg",
    //   "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-622f9e7e-d443-4a69-848b-6b63b1f99892.jpeg"
    // ];
    // Ensure we have arrays even if they're empty
    const keywordsToSend = Array.isArray(keywords) ? keywords : [];
    const spiceToSend = Array.isArray(spice) ? spice : [];

    console.log('Sending to API - Real user values:', {
      hashtags,
      keywords: keywordsToSend,
      spice: spiceToSend
    });

    // Create the request body with user provided values
    const requestBody = {
      hashtags,
      ai: "grok", // Always use grok as the AI model
      keywords: keywordsToSend,
      spice: spiceToSend
    };

    console.log('Request body (stringified):', JSON.stringify(requestBody));

    const response = await fetch(`${API_BASE_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate meme images: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl; // Array of image URLs
  } catch (error) {
    console.error('Error generating meme images:', error);
    // Rethrow the error to be handled by the component
    throw error;
  }
};