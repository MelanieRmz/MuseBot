import React, { useState } from 'react';
import Wheel from './Wheel';
import { HexString, TxnBuilderTypes, BCS } from "supra-l1-sdk";

// Helper function to convert a hex string to a Uint8Array
const hexToBytes = (hex) => {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return new Uint8Array(bytes);
};

const SpinTheWheel = ({ provider, account, networkData }) => {
  const [result, setResult] = useState(null);
  const [mintStatus, setMintStatus] = useState('');

  const spinWheel = () => {
    const outcomes = ["Win", "Lose", "Try Again"];
    const randomIndex = Math.floor(Math.random() * outcomes.length);
    const outcome = outcomes[randomIndex];
    setResult(outcome);

    const wheel = document.getElementById('wheel');
    wheel.classList.add('spin');
    setTimeout(() => {
      wheel.classList.remove('spin');
      alert(`You ${outcome}!`);
    }, 4000);
  };

  const mintNFT = async () => {
    if (!provider || !account || !networkData) {
      setMintStatus('Wallet not connected or network data not available.');
      return;
    }

    setMintStatus('Minting NFT...');
    try {
      const txExpiryTime = (Math.ceil(Date.now() / 1000) + 90); // 30 seconds
      const optionalTransactionPayloadArgs = {
        txExpiryTime
      };

      const rawTxPayload = [
        account, // Sender address
        0, // Sequence number (will be filled by wallet)
        "0x3d527b0ca9be59c7c50d18d65fb9c847b901af56dbbf6402f5657dc3f5cee439", // Module address
        "supra_nft", // Module name
        "mint", // Function name
        [], // Type arguments
        [
          BCS.bcsSerializeStr("Dog NFT"), // ipfs_hash as vector<u8>
          BCS.bcsSerializeStr("Dog NFT"), // name as String
          BCS.bcsSerializeStr("A furry friend with pseudo-random rarity!") // description as String
        ],
        optionalTransactionPayloadArgs
      ];
      alert([
          BCS.bcsSerializeStr("Dog NFT"), // ipfs_hash as vector<u8>
          BCS.bcsSerializeStr("Dog NFT"), // name as String
          BCS.bcsSerializeStr("A furry friend with pseudo-random rarity!") // description as String
        ])
      console.log("Raw Transaction Payload for createRawTransactionData:", rawTxPayload);

      const data = await provider.createRawTransactionData(rawTxPayload);
      console.log("Data from createRawTransactionData:", data);
      debugger;
      if (data) {
        const params = {
          data: data,
          from: account,
          to: "0x3d527b0ca9be59c7c50d18d65fb9c847b901af56dbbf6402f5657dc3f5cee439", // Contract address
          chainId: 6,
          value: "0", // No value transfer for minting
        };
        console.log("Params for sendTransaction:", params);
        const txHash = await provider.sendTransaction(params);
        console.log('Mint transaction hash:', txHash);
        setMintStatus(`NFT Minted! Transaction hash: ${txHash}`);
      }
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      setMintStatus(`Failed to mint NFT: ${error.message}`);
    }
  };

  return (
    <div className="spin-the-wheel-container">
      <Wheel />
      <button onClick={spinWheel} className="spin-button">Spin the Wheel!</button>
      <button onClick={mintNFT} className="mint-button" style={{ marginTop: '20px' }}>Mint Supra NFT</button>
      {mintStatus && <p>{mintStatus}</p>}
    </div>
  );
};

export default SpinTheWheel;
