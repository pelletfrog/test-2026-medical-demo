package io.github.pelletfrog.vitals.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Configuration;

/**
 * 本機的 .env 由 application.yaml 的 spring.config.import 讀進來（conventions.md §1.6）。
 */
class EnvFileTest {

	@Configuration(proxyBeanMethods = false)
	static class Empty {
	}

	@Test
	@DisplayName("conventions §1.6 .env 的中文值不會變成亂碼")
	void readsUtf8(@TempDir Path dir) throws IOException {
		Files.writeString(dir.resolve(".env"), "ADMIN_NAME=林小護\n", StandardCharsets.UTF_8);

		// 用和 application.yaml 一樣的寫法，只把路徑換成暫存檔
		String location = importLocation().replace("../.env", dir.resolve(".env").toString());

		try (ConfigurableApplicationContext context = new SpringApplicationBuilder(Empty.class)
				.web(WebApplicationType.NONE)
				.properties("spring.config.import=" + location)
				.run()) {
			assertThat(context.getEnvironment().getProperty("ADMIN_NAME")).isEqualTo("林小護");
		}
	}

	private static String importLocation() throws IOException {
		// application.yaml 的 spring.config.import，從編譯後的設定檔讀出來，測的才是實際的設定
		try (InputStream in = EnvFileTest.class.getResourceAsStream("/application.yaml")) {
			for (String line : new String(in.readAllBytes(), StandardCharsets.UTF_8).split("\n")) {
				String trimmed = line.trim();
				if (trimmed.startsWith("import:")) {
					return trimmed.substring("import:".length()).trim();
				}
			}
		}
		throw new IllegalStateException("application.yaml 找不到 spring.config.import");
	}

}
