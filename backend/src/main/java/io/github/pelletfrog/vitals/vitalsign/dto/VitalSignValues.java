package io.github.pelletfrog.vitals.vitalsign.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * 新增與編輯共用的欄位，讓 Service 不用分兩套。
 * 數值用 BigDecimal 接收：Jackson 會把 78.5 直接截成整數 78，「只能是整數」就擋不到。
 */
public interface VitalSignValues {

	Instant measuredAt();

	BigDecimal bodyTemperature();

	BigDecimal heartRate();

	BigDecimal respiratoryRate();

	BigDecimal systolicPressure();

	BigDecimal diastolicPressure();

	BigDecimal oxygenSaturation();

}
