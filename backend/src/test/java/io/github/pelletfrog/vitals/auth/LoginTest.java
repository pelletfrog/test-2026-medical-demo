package io.github.pelletfrog.vitals.auth;

import static io.github.pelletfrog.vitals.auth.AuthTestSupport.loginJson;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.pelletfrog.vitals.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class LoginTest {

	@Autowired
	MockMvc mockMvc;

	@Test
	@DisplayName("AUT-001 AC1 登入成功")
	void loginSucceeds() throws Exception {
		var response = mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginJson(IntegrationTest.ADMIN_USERNAME, IntegrationTest.ADMIN_PASSWORD)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value(IntegrationTest.ADMIN_USERNAME))
				.andExpect(jsonPath("$.name").value(IntegrationTest.ADMIN_NAME))
				.andExpect(cookie().httpOnly(AuthCookies.NAME, true))
				.andExpect(cookie().path(AuthCookies.NAME, "/api"))
				.andReturn()
				.getResponse();

		assertThat(response.getHeader(HttpHeaders.SET_COOKIE)).contains("SameSite=Strict");

		// 拿到的 cookie 要能通過驗證，才算真的登入
		Cookie token = response.getCookie(AuthCookies.NAME);
		mockMvc.perform(get("/api/auth/me").cookie(token))
				.andExpect(status().isOk());
	}

	@Test
	@DisplayName("AUT-001 AC2 帳號或密碼錯誤")
	void invalidCredentials() throws Exception {
		for (String body : new String[] {
				loginJson(IntegrationTest.ADMIN_USERNAME, "wrong-password"),
				loginJson("no-such-user", IntegrationTest.ADMIN_PASSWORD),
				// 30 個中文字是 90 byte：沒超過 64 個字，但超過 BCrypt 的 72 byte，不可能是正確的密碼
				loginJson(IntegrationTest.ADMIN_USERNAME, "密".repeat(30)) }) {
			mockMvc.perform(post("/api/auth/login")
							.contentType(MediaType.APPLICATION_JSON)
							.content(body))
					.andExpect(status().isUnauthorized())
					.andExpect(jsonPath("$.detail").value("帳號或密碼錯誤"))
					.andExpect(jsonPath("$.errors").doesNotExist())
					.andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
		}
	}

	@Test
	@DisplayName("AUT-001 AC3 欄位空白")
	void blankFields() throws Exception {
		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginJson(" ", "")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("請修正標示的欄位"))
				.andExpect(jsonPath("$.errors.username").value("請輸入帳號"))
				.andExpect(jsonPath("$.errors.password").value("請輸入密碼"));
	}

	@Test
	@DisplayName("AUT-001 AC4 超過字數")
	void tooLong() throws Exception {
		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginJson("a".repeat(51), "p".repeat(65))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.username").value("帳號最多 50 個字"))
				.andExpect(jsonPath("$.errors.password").value("密碼最多 64 個字"));

		// 剛好在上限內不算錯，只是帳密不對
		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginJson("a".repeat(50), "p".repeat(64))))
				.andExpect(status().isUnauthorized());
	}

}
