package com.x402.gateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import org.springframework.web.reactive.function.BodyExtractors;
import reactor.core.publisher.Flux;

import java.io.Console;
import java.util.HashMap;
import java.util.Map;

@Component
public class X402PaymentFilter implements GlobalFilter , Ordered {

    @Value(("${app.internal-api-key}"))
    private String internalApiKey;

    private final WebClient webClient = WebClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public int getOrder() {return 0;} //after jwt filter (-1)

    @Override
   public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if(!path.startsWith("/api/call/"))
        {
            return chain.filter(exchange);
        }
        String paymentHeader = exchange.getRequest().getHeaders().getFirst("X-402-Payment");
        if(paymentHeader == null)
        {
            return return402(exchange,path);
        }

        return verifyAndForward(exchange,chain,paymentHeader,path);
    }

    private Mono<Void> return402(ServerWebExchange exchange, String path) {



        String[] segments = path.split("/");
        Long endpointId= Long.parseLong(segments[3]);

        return lookupEndpoint(endpointId)
                .flatMap(json ->{
                    JsonNode data =json.path("data");
                    Long providerId = data.path("providerId").asLong();

                    return lookupWallet(providerId)
                            .flatMap(wallet ->{
                                Map<String,Object> body =  Map.of(
                                        "x402", Map.of(
                                                "version", 1,
                                                "price", data.path("pricePerCall").asText(),
                                                "currency", "USDC",
                                                "network","base-sepolia",
                                                "payTo", wallet,
                                                "endpointId", data.path("id").asLong()
                                        )
                                );
                                return writeJsonResponse(exchange,HttpStatus.PAYMENT_REQUIRED, body);
                            });
                })
                .onErrorResume(e -> writeJsonResponse(exchange, HttpStatus.NOT_FOUND,
                        Map.of("error", "Endpoint not found")));




           /* Map<String,Object> body = Map.of(
                "x402", Map.of(
                        "version",1,
                        "price", "0.001",
                        "currency", "USDC",
                        "network", "base-sepolia",
                        "payTo","PROVIDER_WALLET_FROM_DB",
                        "description", "API call payment required"
                )
        );*/
        //return writeJsonResponse( exchange, HttpStatus.PAYMENT_REQUIRED,body);
    }

    private Mono<Void> verifyAndForward(ServerWebExchange exchange, GatewayFilterChain chain, String txHash, String path) {
        String userId= exchange.getRequest().getHeaders().getFirst("X-User-Id");
        String[] segments = path.split("/");
        Long endpointId= Long.parseLong(segments[3]);

        return lookupEndpoint(endpointId)
                .flatMap(json ->{
                    JsonNode data =json.path("data");
                    String providerApiKey = data.path("providerApiKey").asText("");
                    Long providerId = data.path("providerId").asLong();
                    Long apiId = data.path("apiId").asLong();
                    String baseUrl = data.path("baseUrl").asText();
                    String endpointPath = data.path("path").asText();
                    String price = data.path("pricePerCall").asText();

                    return lookupWallet(providerId)
                            .flatMap(wallet ->{
                                Map<String,Object> verifyBody =  Map.of(
                                        "txHash",txHash,
                                        "consumerId", Long.parseLong(userId),
                                        "endpointId", endpointId,
                                        "apiId", apiId,
                                        "providerId", providerId,
                                        "providerWallet",  wallet,
                                        "expectedAmount", new java.math.BigDecimal(price)
                                );
                                return webClient.post()
                                        .uri("http://localhost:8083/api/pay/verify")
                                        .header("X-Internal-Key", internalApiKey)
                                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                        .bodyValue(verifyBody)
                                        .retrieve()
                                        .bodyToMono(JsonNode.class)
                                        .flatMap(response ->{
                                            boolean valid = response.path("data").path("valid").asBoolean(false);
                                            if(valid)
                                            {
                                                //Forward to provider's real API
                                                return forwardToProvider(exchange,baseUrl,endpointPath, providerApiKey);
                                            }
                                            else{
                                                String reason = response.path("data").path("reason").asText("Payment failed");
                                                return writeJsonResponse(exchange,HttpStatus.PAYMENT_REQUIRED,Map.of("error", reason));
                                            }
                                        });
                            });
                })
                .onErrorResume(e->{
                    System.out.println("VERIFY ERROR: " + e.getMessage());
                    return writeJsonResponse(exchange, HttpStatus.BAD_GATEWAY,Map.of("error", "Payment verification unavailable: " + e.getMessage()));
                });


        /*Map<String, Object> verifyBody = Map.of(
                "txHash", txHash,
                "consumerId", Long.parseLong(userId),
                "endpointId", 1L, // TODO: look up from path
                "apiId", 1L, // TODO: look up from path
                "providerId", 1L, // TODO: look up from DB
                "providerWallet", "0xd306833E0D3B60AEcc6b9d5e58AB794A6b326Ee5", // TODO: from DB
                "expectedAmount", 0.001 // TODO: from DB
        );*/


        /*return webClient.post()
                .uri("http://localhost:8083/api/pay/verify")
                .header("X-Internal-Key", internalApiKey)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(verifyBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .flatMap(response -> {

                    boolean valid = response.path("data")
                            .path("valid").asBoolean(false);
                    if (valid) {
                        //for now, return success since no real provider api to forward to
                        //return chain.filter(exchange);
                        return writeJsonResponse(exchange, HttpStatus.OK,
                                Map.of("status", "ok", "message", "Payment verified, API call would be forwarded here"));
                    }
                    else {
                        String reason = response.path("data")
                                .path("reason").asText("Payment failed");
                        return writeJsonResponse(exchange,HttpStatus.PAYMENT_REQUIRED,Map.of("error", reason));
                    }

                })
                .onErrorResume(e ->{
                    System.out.println("PAYMENT ERROR: " + e.getMessage());
                    e.printStackTrace();
                    return writeJsonResponse(exchange, HttpStatus.BAD_GATEWAY,
                            Map.of("error", "Payment verification unavailable: " + e.getMessage()));
                });*/
    }

    private Mono<Void> forwardToProvider(ServerWebExchange exchange, String baseUrl, String endpointPath, String providerApiKey) {
        return exchange.getRequest().getBody()
                .collectList()
                .flatMap(bodyparts ->{

                    WebClient.RequestBodySpec request = webClient.method(exchange.getRequest().getMethod())
                            .uri(baseUrl + endpointPath);
                    request.headers(h-> {
                        exchange.getRequest().getHeaders().forEach((key,value)->{
                            if (!key.equalsIgnoreCase("Host")
                                    && !key.equalsIgnoreCase("X-402-Payment")
                                    && !key.equalsIgnoreCase("X-User-Id")
                                    && !key.equalsIgnoreCase("X-Api-Key")) {
                                h.addAll(key, value);
                            }
                        });

                        if(providerApiKey !=null && !providerApiKey.isEmpty())
                        {
                            h.set("X-Provider-Key", providerApiKey);
                        }
                    });


                    WebClient.RequestHeadersSpec<?> readyRequest;
                    if(!bodyparts.isEmpty())
                    {
                        readyRequest = request.body(
                                Flux.fromIterable(bodyparts), DataBuffer.class
                        );
                    }
                    else
                    {
                        readyRequest = request;
                    }

                    return readyRequest
                            .exchangeToMono(clientResponse -> {

                                exchange.getResponse().setStatusCode(clientResponse.statusCode());

                                clientResponse.headers().asHttpHeaders()
                                        .forEach((key, value)->{
                                            if(!key.equalsIgnoreCase("Transfer-Encoding")
                                                && !key.equalsIgnoreCase("access-control-")){
                                                exchange.getResponse().getHeaders().addAll(key, value);
                                            }
                                        });
                                addCorsHeaders(exchange);
                                return exchange.getResponse().writeWith(clientResponse.body(BodyExtractors.toDataBuffers()));
                            });
                })
                .onErrorResume(e-> writeJsonResponse(exchange, HttpStatus.BAD_GATEWAY,
                        Map.of("error", "Provider API unreachable: " + e.getMessage())));

    }
    /*private Mono<Void> forwardToProvider(ServerWebExchange exchange, String baseUrl, String endpointPath) {
        return webClient.method(exchange.getRequest().getMethod())
                .uri(baseUrl +endpointPath)
                .headers(h->{
                    exchange.getRequest().getHeaders().forEach((key,values)->{
                        if(!key.equalsIgnoreCase("Host"))
                        {
                            h.addAll(key,values);
                        }
                    });
                })
                .retrieve()
                .bodyToMono(byte[].class)
                .flatMap(body->{
                    exchange.getResponse().setStatusCode(HttpStatus.OK);
                    exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
                    DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body);
                    return exchange.getResponse().writeWith(Mono.just(buffer));
                })
                .onErrorResume(e -> writeJsonResponse(exchange,
                        HttpStatus.BAD_GATEWAY,
                        Map.of("error", "Provider API unreachable: "
                                + e.getMessage())));

    }*/

    //helpers
    private Mono<Void> writeJsonResponse(ServerWebExchange exchange, HttpStatus status, Object body) {
        try
        {
            addCorsHeaders(exchange);
            byte[] bytes = objectMapper.writeValueAsBytes(body);
            exchange.getResponse().setStatusCode(status);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
            return exchange.getResponse().writeWith(Mono.just(buffer));
        }
        catch (Exception e)
        {
            exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            return exchange.getResponse().setComplete();
        }
    }

    private Mono<JsonNode> lookupEndpoint(Long endpointId)
    {
        return webClient.get()
                .uri("http://localhost:8082/api/marketplace/lookup?endpointId=" + endpointId)
                .header("X-Internal-Key", internalApiKey)
                .retrieve()
                .bodyToMono(JsonNode.class);
    }

    private Mono<String> lookupWallet(Long providerId)
    {
        return webClient.get()
                .uri("http://localhost:8081/api/auth/wallet/lookup?userId=" + providerId)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> json.path("data").path("walletAddress").asText());
    }

    private void cleanCorsHeaders(ServerWebExchange exchange)
    {
        exchange.getResponse().getHeaders().remove("Access-Control-Allow-Origin");
        exchange.getResponse().getHeaders().remove("Access-Control-Allow-Credentials");
        exchange.getResponse().getHeaders().remove("Access-Control-Allow-Headers");
        exchange.getResponse().getHeaders().remove("Access-Control-Allow-Methods");
    }

    private void addCorsHeaders(ServerWebExchange exchange)
    {
        exchange.getResponse().getHeaders().remove("Access-Control-Allow-Origin");
        exchange.getResponse().getHeaders().remove("Access-Control-Allow-Credentials");
        exchange.getResponse().getHeaders().remove("Access-Control-Allow-Methods");
        exchange.getResponse().getHeaders().remove("Access-Control-Allow-Headers");
        exchange.getResponse().getHeaders().set(
                "Access-Control-Allow-Origin", "http://localhost:5173");
        exchange.getResponse().getHeaders().set(
                "Access-Control-Allow-Credentials", "true");
    }

}
