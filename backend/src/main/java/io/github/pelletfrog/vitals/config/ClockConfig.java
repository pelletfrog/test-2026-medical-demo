package io.github.pelletfrog.vitals.config;

import java.time.Clock;

import io.github.pelletfrog.vitals.common.TimeZones;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class ClockConfig {

	// 「今天」要用台灣的日期；注入 Clock 也讓測試能固定時間
	@Bean
	Clock clock() {
		return Clock.system(TimeZones.TAIPEI);
	}

}
