package io.github.pelletfrog.vitals;

import java.io.IOException;
import java.io.UncheckedIOException;

import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.io.ClassPathResource;

/**
 * 讓只載入部分設定的測試也讀實際的 application.yaml：
 * 測試裡自己寫一份「屬性 = ${環境變數}」的對應，yaml 寫錯時測試照樣通過。
 */
public final class ApplicationYaml {

	private ApplicationYaml() {
	}

	public static ApplicationContextRunner load(ApplicationContextRunner runner) {
		return runner.withInitializer(context -> {
			try {
				new YamlPropertySourceLoader()
						.load("application.yaml", new ClassPathResource("application.yaml"))
						.forEach(context.getEnvironment().getPropertySources()::addLast);
			}
			catch (IOException e) {
				throw new UncheckedIOException(e);
			}
		});
	}

}
