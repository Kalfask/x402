package com.x402.payment_service.service;

import com.x402.common.dto.UsageEvent;
import com.x402.payment_service.entity.UsageLog;
import com.x402.payment_service.repository.UsageLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UsageEventConsumer {
    private final UsageLogRepository usageLogRepository;

    @RabbitListener(queues = "x402.usage.log")
    public void consumerUsageEvent(UsageEvent event) {
        System.out.println("\n=============================================");
        System.out.println("📥 PAYMENT SERVICE: Received message from RabbitMQ!");
        System.out.println("Consumer ID: " + event.getConsumerId());
        System.out.println("Endpoint ID: " + event.getEndpointId());
        System.out.println("Price Paid:  $" + event.getPrice());
        System.out.println("=============================================\n");
        if(usageLogRepository.findByTxHash(event.getTxHash()).isPresent()){
            System.out.println("Already logged (sync), skipping: " + event.getTxHash());
            return;
        }
        UsageLog usageLog = UsageLog.builder()
                .consumerId(Long.parseLong(event.getConsumerId()))
                .endpointId(Long.parseLong(event.getEndpointId()))
                .apiId(Long.parseLong(event.getApiId()))
                .providerId(Long.parseLong(event.getProviderId()))
                .price(event.getPrice())
                .txHash(event.getTxHash())
                .status(UsageLog.PaymentStatus.CONFIRMED)
                .build();
        usageLogRepository.save(usageLog);

    }
}
