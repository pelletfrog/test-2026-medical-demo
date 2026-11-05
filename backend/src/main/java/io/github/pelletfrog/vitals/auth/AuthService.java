package io.github.pelletfrog.vitals.auth;

import java.nio.charset.StandardCharsets;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	// 帳號不存在時也做一次比對，回應時間才不會透露帳號是否存在
	private final String dummyHash;

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.dummyHash = passwordEncoder.encode("dummy-password-for-timing");
	}

	@Transactional(readOnly = true)
	public User login(String username, String password) {
		// 建立帳號時已擋下超過 72 byte 的密碼，這種輸入不可能正確，不用花時間跑 BCrypt
		if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
			throw new InvalidCredentialsException();
		}
		User user = userRepository.findByUsername(username).orElse(null);
		if (user == null) {
			passwordEncoder.matches(password, dummyHash);
			throw new InvalidCredentialsException();
		}
		if (!passwordEncoder.matches(password, user.getPasswordHash())) {
			throw new InvalidCredentialsException();
		}
		return user;
	}

	@Transactional(readOnly = true)
	public User currentUser(Long userId) {
		// JWT 不查資料庫就能驗證；但帳號已刪除時，me 不回傳資料
		return userRepository.findById(userId).orElseThrow(NotAuthenticatedException::new);
	}

}
