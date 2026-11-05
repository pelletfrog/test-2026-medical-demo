package io.github.pelletfrog.vitals.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.pelletfrog.vitals.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class LogoutTest {

	@Autowired
	MockMvc mockMvc;

	@Test
	@DisplayName("AUT-004 AC1 登出")
	void logout() throws Exception {
		Cookie token = AuthTestSupport.login(mockMvc);

		var response = mockMvc.perform(post("/api/auth/logout").cookie(token))
				.andExpect(status().isNoContent())
				// Path 要和登入時相同，瀏覽器才會刪掉同一個 cookie
				.andExpect(cookie().maxAge(AuthCookies.NAME, 0))
				.andExpect(cookie().path(AuthCookies.NAME, "/api"))
				.andReturn()
				.getResponse();

		// 帶著登出回應給的 cookie 再讀資料，等於瀏覽器照 Set-Cookie 更新後的狀態
		Cookie cleared = response.getCookie(AuthCookies.NAME);
		assertThat(cleared.getValue()).isEmpty();
		mockMvc.perform(get("/api/auth/me").cookie(cleared))
				.andExpect(status().isUnauthorized());
	}

}
