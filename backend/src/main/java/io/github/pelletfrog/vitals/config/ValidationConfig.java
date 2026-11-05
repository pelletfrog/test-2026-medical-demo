package io.github.pelletfrog.vitals.config;

import java.time.Clock;

import org.springframework.boot.validation.autoconfigure.ValidationConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class ValidationConfig {

	// @PastOrPresent 等時間的驗證預設用系統時鐘；改用注入的 Clock，和 conventions §1.8 一致，測試也能固定時間
	@Bean
	ValidationConfigurationCustomizer clockProvider(Clock clock) {
		return configuration -> configuration.clockProvider(() -> clock);
	}

}
