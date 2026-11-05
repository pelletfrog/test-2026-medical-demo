package io.github.pelletfrog.vitals;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;

/**
 * 後端整合測試共用的設定。
 *
 * 測試用的帳號與密鑰寫在這裡，不讀開發者本機的 .env：
 * 測試結果才不會因為每個人的 .env 不同而改變。這些值只用在 Testcontainers 的臨時資料庫。
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(properties = {
		"ADMIN_USERNAME=" + IntegrationTest.ADMIN_USERNAME,
		"ADMIN_PASSWORD=" + IntegrationTest.ADMIN_PASSWORD,
		"ADMIN_NAME=" + IntegrationTest.ADMIN_NAME,
		"JWT_SECRET=test-only-secret-for-integration-tests-32b",
})
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public @interface IntegrationTest {

	String ADMIN_USERNAME = "nurse01";
	String ADMIN_PASSWORD = "test-password";
	String ADMIN_NAME = "林小護";

}
