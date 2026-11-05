package io.github.pelletfrog.vitals.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;

import io.github.pelletfrog.vitals.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.json.JsonMapper;

/**
 * conventions.md §1.8：API 的時間一律是台灣時間的 yyyy-MM-dd HH:mm。
 */
@IntegrationTest
class TimeFormatTest {

	@Autowired
	JsonMapper jsonMapper;

	@Autowired
	Clock clock;

	record Sample(Instant at) {
	}

	@Test
	@DisplayName("conventions §1.8 API 時間格式：輸出台灣時間")
	void writesTaipeiTime() {
		String json = jsonMapper.writeValueAsString(new Sample(Instant.parse("2026-11-04T16:30:59Z")));

		// UTC 16:30 是台灣隔天 00:30，日期也要跟著換
		assertThat(json).isEqualTo("{\"at\":\"2026-11-05 00:30\"}");
	}

	@Test
	@DisplayName("conventions §1.8 API 時間格式：輸入當成台灣時間")
	void readsTaipeiTime() {
		Sample sample = jsonMapper.readValue("{\"at\":\"2026-11-05 00:30\"}", Sample.class);

		assertThat(sample.at()).isEqualTo(Instant.parse("2026-11-04T16:30:00Z"));
	}

	@Test
	@DisplayName("conventions §1.8 Clock 用台灣時區")
	void clockUsesTaipei() {
		assertThat(clock.getZone()).isEqualTo(TimeZones.TAIPEI);
	}

}
