package com.x402.provider_service.controller;

import com.x402.common.dto.ApiResponse;
import com.x402.provider_service.dto.ApiDTO;
import com.x402.provider_service.service.ApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
public class MarketplaceController {

    private final ApiService apiService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ApiDTO>>> browse(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category){
                return ResponseEntity.ok(ApiResponse.ok(apiService.browseMarketplace(search,category)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApiDTO>> getApi(
            @PathVariable Long id)
    {
        return ResponseEntity.ok(ApiResponse.ok(apiService.getMarketplaceApi(id)));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health()
    {
        return  ResponseEntity.ok(ApiResponse.ok("Provider Service is running"));
    }
}
