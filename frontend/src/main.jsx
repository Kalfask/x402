import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./config/wagmi";
import App from "./App";
import React from "react";
import ReactDOM from 'react-dom/client'

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);