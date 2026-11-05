package io.github.pelletfrog.vitals.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.pelletfrog.vitals.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 需要登入的測試共用：之後病患、生命徵象的 API 都要先登入才能呼叫。
 */
public final class AuthTestSupport {

	private AuthTestSupport() {
	}

	public static String loginJson(String username, String password) {
		return """
				{"username": "%s", "password": "%s"}
				""".formatted(username, password);
	}

	/** 用預設帳號登入，回傳登入憑證的 cookie */
	public static Cookie login(MockMvc mockMvc) throws Exception {
		return mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginJson(IntegrationTest.ADMIN_USERNAME, IntegrationTest.ADMIN_PASSWORD)))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getCookie(AuthCookies.NAME);
	}

}
