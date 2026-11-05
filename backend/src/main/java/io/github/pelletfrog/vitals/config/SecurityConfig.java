package io.github.pelletfrog.vitals.config;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import io.github.pelletfrog.vitals.auth.CookieBearerTokenResolver;
import io.github.pelletfrog.vitals.auth.JwtProperties;
import io.github.pelletfrog.vitals.auth.NotAuthenticatedException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.json.JsonMapper;

/**
 * 做法見登入 spec §5；除了登入，所有 /api/** 都要登入（docs/security.md §1）。
 */
@Configuration(proxyBeanMethods = false)
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, AuthenticationEntryPoint unauthorized)
			throws Exception {
		http
				// cookie 設了 SameSite=Strict，其他網站的請求不會帶上，不需要 CSRF token
				.csrf(AbstractHttpConfigurer::disable)
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				// 登出由 /api/auth/logout 處理，關掉 Spring 內建的 /logout
				.logout(AbstractHttpConfigurer::disable)
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/logout").permitAll()
						// API 文件公開，API 本身仍要登入才能呼叫
						.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
						.requestMatchers("/error").permitAll()
						.anyRequest().authenticated())
				.oauth2ResourceServer(o -> o
						.bearerTokenResolver(new CookieBearerTokenResolver())
						.jwt(jwt -> {
						})
						.authenticationEntryPoint(unauthorized))
				.exceptionHandling(e -> e.authenticationEntryPoint(unauthorized));
		return http.build();
	}

	// 未登入、過期、token 無效都回同一個 ProblemDetail，前端統一導向登入頁
	@Bean
	AuthenticationEntryPoint unauthorized(JsonMapper jsonMapper) {
		return (request, response, ex) -> {
			Map<String, Object> problem = new LinkedHashMap<>();
			problem.put("type", "about:blank");
			problem.put("title", HttpStatus.UNAUTHORIZED.getReasonPhrase());
			problem.put("status", HttpStatus.UNAUTHORIZED.value());
			problem.put("detail", NotAuthenticatedException.DETAIL);
			problem.put("instance", request.getRequestURI());
			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
			response.setCharacterEncoding(StandardCharsets.UTF_8.name());
			jsonMapper.writeValue(response.getWriter(), problem);
		};
	}

	// 只有這個後端簽發和驗證，用同一把 HMAC 密鑰就夠，不需要 RSA 的公私鑰
	@Bean
	SecretKey jwtSecretKey(JwtProperties jwtProperties) {
		return new SecretKeySpec(jwtProperties.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
	}

	@Bean
	JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
		return NimbusJwtEncoder.withSecretKey(jwtSecretKey).build();
	}

	@Bean
	JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
		return NimbusJwtDecoder.withSecretKey(jwtSecretKey).macAlgorithm(MacAlgorithm.HS256).build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
