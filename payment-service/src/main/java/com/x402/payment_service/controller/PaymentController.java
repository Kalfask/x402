package com.x402.payment_service.controller;

import com.x402.common.dto.ApiResponse;
import com.x402.payment_service.dto.EarningsSummaryDTO;
import com.x402.payment_service.dto.UsageLogDTO;
import com.x402.payment_service.dto.VerifyPaymentRequest;
import com.x402.payment_service.dto.VerifyPaymentResponse;
import com.x402.payment_service.service.UsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pay")
@RequiredArgsConstructor
public class PaymentController {
    private final UsageService usageService;

    @Value("${app.internal-api-key}")
    private String internalApiKey;

    private Long getUserId(Authentication authentication) {
        return Long.parseLong(authentication.getName());
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<VerifyPaymentResponse>> verify(
            @RequestBody VerifyPaymentRequest req,
            @RequestHeader("X-Internal-Key") String apiKey) {
        if(!apiKey.equals(internalApiKey))
        {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Invalid internal key", "FORBIDDEN"));
        }
        VerifyPaymentResponse result = usageService.verifyAndLog(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/usage/me")
    public ResponseEntity<ApiResponse<List<UsageLogDTO>>> myUsage(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(usageService.getMyUsage(getUserId(authentication))));
    }

    @GetMapping("/earnings/me")
    public ResponseEntity<ApiResponse<EarningsSummaryDTO>> myEarnings(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(usageService.getMyEarnings(getUserId(authentication))));
    }

    @GetMapping("/usage/api/{apiId}")
    public ResponseEntity<ApiResponse<List<UsageLogDTO>>> apiUsage(Authentication authentication, @PathVariable Long apiId) {
        return ResponseEntity.ok(ApiResponse.ok(usageService.getApiUsage(apiId, getUserId(authentication))));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.ok("Payment Service is running"));
    }


}
