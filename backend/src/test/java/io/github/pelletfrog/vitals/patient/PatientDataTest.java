package io.github.pelletfrog.vitals.patient;

import static io.github.pelletfrog.vitals.patient.PatientTestSupport.createPatient;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import io.github.pelletfrog.vitals.IntegrationTest;
import io.github.pelletfrog.vitals.auth.AuthTestSupport;
import io.github.pelletfrog.vitals.auth.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

/**
 * data-model.md 的病患欄位約束：直接存進資料庫，確認繞過 API 的驗證也擋得住。
 */
@IntegrationTest
class PatientDataTest {

	@Autowired
	PatientRepository patientRepository;

	@Autowired
	UserRepository userRepository;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		// 生命徵象參照病患，要先刪掉才能清空病患
		jdbc.update("DELETE FROM vital_signs");
		jdbc.update("DELETE FROM patients");
	}

	@Test
	@DisplayName("data-model patients.medicalRecordNo 最多 20 個字")
	void medicalRecordNoMaxLength() {
		patientRepository.saveAndFlush(new Patient("A".repeat(20), "陳測試"));
		assertThatThrownBy(() -> patientRepository.saveAndFlush(new Patient("B".repeat(21), "陳測試")))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("data-model patients.medicalRecordNo 只能是大寫英文字母與數字")
	void medicalRecordNoUppercaseAlphanumeric() {
		for (String medicalRecordNo : new String[] { "a001", "A-001", "病001" }) {
			assertThatThrownBy(() -> patientRepository.saveAndFlush(new Patient(medicalRecordNo, "陳測試")))
					.as(medicalRecordNo)
					.isInstanceOf(DataIntegrityViolationException.class);
		}
	}

	@Test
	@DisplayName("data-model patients.medicalRecordNo 唯一，含已刪除的資料")
	void medicalRecordNoUnique() {
		Patient saved = patientRepository.saveAndFlush(new Patient("A001", "陳測試"));
		assertThatThrownBy(() -> patientRepository.saveAndFlush(new Patient("A001", "林範例")))
				.isInstanceOf(DataIntegrityViolationException.class);

		patientRepository.delete(patientRepository.findById(saved.getId()).orElseThrow());
		patientRepository.flush();
		assertThatThrownBy(() -> patientRepository.saveAndFlush(new Patient("A001", "林範例")))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("data-model patients.name 最多 50 個字")
	void nameMaxLength() {
		patientRepository.saveAndFlush(new Patient("A001", "陳".repeat(50)));
		assertThatThrownBy(() -> patientRepository.saveAndFlush(new Patient("A002", "陳".repeat(51))))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("conventions §1.7 共用欄位：建立者與修改者是登入的使用者")
	void auditUserFromLogin() throws Exception {
		createPatient(mockMvc, AuthTestSupport.login(mockMvc), "A001", "陳測試");

		Long adminId = userRepository.findByUsername(IntegrationTest.ADMIN_USERNAME).orElseThrow().getId();
		Map<String, Object> row = jdbc.queryForMap("SELECT created_by, updated_by FROM patients");
		assertThat(row.get("created_by")).isEqualTo(adminId);
		assertThat(row.get("updated_by")).isEqualTo(adminId);
	}

}
