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
# 移除父 POM 中未复制到构建上下文的模块，避免 Maven 校验报错
RUN sed -i '/<module>taoyue-auth<\/module>/d; /<module>taoyue-course<\/module>/d; /taoyue-system/d; /taoyue-statistics/d' pom.xml
RUN mvn package -pl taoyue-gateway -am -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/taoyue-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
