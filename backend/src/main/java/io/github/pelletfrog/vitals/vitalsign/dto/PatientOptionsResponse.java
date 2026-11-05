package io.github.pelletfrog.vitals.vitalsign.dto;

import java.util.List;

import io.github.pelletfrog.vitals.patient.Patient;

/**
 * 新增紀錄時選擇病患用；hasMore 讓畫面提示「請輸入更多字」，見生命徵象 spec REQ-VIT-003 AC3。
 */
public record PatientOptionsResponse(List<Option> content, boolean hasMore) {

	public record Option(Long id, String medicalRecordNo, String name) {

		public static Option from(Patient patient) {
			return new Option(patient.getId(), patient.getMedicalRecordNo(), patient.getName());
		}

	}

}
