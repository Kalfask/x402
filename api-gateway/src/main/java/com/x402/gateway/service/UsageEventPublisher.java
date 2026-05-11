package com.x402.gateway.service;

import com.x402.gateway.dto.UsageEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsageEventPublisher {
    private final RabbitTemplate rabbitTemplate;

    private static final String EXCHANGE_NAME = "x402.exchange";
    private static final String ROUTING_KEY = "usage.log";

    public void publish(UsageEvent usageEvent) {
        rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY, usageEvent);
        log.info("Usage event published: {}", usageEvent);
        //System.out.println("📤 GATEWAY: Sent usage log to RabbitMQ for consumer: " + usageEvent.getConsumerId());
    }

}
