import React, { useState, useEffect } from "react";
import { Meme } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Coins, 
  Zap, 
  Twitter, 
  Share2, 
  Copy, 
  CheckCircle, 
  ArrowLeft,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Mint() {
  const navigate = useNavigate();
  const [meme, setMeme] = useState(null);
  const [editions, setEditions] = useState([100]);
  const [enableRoyalties, setEnableRoyalties] = useState(true);
  const [royaltyPercentage, setRoyaltyPercentage] = useState([5]);
  const [isMinting, setIsMinting] = useState(false);
  const [mintComplete, setMintComplete] = useState(false);
  const [mintingStep, setMintingStep] = useState(0);
  const [postToTwitter, setPostToTwitter] = useState(true);
  const [twitterText, setTwitterText] = useState("");
  const [gasFee, setGasFee] = useState(0.0023);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeme();
  }, []);

  useEffect(() => {
    if (meme) {
      setTwitterText(`Just minted this viral meme! 🔥 ${meme.trending_topic} #MemeChan #NFT #Web3`);
    }
  }, [meme]);

  const loadMeme = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const memeId = urlParams.get('meme');
    
    if (memeId) {
      try {
        const memes = await Meme.list();
        const foundMeme = memes.find(m => m.id === memeId);
        if (foundMeme) {
          setMeme(foundMeme);
        }
      } catch (error) {
        console.error("Failed to load meme:", error);
      }
    }
    setIsLoading(false);
  };

  const calculateTotalCost = () => {
    const baseCost = meme?.mint_price || 0;
    const royaltyCost = enableRoyalties ? baseCost * (royaltyPercentage[0] / 100) : 0;
    return baseCost + gasFee + royaltyCost;
  };

  const handleMint = async () => {
    if (!meme) return;
    
    setIsMinting(true);
    setMintingStep(0);

    try {
      // Import necessary libraries
      const { BCS } = await import("supra-l1-sdk");
      
      // Get wallet connection
      const supraProvider = window.starkey?.supra;
      const accounts = await supraProvider?.account();
      const account = accounts?.[0];
      
      if (!supraProvider || !account) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      
      // Step 1: Prepare transaction
      setMintingStep(1);
      
      // Get hashtags/keywords as a string
      const hashtags = meme.keywords?.join(' ') || '';
      
      // Expiry time for transaction (30 seconds from now)
      const txExpiryTime = (Math.ceil(Date.now() / 1000) + 30);
      const optionalTransactionPayloadArgs = {
        txExpiryTime
      };
      
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
      
      console.log("Minting with payload:", {
        imageUrl: meme.image_url,
        name: "meme-chan",
        hashtags
      });
      
      // Step 2: Upload to blockchain
      setMintingStep(2);
      
      // Create raw transaction data
      const data = await supraProvider.createRawTransactionData(rawTxPayload);
      console.log("Raw transaction data:", data);
      
      // Send transaction to blockchain
      const params = {
        data: data,
        from: account,
        to: "0x3d527b0ca9be59c7c50d18d65fb9c847b901af56dbbf6402f5657dc3f5cee439", // Contract address
        chainId: 6,
        value: "0", // No value transfer for minting
      };
      
      const txHash = await supraProvider.sendTransaction(params);
      console.log('Mint transaction hash:', txHash);
      
      // Step 3: Confirm transaction
      setMintingStep(3);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update meme as minted
      await Meme.update(meme.id, {
        minted: true,
        mint_price: calculateTotalCost(),
        transaction_hash: txHash
      });

      setMintComplete(true);
      
      // Auto-post to Twitter if enabled
      if (postToTwitter) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // TODO: Implement actual Twitter posting if needed
      }

    } catch (error) {
      console.error("Minting failed:", error);
      alert(`Minting failed: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-effect rounded-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading meme...</p>
        </div>
      </div>
    );
  }

  if (!meme) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect border-white/10 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Meme Not Found</h2>
          <p className="text-gray-300 mb-6">The meme you're looking for doesn't exist.</p>
          <Link to={createPageUrl("Home")}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Generate New Memes
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {!mintComplete ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Mint Your Meme</h1>
                  <p className="text-gray-300">Configure and launch your viral creation</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Meme Preview */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="glass-effect border-white/10 overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={meme.image_url}
                        alt={meme.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold text-lg mb-2">{meme.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {meme.keywords?.slice(0, 3).map((keyword, i) => (
                            <Badge key={i} className="bg-purple-500/80 text-white border-0">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Mint Configuration */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-6"
                >
                  {/* Mint Settings */}
                  <Card className="glass-effect border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Coins className="w-5 h-5" />
                        <span>Mint Settings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-white">Number of Editions</Label>
                        <div className="px-3">
                          <Slider
                            value={editions}
                            onValueChange={setEditions}
                            max={1000}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        <div className="text-sm text-gray-300">{editions[0]} editions</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-white">Enable Royalties</Label>
                          <p className="text-sm text-gray-400">Earn from future sales</p>
                        </div>
                        <Switch
                          checked={enableRoyalties}
                          onCheckedChange={setEnableRoyalties}
                        />
                      </div>

                      {enableRoyalties && (
                        <div className="space-y-2">
                          <Label className="text-white">Royalty Percentage</Label>
                          <div className="px-3">
                            <Slider
                              value={royaltyPercentage}
                              onValueChange={setRoyaltyPercentage}
                              max={10}
                              min={1}
                              step={0.5}
                              className="w-full"
                            />
                          </div>
                          <div className="text-sm text-gray-300">{royaltyPercentage[0]}% royalty</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cost Breakdown */}
                  <Card className="glass-effect border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <DollarSign className="w-5 h-5" />
                        <span>Cost Breakdown</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Base Mint Cost</span>
                          <span className="text-white">{meme.mint_price?.toFixed(4)} ETH</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Gas Fee (est.)</span>
                          <span className="text-white">{gasFee.toFixed(4)} ETH</span>
                        </div>
                        {enableRoyalties && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Royalty Setup</span>
                            <span className="text-white">{((meme.mint_price || 0) * (royaltyPercentage[0] / 100)).toFixed(4)} ETH</span>
                          </div>
                        )}
                        <div className="border-t border-white/10 pt-3">
                          <div className="flex justify-between">
                            <span className="text-white font-semibold">Total Cost</span>
                            <span className="text-white font-bold text-lg">{calculateTotalCost().toFixed(4)} ETH</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Sharing */}
                  <Card className="glass-effect border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Twitter className="w-5 h-5" />
                        <span>Auto-Share</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-white">Post to X (Twitter)</Label>
                          <p className="text-sm text-gray-400">Share immediately after minting</p>
                        </div>
                        <Switch
                          checked={postToTwitter}
                          onCheckedChange={setPostToTwitter}
                        />
                      </div>

                      {postToTwitter && (
                        <div className="space-y-2">
                          <Label className="text-white">Tweet Text</Label>
                          <Input
                            value={twitterText}
                            onChange={(e) => setTwitterText(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                            placeholder="What do you want to say?"
                          />
                          <p className="text-xs text-gray-400">{twitterText.length}/280 characters</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Mint Button */}
                  <Button
                    onClick={handleMint}
                    disabled={isMinting}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 glow-purple"
                  >
                    {isMinting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>
                          {mintingStep === 1 && "Preparing Transaction..."}
                          {mintingStep === 2 && "Uploading to Blockchain..."}
                          {mintingStep === 3 && "Confirming Transaction..."}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Mint NFT for {calculateTotalCost().toFixed(4)} ETH
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white">Meme Minted!</h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Your viral creation is now live on the blockchain and ready to share with the world.
                </p>
              </div>

              {/* Minted NFT Details */}
              <Card className="glass-effect border-white/10 max-w-md mx-auto">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <img
                      src={meme.image_url}
                      alt={meme.title}
                      className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
                    />
                    <h3 className="text-white font-bold">{meme.title}</h3>
                    <p className="text-gray-400 text-sm">Edition #{Math.floor(Math.random() * editions[0]) + 1} of {editions[0]}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contract</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("0x742d35Cc6632C0532925a3b8D39A02E3C")}
                        className="text-purple-400 hover:text-purple-300 p-0 h-auto"
                      >
                        0x742d...E3C <Copy className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Token ID</span>
                      <span className="text-white">#{Math.floor(Math.random() * 10000) + 1}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                  <Twitter className="w-4 h-4" />
                  <span>Share on X</span>
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
                <Link to={createPageUrl("Gallery")}>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    View in Gallery
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}