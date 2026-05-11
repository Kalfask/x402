package com.x402.payment_service.service;

import com.x402.common.dto.UsageEvent;
import com.x402.payment_service.entity.UsageLog;
import com.x402.payment_service.repository.UsageLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UsageEventConsumer {
    private final UsageLogRepository usageLogRepository;

    @RabbitListener(queues = "x402.usage.log")
    public void consumerUsageEvent(UsageEvent event) {
        log.info("""
                        
                        =============================================\
                        
                        📥 PAYMENT SERVICE: Received message from RabbitMQ!\
                        
                        Consumer ID: {}\
                        
                        Endpoint ID: {}\
                        
                        Price Paid:  ${}\
                        
                        =============================================""",
                event.getConsumerId(),
                event.getEndpointId(),
                event.getPrice());
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
