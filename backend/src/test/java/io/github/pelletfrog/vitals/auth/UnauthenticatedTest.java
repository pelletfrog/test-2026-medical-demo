package io.github.pelletfrog.vitals.auth;

import static io.github.pelletfrog.vitals.auth.AuthTestSupport.loginJson;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import io.github.pelletfrog.vitals.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class UnauthenticatedTest {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JwtEncoder jwtEncoder;

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
		mockMvc.perform(post("/api/auth/login")
						.cookie(expired)
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginJson(IntegrationTest.ADMIN_USERNAME, IntegrationTest.ADMIN_PASSWORD)))
				.andExpect(status().isOk());
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
