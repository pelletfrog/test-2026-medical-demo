package io.github.pelletfrog.vitals.common;

/**
 * Service 檢查出、要顯示在某個欄位下方的錯誤；GlobalExceptionHandler 轉成 400，放進 errors。
 * 用在驗證註解做不到、要查資料庫才知道的情況。
 */
public class FieldErrorException extends RuntimeException {

	private final String field;

	public FieldErrorException(String field, String message) {
		super(message);
		this.field = field;
	}

	public String getField() {
		return field;
	}

}
