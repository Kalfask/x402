package com.x402.provider_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor @AllArgsConstructor
public class CreateEndpointRequest {

    @NotBlank(message = "Path is required")
    private String path;

    @NotBlank(message = "Method is required")
    private String method;

    private String description;

    @NotNull(message = "Price is required")
    private BigDecimal pricePerCall;
}
