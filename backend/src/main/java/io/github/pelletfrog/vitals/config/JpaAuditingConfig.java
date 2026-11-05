package io.github.pelletfrog.vitals.config;

import java.time.Clock;
import java.util.Optional;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing(auditorAwareRef = "auditorAware", dateTimeProviderRef = "auditingDateTimeProvider")
public class JpaAuditingConfig {

	// JWT 的 sub 是使用者 id，見登入 spec §5
	@Bean
	AuditorAware<Long> auditorAware() {
		return () -> {
			if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken jwt) {
				return Optional.of(Long.valueOf(jwt.getToken().getSubject()));
			}
			// 沒有登入者，例如啟動時建立預設帳號
			return Optional.empty();
		};
	}

	// 預設會用 LocalDateTime 取現在時間；改用注入的 Clock，欄位才能是 Instant，測試也能固定時間
	@Bean
	DateTimeProvider auditingDateTimeProvider(Clock clock) {
		return () -> Optional.of(clock.instant());
	}

}
