import { useConnect, useAccount, useDisconnect } from 'wagmi';
export default function WalletButton() {
    const { connect, connectors } = useConnect();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    if (isConnected) {
        return (
            <div className='wallet-connected'>
                <span className='wallet-addr'>
                    {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button className='btn-ghost' onClick={() => disconnect()}>
                    Disconnect
                </button>
            </div>
        );
    }
    return (
        <button className='btn-connect'
            onClick={() => connect({ connector: connectors[0] })}>
            Connect Wallet
        </button>
    );
}