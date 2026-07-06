package com.projectmt.api.shared.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice(basePackages = "com.projectmt.api")
public final class GlobalExceptionHandler {

  private static final Logger LOGGER =
    LoggerFactory.getLogger(GlobalExceptionHandler.class);

  private final ApiProblemFactory problemFactory;

  public GlobalExceptionHandler(ApiProblemFactory problemFactory) {
    this.problemFactory = problemFactory;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiProblem> handleBodyValidation(
    MethodArgumentNotValidException exception,
    HttpServletRequest request
  ) {
    List<ApiFieldError> fieldErrors = exception
      .getBindingResult()
      .getFieldErrors()
      .stream()
      .map(error -> new ApiFieldError(
        error.getField(),
        Objects.requireNonNullElse(error.getCode(), "INVALID"),
        Objects.requireNonNullElse(
          error.getDefaultMessage(),
          "The supplied value is invalid."
        )
      ))
      .toList();

    return response(
      HttpStatus.BAD_REQUEST,
      ApiErrorCode.VALIDATION_FAILED,
      "One or more request fields are invalid.",
      request,
      fieldErrors
    );
  }

  @ExceptionHandler({
    HandlerMethodValidationException.class,
    ConstraintViolationException.class
  })
  public ResponseEntity<ApiProblem> handleParameterValidation(
    Exception exception,
    HttpServletRequest request
  ) {
    return response(
      HttpStatus.BAD_REQUEST,
      ApiErrorCode.VALIDATION_FAILED,
      "One or more request parameters are invalid.",
      request,
      List.of()
    );
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiProblem> handleUnreadableRequest(
    HttpMessageNotReadableException exception,
    HttpServletRequest request
  ) {
    return response(
      HttpStatus.BAD_REQUEST,
      ApiErrorCode.VALIDATION_FAILED,
      "The request body is missing or malformed.",
      request,
      List.of()
    );
  }

  @ExceptionHandler(ApiConflictException.class)
  public ResponseEntity<ApiProblem> handleConflict(
    ApiConflictException exception,
    HttpServletRequest request
  ) {
    return response(
      HttpStatus.CONFLICT,
      ApiErrorCode.CONFLICT,
      exception.getMessage(),
      request,
      List.of()
    );
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiProblem> handleNotFound(
    NoResourceFoundException exception,
    HttpServletRequest request
  ) {
    return response(
      HttpStatus.NOT_FOUND,
      ApiErrorCode.RESOURCE_NOT_FOUND,
      "The requested resource was not found.",
      request,
      List.of()
    );
  }

  @ExceptionHandler(ApiResourceNotFoundException.class)
  public ResponseEntity<ApiProblem> handleResourceNotFound(
    ApiResourceNotFoundException exception,
    HttpServletRequest request
  ) {
    return response(
      HttpStatus.NOT_FOUND,
      ApiErrorCode.RESOURCE_NOT_FOUND,
      exception.getMessage(),
      request,
      List.of()
    );
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiProblem> handleUnexpectedFailure(
    Exception exception,
    HttpServletRequest request
  ) {
    LOGGER
      .atError()
      .addKeyValue(
        "error.type",
        exception.getClass().getName()
      )
      .log("Unhandled API exception");

    return response(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ApiErrorCode.INTERNAL_ERROR,
      "An unexpected error occurred.",
      request,
      List.of()
    );
  }

  private ResponseEntity<ApiProblem> response(
    HttpStatus status,
    ApiErrorCode code,
    String detail,
    HttpServletRequest request,
    List<ApiFieldError> fieldErrors
  ) {
    ApiProblem problem = problemFactory.create(
      status,
      code,
      detail,
      request,
      fieldErrors
    );

    return ResponseEntity
      .status(status)
      .contentType(MediaType.APPLICATION_PROBLEM_JSON)
      .body(problem);
  }
}
