package io.github.pelletfrog.vitals.vitalsign;

import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.createRecord;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.putRecord;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.record;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.tomorrow;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.with;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.without;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

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
class VitalSignEditTest {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	PatientRepository patientRepository;

	Cookie token;

	Long patientId;

	@BeforeEach
	void setUp() throws Exception {
		jdbc.update("DELETE FROM vital_signs");
		jdbc.update("DELETE FROM patients");
		token = AuthTestSupport.login(mockMvc);
		patientId = patientRepository.saveAndFlush(new Patient("A001", "陳測試")).getId();
	}

	/** 編輯的請求不含病患 */
	private static Map<String, Object> edit(String measuredAt) {
		return without(record(null, measuredAt), "patientId");
	}

	private Map<String, Object> row(long id) {
		return jdbc.queryForMap("SELECT * FROM vital_signs WHERE id = ?", id);
	}

	@Test
	@DisplayName("VIT-004 AC1 編輯成功")
	void edit() throws Exception {
		long id = createRecord(mockMvc, token, record(patientId, "2026-01-01 08:00"));

		putRecord(mockMvc, token, id, with(with(edit("2026-01-01 08:30"), "bodyTemperature", "38.2"), "heartRate", "110"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(id))
				.andExpect(jsonPath("$.measuredAt").value("2026-01-01 08:30"))
				.andExpect(jsonPath("$.bodyTemperature").value(38.2))
				.andExpect(jsonPath("$.heartRate").value(110))
				.andExpect(jsonPath("$.medicalRecordNo").value("A001"));

		assertThat(row(id).get("heart_rate")).isEqualTo(110);
	}

	@Test
	@DisplayName("VIT-004 AC1 編輯成功：紀錄不存在")
	void notFound() throws Exception {
		putRecord(mockMvc, token, 999999, edit("2026-01-01 08:00"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.detail").value("找不到這筆紀錄"));
	}

	@Test
	@DisplayName("VIT-004 AC2 不能更換病患")
	void cannotChangePatient() throws Exception {
		long id = createRecord(mockMvc, token, record(patientId, "2026-01-01 08:00"));
		Long other = patientRepository.saveAndFlush(new Patient("B002", "林範例")).getId();

		// 不經畫面直接送出其他病患：請求裡的病患不採用
		putRecord(mockMvc, token, id, with(edit("2026-01-01 08:00"), "patientId", other))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.patientId").value(patientId))
				.andExpect(jsonPath("$.medicalRecordNo").value("A001"));

		assertThat(row(id).get("patient_id")).isEqualTo(patientId);
	}

	@Test
	@DisplayName("VIT-004 AC3 欄位檢查")
	void validation() throws Exception {
		long id = createRecord(mockMvc, token, record(patientId, "2026-01-01 08:00"));

		putRecord(mockMvc, token, id, with(without(edit("2026-01-01 08:00"), "measuredAt"), "heartRate", null))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.measuredAt").value("請輸入記錄時間"))
				.andExpect(jsonPath("$.errors.heartRate").value("請輸入心跳"));

		putRecord(mockMvc, token, id, with(with(edit("2026-01-01 08:00"), "bodyTemperature", "36.85"), "oxygenSaturation", "-1"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.bodyTemperature").value("體溫最多 1 位小數"))
				.andExpect(jsonPath("$.errors.oxygenSaturation").value("血氧需介於 0～999"));

		putRecord(mockMvc, token, id, edit(tomorrow()))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.measuredAt").value("記錄時間不能晚於現在"));

		// 被拒絕時不修改
		assertThat(row(id).get("heart_rate")).isEqualTo(78);
	}

	@Test
	@DisplayName("VIT-004 AC4 改成已有紀錄的時間")
	void duplicateTime() throws Exception {
		createRecord(mockMvc, token, record(patientId, "2026-01-01 08:00"));
		long noon = createRecord(mockMvc, token, record(patientId, "2026-01-01 12:00"));

		putRecord(mockMvc, token, noon, edit("2026-01-01 08:00"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.measuredAt").value("這個時間已經有紀錄"));

		Map<String, Object> unchanged = jdbc.queryForMap(
				"SELECT to_char(measured_at AT TIME ZONE 'Asia/Taipei', 'HH24:MI') AS t FROM vital_signs WHERE id = ?", noon);
		assertThat(unchanged.get("t")).isEqualTo("12:00");
	}

}
