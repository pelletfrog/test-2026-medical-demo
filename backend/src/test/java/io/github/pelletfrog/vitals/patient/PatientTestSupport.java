package io.github.pelletfrog.vitals.patient;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

final class PatientTestSupport {

	private PatientTestSupport() {
	}

	static String patientJson(String medicalRecordNo, String name) {
		return """
				{"medicalRecordNo": "%s", "name": "%s"}
				""".formatted(medicalRecordNo, name);
	}

	static ResultActions postPatient(MockMvc mockMvc, Cookie token, String json) throws Exception {
		return mockMvc.perform(post("/api/patients")
				.cookie(token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(json));
	}

	static void createPatient(MockMvc mockMvc, Cookie token, String medicalRecordNo, String name) throws Exception {
		postPatient(mockMvc, token, patientJson(medicalRecordNo, name)).andExpect(status().isCreated());
	}

}
