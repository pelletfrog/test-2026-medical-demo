package io.github.pelletfrog.vitals.vitalsign;

import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.createRecord;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.now;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.postRecord;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.record;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.tomorrow;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.with;
import static io.github.pelletfrog.vitals.vitalsign.VitalSignTestSupport.without;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.transaction.support.TransactionTemplate;

@IntegrationTest
class VitalSignCreateTest {

	// 各數值欄位與顯示用的名稱
	private static final Map<String, String> INTEGER_FIELDS = Map.of(
			"heartRate", "心跳",
			"respiratoryRate", "呼吸",
			"systolicPressure", "收縮壓",
			"diastolicPressure", "舒張壓",
			"oxygenSaturation", "血氧");

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	PatientRepository patientRepository;

	@Autowired
	VitalSignRepository vitalSignRepository;

	@Autowired
	TransactionTemplate tx;

	Cookie token;

	Long patientId;

	@BeforeEach
	void setUp() throws Exception {
		jdbc.update("DELETE FROM vital_signs");
		jdbc.update("DELETE FROM patients");
		token = AuthTestSupport.login(mockMvc);
		patientId = patientRepository.saveAndFlush(new Patient("A001", "陳測試")).getId();
	}

	private int countRows() {
		// 用 SQL 計算：包含已刪除的資料
		return jdbc.queryForObject("SELECT count(*) FROM vital_signs", Integer.class);
	}

	@Test
	@DisplayName("VIT-003 AC1 新增成功")
	void create() throws Exception {
		createRecord(mockMvc, token, record(patientId, "2026-01-01 08:00"));

		postRecord(mockMvc, token, record(patientId, now()))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.patientId").value(patientId))
				.andExpect(jsonPath("$.medicalRecordNo").value("A001"))
				.andExpect(jsonPath("$.name").value("陳測試"))
				.andExpect(jsonPath("$.measuredAt").value(now()))
				.andExpect(jsonPath("$.bodyTemperature").value(36.8))
				.andExpect(jsonPath("$.oxygenSaturation").value(98));

		mockMvc.perform(get("/api/vital-signs").cookie(token))
				.andExpect(jsonPath("$.content[0].measuredAt").value(now()));
	}

	@Test
	@DisplayName("VIT-003 AC3 選擇病患")
	void patientOptions() throws Exception {
		jdbc.update("DELETE FROM patients");
		for (int i = 25; i >= 1; i--) {
			patientRepository.saveAndFlush(new Patient("P%03d".formatted(i), "陳測試" + i));
		}
		patientRepository.saveAndFlush(new Patient("Q001", "林範例"));

		// 超過 20 位：依病歷號由小到大只回 20 位，並說明還有更多
		mockMvc.perform(get("/api/vital-signs/patient-options").param("keyword", "陳").cookie(token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content.length()").value(20))
				.andExpect(jsonPath("$.content[0].medicalRecordNo").value("P001"))
				.andExpect(jsonPath("$.content[19].medicalRecordNo").value("P020"))
				.andExpect(jsonPath("$.hasMore").value(true));

		// 病歷號不分大小寫
		mockMvc.perform(get("/api/vital-signs/patient-options").param("keyword", "p02").cookie(token))
				.andExpect(jsonPath("$.content[*].medicalRecordNo",
						contains("P020", "P021", "P022", "P023", "P024", "P025")))
				.andExpect(jsonPath("$.hasMore").value(false));

		mockMvc.perform(get("/api/vital-signs/patient-options").param("keyword", "林").cookie(token))
				.andExpect(jsonPath("$.content[*].medicalRecordNo", contains("Q001")))
				.andExpect(jsonPath("$.content[0].id").isNumber())
				.andExpect(jsonPath("$.content[0].name").value("林範例"));
	}

	@Test
	@DisplayName("VIT-003 AC3 選擇病患：剛好 20 位時沒有提示")
	void patientOptionsExactly20() throws Exception {
		jdbc.update("DELETE FROM patients");
		for (int i = 1; i <= 20; i++) {
			patientRepository.saveAndFlush(new Patient("P%03d".formatted(i), "陳測試"));
		}

		mockMvc.perform(get("/api/vital-signs/patient-options").param("keyword", "陳").cookie(token))
				.andExpect(jsonPath("$.content.length()").value(20))
				.andExpect(jsonPath("$.hasMore").value(false));
	}

	@Test
	@DisplayName("VIT-003 AC4 欄位空白")
	void blankFields() throws Exception {
		var body = record(patientId, "2026-01-01 08:00");
		postRecord(mockMvc, token, without(without(body, "patientId"), "measuredAt"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("請修正標示的欄位"))
				.andExpect(jsonPath("$.errors.patientId").value("請選擇病患"))
				.andExpect(jsonPath("$.errors.measuredAt").value("請輸入記錄時間"));

		postRecord(mockMvc, token, with(body, "bodyTemperature", null))
				.andExpect(jsonPath("$.errors.bodyTemperature").value("請輸入體溫"));
		for (var field : INTEGER_FIELDS.entrySet()) {
			postRecord(mockMvc, token, with(body, field.getKey(), null))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.errors." + field.getKey()).value("請輸入" + field.getValue()));
		}
		assertThat(countRows()).isZero();
	}

	@Test
	@DisplayName("VIT-003 AC4 欄位空白：病患不存在")
	void patientNotFound() throws Exception {
		postRecord(mockMvc, token, record(patientId + 999, "2026-01-01 08:00"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.patientId").value("找不到這位病患"));
		assertThat(countRows()).isZero();
	}

	@Test
	@DisplayName("VIT-003 AC5 數值格式")
	void numberFormat() throws Exception {
		var body = record(patientId, "2026-01-01 08:00");

		// 負數、超過位數上限
		for (String value : new String[] { "-0.1", "1000" }) {
			postRecord(mockMvc, token, with(body, "bodyTemperature", value))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.errors.bodyTemperature").value("體溫需介於 0～999.9"));
		}
		postRecord(mockMvc, token, with(body, "bodyTemperature", "36.85"))
				.andExpect(jsonPath("$.errors.bodyTemperature").value("體溫最多 1 位小數"));

		for (var field : INTEGER_FIELDS.entrySet()) {
			// 負數又有小數時，只顯示範圍的訊息
			for (String value : new String[] { "-1", "1000", "-1.5" }) {
				postRecord(mockMvc, token, with(body, field.getKey(), value))
						.andExpect(status().isBadRequest())
						.andExpect(jsonPath("$.errors." + field.getKey()).value(field.getValue() + "需介於 0～999"));
			}
			postRecord(mockMvc, token, with(body, field.getKey(), "78.5"))
					.andExpect(jsonPath("$.errors." + field.getKey()).value(field.getValue() + "只能是整數"));
		}
		assertThat(countRows()).isZero();

		// 上下限本身可以存
		createRecord(mockMvc, token, with(with(body, "bodyTemperature", "999.9"), "heartRate", "0"));
		createRecord(mockMvc, token, with(with(record(patientId, "2026-01-01 09:00"),
				"bodyTemperature", "0"), "heartRate", "999"));
	}

	@Test
	@DisplayName("VIT-003 AC5 數值格式：尾端的 0 不算小數位數")
	void trailingZeros() throws Exception {
		// 78.0 就是整數 78、36.80 就是 36.8，和畫面的判斷一致
		postRecord(mockMvc, token, with(with(record(patientId, "2026-01-01 08:00"),
				"heartRate", "78.0"), "bodyTemperature", "36.80"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.heartRate").value(78))
				.andExpect(jsonPath("$.bodyTemperature").value(36.8));
	}

	@Test
	@DisplayName("VIT-003 AC6 記錄時間不能是未來")
	void futureTime() throws Exception {
		postRecord(mockMvc, token, record(patientId, tomorrow()))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.measuredAt").value("記錄時間不能晚於現在"));
		assertThat(countRows()).isZero();
	}

	@Test
	@DisplayName("VIT-003 AC7 同一時間已有紀錄")
	void duplicateTime() throws Exception {
		createRecord(mockMvc, token, record(patientId, "2026-01-01 08:00"));

		postRecord(mockMvc, token, record(patientId, "2026-01-01 08:00"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.detail").value("請修正標示的欄位"))
				.andExpect(jsonPath("$.errors.measuredAt").value("這個時間已經有紀錄"));
		assertThat(countRows()).isEqualTo(1);

		// 已刪除的紀錄也占用這個時間
		long deleted = createRecord(mockMvc, token, record(patientId, "2026-01-01 09:00"));
		tx.executeWithoutResult(status -> vitalSignRepository.deleteById(deleted));
		postRecord(mockMvc, token, record(patientId, "2026-01-01 09:00"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.measuredAt").value("這個時間已經有紀錄"));

		// 不同病患可以同一個時間
		Long other = patientRepository.saveAndFlush(new Patient("B002", "林範例")).getId();
		createRecord(mockMvc, token, record(other, "2026-01-01 08:00"));
	}

}
