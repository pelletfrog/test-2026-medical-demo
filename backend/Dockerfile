FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
# 先只複製 Maven 設定：原始碼改了但依賴沒變時，下載依賴這層可以沿用快取
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw -q dependency:go-offline
COPY src src
# 測試在 commit 前跑過（見 /c-commit），建 image 時不重跑：Testcontainers 在 build 裡連不到 Docker
RUN ./mvnw -q -DskipTests package && cp target/*.jar app.jar

FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system app
COPY --from=build /app/app.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
