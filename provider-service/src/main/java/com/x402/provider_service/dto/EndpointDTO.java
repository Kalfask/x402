package com.x402.provider_service.dto;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EndpointDTO {
    private Long id;
    private Long providerId;
    private Long apiId;
    private String path;
    private String method;
    private String description;
    private BigDecimal pricePerCall;
    private Boolean isActive;
    private String baseUrl;
    private String providerApiKey;
}