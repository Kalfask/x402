package com.x402.provider_service.service;

import com.x402.common.exceptions.ResourceNotFoundException;
import com.x402.common.exceptions.UnauthorizedException;
import com.x402.provider_service.dto.*;
import com.x402.provider_service.entity.Api;
import com.x402.provider_service.entity.Endpoint;
import com.x402.provider_service.repository.ApiRepository;
import com.x402.provider_service.repository.EndpointRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApiServiceImpl implements ApiService{

    private final ApiRepository apiRepository;
    private final EndpointRepository endpointRepository;


    //Provider Operations

    @Override
    @Transactional
    public ApiDTO createApi(Long providerId, CreateApiRequest request)
    {
        Api api = Api.builder()
                .providerId(providerId)
                .name(request.getName())
                .description(request.getDescription())
                .baseUrl(request.getBaseUrl())
                .category(request.getCategory())
                .providerApiKey(request.getProviderApiKey())
                .build();

        return toDTO(apiRepository.save(api));
    }

    @Override
    @Transactional
    public ApiDTO updateApi(Long providerId, Long apiId, UpdateRequest request)
    {
        Api api = getOwnedApi(providerId, apiId);
        if(request.getName() != null) api.setName(request.getName());
        if(request.getDescription() != null) api.setDescription(request.getDescription());
        if(request.getBaseUrl() != null) api.setBaseUrl(request.getBaseUrl());
        if(request.getCategory() != null) api.setCategory(request.getCategory());
        if(request.getProviderApiKey() != null) api.setProviderApiKey(request.getProviderApiKey());
        return toDTO(apiRepository.save(api));
    }

    @Override
    @Transactional
    public ApiDTO updateApiStatus(Long providerId, Long apiId, String status)
    {
        Api api = getOwnedApi(providerId, apiId);
        api.setStatus(Api.Status.valueOf(status.toUpperCase()));
        return toDTO(apiRepository.save(api));
    }

    @Override
    public List<ApiDTO> getMyApis(Long providerId)
    {
        return apiRepository.findByProviderId(providerId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ApiDTO getApiById(Long apiId)
    {
        Api api = apiRepository.findById(apiId).orElseThrow(() -> new ResourceNotFoundException("Api not found"));
        return toDTO(api);
    }



    //Endpoint management
    @Override
    @Transactional
    public EndpointDTO addEndpoint(Long providerId, Long endpointId, CreateEndpointRequest request)
    {
        Api api = getOwnedApi(providerId, endpointId);
        Endpoint endpoint = Endpoint.builder()
                .api(api)
                .path(request.getPath())
                .method(Endpoint.HttpMethod.valueOf(request.getMethod().toUpperCase()))
                .description(request.getDescription())
                .pricePerCall(request.getPricePerCall())
                .build();

        return toEndpointDTO(endpointRepository.save(endpoint));
    }

    @Override
    @Transactional
    public EndpointDTO updateEndpoint(Long providerId, Long endpointId, UpdateEndpointRequest request)
    {
        Endpoint endpoint = getOwnedEndpoint(providerId, endpointId);

        if(request.getPath() != null) endpoint.setPath(request.getPath());
        if(request.getMethod()!=null) endpoint.setMethod(Endpoint.HttpMethod.valueOf(request.getMethod().toUpperCase()));
        if(request.getDescription()!=null) endpoint.setDescription(request.getDescription());
        if(request.getPricePerCall()!=null) endpoint.setPricePerCall(request.getPricePerCall());
        if(request.getIsActive()!=null) endpoint.setIsActive(request.getIsActive());
        return toEndpointDTO(endpointRepository.save(endpoint));
    }

    public void deleteEndpoint(Long providerId, Long endpointId)
    {
        Endpoint endpoint = getOwnedEndpoint(providerId, endpointId);
        endpointRepository.delete(endpoint);
    }

    public EndpointDTO getEndpointById(Long endpointId)
    {
        return toEndpointDTO(endpointRepository.findById(endpointId).orElseThrow(() -> new ResourceNotFoundException("Endpoint not found")));
    }

    //Marketplace (Public)

    @Override
    public List<ApiDTO> browseMarketplace(String search, String category)
    {
        List<Api> apis;
        if(search != null && !search.isBlank())
        {
            apis = apiRepository.findByStatusAndNameContainingIgnoreCase(Api.Status.ACTIVE, search);
        } else if (category != null && !category.isBlank()) {
            apis = apiRepository.findByStatusAndCategory(Api.Status.ACTIVE, category);
        }
        else
        {
            apis = apiRepository.findByStatus(Api.Status.ACTIVE);
        }
        return apis.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public ApiDTO getMarketplaceApi(Long apiId)
    {
        Api api = apiRepository.findById(apiId).orElseThrow(() -> new ResourceNotFoundException("Api not found"));
        if (!api.getStatus().equals(Api.Status.ACTIVE))
        {
            throw new UnauthorizedException("Api not active");
        }
        return toDTO(api);
    }



    //Helpers

    private Api getOwnedApi(Long providerId, Long apiId) {
        Api api = apiRepository.findById(apiId)
                .orElseThrow(() -> new ResourceNotFoundException("API not found"));
        if (!api.getProviderId().equals(providerId)) {
            throw new UnauthorizedException("You don't own this API");
        }
        return api;
    }
    private Endpoint getOwnedEndpoint(Long providerId, Long endpointId) {
        Endpoint ep = endpointRepository.findById(endpointId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Endpoint not found"));
        if (!ep.getApi().getProviderId().equals(providerId)) {
            throw new UnauthorizedException("You don't own this endpoint");
        }
        return ep;
    }

    private ApiDTO toDTO(Api api) {
        return ApiDTO.builder()
                .id(api.getId())
                .providerId(api.getProviderId())
                .name(api.getName())
                .description(api.getDescription())
                .baseUrl(api.getBaseUrl())
                .category(api.getCategory())
                .status(api.getStatus().name())
                .endpoints(api.getEndpoints().stream()
                        .map(this::toEndpointDTO)
                        .collect(Collectors.toList()))
                .createdAt(api.getCreatedAt())
                .updatedAt(api.getUpdatedAt())
                .build();
    }
    private EndpointDTO toEndpointDTO(Endpoint ep) {
        return EndpointDTO.builder()
                .id(ep.getId())
                .providerId(ep.getApi().getProviderId())
                .apiId(ep.getApi().getId())
                .path(ep.getPath())
                .method(ep.getMethod().name())
                .description(ep.getDescription())
                .pricePerCall(ep.getPricePerCall())
                .isActive(ep.getIsActive())
                .baseUrl(ep.getApi().getBaseUrl())
                .providerApiKey(ep.getApi().getProviderApiKey())
                .build();
    }

}
