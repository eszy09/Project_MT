# syntax=docker/dockerfile:1.7

FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

COPY apps/api/.mvn apps/api/.mvn
COPY apps/api/mvnw apps/api/mvnw
COPY apps/api/pom.xml apps/api/pom.xml

RUN chmod +x apps/api/mvnw
RUN ./apps/api/mvnw --file apps/api/pom.xml --batch-mode --no-transfer-progress dependency:go-offline

COPY apps/api/src apps/api/src

RUN ./apps/api/mvnw --file apps/api/pom.xml --batch-mode --no-transfer-progress -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

ENV API_PORT=8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

RUN apk upgrade --no-cache p11-kit p11-kit-trust libexpat
RUN addgroup -S projectmt && adduser -S projectmt -G projectmt

COPY --from=build --chown=projectmt:projectmt /workspace/apps/api/target/api-0.0.1-SNAPSHOT.jar /app/api.jar

USER projectmt

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health/readiness | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/api.jar"]
