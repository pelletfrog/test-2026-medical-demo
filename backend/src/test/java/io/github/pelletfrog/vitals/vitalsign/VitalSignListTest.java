package io.github.pelletfrog.vitals.vitalsign;

import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.createRecord;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.record;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.pelletfrog.vitals.IntegrationTest;
import io.github.pelletfrog.vitals.auth.AuthTestSupport;
import io.github.pelletfrog.vitals.patient.Patient;
import io.github.pelletfrog.vitals.patient.PatientRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
class VitalSignListTest {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	PatientRepository patientRepository;

	Cookie token;

	@BeforeEach
	void setUp() throws Exception {
		// 臨時資料庫在測試類別之間共用，每個測試從沒有資料開始
		jdbc.update("DELETE FROM vital_signs");
		jdbc.update("DELETE FROM patients");
		token = AuthTestSupport.login(mockMvc);
	}

	private Long patient(String medicalRecordNo, String name) {
		return patientRepository.saveAndFlush(new Patient(medicalRecordNo, name)).getId();
	}

	@Test
	@DisplayName("VIT-001 AC1 列出紀錄")
	void listNewestFirst() throws Exception {
		Long a = patient("A001", "陳測試");
		Long b = patient("B002", "林範例");
		createRecord(mockMvc, token, record(a, "2026-01-01 08:00"));
		createRecord(mockMvc, token, record(a, "2026-01-01 12:00"));
		createRecord(mockMvc, token, record(b, "2026-01-01 10:00"));

		mockMvc.perform(get("/api/vital-signs").cookie(token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[*].measuredAt",
						contains("2026-01-01 12:00", "2026-01-01 10:00", "2026-01-01 08:00")))
				.andExpect(jsonPath("$.content[0].medicalRecordNo").value("A001"))
				.andExpect(jsonPath("$.content[0].name").value("陳測試"))
				.andExpect(jsonPath("$.content[0].bodyTemperature").value(36.8))
				.andExpect(jsonPath("$.content[0].heartRate").value(78))
				.andExpect(jsonPath("$.content[0].respiratoryRate").value(16))
				.andExpect(jsonPath("$.content[0].systolicPressure").value(122))
				.andExpect(jsonPath("$.content[0].diastolicPressure").value(78))
				.andExpect(jsonPath("$.content[0].oxygenSaturation").value(98))
				.andExpect(jsonPath("$.content[1].name").value("林範例"));
	}

	@Test
	@DisplayName("VIT-001 AC1 列出紀錄：記錄時間相同時，後新增的在上面")
	void sameTimeNewerIdFirst() throws Exception {
		Long a = patient("A001", "陳測試");
		Long b = patient("B002", "林範例");
		Long c = patient("C003", "黃虛構");
		createRecord(mockMvc, token, record(b, "2026-01-01 08:00"));
		createRecord(mockMvc, token, record(a, "2026-01-01 08:00"));
		createRecord(mockMvc, token, record(c, "2026-01-01 08:00"));

		mockMvc.perform(get("/api/vital-signs").cookie(token))
				.andExpect(jsonPath("$.content[*].medicalRecordNo", contains("C003", "A001", "B002")));
	}

	@Test
	@DisplayName("VIT-001 AC2 分頁")
	void paging() throws Exception {
		Long a = patient("A001", "陳測試");
		for (int minute = 0; minute <= 20; minute++) {
			createRecord(mockMvc, token, record(a, "2026-01-01 08:%02d".formatted(minute)));
		}

		mockMvc.perform(get("/api/vital-signs").cookie(token))
				.andExpect(jsonPath("$.content.length()").value(20))
				.andExpect(jsonPath("$.content[0].measuredAt").value("2026-01-01 08:20"))
				.andExpect(jsonPath("$.page").value(1))
				.andExpect(jsonPath("$.size").value(20))
				.andExpect(jsonPath("$.totalElements").value(21))
				.andExpect(jsonPath("$.totalPages").value(2));

		// 每頁固定 20 筆，請求帶的 size 不採用
		mockMvc.perform(get("/api/vital-signs").param("size", "100").cookie(token))
				.andExpect(jsonPath("$.content.length()").value(20));

		mockMvc.perform(get("/api/vital-signs").param("page", "2").cookie(token))
				.andExpect(jsonPath("$.content[*].measuredAt", contains("2026-01-01 08:00")))
				.andExpect(jsonPath("$.page").value(2));
	}

	@Test
	@DisplayName("VIT-002 AC1 病歷號或姓名部分符合")
	void searchByMedicalRecordNoOrName() throws Exception {
		Long a = patient("A001", "陳測試");
		Long b = patient("B002", "林範例");
		createRecord(mockMvc, token, record(a, "2026-01-01 08:00"));
		createRecord(mockMvc, token, record(b, "2026-01-01 09:00"));

		// 病歷號不分大小寫
		mockMvc.perform(get("/api/vital-signs").param("keyword", "a00").cookie(token))
				.andExpect(jsonPath("$.content[*].medicalRecordNo", contains("A001")));

		mockMvc.perform(get("/api/vital-signs").param("keyword", "林").cookie(token))
				.andExpect(jsonPath("$.content[*].medicalRecordNo", contains("B002")));

		// 使用者輸入的 % 不當成萬用字元
		mockMvc.perform(get("/api/vital-signs").param("keyword", "%").cookie(token))
				.andExpect(jsonPath("$.totalElements").value(0));
	}

}
