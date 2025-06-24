import 'dotenv/config';
import express from "express";
import { getTwitterTrendingHashtags } from './integrations/twitter';
import { generateOpenAIImage, generateXAIImage } from './integrations/openai';
import cors from 'cors';

const app = express();

// Enable CORS with proper options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Parse JSON request bodies
app.use(express.json());
app.get("/", (_req, res) => {
  res.send("Backend working!");
});

app.get("/get-trending-hashtags", async (req, res) => {
  const region = (req.query.region || "global") as 'global' | 'us' | 'uk' | 'jp' | 'in';
  const count = parseInt(req.query.count as string) || 10;
  try {
    const hashtags = await getTwitterTrendingHashtags(region, count);
    res.json({ hashtags });
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    res.status(500).json({ error: "Failed to fetch trending hashtags" });
  }
});

app.post("/generate-image", async (req, res) => {
  const { hashtags, ai, keywords, spice } = req.body as { hashtags: string[], ai: "openai" | "grok", keywords?: string[], spice?: string[] };
  
  console.log("Generate image request:", { hashtags, ai, keywords, spice });
  
  if (!Array.isArray(hashtags) || hashtags.length === 0) {
    res.status(400).json({ error: "Invalid hashtags provided" });
    return;
  }
  
  // Ensure keywords and spice are arrays
  const keywordsArray = Array.isArray(keywords) ? keywords : [];
  const spiceArray = Array.isArray(spice) ? spice : [];
  
  try {
    if (ai !== "openai" && ai !== "grok") {
      res.status(400).json({ error: "Invalid AI provider specified" });
      return;
    }
    
    console.log("Processing with:", {
      hashtags,
      keywordsArray,
      spiceArray
    });
    
    let imageUrl: string[] | undefined = undefined;
    if (ai === "openai") {
      imageUrl = await generateOpenAIImage(hashtags, keywordsArray, spiceArray);
    } else if (ai === "grok") {
      imageUrl = await generateXAIImage(hashtags, keywordsArray, spiceArray);
    }

    res.json({
      imageUrl
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }

});

app.listen(4000, () => console.log("🚀 Server running on http://localhost:4000"));
