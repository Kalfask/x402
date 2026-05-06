package com.x402.common.security;

import com.x402.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import org.springframework.http.HttpHeaders;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ApiKeyValidator {

    private final RestTemplate restTemplate;

    public boolean isValid(String apiKey)
    {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Api-Key", apiKey);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    "http://localhost:8081/api/auth/validate-key",
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
