import React, { useEffect, useState } from "react";

const WalletConnection = ({ children }) => {
  let supraProvider = typeof window !== "undefined" && (window).starkey?.supra;

  const [isStarkeyInstalled, setIsStarkeyInstalled] = useState(!!supraProvider);
  const [accounts, setAccounts] = useState([]);
  const [networkData, setNetworkData] = useState(null);
  const [provider, setProvider] = useState(supraProvider);

  const checkForStarkey = () => {
    const intervalId = setInterval(() => {
      if ((window).starkey) {
        supraProvider = (window).starkey.supra;
        clearInterval(intervalId);
        setIsStarkeyInstalled(true);
        setProvider(supraProvider); // Update provider state
        updateAccounts().then();
      }
    }, 500);

    setTimeout(() => {
      clearInterval(intervalId);
    }, 5000);
  };

  const getNetworkData = async () => {
    if (provider) {
      const data = await provider.getChainId();
      console.log("Network Data:", data);
      if (data) {
        setNetworkData(data);
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
      await provider.connect();
      updateAccounts().then();
    } else {
      window.open('https://starkey.app/', '_blank');
    }
  };

  const disconnectWallet = async () => {
    if (provider) {
      await provider.disconnect();
    }
    resetWalletData();
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
    <div>
      {!isStarkeyInstalled && (
        <p>Please install the StarKey wallet extension: <a href="https://starkey.app/" target="_blank" rel="noopener noreferrer">starkey.app</a></p>
      )}
      {isStarkeyInstalled && accounts.length === 0 && (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
      {accounts.length > 0 && (
        <>
          <p>Connected account: {accounts[0]}</p>
          <p>Network: {networkData?.name || networkData?.chainId}</p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
          {children && React.cloneElement(children, { provider, account: accounts[0], networkData })}
        </>
      )}
    </div>
  );
};

export default WalletConnection;
