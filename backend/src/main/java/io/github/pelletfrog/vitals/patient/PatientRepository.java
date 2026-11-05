package io.github.pelletfrog.vitals.patient;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {

	// Containing 會跳脫 % 與 _，使用者輸入的字不會被當成萬用字元
	Page<Patient> findByMedicalRecordNoContaining(String medicalRecordNo, Pageable pageable);

	// 生命徵象選擇病患用：多查 1 位，才知道是否超過 20 位
	List<Patient> findTop21ByMedicalRecordNoContainingOrNameContainingOrderByMedicalRecordNoAsc(
			String medicalRecordNo, String name);

}
