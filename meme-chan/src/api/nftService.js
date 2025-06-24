/**
 * NFT minting service for meme-chan
 */

/**
 * Mint an NFT using the Starkey wallet
 * @param {Object} params - Parameters for minting
 * @param {string} params.imageUrl - The URL of the image to mint
 * @param {string} params.title - The title of the NFT
 * @param {string} params.description - The description of the NFT
 * @param {number} params.price - The price of the NFT in ETH
 * @param {Array} params.keywords - Keywords/tags for the NFT
 * @param {string} params.trendingTopic - The trending topic used for the NFT
 * @param {Object} params.provider - The wallet provider (from starkey.supra)
 * @param {string} params.account - The wallet account address
 * @returns {Promise<Object>} - Transaction details including txHash
 */
export const mintNFT = async ({ 
  imageUrl, 
  title, 
  description, 
  price, 
  keywords, 
  trendingTopic, 
  provider, 
  account 
}) => {
  if (!provider || !account) {
    throw new Error("Wallet not connected. Please connect your wallet to mint.");
  }

  // Validate required parameters
  if (!imageUrl) {
    throw new Error("Image URL is required for minting");
  }
  
  try {
    console.log("Minting NFT with parameters:", {
      imageUrl,
      title,
      account
    });
    
    // For now, let's create a simple metadata structure
    const metadata = {
      name: title || "MemeChan NFT",
      description: description || `A viral meme featuring ${trendingTopic}`,
      image: imageUrl,
      attributes: [
        {
          trait_type: "Type",
          value: "Meme"
        },
        {
          trait_type: "Trending Topic",
          value: trendingTopic || "None"
        },
        ...keywords.map(keyword => ({
          trait_type: "Keyword",
          value: keyword
        }))
      ]
    };
    
    // Prepare transaction parameters
    const txParams = {
      method: 'mint_nft',
      params: {
        metadata: JSON.stringify(metadata),
        royaltyPercentage: 5, // Default 5% royalty
      }
    };
    
    // Call the provider to create the transaction
    const txHash = await provider.signAndSubmitTransaction(txParams);
    
    // Return transaction details
    return {
      success: true,
      txHash,
      metadata
    };
  } catch (error) {
    console.error("NFT minting failed:", error);
    throw new Error(`Failed to mint NFT: ${error.message || "Unknown error"}`);
  }
};

/**
 * Get transaction status from blockchain
 * @param {string} txHash - Transaction hash to check
 * @param {Object} provider - The wallet provider
 * @returns {Promise<Object>} - Transaction status
 */
export const getTransactionStatus = async (txHash, provider) => {
  if (!provider || !txHash) {
    throw new Error("Provider and transaction hash are required");
  }
  
  try {
    const status = await provider.getTransactionStatus(txHash);
    return status;
  } catch (error) {
    console.error("Failed to get transaction status:", error);
    throw error;
  }
};