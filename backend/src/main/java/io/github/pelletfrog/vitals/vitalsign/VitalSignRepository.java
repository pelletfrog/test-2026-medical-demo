package io.github.pelletfrog.vitals.vitalsign;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

// 列表與編輯都要顯示病歷號與姓名，一起查出病患；open-in-view 關閉，查詢之後就讀不到延遲載入的欄位
public interface VitalSignRepository extends JpaRepository<VitalSign, Long> {

	@Override
	@EntityGraph(attributePaths = "patient")
	Page<VitalSign> findAll(Pageable pageable);

	// Containing 會跳脫 % 與 _，使用者輸入的字不會被當成萬用字元
	@EntityGraph(attributePaths = "patient")
	Page<VitalSign> findByPatientMedicalRecordNoContainingOrPatientNameContaining(
			String medicalRecordNo, String name, Pageable pageable);

	@EntityGraph(attributePaths = "patient")
	Optional<VitalSign> findWithPatientById(Long id);

}
