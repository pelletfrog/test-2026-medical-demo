package io.github.pelletfrog.vitals;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class VitalsApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(VitalsApiApplication.class, args);
	}

}
