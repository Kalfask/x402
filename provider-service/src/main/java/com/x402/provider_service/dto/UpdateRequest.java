package com.x402.provider_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor @AllArgsConstructor
public class UpdateRequest {

    private String name;
    private String description;
    private String baseUrl;
    private String category;
}
