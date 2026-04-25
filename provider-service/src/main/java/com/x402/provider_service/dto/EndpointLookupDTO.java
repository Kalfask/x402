package com.x402.provider_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EndpointLookupDTO implements Serializable {
    private Long id;
    private Long providerId;
    private Long apiId;
    private String path;
    private String method;
    private BigDecimal pricePerCall;
    private String baseUrl;
    private String providerApiKey;
}
