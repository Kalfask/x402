package com.x402.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsageEvent {

    private String consumerId;
    private String endpointId;
    private String apiId;
    private String providerId;
    private String txHash;
    private BigDecimal price;
    private String status;
    //private boolean valid;
}
