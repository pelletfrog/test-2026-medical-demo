package io.github.pelletfrog.vitals.auth;

import io.github.pelletfrog.vitals.auth.dto.LoginRequest;
import io.github.pelletfrog.vitals.auth.dto.MeResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;
	private final TokenService tokenService;
	private final AuthCookies authCookies;

	public AuthController(AuthService authService, TokenService tokenService, AuthCookies authCookies) {
		this.authService = authService;
		this.tokenService = tokenService;
		this.authCookies = authCookies;
	}

	@PostMapping("/login")
	public ResponseEntity<MeResponse> login(@Valid @RequestBody LoginRequest request) {
		User user = authService.login(request.username(), request.password());
		String token = tokenService.issue(user.getId());
		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, authCookies.create(token).toString())
				.body(MeResponse.from(user));
	}

	// 前端 JavaScript 刪不掉 httpOnly cookie，只能由後端清除
	@PostMapping("/logout")
	public ResponseEntity<Void> logout() {
		return ResponseEntity.noContent()
				.header(HttpHeaders.SET_COOKIE, authCookies.clear().toString())
				.build();
	}

	@GetMapping("/me")
	public MeResponse me(@AuthenticationPrincipal Jwt jwt) {
		return MeResponse.from(authService.currentUser(Long.valueOf(jwt.getSubject())));
	}

}
