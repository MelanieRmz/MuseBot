import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for wallet data
const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  let supraProvider = typeof window !== "undefined" && window.starkey?.supra;

  const [isStarkeyInstalled, setIsStarkeyInstalled] = useState(!!supraProvider);
  const [accounts, setAccounts] = useState([]);
  const [networkData, setNetworkData] = useState(null);
  const [provider, setProvider] = useState(supraProvider);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

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
        setError("Error getting network data");
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
        setError("Error updating accounts");
      }
      getNetworkData().then();
    }
  };

  const resetWalletData = () => {
    setAccounts([]);
    setNetworkData(null);
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    if (provider) {
      try {
        await provider.connect();
        updateAccounts().then();
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet");
      } finally {
        setIsConnecting(false);
      }
    } else {
      window.open('https://starkey.app/', '_blank');
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (provider) {
      try {
        await provider.disconnect();
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
        setError("Error disconnecting wallet");
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
        setError(null);
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

  const walletState = {
    isStarkeyInstalled,
    accounts,
    networkData,
    provider,
    isConnected: accounts.length > 0,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    currentAccount: accounts.length > 0 ? accounts[0] : null
  };

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};