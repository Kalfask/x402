FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY common/pom.xml common/
COPY auth-service/pom.xml auth-service/
COPY provider-service/pom.xml provider-service/
COPY payment-service/pom.xml payment-service/
COPY api-gateway/pom.xml api-gateway/
COPY discovery-server/pom.xml discovery-server/

RUN mkdir -p common/src/main/java \
    auth-service/src/main/java \
    provider-service/src/main/java \
    payment-service/src/main/java \
    api-gateway/src/main/java

RUN mvn dependency:go-offline -pl discovery-server

COPY discovery-server/src discovery-server/src

RUN mvn clean package -pl discovery-server -Dmaven.test.skip=true

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/discovery-server/target/discovery-server-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8761

ENTRYPOINT ["java", "-jar", "app.jar"]



