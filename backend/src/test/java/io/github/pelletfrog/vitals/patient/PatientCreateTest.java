package io.github.pelletfrog.vitals.patient;

import static io.github.pelletfrog.vitals.patient.PatientTestSupport.createPatient;
import static io.github.pelletfrog.vitals.patient.PatientTestSupport.patientJson;
import static io.github.pelletfrog.vitals.patient.PatientTestSupport.postPatient;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.pelletfrog.vitals.IntegrationTest;
import io.github.pelletfrog.vitals.auth.AuthTestSupport;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

@IntegrationTest
class PatientCreateTest {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	PatientRepository patientRepository;

	@Autowired
	TransactionTemplate tx;

	Cookie token;

	@BeforeEach
	void setUp() throws Exception {
		jdbc.update("DELETE FROM patients");
		token = AuthTestSupport.login(mockMvc);
	}

	private int countRows() {
		// 用 SQL 計算：包含已刪除的資料
		return jdbc.queryForObject("SELECT count(*) FROM patients", Integer.class);
	}

	@Test
	@DisplayName("PAT-003 AC1 新增成功")
	void create() throws Exception {
		createPatient(mockMvc, token, "A001", "陳測試");

		postPatient(mockMvc, token, patientJson("A002", "林範例"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.medicalRecordNo").value("A002"))
				.andExpect(jsonPath("$.name").value("林範例"));

		mockMvc.perform(get("/api/patients").cookie(token))
				.andExpect(jsonPath("$.content[0].medicalRecordNo").value("A002"));
	}

	@Test
	@DisplayName("PAT-003 AC1 新增成功：姓名去掉前後空白")
	void nameStripped() throws Exception {
		// 畫面的 TextField 會去掉前後空白；不經畫面呼叫 API 時，後端也要一致
		postPatient(mockMvc, token, patientJson("A001", "  陳測試 "))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("陳測試"));
	}

	@Test
	@DisplayName("PAT-003 AC2 病歷號存成大寫")
	void storedUppercase() throws Exception {
		postPatient(mockMvc, token, patientJson("a001b", "陳測試"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.medicalRecordNo").value("A001B"));

		assertThat(jdbc.queryForObject("SELECT medical_record_no FROM patients", String.class))
				.isEqualTo("A001B");
	}

	@Test
	@DisplayName("PAT-003 AC3 欄位空白")
	void blankFields() throws Exception {
		for (String json : new String[] {
				patientJson("", ""),
				// 只有空白也算沒填；同時不符合格式時，只顯示必填提示
				patientJson("   ", "   "),
				"{}" }) {
			postPatient(mockMvc, token, json)
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.detail").value("請修正標示的欄位"))
					.andExpect(jsonPath("$.errors.medicalRecordNo").value("請輸入病歷號"))
					.andExpect(jsonPath("$.errors.name").value("請輸入姓名"));
		}
		assertThat(countRows()).isZero();
	}

	@Test
	@DisplayName("PAT-003 AC4 超過字數")
	void tooLong() throws Exception {
		postPatient(mockMvc, token, patientJson("A".repeat(21), "陳".repeat(51)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.medicalRecordNo").value("病歷號最多 20 個字"))
				.andExpect(jsonPath("$.errors.name").value("姓名最多 50 個字"));

		// 超過字數又不符合格式時，只顯示字數的訊息
		postPatient(mockMvc, token, patientJson("-".repeat(21), "陳測試"))
				.andExpect(jsonPath("$.errors.medicalRecordNo").value("病歷號最多 20 個字"));
		assertThat(countRows()).isZero();

		// 剛好在上限內可以新增
		createPatient(mockMvc, token, "A".repeat(20), "陳".repeat(50));
	}

	@Test
	@DisplayName("PAT-003 AC5 病歷號格式")
	void invalidFormat() throws Exception {
		for (String medicalRecordNo : new String[] { "A-001", "A 001", "病001", "Ａ001", "A001!" }) {
			postPatient(mockMvc, token, patientJson(medicalRecordNo, "陳測試"))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.errors.medicalRecordNo").value("病歷號只能是英文字母與數字"));
		}
		assertThat(countRows()).isZero();
	}

	@Test
	@DisplayName("PAT-003 AC6 病歷號已存在")
	void duplicate() throws Exception {
		createPatient(mockMvc, token, "A001", "陳測試");

		// 大小寫不同也算同一個病歷號
		postPatient(mockMvc, token, patientJson("a001", "林範例"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.detail").value("請修正標示的欄位"))
				.andExpect(jsonPath("$.errors.medicalRecordNo").value("病歷號已存在"));
		assertThat(countRows()).isEqualTo(1);

		// 已刪除的病患也占用病歷號
		createPatient(mockMvc, token, "A002", "黃虛構");
		tx.executeWithoutResult(status -> patientRepository.delete(
				patientRepository.findAll().stream()
						.filter(p -> p.getMedicalRecordNo().equals("A002"))
						.findFirst().orElseThrow()));
		postPatient(mockMvc, token, patientJson("A002", "張示範"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.medicalRecordNo").value("病歷號已存在"));
		assertThat(countRows()).isEqualTo(2);
	}

}
