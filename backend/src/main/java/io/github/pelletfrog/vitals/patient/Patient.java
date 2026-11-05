package io.github.pelletfrog.vitals.patient;

import io.github.pelletfrog.vitals.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "patients")
public class Patient extends BaseEntity {

	@Column(nullable = false, length = 20)
	private String medicalRecordNo;

	@Column(nullable = false, length = 50)
	private String name;

	protected Patient() {
	}

	public Patient(String medicalRecordNo, String name) {
		this.medicalRecordNo = medicalRecordNo;
		this.name = name;
	}

	public String getMedicalRecordNo() {
		return medicalRecordNo;
	}

	public String getName() {
		return name;
	}

}
