import React, { useState, useEffect } from "react";
import { Meme } from "@/api/entities";
import { fetchTrendingHashtags, generateMemeImages } from "@/api/apiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, TrendingUp, Hash, Zap, RefreshCw, Check, AlertCircle, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HexString, TxnBuilderTypes, BCS } from "supra-l1-sdk";

import TrendSelector from "../components/meme/TrendSelector";
import KeywordInput from "../components/meme/KeywordInput";
import GenerationProgress from "../components/meme/GenerationProgress";

export default function Home() {
  // Ensure arrays are properly initialized
  const [selectedTrends, setSelectedTrends] = useState([]);
  const [customKeywords, setCustomKeywords] = useState([]);
  const [spiceWords, setSpiceWords] = useState([]);
  const [mintingStatus, setMintingStatus] = useState({});
  
  // Debug state changes
  useEffect(() => {
    console.log("Home component state:", {
      customKeywords,
      spiceWords,
      customKeywordsLength: customKeywords?.length,
      spiceWordsLength: spiceWords?.length
    });
  }, [customKeywords, spiceWords]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedMemes, setGeneratedMemes] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [error, setError] = useState(null);

  // Fetch trending hashtags from the backend
  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoadingTrends(true);
      try {
        setError(null);
        const trends = await fetchTrendingHashtags();
        setTrendingTopics(trends);
      } catch (error) {
        console.error("Failed to fetch trending hashtags:", error);
        setError("Failed to load trending topics. Please try again later.");
      } finally {
        setIsLoadingTrends(false);
      }
    };

    fetchTrends();
  }, []);

  const handleGenerate = async () => {
    if (selectedTrends.length === 0 && customKeywords.length === 0) return;
    
    setIsGenerating(true);
    setGenerationStep(0);
    setShowResults(false);

    try {
      setError(null);
      // Get the selected trend objects and extract their labels
      const selectedTrendObjs = trendingTopics.filter(t => selectedTrends.includes(t.id));
      const selectedHashtags = selectedTrendObjs.map(t => t.label);
      
      // Step 1: Processing trends and keywords (minimum 3 seconds)
      setGenerationStep(1);
      const step1Timer = new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 2: Start API call but don't await it yet
      console.log("Before API call - state values:", {
        customKeywords,
        spiceWords,
        selectedTrends,
        selectedHashtags
      });
      
      // Create explicit copies of arrays to ensure they're passed correctly
      const keywordsToSend = Array.isArray(customKeywords) ? [...customKeywords] : [];
      const spiceToSend = Array.isArray(spiceWords) ? [...spiceWords] : [];
      
      console.log("Values being sent to API:", {
        hashtags: selectedHashtags,
        keywords: keywordsToSend,
        spice: spiceToSend
      });
      
      // Make sure keywords and spice are being sent as arrays
      const imageUrlsPromise = generateMemeImages({
        hashtags: selectedHashtags,
        keywords: keywordsToSend,
        spice: spiceToSend
      }).catch(err => {
        console.error("API call failed:", err);
        // Rethrow to be caught by the outer catch block
        throw new Error("Failed to generate meme images. Please try again later.");
      });
      
      // Wait for the minimum time for step 1
      await step1Timer;
      
      // Step 2: Generating images (minimum 4 seconds)
      setGenerationStep(2);
      const step2Timer = new Promise(resolve => setTimeout(resolve, 4000));
      
      // Wait for both the API call AND the minimum time to complete
      // Using try/catch inside Promise.all to handle API errors more gracefully
      let imageUrls;
      try {
        [imageUrls] = await Promise.all([
          imageUrlsPromise,
          step2Timer
        ]);
      } catch (error) {
        console.error("Error during image generation:", error);
        throw error; // Rethrow to outer catch block
      }
      
      // Step 3: Finalizing (minimum 3 seconds)
      setGenerationStep(3);
      const step3Timer = new Promise(resolve => setTimeout(resolve, 3000));
      
      // Process the results while waiting for the minimum time
      const memes = imageUrls.map((imageUrl, index) => {
        // Create a title based on the hashtags and keywords
        const allTerms = [...selectedHashtags, ...customKeywords, ...spiceWords];
        const title = `Meme with ${allTerms.slice(0, 3).join(', ')}${allTerms.length > 3 ? '...' : ''}`;
        
        return {
          id: `meme-${Date.now()}-${index}`,
          title: title,
          image_url: imageUrl,
          keywords: [...customKeywords, ...spiceWords],
          trending_topic: selectedHashtags.join(", "),
          mint_price: Math.random() * 0.05 + 0.001 // Random price between 0.001-0.051 ETH
        };
      });
      
      // Wait for the minimum time for step 3
      await step3Timer;
      
      // Show the results
      setGeneratedMemes(memes);
      setShowResults(true);
    } catch (error) {
      console.error("Generation failed:", error);
      setError(error.message || "Failed to generate memes. Please try again later.");
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  // Helper function to parse transaction output and extract NFT data
  const parseTransactionOutput = (txOutput) => {
    try {
      if (!txOutput) {
        // If no real output, generate mock data for testing
        return {
          rarity: Math.floor(Math.random() * 100) + 1,
          objectId: Math.floor(Math.random() * 1000)
        };
      }

      // Parse actual output if available
      const data = JSON.parse(txOutput);
      
      // Extract NFT minted event data
      if (data?.Move?.events) {
        const nftMintedEvent = data.Move.events.find(
          event => event.type.includes('::supra_nft::NFTMinted')
        );
        
        if (nftMintedEvent) {
          return {
            rarity: nftMintedEvent.data.rarity,
            objectId: nftMintedEvent.data.object_id
          };
        }
      }
      
      // Fallback with mock data
      return {
        rarity: Math.floor(Math.random() * 100) + 1,
        objectId: Math.floor(Math.random() * 1000)
      };
    } catch (e) {
      console.error("Error parsing transaction output:", e);
      // Return mock data if parsing fails
      return {
        rarity: Math.floor(Math.random() * 100) + 1,
        objectId: Math.floor(Math.random() * 1000)
      };
    }
  };

  const handleMintNFT = async (meme) => {
    if (!meme || !meme.image_url) {
      alert("Missing meme data for minting");
      return;
    }

    // Update status to show loading
    setMintingStatus(prevState => ({
      ...prevState,
      [meme.id]: { isLoading: true }
    }));

    try {
      // Get wallet provider
      const supraProvider = window.starkey?.supra;
      const accounts = await supraProvider?.account();
      const account = accounts?.[0];
      
      if (!supraProvider || !account) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }

      // Prepare transaction params
      const txExpiryTime = (Math.ceil(Date.now() / 1000) + 30); // 30 seconds
      const optionalTransactionPayloadArgs = {
        txExpiryTime
      };

      // Get hashtags/keywords as a string
      const hashtags = meme.keywords?.join(' ') || '';
      
      // Prepare transaction payload using the actual image URL
      const rawTxPayload = [
        account, // Sender address
        0, // Sequence number (will be filled by wallet)
        "0x3d527b0ca9be59c7c50d18d65fb9c847b901af56dbbf6402f5657dc3f5cee439", // Module address
        "supra_nft", // Module name
        "mint", // Function name
        [], // Type arguments
        [
          BCS.bcsSerializeStr(meme.image_url), // Use the actual image URL 
          BCS.bcsSerializeStr("meme-chan"), 
          BCS.bcsSerializeStr(hashtags)
        ],
        optionalTransactionPayloadArgs
      ];

      console.log("Minting NFT with payload:", {
        imageUrl: meme.image_url,
        hashtags
      });

      // Create raw transaction data
      const data = await supraProvider.createRawTransactionData(rawTxPayload);
      
      // Send transaction to blockchain
      const params = {
        data: data,
        from: account,
        to: "0x3d527b0ca9be59c7c50d18d65fb9c847b901af56dbbf6402f5657dc3f5cee439", // Contract address
        chainId: 6,
        value: "0" // No value transfer for minting
      };
      
      const txHash = await supraProvider.sendTransaction(params);
      alert(txHash);
      console.log('Mint transaction hash:', txHash);

      // Mock transaction output for demonstration
      // In a real app, you would wait for the transaction to be mined 
      // and get the receipt with receipt = await provider.getTransactionStatus(txHash);
      const mockTxOutput = JSON.stringify({
        "Move": {
          "gas_used": 5,
          "events": [
            {
              "guid": {"creation_number": "0", "account_address": "0x0"},
              "sequence_number": "0",
              "type": "0x3d527b0ca9be59c7c50d18d65fb9c847b901af56dbbf6402f5657dc3f5cee439::supra_nft::NFTMinted",
              "data": {
                "creator": account,
                "ipfs_hash": meme.image_url,
                "name": "meme-chan",
                "object_id": Math.floor(Math.random() * 100).toString(),
                "rarity": Math.floor(Math.random() * 100).toString()
              }
            }
          ],
          "vm_status": "Executed successfully"
        }
      });
      
      // Parse the transaction output to get NFT data (rarity, etc)
      const nftData = parseTransactionOutput(mockTxOutput);
      
      // Update meme as minted
      // await Meme.update(meme.id, { 
      //   minted: true,
      //   mint_price: meme.mint_price,
      //   transaction_hash: txHash,
      //   rarity: nftData.rarity,
      //   object_id: nftData.objectId
      // });

      // Update status to show success
      setMintingStatus(prevState => ({
        ...prevState,
        [meme.id]: { 
          isLoading: false, 
          success: true,
          txHash,
          rarity: nftData.rarity,
          objectId: nftData.objectId
        }
      }));
    } catch (error) {
      console.error("Minting failed:", error);
      
      // Update status to show error
      setMintingStatus(prevState => ({
        ...prevState,
        [meme.id]: { 
          isLoading: false, 
          success: false,
          error: error.message || "Failed to mint"
        }
      }));
    }
  };

  const resetGeneration = () => {
    setSelectedTrends([]);
    setCustomKeywords([]);
    setSpiceWords([]);
    setShowResults(false);
    setGeneratedMemes([]);
  };

  // Helper function to get a color based on rarity
  const getRarityColor = (rarity) => {
    const rarityNum = parseInt(rarity);
    if (rarityNum >= 80) return "text-orange-400"; // Legendary
    if (rarityNum >= 60) return "text-purple-400"; // Epic
    if (rarityNum >= 40) return "text-blue-400";   // Rare
    if (rarityNum >= 20) return "text-green-400";  // Uncommon
    return "text-gray-400";                        // Common
  };

  // Helper function to get rarity level text
  const getRarityLevelText = (rarity) => {
    const rarityNum = parseInt(rarity);
    if (rarityNum >= 80) return "Legendary";
    if (rarityNum >= 60) return "Epic";
    if (rarityNum >= 40) return "Rare";
    if (rarityNum >= 20) return "Uncommon";
    return "Common";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="text-center space-y-6">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-7xl font-bold text-white leading-tight"
                >
                  Generate Viral
                  <br />
                  <span className="bg-clip-text">
                    Memes
                  </span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-gray-300 max-w-2xl mx-auto"
                >
                  Turn trending topics into viral memes with AI. Ready to mint and share instantly.
                </motion.p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/30 text-red-100 p-4 rounded-lg text-center mb-6"
                >
                  <p>{error}</p>
                </motion.div>
              )}

              {/* Generation Interface */}
              {!isGenerating ? (
                <div className="grid lg:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <TrendSelector
                      trends={trendingTopics}
                      selectedTrends={selectedTrends}
                      onTrendSelect={setSelectedTrends}
                      isLoading={isLoadingTrends}
                      maxTrends={10}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-6"
                  >
                    <KeywordInput
                      keywords={customKeywords}
                      onKeywordsChange={setCustomKeywords}
                      spiceWords={spiceWords}
                      onSpiceWordsChange={setSpiceWords}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                    >
                      <div className="space-y-2">
                        <Button
                          onClick={handleGenerate}
                          disabled={selectedTrends.length === 0 && customKeywords.length === 0}
                          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 glow-purple"
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Viral Memes
                        </Button>
                        
                      <img 
                        src="https://monii-storage-bucket.nyc3.cdn.digitaloceanspaces.com/memechan.png" 
                        alt="Meme Chan Logo" 
                        className="w-48 mx-auto mt-4 opacity-50" 
                      />

                        {/* Debug info */}
                        <div className="text-xs text-gray-400 mt-2">
                          Your inputs: Keywords ({customKeywords.length}), Spice Words ({spiceWords.length})
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              ) : (
                <GenerationProgress step={generationStep} />
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Results Header */}
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-white">Your Viral Memes</h2>
                <p className="text-gray-300">Choose your favorite to mint and share</p>
                <Button
                  onClick={resetGeneration}
                  variant="outline"
                  className="glass-effect border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate New Memes
                </Button>
              </div>

              {/* Generated Memes Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedMemes.map((meme, index) => (
                  <motion.div
                    key={meme.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card className="glass-effect border-white/10 overflow-hidden group hover:glow-purple transition-all duration-300">
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={meme.image_url}
                          alt={meme.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Show rarity badge if minted */}
                        {mintingStatus[meme.id]?.success && mintingStatus[meme.id]?.rarity && (
                          <div className="absolute top-4 right-4">
                            <Badge className={`${getRarityColor(mintingStatus[meme.id].rarity)} bg-black/50 border border-white/30`}>
                              <Star className="w-3 h-3 mr-1" />
                              {getRarityLevelText(mintingStatus[meme.id].rarity)} ({mintingStatus[meme.id].rarity})
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <h3 className="text-white font-semibold line-clamp-2">{meme.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {meme.keywords.slice(0, 3).map((keyword, i) => (
                            <Badge key={i} variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-400">
                            {/* Mint: {meme.mint_price.toFixed(4)} ETH */}
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleMintNFT(meme)}
                            disabled={mintingStatus[meme.id]?.isLoading}
                          >
                            {mintingStatus[meme.id]?.isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Minting...
                              </>
                            ) : mintingStatus[meme.id]?.success ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Minted!
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-1" />
                                Mint
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {/* Success message with rarity info */}
                        {mintingStatus[meme.id]?.success && (
                          <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded-md">
                            <div className="text-xs text-green-300 flex items-center mb-1">
                              <Check className="w-3 h-3 mr-1" /> 
                              NFT minted successfully!
                            </div>
                            {mintingStatus[meme.id]?.rarity && (
                              <div className={`text-sm font-semibold ${getRarityColor(mintingStatus[meme.id].rarity)} flex items-center`}>
                                <Star className="w-4 h-4 mr-1" />
                                {getRarityLevelText(mintingStatus[meme.id].rarity)} Rarity: {mintingStatus[meme.id].rarity}
                              </div>
                            )}
                            {mintingStatus[meme.id]?.objectId && (
                              <div className="text-xs text-gray-300 mt-1">
                                Token ID: #{mintingStatus[meme.id].objectId}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Error message */}
                        {mintingStatus[meme.id]?.error && (
                          <div className="mt-2 text-xs text-red-400 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {mintingStatus[meme.id].error}
                          </div>
                        )}
                        
                        {/* Transaction hash */}
                        {mintingStatus[meme.id]?.txHash && (
                          <div className="mt-1 text-xs text-gray-400 truncate">
                            Tx: {mintingStatus[meme.id].txHash.substring(0, 10)}...
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}