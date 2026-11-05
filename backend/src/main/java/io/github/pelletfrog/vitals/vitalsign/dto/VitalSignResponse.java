package io.github.pelletfrog.vitals.vitalsign.dto;

import java.math.BigDecimal;
import java.time.Instant;

import io.github.pelletfrog.vitals.vitalsign.VitalSign;

public record VitalSignResponse(
		Long id,
		Long patientId,
		String medicalRecordNo,
		String name,
		Instant measuredAt,
		BigDecimal bodyTemperature,
		Integer heartRate,
		Integer respiratoryRate,
		Integer systolicPressure,
		Integer diastolicPressure,
		Integer oxygenSaturation) {

	public static VitalSignResponse from(VitalSign v) {
		return new VitalSignResponse(v.getId(), v.getPatient().getId(), v.getPatient().getMedicalRecordNo(),
				v.getPatient().getName(), v.getMeasuredAt(), v.getBodyTemperature(), v.getHeartRate(),
				v.getRespiratoryRate(), v.getSystolicPressure(), v.getDiastolicPressure(), v.getOxygenSaturation());
	}

}
