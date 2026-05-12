FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY common/pom.xml common/
COPY auth-service/pom.xml auth-service/
COPY provider-service/pom.xml provider-service/
COPY payment-service/pom.xml payment-service/
COPY api-gateway/pom.xml api-gateway/
COPY discovery-server/pom.xml discovery-server/

RUN mkdir -p auth-service/src/main/java \
    payment-service/src/main/java \
    api-gateway/src/main/java \
    discovery-server/src/main/java

RUN mvn dependency:go-offline -pl common,provider-service -am -q || true

COPY common/src common/src
COPY provider-service/src provider-service/src

RUN mvn clean package -pl common,provider-service -am -Dmaven.test.skip=true -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/provider-service/target/provider-service-1.0.0-SNAPSHOT.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
