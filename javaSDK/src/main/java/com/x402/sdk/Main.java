package com.x402.sdk;

public class Main {
    public static void main(String[] args) {

        System.out.println("🚀 Starting X402 Java SDK Test...");

        // 1. Initialize the SDK (Just like a developer would)
        x402Client client = new x402Client.Builder()
                .apiKey("api-key")
                .privateKey("privatekey")
                .gatewayUrl("http://localhost:8080") // Your Spring Boot Gateway
                .rpcUrl("https://sepolia.base.org")  // Base Sepolia
                .build();

        System.out.println("⏳ Contacting Gateway...");

        // 2. Make the purchase!
        // Let's pretend endpointId is "weather_1" and path is "/current"
       /* client.call("1", "/api/breeds/image/random","GET","")
                .thenAccept(response -> {
                    System.out.println("\n✅ SUCCESS! Data Received from Gateway:");
                    System.out.println(response);
                })
                .exceptionally(ex -> {
                    System.err.println("\n❌ FAILED: " + ex.getMessage());
                    return null;
                })
                .join();*/

        client.callByName("dog","/api/breeds/image/random","GET", "")
                .thenAccept(response -> {
                    System.out.println("\n✅ SUCCESS CALLING BY NAME! Data Received from Gateway:");
                    System.out.println(response);
                })
                .exceptionally(ex -> {
                    System.err.println("\n❌ FAILED: " + ex.getMessage());
                    return null;
                })
                .join();
    }
}