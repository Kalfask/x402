package com.x402.provider_service.dto;
import lombok.*;
import java.math.BigDecimal;


@Data
@NoArgsConstructor @AllArgsConstructor
public class UpdateEndpointRequest {

    private String path;
    private String method;
    private String description;
    private BigDecimal pricePerCall;
    private Boolean isActive;

}
