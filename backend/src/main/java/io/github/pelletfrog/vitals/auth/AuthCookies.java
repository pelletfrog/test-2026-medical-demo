package io.github.pelletfrog.vitals.auth;

import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * 登入憑證的 cookie，各屬性的理由見登入 spec §5「JWT cookie」。
 */
@Component
public class AuthCookies {

	public static final String NAME = "access_token";

	// 建立與清除都用同一個 Path，否則瀏覽器會當成另一個 cookie，刪不掉
	private static final String PATH = "/api";

	private final JwtProperties jwtProperties;

	public AuthCookies(JwtProperties jwtProperties) {
		this.jwtProperties = jwtProperties;
	}

	public ResponseCookie create(String token) {
		return base(token).maxAge(jwtProperties.expiry()).build();
	}

	public ResponseCookie clear() {
		return base("").maxAge(Duration.ZERO).build();
	}

	private ResponseCookie.ResponseCookieBuilder base(String value) {
		return ResponseCookie.from(NAME, value)
				.httpOnly(true)
				.secure(jwtProperties.cookieSecure())
				.sameSite("Strict")
				.path(PATH);
	}

}
