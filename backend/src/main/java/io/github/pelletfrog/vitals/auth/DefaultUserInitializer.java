package io.github.pelletfrog.vitals.auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 不開放註冊，啟動時依環境變數建立預設帳號（REQ-AUT-002）。
 */
@Component
public class DefaultUserInitializer implements CommandLineRunner {

	private final AdminProperties admin;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public DefaultUserInitializer(AdminProperties admin, UserRepository userRepository,
			PasswordEncoder passwordEncoder) {
		this.admin = admin;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(String... args) {
		// 已存在就不動，也不依環境變數更新密碼：環境變數只用來建立第一次
		if (userRepository.existsByUsername(admin.username())) {
			return;
		}
		userRepository.save(new User(admin.username(), passwordEncoder.encode(admin.password()), admin.name()));
	}

}
