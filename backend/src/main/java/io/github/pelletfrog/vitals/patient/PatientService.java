package io.github.pelletfrog.vitals.patient;

import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {

	// spec 規定每頁 20 筆，不採用請求帶的 size：避免一次拉出大量資料
	private static final int PAGE_SIZE = 20;

	// 時間相同時再依 id：換頁時資料才不會重複或漏掉
	private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

	private final PatientRepository patientRepository;

	public PatientService(PatientRepository patientRepository) {
		this.patientRepository = patientRepository;
	}

	@Transactional(readOnly = true)
	public Page<Patient> list(String medicalRecordNo, Pageable pageable) {
		// 每頁筆數與排序固定由後端決定，只採用請求的頁碼
		Pageable sorted = PageRequest.of(pageable.getPageNumber(), PAGE_SIZE, NEWEST_FIRST);
		if (medicalRecordNo == null || medicalRecordNo.isBlank()) {
			return patientRepository.findAll(sorted);
		}
		// 病歷號都存成大寫，搜尋也轉成大寫，才能不分大小寫
		return patientRepository.findByMedicalRecordNoContaining(normalize(medicalRecordNo.strip()), sorted);
	}

	@Transactional
	public Patient create(String medicalRecordNo, String name) {
		// 不先查是否重複：已刪除的資料查不到，以資料庫的唯一約束為準，見 conventions §1.7
		// 用 saveAndFlush 讓約束錯誤在這裡發生，才能交給 GlobalExceptionHandler 轉成「已存在」
		// 姓名去掉前後空白，和畫面的 TextField 一致；不經畫面呼叫 API 時也一樣
		return patientRepository.saveAndFlush(new Patient(normalize(medicalRecordNo), name.strip()));
	}

	// 大小寫不同的病歷號視為同一個
	private static String normalize(String medicalRecordNo) {
		return medicalRecordNo.toUpperCase(Locale.ROOT);
	}

}
