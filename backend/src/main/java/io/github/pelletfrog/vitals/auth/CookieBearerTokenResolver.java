package io.github.pelletfrog.vitals.auth;

import java.util.Set;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;

/**
 * 預設只讀 Authorization header；我們的 JWT 放在 httpOnly cookie。
 */
public class CookieBearerTokenResolver implements BearerTokenResolver {

	// 帶著過期的 cookie 時，登入、登出不能先被 JWT 驗證擋下，否則過期後就再也登不進去
	private static final Set<String> IGNORED_PATHS = Set.of("/api/auth/login", "/api/auth/logout");

	@Override
	public String resolve(HttpServletRequest request) {
		if (IGNORED_PATHS.contains(request.getRequestURI())) {
			return null;
		}
		Cookie[] cookies = request.getCookies();
		if (cookies == null) {
			return null;
		}
		for (Cookie cookie : cookies) {
			if (AuthCookies.NAME.equals(cookie.getName()) && !cookie.getValue().isEmpty()) {
				return cookie.getValue();
			}
		}
		return null;
	}

}
