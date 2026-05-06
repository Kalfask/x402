package com.x402.sdk;

import com.x402.sdk.crypto.Web3Signer;
import io.reactivex.Completable;
import okhttp3.ResponseBody;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;


public class x402Client {

    private final String apiKey;
    private final String gatewayUrl;
    private final Web3Signer web3Signer;
    private final HttpClient httpClient;
    private final String rpcUrl;


    private final String USDC_CONTRACT_ADDRESS= "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

    private x402Client(Builder builder){
        this.apiKey = builder.apiKey;
        this.gatewayUrl = builder.gatewayUrl;
        this.rpcUrl = builder.rpcUrl;


        this.web3Signer = new Web3Signer(builder.privateKey, rpcUrl);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public CompletableFuture<String> call(String endpointId, String endpointPath, String httpMethod, String jsonBody)
    {
        String safePath = endpointPath.startsWith("/") ? endpointPath : "/" + endpointPath;
        String url = this.gatewayUrl + "/api/call/" + endpointId + safePath;
        HttpRequest.BodyPublisher bodyPublisher = (jsonBody != null && !jsonBody.isEmpty())
                ? HttpRequest.BodyPublishers.ofString(jsonBody)
                : HttpRequest.BodyPublishers.noBody();
        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("X-API-Key", this.apiKey)
                .method(httpMethod.toUpperCase(),bodyPublisher);

        if(jsonBody != null && !jsonBody.isEmpty())
        {
            request.header("Content-Type", "application/json");
        }

        return httpClient.sendAsync(request.build(), HttpResponse.BodyHandlers.ofString())
                .thenCompose(response ->{
                    if(response.statusCode() == 200)
                    {
                        return CompletableFuture.completedFuture(response.body());
                    }

                    if(response.statusCode() == 402)
                    {
                        try{
                            String PayTo = extractPayTo(response.body());
                            BigInteger price = extractPrice(response.body());

                            String txHash = web3Signer.payAndGetTxHash(PayTo,price,USDC_CONTRACT_ADDRESS);
                            System.out.println("✅ Transaction confirmed! Hash: " + txHash);
                            HttpRequest.Builder request2 = HttpRequest.newBuilder()
                                    .uri(URI.create(url))
                                    .header("X-Api-Key", this.apiKey)
                                    .header("X-402-Payment",txHash)
                                    .method(httpMethod.toUpperCase(),bodyPublisher);

                            if(jsonBody != null && !jsonBody.isEmpty())
                            {
                                request2.header("Content-Type", "application/json");
                            }

                            return httpClient.sendAsync(request2.build(), HttpResponse.BodyHandlers.ofString())
                                    .thenApply(HttpResponse::body);
                        } catch (Exception e) {
                            CompletableFuture<String> failed = new CompletableFuture<>();
                            failed.completeExceptionally(new RuntimeException("Web3 Payment Failed: " + e.getMessage(), e));
                            return failed;
                        }
                    }
                    CompletableFuture<String> error = new CompletableFuture<>();
                    error.completeExceptionally(new RuntimeException("API Error: " + response.statusCode() + " - " + response.body()));
                    return error;
                });

    }

    public CompletableFuture<String> callByName(String apiName, String endpointPath, String httpMethod, String jsonBody)
    {
        String safePath = endpointPath.startsWith("/") ? endpointPath : "/" + endpointPath;
        try{
            String endpointId = findId(apiName, safePath);
            return call(endpointId, endpointPath, httpMethod, jsonBody);
        }
        catch (Exception e)
        {
            CompletableFuture<String> errorFuture = new CompletableFuture<>();
            errorFuture.completeExceptionally(new RuntimeException("Failed to resolve API name: " + e.getMessage(), e));
            return errorFuture;
        }
    }

    private String findId(String apiName,String endpointPath)
    {
        HttpRequest.BodyPublisher bodyPublisher = HttpRequest.BodyPublishers.ofString("{\"name\": \""+apiName+"\", \"path\" :\""+endpointPath+"\" }");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(this.gatewayUrl+"/api/marketplace/findEndpointId"))
                .header("X-Api-Key", this.apiKey)
                .header("Content-Type", "application/json")
                .POST(bodyPublisher)
                .build();

        return httpClient.sendAsync(request,HttpResponse.BodyHandlers.ofString())
                .thenApply(response->{
                    if(response.statusCode() == 200)
                    {
                        String jsonString = response.body();
                        String marker = "\"data\":";
                        int startIndex = jsonString.indexOf(marker);
                        if(startIndex == -1)
                        {
                            throw new RuntimeException("Failed to resolve API name: " + response.body());
                        }
                        startIndex = startIndex + marker.length();
                        int endIndex = startIndex;
                        while(endIndex < jsonString.length()&&Character.isDigit(jsonString.charAt(endIndex)))
                        {
                            endIndex++;
                        }

                        return jsonString.substring(startIndex, endIndex).trim();

                    }
                    else
                    {
                        throw new RuntimeException("API Error: " + response.statusCode() + " - " + response.body());
                    }
                }).join();
    }

    private BigInteger extractPrice(String jsonBody) {
        String[] parts = jsonBody.split("\"price\"\\s*:\\s*");
        if(parts.length > 1)
        {
            // Get the raw string, e.g., ".001" or "0.001"
            String numStr = parts[1].split("[,}]")[0].trim().replaceAll("\"", "");

            // 1. Parse it safely as a Decimal
            BigDecimal decimalPrice = new BigDecimal(numStr);

            // 2. Multiply by 1,000,000 (USDC has 6 decimal places)
            BigDecimal multiplier = new BigDecimal("1000000");
            BigDecimal rawAmount = decimalPrice.multiply(multiplier);

            // 3. Convert it to the final BigInteger for the blockchain!
            return rawAmount.toBigInteger();
        }
        throw new RuntimeException("Could not find 'price' in 402 response. Response was: " + jsonBody);
    }

    public static class Builder{
        private String apiKey;
        private String privateKey;
        private String gatewayUrl = "http://localhost:8080";
        private String rpcUrl = "https://sepolia.base.org";

        public Builder apiKey(String apiKey){
            this.apiKey = apiKey;
            return this;
        }
        public Builder privateKey(String privateKey){
            this.privateKey = privateKey;
            return this;
        }
        public Builder gatewayUrl(String gatewayUrl){
            this.gatewayUrl = gatewayUrl;
            return this;
        }

        public Builder rpcUrl(String rpcUrl){
            this.rpcUrl = rpcUrl;
            return this;
        }

        public x402Client build(){
            if(apiKey == null || privateKey == null){
                throw new RuntimeException("API KEY or private KEY IS NULL");
            }
            return new x402Client(this);
        }
    }
    private String extractPayTo(String jsonBody){
        String[] parts = jsonBody.split("\"payTo\"\\s*:\\s*\"");
        if(parts.length > 1){
            return parts[1].split("\"")[0].toLowerCase();
        }
        throw new RuntimeException("Could not find 'payTo' address in 402 response. Response was: " + jsonBody);
    }
}
