package com.x402.provider_service.dto;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ApiDTO {
    private Long id;
    private Long providerId;
    private String name;
    private String description;
    private String baseUrl;
    private String category;
    private String status;
    private List<EndpointDTO> endpoints;
    private String providerApiKey;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
