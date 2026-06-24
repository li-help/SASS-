package com.sass.kb.file.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class MinioConfig {

    private final MinioProperties properties;

    @Bean
    public MinioClient minioClient() {
        MinioClient client = MinioClient.builder()
                .endpoint(properties.getEndpoint())
                .credentials(properties.getAccessKey(), properties.getSecretKey())
                .build();
        try {
            boolean found = client.bucketExists(BucketExistsArgs.builder()
                    .bucket(properties.getBucket())
                    .build());
            if (!found) {
                log.info("MinIO bucket '{}' does not exist, creating it...", properties.getBucket());
                client.makeBucket(MakeBucketArgs.builder()
                        .bucket(properties.getBucket())
                        .build());
                log.info("MinIO bucket '{}' created successfully.", properties.getBucket());
            } else {
                log.info("MinIO bucket '{}' already exists, skipping creation.", properties.getBucket());
            }
        } catch (Exception e) {
            log.warn("Failed to check or auto-create MinIO bucket: {}", e.getMessage());
        }
        return client;
    }
}
