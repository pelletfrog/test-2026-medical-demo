package io.github.pelletfrog.vitals.patient;

import static io.github.pelletfrog.vitals.patient.PatientTestSupport.createPatient;
import static org.hamcrest.Matchers.contains;
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

@IntegrationTest
class PatientListTest {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	Cookie token;

	@BeforeEach
	void setUp() throws Exception {
		// 臨時資料庫在測試類別之間共用，每個測試從沒有病患開始
		jdbc.update("DELETE FROM patients");
		token = AuthTestSupport.login(mockMvc);
	}

	@Test
	@DisplayName("PAT-001 AC1 列出病患")
	void listNewestFirst() throws Exception {
		createPatient(mockMvc, token, "A001", "陳測試");
		createPatient(mockMvc, token, "A002", "林範例");
		createPatient(mockMvc, token, "A003", "黃虛構");

		mockMvc.perform(get("/api/patients").cookie(token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[*].medicalRecordNo", contains("A003", "A002", "A001")))
				.andExpect(jsonPath("$.content[*].name", contains("黃虛構", "林範例", "陳測試")));
	}

	@Test
	@DisplayName("PAT-001 AC2 分頁")
	void paging() throws Exception {
		for (int i = 1; i <= 21; i++) {
			createPatient(mockMvc, token, "P%03d".formatted(i), "測試");
		}

		// 沒指定時每頁 20 筆；頁碼從 1 開始，見 conventions §1.9
		mockMvc.perform(get("/api/patients").cookie(token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content.length()").value(20))
				.andExpect(jsonPath("$.content[0].medicalRecordNo").value("P021"))
				.andExpect(jsonPath("$.page").value(1))
				.andExpect(jsonPath("$.size").value(20))
				.andExpect(jsonPath("$.totalElements").value(21))
				.andExpect(jsonPath("$.totalPages").value(2));

		// spec 規定每頁 20 筆，請求帶的 size 不採用：避免一次拉出大量資料
		mockMvc.perform(get("/api/patients").param("size", "100").cookie(token))
				.andExpect(jsonPath("$.content.length()").value(20))
				.andExpect(jsonPath("$.size").value(20));

		mockMvc.perform(get("/api/patients").param("page", "2").cookie(token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[*].medicalRecordNo", contains("P001")))
				.andExpect(jsonPath("$.page").value(2));
	}

	@Test
	@DisplayName("PAT-002 AC1 部分符合")
	void searchByPartialMedicalRecordNo() throws Exception {
		createPatient(mockMvc, token, "A001", "陳測試");
		createPatient(mockMvc, token, "A002", "林範例");
		createPatient(mockMvc, token, "B001", "黃虛構");

		// 輸入小寫也找得到：病歷號都存成大寫
		mockMvc.perform(get("/api/patients").param("medicalRecordNo", "a00").cookie(token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[*].medicalRecordNo", contains("A002", "A001")))
				.andExpect(jsonPath("$.totalElements").value(2));

		// 中間的部分也算符合
		mockMvc.perform(get("/api/patients").param("medicalRecordNo", "001").cookie(token))
				.andExpect(jsonPath("$.content[*].medicalRecordNo", contains("B001", "A001")));
	}

}
