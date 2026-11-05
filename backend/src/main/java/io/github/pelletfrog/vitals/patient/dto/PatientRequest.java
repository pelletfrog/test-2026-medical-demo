package io.github.pelletfrog.vitals.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PatientRequest(
		@NotBlank(message = "請輸入病歷號")
		@Size(max = 20, message = "病歷號最多 20 個字")
		@Pattern(regexp = "[A-Za-z0-9]*", message = "病歷號只能是英文字母與數字")
		String medicalRecordNo,

		@NotBlank(message = "請輸入姓名")
		@Size(max = 50, message = "姓名最多 50 個字")
		String name) {
}
