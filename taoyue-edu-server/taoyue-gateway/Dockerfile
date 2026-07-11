FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
# 父 POM
COPY pom.xml .
# taoyue-common 依赖
COPY taoyue-common/pom.xml taoyue-common/
COPY taoyue-common/src taoyue-common/src
# gateway 模块
COPY taoyue-gateway/pom.xml taoyue-gateway/
COPY taoyue-gateway/src taoyue-gateway/src
RUN mvn package -pl taoyue-gateway -am -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/taoyue-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
