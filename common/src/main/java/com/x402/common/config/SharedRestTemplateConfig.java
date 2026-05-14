package com.x402.common.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;

@Configuration
public class SharedRestTemplateConfig {

    @Bean
    @ConditionalOnMissingBean(RestTemplate.class)
    @LoadBalanced
    public RestTemplate defaultRestTemplate()
    {
        return new RestTemplate();
    }
}
