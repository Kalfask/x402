package com.x402.payment_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyPaymentRequest {
   @NotBlank private String txHash;
   @NotNull private Long consumerId;
   @NotNull private Long endpointId;
   @NotNull private Long apiId;
   @NotNull private Long providerId;
   @NotBlank private String providerWallet;
   @NotNull private BigDecimal expectedAmount;
}
