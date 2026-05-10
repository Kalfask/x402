package com.x402.common.security;

import com.x402.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import org.springframework.http.HttpHeaders;

import java.util.Map;

@Component
@RequiredArgsConstructor
@ConditionalOnBean(RestTemplate.class)
public class ApiKeyValidator {

    @Value("${app.services.auth-url:http://localhost:8081}")
    private String authUrl;

    private final RestTemplate restTemplate;

    public boolean isValid(String apiKey)
    {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Api-Key", apiKey);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    authUrl+"/api/auth/validate-key",
                    HttpMethod.GET, entity, Map.class
            );
            if(response.getStatusCode().is2xxSuccessful()&&response.getBody()!=null){
                Map<String,Object> body = response.getBody();
                Map<String,Object> data = (Map<String, Object>) body.get("data");
                if(data!=null && Boolean.TRUE.equals(data.get("valid"))){
                    return true;
                }
            }
        }
        catch (Exception e) {
            System.err.println("API Key validation failed: " + e.getMessage());
        }
        return false;
    }
}
