package com.x402.payment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor
@AllArgsConstructor
@Builder
public class EarningsSummaryDTO {
    private BigDecimal totalEarnings;
    private Long totalCalls;
    private List<UsageLogDTO> recentTransactions;
}
