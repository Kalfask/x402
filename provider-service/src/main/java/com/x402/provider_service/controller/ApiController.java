package com.x402.provider_service.controller;

import com.x402.common.dto.ApiResponse;
import com.x402.provider_service.dto.*;
import com.x402.provider_service.service.ApiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/provider")
@RequiredArgsConstructor
public class ApiController {

    private final ApiService apiService;

    //Helper

    private Long getUserId(Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }

    //Api Crud
    @PostMapping("/apis")
    public ResponseEntity<ApiResponse<ApiDTO>> createApi(
            @Valid @RequestBody CreateApiRequest request,
            Authentication authentication
            )
    {
        ApiDTO api = apiService.createApi(getUserId(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(api));
    }

    @GetMapping("/apis/mine")
    public ResponseEntity<ApiResponse<List<ApiDTO>>> getMyApis(Authentication authentication) {
        return ResponseEntity.ok(
                ApiResponse.ok(apiService.getMyApis(getUserId(authentication))));
    }

    @GetMapping("/apis/{id}")
    public ResponseEntity<ApiResponse<ApiDTO>> getApi(
            @PathVariable Long id){
        return ResponseEntity.ok(ApiResponse.ok(apiService.getApiById(id)));
    }

    @PutMapping("/apis/{id}")
    public ResponseEntity<ApiResponse<ApiDTO>> updateApi(
            @PathVariable Long id,
            @RequestBody UpdateRequest request,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(
                apiService.updateApi(getUserId(auth), id, request)));
    }


    @PatchMapping("/apis/{id}/status")
    public ResponseEntity<ApiResponse<ApiDTO>> updateApiStatus(@PathVariable Long id,
                                                               @RequestBody Map<String, String> body,
                                                               Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(apiService.updateApiStatus(getUserId(auth),id,body.get("status"))));
    }


    //Endpoint Management

    @PostMapping("/apis/{apiId}/endpoints")
    public ResponseEntity<ApiResponse<EndpointDTO>> addEndpoint(
            @PathVariable Long apiId,
            @Valid @RequestBody CreateEndpointRequest request,
            Authentication authentication
            )
    {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse
                .ok(apiService.addEndpoint(getUserId(authentication), apiId, request)));
    }

    @PutMapping("/endpoints/{id}")
    public ResponseEntity<ApiResponse<EndpointDTO>> updateEndpoint(
            @PathVariable Long Id,
            @Valid @RequestBody UpdateEndpointRequest request,
            Authentication authentication
    )
    {
        return ResponseEntity.ok(ApiResponse.ok(apiService.updateEndpoint(getUserId(authentication), Id, request)));
    }

    @DeleteMapping("/endpoints/{id}")
    public ResponseEntity<ApiResponse<String>> deleteEndpoint(
            @PathVariable Long id,
            Authentication authentication
    )
    {
        apiService.deleteEndpoint(getUserId(authentication), id);
        return ResponseEntity.ok(ApiResponse.ok("Endpoint Deleted"));
    }

}
