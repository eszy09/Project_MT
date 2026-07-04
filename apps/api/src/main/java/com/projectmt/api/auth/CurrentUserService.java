package com.projectmt.api.auth;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public final class CurrentUserService {

  public AuthenticatedUser requireCurrentUser() {
    Authentication authentication = SecurityContextHolder
      .getContext()
      .getAuthentication();

    if (
      authentication
        instanceof ProjectMtAuthenticationToken projectMtAuthentication
      && authentication.isAuthenticated()
    ) {
      return projectMtAuthentication.user();
    }

    throw new AuthenticationCredentialsNotFoundException(
      "An authenticated Project_MT user is required."
    );
  }
}
