package io.github.pelletfrog.vitals.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.pelletfrog.vitals.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class MeTest {

	@Autowired
	MockMvc mockMvc;

	@Test
	@DisplayName("AUT-005 AC1 顯示姓名")
	void showsName() throws Exception {
		mockMvc.perform(get("/api/auth/me").cookie(AuthTestSupport.login(mockMvc)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.username").value(IntegrationTest.ADMIN_USERNAME))
				.andExpect(jsonPath("$.name").value(IntegrationTest.ADMIN_NAME))
				.andExpect(jsonPath("$.passwordHash").doesNotExist());
	}

}
