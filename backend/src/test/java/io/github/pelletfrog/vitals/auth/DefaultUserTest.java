package io.github.pelletfrog.vitals.auth;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.pelletfrog.vitals.ApplicationYaml;
import io.github.pelletfrog.vitals.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.validation.autoconfigure.ValidationAutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.security.crypto.password.PasswordEncoder;

@IntegrationTest
class DefaultUserTest {

	@Autowired
	UserRepository userRepository;

	@Autowired
	PasswordEncoder passwordEncoder;

	@Autowired
	DefaultUserInitializer initializer;

	@Test
	@DisplayName("AUT-002 AC1 啟動時建立")
	void createdOnStartup() {
		var user = userRepository.findByUsername(IntegrationTest.ADMIN_USERNAME).orElseThrow();

		assertThat(user.getName()).isEqualTo(IntegrationTest.ADMIN_NAME);
		assertThat(user.getPasswordHash()).isNotEqualTo(IntegrationTest.ADMIN_PASSWORD);
		assertThat(passwordEncoder.matches(IntegrationTest.ADMIN_PASSWORD, user.getPasswordHash())).isTrue();
	}

	@Test
	@DisplayName("AUT-002 AC2 帳號已存在")
	void notRecreated() throws Exception {
		var before = userRepository.findByUsername(IntegrationTest.ADMIN_USERNAME).orElseThrow();

		var changed = new AdminProperties(IntegrationTest.ADMIN_USERNAME, "another-password", "改過的姓名");
		new DefaultUserInitializer(changed, userRepository, passwordEncoder).run();

		var users = userRepository.findAll().stream()
				.filter(u -> u.getUsername().equals(IntegrationTest.ADMIN_USERNAME))
				.toList();
		assertThat(users).hasSize(1);
		assertThat(users.getFirst().getPasswordHash()).isEqualTo(before.getPasswordHash());
		assertThat(users.getFirst().getName()).isEqualTo(before.getName());
	}

	// 不加 @Configuration：測試類別裡的 @Configuration 會被當成整個測試的設定
	@EnableConfigurationProperties(AdminProperties.class)
	static class AdminPropertiesOnly {
	}

	private final ApplicationContextRunner runner = ApplicationYaml.load(new ApplicationContextRunner()
			.withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))
			.withUserConfiguration(AdminPropertiesOnly.class));

	@Test
	@DisplayName("AUT-002 AC3 帳號設定不正確")
	void invalidSettings() {
		// 沒設定
		runner.withPropertyValues("ADMIN_PASSWORD=pw", "ADMIN_NAME=林小護")
				.run(context -> assertThat(context).getFailure()
						.hasStackTraceContaining("ADMIN_USERNAME 未設定"));
		runner.withPropertyValues("ADMIN_USERNAME=nurse01", "ADMIN_PASSWORD=pw")
				.run(context -> assertThat(context).getFailure()
						.hasStackTraceContaining("ADMIN_NAME 未設定"));

		// 空白也算沒設定
		runner.withPropertyValues("ADMIN_USERNAME=nurse01", "ADMIN_PASSWORD=", "ADMIN_NAME=林小護")
				.run(context -> assertThat(context).getFailure()
						.hasStackTraceContaining("ADMIN_PASSWORD 未設定"));

		// 帳號超過 50 個字
		runner.withPropertyValues("ADMIN_USERNAME=" + "a".repeat(51), "ADMIN_PASSWORD=pw", "ADMIN_NAME=林小護")
				.run(context -> assertThat(context).getFailure()
						.hasStackTraceContaining("ADMIN_USERNAME 最多 50 個字"));

		// 密碼超過 64 個字
		runner.withPropertyValues("ADMIN_USERNAME=nurse01", "ADMIN_PASSWORD=" + "p".repeat(65), "ADMIN_NAME=林小護")
				.run(context -> assertThat(context).getFailure()
						.hasStackTraceContaining("ADMIN_PASSWORD 最多 64 個字"));

		// 25 個中文字是 75 byte：沒超過 64 個字，但超過 BCrypt 的 72 byte
		runner.withPropertyValues("ADMIN_USERNAME=nurse01", "ADMIN_PASSWORD=" + "密".repeat(25), "ADMIN_NAME=林小護")
				.run(context -> assertThat(context).getFailure()
						.hasStackTraceContaining("ADMIN_PASSWORD 超過 72 byte"));

		// 都正確時可以啟動
		runner.withPropertyValues("ADMIN_USERNAME=nurse01", "ADMIN_PASSWORD=pw", "ADMIN_NAME=林小護")
				.run(context -> assertThat(context).hasNotFailed());
	}

}
