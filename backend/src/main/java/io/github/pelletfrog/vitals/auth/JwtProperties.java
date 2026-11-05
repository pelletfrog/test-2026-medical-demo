package io.github.pelletfrog.vitals.auth;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.jwt")
public record JwtProperties(
		@NotBlank(message = "JWT_SECRET 未設定")
		String secret,

		// 從設定讀取：測試可以縮短，用來驗證過期
		@NotNull
		Duration expiry,

		// dev 環境走 HTTPS 才開；本機是 http，開了瀏覽器就不送 cookie
		boolean cookieSecure) {

	// HS256 的密鑰至少要和雜湊長度一樣（32 byte），太短的密鑰容易被暴力破解
	@AssertTrue(message = "JWT_SECRET 至少要 32 byte")
	public boolean isSecretLongEnough() {
		return secret == null || secret.getBytes(StandardCharsets.UTF_8).length >= 32;
	}

}
