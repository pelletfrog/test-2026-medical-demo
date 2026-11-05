package io.github.pelletfrog.vitals.common;

/**
 * 找不到資料，GlobalExceptionHandler 轉成 404；訊息直接給使用者看。
 */
public class NotFoundException extends RuntimeException {

	public NotFoundException(String message) {
		super(message);
	}

}
