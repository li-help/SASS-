FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
# 使用阿里云镜像加速
COPY settings.xml /root/.m2/settings.xml
COPY pom.xml .
COPY sass-kb-common/pom.xml sass-kb-common/
COPY sass-kb-tenant/pom.xml sass-kb-tenant/
COPY sass-kb-auth/pom.xml sass-kb-auth/
COPY sass-kb-doc/pom.xml sass-kb-doc/
COPY sass-kb-file/pom.xml sass-kb-file/
COPY sass-kb-search/pom.xml sass-kb-search/
COPY sass-kb-collaboration/pom.xml sass-kb-collaboration/
COPY sass-kb-notification/pom.xml sass-kb-notification/
COPY sass-kb-onboarding/pom.xml sass-kb-onboarding/
COPY sass-kb-web/pom.xml sass-kb-web/
RUN mvn dependency:go-offline -q
COPY . .
RUN mvn clean package -DskipTests -T 1C -q

FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /app/sass-kb-web/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
