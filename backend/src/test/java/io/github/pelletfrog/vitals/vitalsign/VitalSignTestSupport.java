package io.github.pelletfrog.vitals.vitalsign;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import io.github.pelletfrog.vitals.common.TimeZones;
import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

final class VitalSignTestSupport {

	private VitalSignTestSupport() {
	}

	/** 一筆數值都合法的紀錄；測試再用 with 改掉要驗證的欄位 */
	static Map<String, Object> record(Long patientId, String measuredAt) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("patientId", patientId);
		body.put("measuredAt", measuredAt);
		body.put("bodyTemperature", "36.8");
		body.put("heartRate", "78");
		body.put("respiratoryRate", "16");
		body.put("systolicPressure", "122");
		body.put("diastolicPressure", "78");
		body.put("oxygenSaturation", "98");
		return body;
	}

	static Map<String, Object> with(Map<String, Object> body, String field, Object value) {
		Map<String, Object> copy = new LinkedHashMap<>(body);
		copy.put(field, value);
		return copy;
	}

	static Map<String, Object> without(Map<String, Object> body, String field) {
		Map<String, Object> copy = new LinkedHashMap<>(body);
		copy.remove(field);
		return copy;
	}

	/** 數值用字串存，原樣寫進 JSON，才能送出 36.85、-1 這類要被擋下的值 */
	static String json(Map<String, Object> body) {
		return body.entrySet().stream()
				.map(e -> "\"%s\": %s".formatted(e.getKey(), jsonValue(e.getKey(), e.getValue())))
				.collect(Collectors.joining(", ", "{", "}"));
	}

	private static String jsonValue(String key, Object value) {
		if (value == null) {
			return "null";
		}
		if (key.equals("measuredAt")) {
			return "\"" + value + "\"";
		}
		return value.toString();
	}

	static String now() {
		return TimeZones.API_DATE_TIME.format(LocalDateTime.now(TimeZones.TAIPEI).atZone(TimeZones.TAIPEI));
	}

	static String tomorrow() {
		return TimeZones.API_DATE_TIME.format(LocalDateTime.now(TimeZones.TAIPEI).plusDays(1).atZone(TimeZones.TAIPEI));
	}

	static ResultActions postRecord(MockMvc mockMvc, Cookie token, Map<String, Object> body) throws Exception {
		return mockMvc.perform(post("/api/vital-signs").cookie(token)
				.contentType(MediaType.APPLICATION_JSON).content(json(body)));
	}

	static ResultActions putRecord(MockMvc mockMvc, Cookie token, Object id, Map<String, Object> body) throws Exception {
		return mockMvc.perform(put("/api/vital-signs/{id}", id).cookie(token)
				.contentType(MediaType.APPLICATION_JSON).content(json(body)));
	}

	static long createRecord(MockMvc mockMvc, Cookie token, Map<String, Object> body) throws Exception {
		String response = postRecord(mockMvc, token, body)
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return Long.parseLong(response.replaceAll(".*?\"id\"\\s*:\\s*(\\d+).*", "$1"));
	}

}
