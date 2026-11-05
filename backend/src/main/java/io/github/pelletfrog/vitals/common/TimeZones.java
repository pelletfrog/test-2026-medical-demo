package io.github.pelletfrog.vitals.common;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class TimeZones {

	// 病房在台灣；伺服器、容器的時區不一定是台北，需要台灣時間的地方都明確用這個
	public static final ZoneId TAIPEI = ZoneId.of("Asia/Taipei");

	// 前端直接顯示 API 給的字串，所以格式在這裡統一決定
	public static final DateTimeFormatter API_DATE_TIME =
			DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(TAIPEI);

	private TimeZones() {
	}

}
