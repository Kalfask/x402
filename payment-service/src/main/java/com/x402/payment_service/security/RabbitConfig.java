package com.x402.payment_service.security;


import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String QUEUE_NAME = "x402.usage.log";
    public static final String EXCHANGE_NAME = "x402.exchange";
    public static final String ROUTING_KEY = "usage.log";

    @Bean
    public Queue usageLogQueue(){
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    public DirectExchange x402Exchange(){
        return new DirectExchange(EXCHANGE_NAME);
    }

    @Bean
    public Binding binding(Queue usageLogQueue, DirectExchange x402Exchange){
        return BindingBuilder
                .bind(usageLogQueue)
                .to(x402Exchange)
                .with(ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter()
    {
        return new Jackson2JsonMessageConverter();
    }
}
