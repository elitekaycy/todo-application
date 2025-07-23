# Todo Application - Event-Driven Deployment

This repository contains the containerized Todo application built with Spring Boot, designed with an event-driven CI/CD pipeline that automatically deploys to ECS when Docker images are pushed to ECR.

## Architecture

- **Backend**: Spring Boot 3.2 with Java 17
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: Amazon DynamoDB
- **Container**: Docker with multi-stage build
- **Deployment**: Event-driven via ECR → EventBridge → CodePipeline
- **CI/CD**: GitHub Actions → ECR → Automatic ECS deployment
