package io.github.pelletfrog.vitals.vitalsign.dto;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

// 數值只檢查格式與位數，不檢查醫學上的合理範圍，見生命徵象 spec §5
public record VitalSignCreateRequest(
		@NotNull(message = "請選擇病患")
		Long patientId,

		@NotNull(message = "請輸入記錄時間")
		@PastOrPresent(message = "記錄時間不能晚於現在")
		Instant measuredAt,

		@NotNull(message = "請輸入體溫")
		@DecimalMin(value = "0", message = "體溫需介於 0～999.9")
		@DecimalMax(value = "999.9", message = "體溫需介於 0～999.9")
		@Digits(integer = 3, fraction = 1, message = "體溫最多 1 位小數")
		BigDecimal bodyTemperature,

		@NotNull(message = "請輸入心跳")
		@DecimalMin(value = "0", message = "心跳需介於 0～999")
		@DecimalMax(value = "999", message = "心跳需介於 0～999")
		@Digits(integer = 3, fraction = 0, message = "心跳只能是整數")
		BigDecimal heartRate,

		@NotNull(message = "請輸入呼吸")
		@DecimalMin(value = "0", message = "呼吸需介於 0～999")
		@DecimalMax(value = "999", message = "呼吸需介於 0～999")
		@Digits(integer = 3, fraction = 0, message = "呼吸只能是整數")
		BigDecimal respiratoryRate,

		@NotNull(message = "請輸入收縮壓")
		@DecimalMin(value = "0", message = "收縮壓需介於 0～999")
		@DecimalMax(value = "999", message = "收縮壓需介於 0～999")
		@Digits(integer = 3, fraction = 0, message = "收縮壓只能是整數")
		BigDecimal systolicPressure,

		@NotNull(message = "請輸入舒張壓")
		@DecimalMin(value = "0", message = "舒張壓需介於 0～999")
		@DecimalMax(value = "999", message = "舒張壓需介於 0～999")
		@Digits(integer = 3, fraction = 0, message = "舒張壓只能是整數")
		BigDecimal diastolicPressure,

		@NotNull(message = "請輸入血氧")
		@DecimalMin(value = "0", message = "血氧需介於 0～999")
		@DecimalMax(value = "999", message = "血氧需介於 0～999")
		@Digits(integer = 3, fraction = 0, message = "血氧只能是整數")
		BigDecimal oxygenSaturation) implements VitalSignValues {

	// 驗證在建立之後才進行，所以在這裡先去掉尾端的 0
	public VitalSignCreateRequest {
		bodyTemperature = Decimals.normalize(bodyTemperature);
		heartRate = Decimals.normalize(heartRate);
		respiratoryRate = Decimals.normalize(respiratoryRate);
		systolicPressure = Decimals.normalize(systolicPressure);
		diastolicPressure = Decimals.normalize(diastolicPressure);
		oxygenSaturation = Decimals.normalize(oxygenSaturation);
	}

}
