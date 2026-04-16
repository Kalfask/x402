package com.x402.provider_service.service;

import com.x402.provider_service.dto.*;

import java.util.List;

public interface ApiService {

    // === Provider Operations (require ownership)
    ApiDTO createApi(Long providerId, CreateApiRequest request);
    ApiDTO updateApi(Long providerId, Long apiId, UpdateRequest request);
    ApiDTO updateApiStatus(Long providerId, Long apiId, String status);
    List<ApiDTO> getMyApis(Long providerId);
    ApiDTO getApiById( Long apiId);


    // === EndpointManagement (require api ownership)
    EndpointDTO addEndpoint(Long providerId, Long apiId, CreateEndpointRequest request);
    EndpointDTO updateEndpoint(Long providerId, Long endpointId, UpdateEndpointRequest request);
    void deleteEndpoint(Long providerId, Long endpointId);


    // === Marketplace (public) ===
    List<ApiDTO> browseMarketplace(String search, String category);
    ApiDTO getMarketplaceApi(Long apiId);

    EndpointDTO getEndpointById(Long endpointId);
}
