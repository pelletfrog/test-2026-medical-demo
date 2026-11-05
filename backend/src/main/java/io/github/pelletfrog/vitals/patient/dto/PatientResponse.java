package io.github.pelletfrog.vitals.patient.dto;

import io.github.pelletfrog.vitals.patient.Patient;

public record PatientResponse(Long id, String medicalRecordNo, String name) {

	public static PatientResponse from(Patient patient) {
		return new PatientResponse(patient.getId(), patient.getMedicalRecordNo(), patient.getName());
	}

}
