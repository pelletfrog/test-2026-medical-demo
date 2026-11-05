package io.github.pelletfrog.vitals.vitalsign.dto;

import java.math.BigDecimal;

final class Decimals {

	private Decimals() {
	}

	/**
	 * 去掉小數尾端的 0：78.0 就是整數 78、36.80 就是 36.8，和畫面的判斷一致；
	 * 不去掉的話 @Digits 會把 78.0 當成有 1 位小數。
	 */
	static BigDecimal normalize(BigDecimal value) {
		if (value == null) {
			return null;
		}
		BigDecimal stripped = value.stripTrailingZeros();
		// 100 去掉尾端的 0 會變成 1E+2，存進資料庫與回傳時都改回一般寫法
		return stripped.scale() < 0 ? stripped.setScale(0) : stripped;
	}

}
