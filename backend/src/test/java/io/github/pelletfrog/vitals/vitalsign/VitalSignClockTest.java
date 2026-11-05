package io.github.pelletfrog.vitals.vitalsign;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import io.github.pelletfrog.vitals.config.ValidationConfig;
import io.github.pelletfrog.vitals.vitalsign.dto.VitalSignCreateRequest;
import jakarta.validation.Validator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.validation.autoconfigure.ValidationAutoConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * 「不能晚於現在」要用注入的 Clock 判斷，見生命徵象 spec §5。
 * 只載入驗證相關的設定，換成固定的時鐘：整個應用程式換時鐘的話，登入的 JWT 也會跟著過期。
 */
class VitalSignClockTest {

	// 台灣時間 2026-01-01 08:00
	private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

	static class FixedClock {

		@Bean
		Clock clock() {
			return Clock.fixed(NOW, ZoneId.of("Asia/Taipei"));
		}

	}

	private final ApplicationContextRunner runner = new ApplicationContextRunner()
			.withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))
			.withUserConfiguration(FixedClock.class, ValidationConfig.class);

	private static VitalSignCreateRequest at(Instant measuredAt) {
		BigDecimal n = new BigDecimal("78");
		return new VitalSignCreateRequest(1L, measuredAt, new BigDecimal("36.8"), n, n, n, n, n);
	}

	@Test
	@DisplayName("VIT-003 AC6 記錄時間不能是未來：用注入的 Clock 判斷")
	void usesInjectedClock() {
		runner.run(context -> {
			Validator validator = context.getBean(Validator.class);
			// 現在這一分鐘可以，下一分鐘不行
			assertThat(validator.validate(at(NOW))).isEmpty();
			assertThat(validator.validate(at(NOW.plusSeconds(60))))
					.extracting(v -> v.getMessage())
					.containsExactly("記錄時間不能晚於現在");
		});
	}

}
