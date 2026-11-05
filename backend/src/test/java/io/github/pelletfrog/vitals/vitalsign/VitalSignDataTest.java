package io.github.pelletfrog.vitals.vitalsign;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import io.github.pelletfrog.vitals.IntegrationTest;
import io.github.pelletfrog.vitals.patient.Patient;
import io.github.pelletfrog.vitals.patient.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * data-model.md 的生命徵象欄位約束：直接存進資料庫，確認繞過 API 的驗證也擋得住。
 */
@IntegrationTest
class VitalSignDataTest {

	@Autowired
	VitalSignRepository vitalSignRepository;

	@Autowired
	PatientRepository patientRepository;

	@Autowired
	JdbcTemplate jdbc;

	Patient patient;

	@BeforeEach
	void setUp() {
		jdbc.update("DELETE FROM vital_signs");
		jdbc.update("DELETE FROM patients");
		patient = patientRepository.saveAndFlush(new Patient("A001", "陳測試"));
	}

	private VitalSign sign(String measuredAt, String temperature, int heartRate) {
		return new VitalSign(patient, Instant.parse(measuredAt), new BigDecimal(temperature),
				heartRate, 16, 122, 78, 98);
	}

	private void insertWithIntegerColumn(String column, int value) {
		Map<String, Integer> values = new LinkedHashMap<>();
		values.put("heart_rate", 78);
		values.put("respiratory_rate", 16);
		values.put("systolic_pressure", 122);
		values.put("diastolic_pressure", 78);
		values.put("oxygen_saturation", 98);
		values.put(column, value);
		jdbc.update("""
				INSERT INTO vital_signs (patient_id, measured_at, body_temperature, heart_rate, respiratory_rate,
				    systolic_pressure, diastolic_pressure, oxygen_saturation, created_at, updated_at)
				VALUES (?, '2026-01-01 00:00+00', 36.8, ?, ?, ?, ?, ?, now(), now())
				""", patient.getId(), values.get("heart_rate"), values.get("respiratory_rate"),
				values.get("systolic_pressure"), values.get("diastolic_pressure"), values.get("oxygen_saturation"));
	}

	@Test
	@DisplayName("data-model vital_signs.measuredAt 同一位病患的記錄時間唯一，含已刪除的資料")
	void uniquePatientAndTime() {
		VitalSign saved = vitalSignRepository.saveAndFlush(sign("2026-01-01T00:00:00Z", "36.8", 78));
		assertThatThrownBy(() -> vitalSignRepository.saveAndFlush(sign("2026-01-01T00:00:00Z", "36.8", 78)))
				.isInstanceOf(DataIntegrityViolationException.class);

		vitalSignRepository.delete(vitalSignRepository.findById(saved.getId()).orElseThrow());
		vitalSignRepository.flush();
		assertThatThrownBy(() -> vitalSignRepository.saveAndFlush(sign("2026-01-01T00:00:00Z", "36.8", 78)))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("data-model vital_signs.patientId 參照 patients")
	void patientMustExist() {
		assertThatThrownBy(() -> jdbc.update("""
				INSERT INTO vital_signs (patient_id, measured_at, body_temperature, heart_rate, respiratory_rate,
				    systolic_pressure, diastolic_pressure, oxygen_saturation, created_at, updated_at)
				VALUES (?, '2026-01-01 00:00+00', 36.8, 78, 16, 122, 78, 98, now(), now())
				""", patient.getId() + 999))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("data-model vital_signs.measuredAt 只到分鐘")
	void measuredAtMinutePrecision() {
		vitalSignRepository.saveAndFlush(sign("2026-01-01T00:01:00Z", "36.8", 78));
		assertThatThrownBy(() -> vitalSignRepository.saveAndFlush(sign("2026-01-01T00:02:30Z", "36.8", 78)))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("data-model vital_signs.bodyTemperature 0～999.9，最多 1 位小數")
	void bodyTemperature() {
		vitalSignRepository.saveAndFlush(sign("2026-01-01T00:00:00Z", "0", 78));
		vitalSignRepository.saveAndFlush(sign("2026-01-01T00:01:00Z", "999.9", 78));
		String[] invalid = { "-0.1", "1000", "36.85" };
		for (int i = 0; i < invalid.length; i++) {
			String value = invalid[i];
			String time = "2026-01-01T01:0%d:00Z".formatted(i);
			assertThatThrownBy(() -> vitalSignRepository.saveAndFlush(sign(time, value, 78)))
					.as(value)
					.isInstanceOf(DataIntegrityViolationException.class);
		}
	}

	@Test
	@DisplayName("data-model vital_signs 心跳、呼吸、收縮壓、舒張壓、血氧 0～999 的整數")
	void integerColumns() {
		for (String column : new String[] { "heart_rate", "respiratory_rate", "systolic_pressure",
				"diastolic_pressure", "oxygen_saturation" }) {
			for (int value : new int[] { -1, 1000 }) {
				assertThatThrownBy(() -> insertWithIntegerColumn(column, value))
						.as(column + "=" + value)
						.isInstanceOf(DataIntegrityViolationException.class);
			}
		}
	}

}
