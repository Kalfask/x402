package com.x402.payment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UsageLogDTO {
    private Long id;
    private Long consumerId;
    private Long endpointId;
    private Long apiId;
    private Long providerId;
    private BigDecimal price;
    private String txHash;
    private String status;
    private LocalDateTime calledAt;
}
