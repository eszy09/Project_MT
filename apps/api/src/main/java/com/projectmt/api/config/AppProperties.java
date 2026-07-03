package com.projectmt.api.config;

import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "project-mt")
public record AppProperties(URI clientUrl) {}
