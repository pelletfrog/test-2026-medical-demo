package io.github.pelletfrog.vitals.auth;

import static io.github.pelletfrog.vitals.auth.AuthTestSupport.loginJson;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import io.github.pelletfrog.vitals.ApplicationYaml;
import io.github.pelletfrog.vitals.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.validation.autoconfigure.ValidationAutoConfiguration;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class UnauthenticatedTest {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JwtEncoder jwtEncoder;

	@Autowired
	JwtDecoder jwtDecoder;

	@Autowired
	JwtProperties jwtProperties;

	@Autowired
	UserRepository userRepository;

	@Test
	@DisplayName("AUT-003 AC1 未登入不能讀取資料")
	void rejectedWithoutLogin() throws Exception {
		// 病患 API 還沒做，用 me 和任意的 /api 路徑代表需要登入的 API
		for (String path : new String[] { "/api/auth/me", "/api/patients" }) {
			mockMvc.perform(get(path))
					.andExpect(status().isUnauthorized())
					.andExpect(jsonPath("$.detail").value("請先登入"));
		}

		// 亂填的 cookie 也一樣
		mockMvc.perform(get("/api/auth/me").cookie(new Cookie(AuthCookies.NAME, "not-a-jwt")))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("AUT-003 AC3 登入過期")
	void expired() throws Exception {
		Long userId = userRepository.findByUsername(IntegrationTest.ADMIN_USERNAME).orElseThrow().getId();

		// 用超過有效期限 5 分鐘的時鐘簽發（驗證時允許 1 分鐘的時鐘誤差），模擬登入已超過有效期限
		Instant longAgo = Instant.now().minus(jwtProperties.expiry()).minus(Duration.ofMinutes(5));
		var tokens = new TokenService(jwtEncoder, jwtProperties, Clock.fixed(longAgo, ZoneId.of("UTC")));
		Cookie expired = new Cookie(AuthCookies.NAME, tokens.issue(userId));

		mockMvc.perform(get("/api/auth/me").cookie(expired))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.detail").value("請先登入"));

		// 帶著過期的 cookie 仍然可以重新登入，不會被擋在登入 API 外面
		Cookie renewed = mockMvc.perform(post("/api/auth/login")
						.cookie(expired)
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginJson(IntegrationTest.ADMIN_USERNAME, IntegrationTest.ADMIN_PASSWORD)))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getCookie(AuthCookies.NAME);

		// 重新登入後可以繼續使用
		mockMvc.perform(get("/api/auth/me").cookie(renewed))
				.andExpect(status().isOk());
	}

	// 不加 @Configuration：測試類別裡的 @Configuration 會被當成整個測試的設定
	@EnableConfigurationProperties(JwtProperties.class)
	static class JwtPropertiesOnly {
	}

	@Test
	@DisplayName("AUT-003 AC3 登入過期：沒設定 JWT_EXPIRY 時為 12 小時")
	void defaultExpiryIs12Hours() {
		// 整合測試會讀到開發者 .env 的 JWT_EXPIRY，所以另外只用 application.yaml 檢查預設值
		ApplicationYaml.load(new ApplicationContextRunner()
						.withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))
						.withUserConfiguration(JwtPropertiesOnly.class))
				.withPropertyValues("JWT_SECRET=test-only-secret-for-integration-tests-32b")
				.run(context -> assertThat(context.getBean(JwtProperties.class).expiry())
						.isEqualTo(Duration.ofHours(12)));
	}

	@Test
	@DisplayName("AUT-003 AC3 登入過期：cookie 與登入憑證都照設定的有效期限")
	void cookieAndTokenUseExpiry() throws Exception {
		Cookie token = AuthTestSupport.login(mockMvc);

		assertThat(token.getMaxAge()).isEqualTo(jwtProperties.expiry().toSeconds());
		Jwt jwt = jwtDecoder.decode(token.getValue());
		assertThat(Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt())).isEqualTo(jwtProperties.expiry());
	}

	@Test
	@DisplayName("AUT-003 AC3 登入過期：有效期限內仍可使用")
	void notYetExpired() throws Exception {
		Long userId = userRepository.findByUsername(IntegrationTest.ADMIN_USERNAME).orElseThrow().getId();

		Instant justInside = Instant.now().minus(jwtProperties.expiry()).plus(Duration.ofMinutes(5));
		var tokens = new TokenService(jwtEncoder, jwtProperties, Clock.fixed(justInside, ZoneId.of("UTC")));

		mockMvc.perform(get("/api/auth/me").cookie(new Cookie(AuthCookies.NAME, tokens.issue(userId))))
				.andExpect(status().isOk());
	}

}
