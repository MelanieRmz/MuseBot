import React, { useEffect, useState } from "react";

const WalletConnection = () => {
  let supraProvider = typeof window !== "undefined" && window.starkey?.supra;

  const [isStarkeyInstalled, setIsStarkeyInstalled] = useState(!!supraProvider);
  const [accounts, setAccounts] = useState([]);
  const [networkData, setNetworkData] = useState(null);
  const [provider, setProvider] = useState(supraProvider);

  const checkForStarkey = () => {
    const intervalId = setInterval(() => {
      if (window.starkey) {
        supraProvider = window.starkey.supra;
        clearInterval(intervalId);
        setIsStarkeyInstalled(true);
        setProvider(supraProvider);
        updateAccounts().then();
      }
    }, 500);

    setTimeout(() => {
      clearInterval(intervalId);
    }, 5000);
  };

  const getNetworkData = async () => {
    if (provider) {
      try {
        const data = await provider.getChainId();
        console.log("Network Data:", data);
        if (data) {
          setNetworkData(data);
        }
      } catch (error) {
        console.error("Error getting network data:", error);
      }
    }
  };

  const updateAccounts = async () => {
    if (provider) {
      try {
        const response_acc = await provider.account();
        if (response_acc.length > 0) {
          setAccounts(response_acc);
        } else {
          setAccounts([]);
        }
      } catch (e) {
        console.error("Error updating accounts:", e);
        setAccounts([]);
      }
      getNetworkData().then();
    }
  };

  const resetWalletData = () => {
    setAccounts([]);
    setNetworkData(null);
  };

  const connectWallet = async () => {
    if (provider) {
      try {
        await provider.connect();
        updateAccounts().then();
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      window.open('https://starkey.app/', '_blank');
    }
  };

  const disconnectWallet = async () => {
    if (provider) {
      try {
        await provider.disconnect();
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
      }
      resetWalletData();
    }
  };

  useEffect(() => {
    checkForStarkey();
  }, []);

  useEffect(() => {
    if (provider) {
      provider.on("accountChanged", (acc) => {
        setAccounts(acc);
      });
      provider.on("networkChanged", (data) => {
        setNetworkData(data);
      });
      provider.on("disconnect", () => {
        resetWalletData();
      });
      updateAccounts().then(); // Initial account update after provider is set
    }
  }, [provider]);

  useEffect(() => {
    if (accounts.length > 0) {
      getNetworkData().then();
    }
  }, [accounts]);

  return (
    <div className="glass-effect px-4 py-2 rounded-lg">
      {!isStarkeyInstalled && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">Wallet Required</span>
          <button 
            onClick={() => window.open('https://starkey.app/', '_blank')}
            className="ml-2 text-xs text-purple-300 hover:text-purple-200 transition-colors"
          >
            Install Starkey
          </button>
        </div>
      )}
      
      {isStarkeyInstalled && accounts.length === 0 && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">Not Connected</span>
          <button 
            onClick={connectWallet}
            className="ml-2 text-xs text-purple-300 hover:text-purple-200 transition-colors"
          >
            Connect
          </button>
        </div>
      )}
      
      {accounts.length > 0 && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium truncate" title={accounts[0]}>
            {accounts[0].substring(0, 6)}...{accounts[0].substring(accounts[0].length - 4)}
          </span>
          <button 
            onClick={disconnectWallet}
            className="ml-2 text-xs text-purple-300 hover:text-purple-200 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;