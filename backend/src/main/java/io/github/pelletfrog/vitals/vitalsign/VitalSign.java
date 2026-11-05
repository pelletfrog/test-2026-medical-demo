package io.github.pelletfrog.vitals.vitalsign;

import java.math.BigDecimal;
import java.time.Instant;

import io.github.pelletfrog.vitals.common.BaseEntity;
import io.github.pelletfrog.vitals.patient.Patient;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "vital_signs")
public class VitalSign extends BaseEntity {

	// 建立後不能更換病患，見生命徵象 spec REQ-VIT-004 AC2
	// 不設成延遲載入：Hibernate 不允許延遲載入有 @SoftDelete 的 Entity；顯示紀錄時本來就都要病歷號與姓名
	@ManyToOne(optional = false)
	@JoinColumn(name = "patient_id", nullable = false, updatable = false)
	private Patient patient;

	@Column(nullable = false)
	private Instant measuredAt;

	@Column(nullable = false)
	private BigDecimal bodyTemperature;

	@Column(nullable = false)
	private Integer heartRate;

	@Column(nullable = false)
	private Integer respiratoryRate;

	@Column(nullable = false)
	private Integer systolicPressure;

	@Column(nullable = false)
	private Integer diastolicPressure;

	@Column(nullable = false)
	private Integer oxygenSaturation;

	protected VitalSign() {
	}

	public VitalSign(Patient patient, Instant measuredAt, BigDecimal bodyTemperature, Integer heartRate,
			Integer respiratoryRate, Integer systolicPressure, Integer diastolicPressure, Integer oxygenSaturation) {
		this.patient = patient;
		update(measuredAt, bodyTemperature, heartRate, respiratoryRate, systolicPressure, diastolicPressure,
				oxygenSaturation);
	}

	public void update(Instant measuredAt, BigDecimal bodyTemperature, Integer heartRate, Integer respiratoryRate,
			Integer systolicPressure, Integer diastolicPressure, Integer oxygenSaturation) {
		this.measuredAt = measuredAt;
		this.bodyTemperature = bodyTemperature;
		this.heartRate = heartRate;
		this.respiratoryRate = respiratoryRate;
		this.systolicPressure = systolicPressure;
		this.diastolicPressure = diastolicPressure;
		this.oxygenSaturation = oxygenSaturation;
	}

	public Patient getPatient() {
		return patient;
	}

	public Instant getMeasuredAt() {
		return measuredAt;
	}

	public BigDecimal getBodyTemperature() {
		return bodyTemperature;
	}

	public Integer getHeartRate() {
		return heartRate;
	}

	public Integer getRespiratoryRate() {
		return respiratoryRate;
	}

	public Integer getSystolicPressure() {
		return systolicPressure;
	}

	public Integer getDiastolicPressure() {
		return diastolicPressure;
	}

	public Integer getOxygenSaturation() {
		return oxygenSaturation;
	}

}
