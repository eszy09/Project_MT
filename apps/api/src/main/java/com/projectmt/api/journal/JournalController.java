package com.projectmt.api.journal;

import com.projectmt.api.shared.api.ApiPaths;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping(
  path = ApiPaths.V1 + "/journal",
  produces = MediaType.APPLICATION_JSON_VALUE
)
public class JournalController {

  private final JournalService journals;

  public JournalController(JournalService journals) {
    this.journals = journals;
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public JournalResponse create(
    @Valid @RequestBody JournalRequest request
  ) {
    return JournalResponse.from(journals.create(request.command()));
  }

  @GetMapping
  public List<JournalResponse> list() {
    return journals.list().stream().map(JournalResponse::from).toList();
  }

  @GetMapping("/{id}")
  public JournalResponse get(@PathVariable UUID id) {
    return JournalResponse.from(journals.get(id));
  }

  @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public JournalResponse update(
    @PathVariable UUID id,
    @RequestParam @Min(1) int version,
    @Valid @RequestBody JournalRequest request
  ) {
    return JournalResponse.from(
      journals.update(id, version, request.command())
    );
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id) {
    journals.delete(id);
  }

  public record JournalRequest(
    @NotBlank @Size(max = 140) String title,
    @NotBlank @Size(max = 10000) String content
  ) {
    JournalCommand command() {
      return new JournalCommand(title, content);
    }
  }

  public record JournalResponse(
    UUID id,
    String title,
    String content,
    String visibility,
    int version,
    Instant createdAt,
    Instant updatedAt
  ) {
    static JournalResponse from(JournalEntry entry) {
      return new JournalResponse(
        entry.id(),
        entry.title(),
        entry.content(),
        entry.visibility(),
        entry.version(),
        entry.createdAt(),
        entry.updatedAt()
      );
    }
  }
}
