package com.projectmt.api.config;

import jakarta.annotation.PostConstruct;
import java.util.List;
import org.springframework.boot.logging.LogLevel;
import org.springframework.boot.logging.LoggingSystem;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class SafeLoggingConfiguration {

  private static final List<String> SENSITIVE_NAMESPACES = List.of(
    "org.springframework.jdbc",
    "org.springframework.security",
    "org.springframework.web"
  );

  private final LoggingSystem loggingSystem = LoggingSystem.get(
    SafeLoggingConfiguration.class.getClassLoader()
  );

  @PostConstruct
  void enforceSensitiveFrameworkLogLevels() {
    List<String> configuredLoggers = loggingSystem
      .getLoggerConfigurations()
      .stream()
      .map(configuration -> configuration.getName())
      .toList();

    for (String namespace : SENSITIVE_NAMESPACES) {
      loggingSystem.setLogLevel(namespace, LogLevel.INFO);
      configuredLoggers
        .stream()
        .filter(logger ->
          logger.equals(namespace)
            || logger.startsWith(namespace + ".")
        )
        .forEach(logger ->
          loggingSystem.setLogLevel(logger, LogLevel.INFO)
        );
    }
  }
}
