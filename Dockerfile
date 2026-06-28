# syntax=docker/dockerfile:1.7

FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /workspace

ARG PROJECT_DIR
ARG SERVICE_MODULE

COPY . .

RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -pl "${PROJECT_DIR}/${SERVICE_MODULE}" -am package -DskipTests \
    -Dmaven.wagon.http.retryHandler.count=5 \
    -Dural-common-starter.version=1.18-SNAPSHOT \
    -Dural-security.version=1.9-SNAPSHOT \
    -Dural-auth.version=1.9-SNAPSHOT \
    -Dural-users-api.version=1.1-SNAPSHOT

RUN set -eux; \
    jar_file="$(find "${PROJECT_DIR}/${SERVICE_MODULE}/target" -maxdepth 1 -type f -name '*.jar' ! -name 'original-*' | head -n 1)"; \
    test -n "${jar_file}"; \
    cp "${jar_file}" /tmp/service.jar

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY --from=build /tmp/service.jar /app/service.jar

ENTRYPOINT ["java", "-jar", "/app/service.jar"]
