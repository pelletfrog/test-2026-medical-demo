package io.github.pelletfrog.vitals.auth;

import java.nio.charset.StandardCharsets;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 預設帳號，從環境變數讀取；不合規定時啟動失敗（REQ-AUT-002 AC3）。
 * 訊息寫環境變數的名稱：設定的人看的是 .env，不是這裡的屬性名稱。
 */
@Validated
@ConfigurationProperties("app.admin")
public record AdminProperties(
		@NotBlank(message = "ADMIN_USERNAME 未設定")
		@Size(max = 50, message = "ADMIN_USERNAME 最多 50 個字")
		String username,

		@NotBlank(message = "ADMIN_PASSWORD 未設定")
		@Size(max = 64, message = "ADMIN_PASSWORD 最多 64 個字")
		String password,

		@NotBlank(message = "ADMIN_NAME 未設定")
		String name) {

	// BCrypt 只處理前 72 byte，超過的部分不會被比對；中文一個字 3 byte，64 個字也可能超過
	@AssertTrue(message = "ADMIN_PASSWORD 超過 72 byte")
	public boolean isPasswordWithinBcryptLimit() {
		return password == null || password.getBytes(StandardCharsets.UTF_8).length <= 72;
	}

}
