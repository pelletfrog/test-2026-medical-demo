package io.github.pelletfrog.vitals.vitalsign;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

import io.github.pelletfrog.vitals.common.FieldErrorException;
import io.github.pelletfrog.vitals.common.NotFoundException;
import io.github.pelletfrog.vitals.patient.Patient;
import io.github.pelletfrog.vitals.patient.PatientRepository;
import io.github.pelletfrog.vitals.vitalsign.dto.PatientOptionsResponse;
import io.github.pelletfrog.vitals.vitalsign.dto.VitalSignCreateRequest;
import io.github.pelletfrog.vitals.vitalsign.dto.VitalSignValues;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VitalSignService {

	// spec 規定每頁 20 筆，不採用請求帶的 size：避免一次拉出大量資料
	private static final int PAGE_SIZE = 20;

	// 時間相同時再依 id：換頁時資料才不會重複或漏掉
	private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("measuredAt"), Sort.Order.desc("id"));

	private static final int PATIENT_OPTIONS_LIMIT = 20;

	private final VitalSignRepository vitalSignRepository;
	private final PatientRepository patientRepository;

	public VitalSignService(VitalSignRepository vitalSignRepository, PatientRepository patientRepository) {
		this.vitalSignRepository = vitalSignRepository;
		this.patientRepository = patientRepository;
	}

	@Transactional(readOnly = true)
	public Page<VitalSign> list(String keyword, Pageable pageable) {
		Pageable sorted = PageRequest.of(pageable.getPageNumber(), PAGE_SIZE, NEWEST_FIRST);
		if (keyword == null || keyword.isBlank()) {
			return vitalSignRepository.findAll(sorted);
		}
		String trimmed = keyword.strip();
		// 病歷號都存成大寫，轉成大寫才能不分大小寫；姓名照原樣比對
		return vitalSignRepository.findByPatientMedicalRecordNoContainingOrPatientNameContaining(
				trimmed.toUpperCase(Locale.ROOT), trimmed, sorted);
	}

	@Transactional(readOnly = true)
	public PatientOptionsResponse patientOptions(String keyword) {
		String trimmed = keyword == null ? "" : keyword.strip();
		List<Patient> found = patientRepository.findTop21ByMedicalRecordNoContainingOrNameContainingOrderByMedicalRecordNoAsc(
				trimmed.toUpperCase(Locale.ROOT), trimmed);
		boolean hasMore = found.size() > PATIENT_OPTIONS_LIMIT;
		return new PatientOptionsResponse(
				found.stream().limit(PATIENT_OPTIONS_LIMIT).map(PatientOptionsResponse.Option::from).toList(),
				hasMore);
	}

	@Transactional
	public VitalSign create(VitalSignCreateRequest request) {
		// 只有不經畫面直接呼叫 API 才會發生，當成病患欄位的錯誤
		Patient patient = patientRepository.findById(request.patientId())
				.orElseThrow(() -> new FieldErrorException("patientId", "找不到這位病患"));
		VitalSign sign = new VitalSign(patient, request.measuredAt(), request.bodyTemperature(),
				toInt(request.heartRate()), toInt(request.respiratoryRate()), toInt(request.systolicPressure()),
				toInt(request.diastolicPressure()), toInt(request.oxygenSaturation()));
		// 用 saveAndFlush 讓同一時間已有紀錄的約束錯誤在這裡發生，才能交給 GlobalExceptionHandler
		return vitalSignRepository.saveAndFlush(sign);
	}

	@Transactional
	public VitalSign update(Long id, VitalSignValues values) {
		VitalSign sign = vitalSignRepository.findWithPatientById(id)
				.orElseThrow(() -> new NotFoundException("找不到這筆紀錄"));
		sign.update(values.measuredAt(), values.bodyTemperature(), toInt(values.heartRate()),
				toInt(values.respiratoryRate()), toInt(values.systolicPressure()), toInt(values.diastolicPressure()),
				toInt(values.oxygenSaturation()));
		return vitalSignRepository.saveAndFlush(sign);
	}

	// 驗證已確認沒有小數；78.0 在 Request 建立時已經去掉尾端的 0
	private static Integer toInt(BigDecimal value) {
		return value.intValueExact();
	}

}
