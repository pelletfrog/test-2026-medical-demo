package io.github.pelletfrog.vitals.patient;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {

	// Containing 會跳脫 % 與 _，使用者輸入的字不會被當成萬用字元
	Page<Patient> findByMedicalRecordNoContaining(String medicalRecordNo, Pageable pageable);

}
