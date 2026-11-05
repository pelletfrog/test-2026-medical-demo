package io.github.pelletfrog.vitals.config;

import java.time.Instant;
import java.time.LocalDateTime;

import io.github.pelletfrog.vitals.common.TimeZones;
import org.springframework.boot.jackson.JacksonComponent;
import tools.jackson.core.JsonGenerator;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.ValueSerializer;

/**
 * API 的時間一律是台灣時間的 yyyy-MM-dd HH:mm，見 docs/conventions.md §1.8。
 * 全域註冊，DTO 照常用 Instant，不會有哪個欄位忘了轉換。
 */
@JacksonComponent
public class JacksonConfig {

	public static class InstantSerializer extends ValueSerializer<Instant> {

		@Override
		public void serialize(Instant value, JsonGenerator gen, SerializationContext ctx) {
			gen.writeString(TimeZones.API_DATE_TIME.format(value));
		}

	}

	public static class InstantDeserializer extends ValueDeserializer<Instant> {

		@Override
		public Instant deserialize(JsonParser p, DeserializationContext ctx) {
			// 輸入不帶時區，和輸出一樣當成台灣時間
			return LocalDateTime.parse(p.getString(), TimeZones.API_DATE_TIME)
					.atZone(TimeZones.TAIPEI)
					.toInstant();
		}

	}

}
