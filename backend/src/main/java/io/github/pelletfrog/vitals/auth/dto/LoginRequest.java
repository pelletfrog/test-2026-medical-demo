package io.github.pelletfrog.vitals.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
		@NotBlank(message = "請輸入帳號")
		@Size(max = 50, message = "帳號最多 50 個字")
		String username,

		@NotBlank(message = "請輸入密碼")
		@Size(max = 64, message = "密碼最多 64 個字")
		String password) {
}
