package com.projectmt.api.config;

import com.projectmt.api.auth.ProjectMtJwtAuthenticationConverter;
import com.projectmt.api.shared.api.ApiAccessDeniedHandler;
import com.projectmt.api.shared.api.ApiAuthenticationEntryPoint;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(
  type = ConditionalOnWebApplication.Type.SERVLET
)
public class SecurityConfiguration {

  @Bean
  SecurityFilterChain apiSecurityFilterChain(
    HttpSecurity http,
    ProjectMtJwtAuthenticationConverter authenticationConverter,
    ApiAuthenticationEntryPoint authenticationEntryPoint,
    ApiAccessDeniedHandler accessDeniedHandler
  ) throws Exception {
    http
      .csrf(AbstractHttpConfigurer::disable)
      .cors(Customizer.withDefaults())
      .sessionManagement(session ->
        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .exceptionHandling(exceptions ->
        exceptions
          .authenticationEntryPoint(authenticationEntryPoint)
          .accessDeniedHandler(accessDeniedHandler)
      )
      .authorizeHttpRequests(authorize ->
        authorize
          .requestMatchers(
            "/actuator/health",
            "/actuator/info",
            "/api/v1",
            "/v3/api-docs",
            "/v3/api-docs.yaml",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
          )
          .permitAll()
          .anyRequest()
          .authenticated()
      )
      .oauth2ResourceServer(oauth2 ->
        oauth2
          .authenticationEntryPoint(authenticationEntryPoint)
          .accessDeniedHandler(accessDeniedHandler)
          .jwt(jwt ->
            jwt.jwtAuthenticationConverter(authenticationConverter)
          )
      );

    return http.build();
  }
}
