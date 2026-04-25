import { PlugZap } from 'lucide-react';
import { useEffect } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { useAuth } from '../context/AuthContext';
import { updateWallet } from '../services/api';

export default function WalletButton() {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { accessToken, refresh, user } = useAuth();

  // When wallet connects, save address to database
  useEffect(() => {
    if (isConnected && address && accessToken) {
      // Only update if different from what's in DB
      if (user?.walletAddress !== address) {
        updateWallet(address, accessToken, refresh);
      }
    }
  }, [isConnected, address, accessToken]);

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <span className="wallet-addr">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button className="btn-ghost" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  // If user has wallet in DB but not connected to MetaMask
  if (user?.walletAddress) {
    return (
      <div className="wallet-connected">
        <span className="wallet-addr">
          {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
        </span>
        <button
          className="btn-ghost"
          onClick={() => connect({ connector: connectors[0] })}
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn-connect"
      onClick={() => connect({ connector: connectors[0] })}
    >
      <PlugZap size={15} />
      Connect Wallet
    </button>
  );
}
