package com.x402.payment_service.service;

import com.x402.payment_service.dto.EarningsSummaryDTO;
import com.x402.payment_service.dto.UsageLogDTO;
import com.x402.payment_service.dto.VerifyPaymentRequest;
import com.x402.payment_service.dto.VerifyPaymentResponse;
import com.x402.payment_service.entity.UsageLog;
import com.x402.payment_service.repository.UsageLogRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsageService {

    private final UsageLogRepository usageLogRepository;
    private final BlockchainService blockchainService;

    private final StringRedisTemplate stringRedisTemplate;

    public VerifyPaymentResponse verifyAndLog(VerifyPaymentRequest req) {

        String lockKey = "lock:tx" + req.getTxHash();

        Boolean isNew = stringRedisTemplate.opsForValue()
                .setIfAbsent(lockKey, "PROCESSING", Duration.ofMinutes(2));

        if (Boolean.FALSE.equals(isNew)) {
            log.warn("Replay attempt blocked by Redis: {}", req.getTxHash());
            return VerifyPaymentResponse.builder()
                    .valid(false)
                    .reason("Transaction is currently being processed or was recently submitted.")
                    .build();
        }
        try {


            if (usageLogRepository.findByTxHash(req.getTxHash()).isPresent()) {
                return VerifyPaymentResponse.builder()
                        .valid(false)
                        .reason("Transaction already used")
                        .build();
            }

            boolean valid = blockchainService.verifyPayment(req.getTxHash(), req.getProviderWallet(), req.getExpectedAmount());

            UsageLog usageLog = UsageLog.builder()
                    .consumerId(req.getConsumerId())
                    .endpointId(req.getEndpointId())
                    .apiId(req.getApiId())
                    .providerId(req.getProviderId())
                    .price(req.getExpectedAmount())
                    .txHash(req.getTxHash())
                    .status(valid ? UsageLog.PaymentStatus.CONFIRMED
                            : UsageLog.PaymentStatus.FAILED)
                    .build();

            usageLogRepository.save(usageLog);

            return VerifyPaymentResponse.builder()
                    .valid(valid)
                    .reason(valid ? "Payment verified" : "Verification failed")
                    .build();

        }
        catch (Exception e) {
            stringRedisTemplate.delete(lockKey);
            throw e;
        }
    }


    public List<UsageLogDTO> getMyUsage(Long consumerId){
        return usageLogRepository.findByConsumerIdOrderByCalledAtDesc(consumerId).stream().map(this ::toDTO).collect(Collectors.toList());
    }

    public EarningsSummaryDTO getMyEarnings(Long providerId)
    {
        var confirmed = usageLogRepository.findByProviderIdAndStatusOrderByCalledAtDesc(providerId, UsageLog.PaymentStatus.CONFIRMED);
        return EarningsSummaryDTO.builder()
                .totalEarnings(usageLogRepository.getTotalEarnings(providerId))
                .totalCalls((long) confirmed.size())
                .recentTransactions(confirmed.stream().map(this::toDTO).collect(Collectors.toList()))
                .build();
    }

    /*public List<UsageLogDTO> getMyEarnings(Long providerId){
        return usageLogRepository.findByProviderIdOrderByCalledAtDesc(providerId).stream().map(this ::toDTO).collect(Collectors.toList());
    }*/

    public List<UsageLogDTO> getApiUsage(Long apiId, Long providerId){
        //need to implement ownership check
        return usageLogRepository.findByApiIdAndProviderIdOrderByCalledAtDesc(apiId, providerId).stream()
                .map(this ::toDTO).collect(Collectors.toList());
    }

    private UsageLogDTO toDTO(UsageLog log) {
        return UsageLogDTO.builder()
                .id(log.getId())
                .consumerId(log.getConsumerId())
                .endpointId(log.getEndpointId())
                .apiId(log.getApiId())
                .providerId(log.getProviderId())
                .price(log.getPrice())
                .txHash(log.getTxHash())
                .status(log.getStatus().name())
                .calledAt(log.getCalledAt())
                .build();
    }

}
