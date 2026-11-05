package io.github.pelletfrog.vitals.auth;

import static io.github.pelletfrog.vitals.auth.AuthTestSupport.loginJson;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import io.github.pelletfrog.vitals.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * data-model.md 的使用者欄位約束，以及 conventions.md §1.7 的軟刪除規則。
 * 每個測試用自己的帳號，互不影響。
 */
@IntegrationTest
class UserDataTest {

	@Autowired
	UserRepository userRepository;

	@Autowired
	PasswordEncoder passwordEncoder;

	@Autowired
	TransactionTemplate tx;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	MockMvc mockMvc;

	private User newUser(String username) {
		return new User(username, passwordEncoder.encode("pw-" + username), "測試用");
	}

	private void softDelete(String username) {
		tx.executeWithoutResult(status -> {
			userRepository.delete(userRepository.findByUsername(username).orElseThrow());
		});
	}

	@Test
	@DisplayName("data-model users.username 唯一，含已刪除的資料")
	void usernameUniqueIncludingDeleted() {
		userRepository.saveAndFlush(newUser("dup-user"));
		assertThatThrownBy(() -> userRepository.saveAndFlush(newUser("dup-user")))
				.isInstanceOf(DataIntegrityViolationException.class);

		softDelete("dup-user");
		assertThatThrownBy(() -> userRepository.saveAndFlush(newUser("dup-user")))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("data-model users.username 最多 50 個字")
	void usernameMaxLength() {
		userRepository.saveAndFlush(newUser("b".repeat(50)));
		assertThatThrownBy(() -> userRepository.saveAndFlush(newUser("c".repeat(51))))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("conventions §1.7 軟刪除：不實體刪除，查詢排除已刪除的資料")
	void softDeleteKeepsRowAndHidesIt() throws Exception {
		userRepository.saveAndFlush(newUser("to-delete"));
		softDelete("to-delete");

		assertThat(userRepository.findByUsername("to-delete")).isEmpty();
		assertThat(userRepository.existsByUsername("to-delete")).isFalse();

		Map<String, Object> row = jdbc.queryForMap(
				"SELECT deleted_at FROM users WHERE username = ?", "to-delete");
		assertThat(row.get("deleted_at")).isNotNull();

		// 已刪除的帳號不能登入
		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginJson("to-delete", "pw-to-delete")))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("conventions §1.7 共用欄位：建立與修改的時間自動填入")
	void auditTimestamps() {
		User saved = userRepository.saveAndFlush(newUser("audit-user"));

		assertThat(saved.getCreatedAt()).isNotNull();
		assertThat(saved.getUpdatedAt()).isNotNull();
		// 沒有登入者時（例如啟動時建立預設帳號），建立者留空
		assertThat(saved.getCreatedBy()).isNull();
	}

}
