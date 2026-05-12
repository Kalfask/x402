package com.x402.gateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.x402.gateway.dto.UsageEvent;
import com.x402.gateway.service.UsageEventPublisher;
import io.lettuce.core.protocol.Endpoint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
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
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class X402PaymentFilter implements GlobalFilter , Ordered {

    @Value(("${app.internal-api-key}"))
    private String internalApiKey;

    @Value("${app.frontend-url:http://localhost:5173}")
    String frontendUrl;


   //private static final org.slf4j.Logger log = LoggerFactory.getLogger(X402PaymentFilter.class);

    private final ReactiveStringRedisTemplate reactiveStringRedisTemplate;


    private final WebClient webClient;

    private final WebClient externalWebClient;

    private final ObjectMapper objectMapper = new ObjectMapper();


    private final UsageEventPublisher  usageEventPublisher;

    public X402PaymentFilter(ReactiveStringRedisTemplate redisTemplate,
                             UsageEventPublisher publisher,
                             @Qualifier("loadBalancedWebClient") WebClient loadBalancedWebClient,
                             @Qualifier("externalWebClient") WebClient externalWebClient,
                             @Value("${app.internal-api-key}") String internalApiKey) {
        this.reactiveStringRedisTemplate = redisTemplate;
        this.usageEventPublisher = publisher;
        this.webClient = loadBalancedWebClient;
        this.externalWebClient = externalWebClient;
        this.internalApiKey = internalApiKey;
    }

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
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        if(paymentHeader == null)
        {

            Long endpointId= parseEndpointId(path);
            if(endpointId == null)
            {
                return writeJsonResponse(exchange, HttpStatus.BAD_REQUEST,Map.of("error", "Invalid endpoint id"));
            }

            return lookupEndpoint(endpointId)
                    .flatMap(jsonNode -> {
                        JsonNode data =  jsonNode.path("data");
                        int freeApiCalls = Integer.parseInt(data.get("freeCallsPerDay").asText());
                        String providerApiKey = data.path("providerApiKey").asText("");
                        Long providerId = data.path("providerId").asLong();
                        Long apiId = data.path("apiId").asLong();
                        String baseUrl = data.path("baseUrl").asText();
                        String endpointPath = data.path("path").asText();
                        String price = data.path("pricePerCall").asText();
                        if(freeApiCalls > 0)
                        {
                            if(userId !=null)
                            {
                                String redisKey = String.format("free:user:%s:endpoint:%d:date:%s", userId, endpointId, LocalDate.now());
                                return getApiCallsCount(redisKey)
                                        .flatMap(count->{
                                            if (count > freeApiCalls)
                                            {
                                                return return402(exchange,data);
                                            }
                                            else
                                            {
                                                return forwardToProvider(exchange,baseUrl,endpointPath,providerApiKey);
                                            }

                                        });
                            }
                            else
                            {
                                return writeJsonResponse(exchange,HttpStatus.FORBIDDEN,Map.of("message","No User Found"));
                            }


                        }
                        log.info("No free calls for endpoint, requiring payment");
                        //System.out.println("no free calls available"+freeApiCalls);
                        return return402(exchange,data);
                    });



        }

        return verifyAndForward(exchange,chain,paymentHeader,path);
    }

    private Mono<Void> return402(ServerWebExchange exchange, JsonNode data) {


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

    }

    private Mono<Void> verifyAndForward(ServerWebExchange exchange, GatewayFilterChain chain, String txHash, String path) {
        String userId= exchange.getRequest().getHeaders().getFirst("X-User-Id");
        if(userId == null)
        {
            return writeJsonResponse(exchange,HttpStatus.FORBIDDEN,Map.of("message","No User Found"));
        }
        Long endpointId= parseEndpointId(path);
        if(endpointId == null)
        {
            return writeJsonResponse(exchange,HttpStatus.BAD_REQUEST,Map.of("message","No Endpoint Found"));
        }

        return lookupEndpoint(endpointId)
                .flatMap(json ->{
                    JsonNode data =json.path("data");
                    String providerApiKey = data.path("providerApiKey").asText("");
                    Long providerId = data.path("providerId").asLong();
                    Long apiId = data.path("apiId").asLong();
                    String baseUrl = data.path("baseUrl").asText();
                    String endpointPath = data.path("path").asText();
                    String price = data.path("pricePerCall").asText();

                    if(!isValidEndpointData(price,baseUrl,path))
                    {
                        return writeJsonResponse(exchange,HttpStatus.FORBIDDEN,Map.of("message","Received Invalid Data"));
                    }


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
                                        .uri("http://PAYMENT-SERVICE/api/pay/verify")
                                        .header("X-Internal-Key", internalApiKey)
                                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                        .bodyValue(verifyBody)
                                        .retrieve()
                                        .bodyToMono(JsonNode.class)
                                        .flatMap(response ->{
                                            boolean valid = response.path("data").path("valid").asBoolean(false);
                                            if(valid)
                                            {
                                                UsageEvent event = UsageEvent.builder()
                                                        .consumerId(userId)
                                                        .endpointId(String.valueOf(endpointId))
                                                        .apiId(String.valueOf(apiId))
                                                        .providerId(String.valueOf(providerId))
                                                        .txHash(txHash)
                                                        .price(new java.math.BigDecimal(price))
                                                        .status("SUCCESS")
                                                        .build();
                                                try{
                                                    usageEventPublisher.publish(event);
                                                }catch(Exception e){
                                                    log.warn("Failed to publish event", e.getMessage());
                                                    //System.err.println("Failed to publish usage event, but continuing flow: " + e.getMessage());
                                                }

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
                    log.error("Payment verification failed on verify and forward", e);
                    //System.out.println("VERIFY ERROR: " + e.getMessage());
                    return writeJsonResponse(exchange, HttpStatus.BAD_GATEWAY,Map.of("error", "Payment verification temporary unavailable: "));
                });
    }

    private Mono<Void> forwardToProvider(ServerWebExchange exchange, String baseUrl, String endpointPath, String providerApiKey) {
        return exchange.getRequest().getBody()
                .collectList()
                .flatMap(bodyparts ->{

                   WebClient.RequestBodySpec request = externalWebClient.method(exchange.getRequest().getMethod())
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
                .onErrorResume(e->
                        {
                            log.error("verify error in forward to provider", e);
                            //System.out.println("VERIFY ERROR: " + e.getMessage());
                            return writeJsonResponse(exchange, HttpStatus.BAD_GATEWAY,
                                    Map.of("error", "Provider API unreachable"));
                        });

    }

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
                .uri("http://PROVIDER-SERVICE/api/marketplace/lookup?endpointId=" + endpointId)
                .header("X-Internal-Key", internalApiKey)
                .retrieve()
                .bodyToMono(JsonNode.class);
    }

    private Mono<String> lookupWallet(Long providerId)
    {
        return webClient.get()
                .uri("http://AUTH-SERVICE/api/auth/wallet/lookup?userId=" + providerId)
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
                "Access-Control-Allow-Origin", frontendUrl);
        exchange.getResponse().getHeaders().set(
                "Access-Control-Allow-Credentials", "true");
    }

    private Mono<Long> getApiCallsCount(String redisKey)
    {
       return reactiveStringRedisTemplate.opsForValue().increment(redisKey)
                .flatMap(currentCount->{
                    if(currentCount==1L)
                    {
                        LocalDateTime midnight = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
                        Duration duration = Duration.between(LocalDateTime.now(), midnight);
                        return reactiveStringRedisTemplate.expire(redisKey, duration)
                                .thenReturn(currentCount);
                    }
                    return Mono.just(currentCount);
                });

    }

    private Long parseEndpointId(String path)
    {
        try{
            String[] segments = path.split("/");
            if(segments.length <=3)
            {
                return null;
            }

            for(String segment : segments)
            {
                if("..".equals(segment)||segment.contains(".."))
                {
                    return null;
                }
            }

            return Long.parseLong(segments[3]);
        }
        catch (NumberFormatException | NullPointerException e)
        {
            return null;
        }
    }

    private boolean isValidEndpointData(String price, String baseUrl, String path)
    {
        return price != null && !price.isEmpty() &&
                path != null && !path.isEmpty() &&
                baseUrl != null && !baseUrl.isEmpty();
    }
}
