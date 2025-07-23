FROM openjdk:17-jdk-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl maven && rm -rf /var/lib/apt/lists/*

COPY pom.xml ./

RUN mvn dependency:go-offline -B

COPY src src

RUN mvn clean package -DskipTests

RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

EXPOSE 8080

ENV JAVA_OPTS="-Xmx512m -Xms256m -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar target/*.jar"]
