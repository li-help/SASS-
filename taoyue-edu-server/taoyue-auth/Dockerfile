FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
# 父 POM
COPY pom.xml .
# taoyue-common 依赖
COPY taoyue-common/pom.xml taoyue-common/
COPY taoyue-common/src taoyue-common/src
# auth 模块
COPY taoyue-auth/pom.xml taoyue-auth/
COPY taoyue-auth/src taoyue-auth/src
# 移除父 POM 中未复制到构建上下文的模块，避免 Maven 校验报错
RUN sed -i '/<module>taoyue-gateway<\/module>/d; /<module>taoyue-course<\/module>/d; /taoyue-system/d; /taoyue-statistics/d' pom.xml
RUN mvn package -pl taoyue-auth -am -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/taoyue-auth/target/*.jar app.jar
EXPOSE 8081
HEALTHCHECK --interval=15s --timeout=5s --retries=10 --start-period=60s \
  CMD wget -qO- http://localhost:8081/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
