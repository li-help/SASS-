package com.sass.kb.file.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.file.config.MinioProperties;
import com.sass.kb.file.entity.FileAsset;
import com.sass.kb.file.mapper.FileAssetMapper;
import com.sass.kb.tenant.context.TenantContext;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class FileService {

    private final MinioClient minioClient;
    private final MinioProperties minioProperties;
    private final FileAssetMapper fileAssetMapper;

    public FileAsset upload(MultipartFile file, String spaceId, String userId) {
        String tenantId = TenantContext.getCurrentTenantId();
        String objName = (tenantId != null ? tenantId : "public") + "/"
                + IdUtil.fastSimpleUUID() + "/" + file.getOriginalFilename();

        try (var inputStream = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(minioProperties.getBucket())
                    .object(objName)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception e) {
            throw new BizException("文件上传失败: " + e.getMessage());
        }

        FileAsset asset = new FileAsset();
        asset.setId(IdUtil.fastSimpleUUID());
        asset.setTenantId(tenantId);
        asset.setSpaceId(spaceId);
        asset.setOriginalName(file.getOriginalFilename());
        asset.setStorePath(objName);
        asset.setFileSize(file.getSize());
        asset.setMimeType(file.getContentType());
        asset.setCreatedBy(userId);
        fileAssetMapper.insert(asset);
        return asset;
    }

    public FileAsset getById(String id) {
        FileAsset asset = fileAssetMapper.selectById(id);
        if (asset == null) {
            throw new BizException(404, "文件不存在");
        }
        return asset;
    }

    public String getDownloadUrl(String id) {
        FileAsset asset = getById(id);
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(minioProperties.getBucket())
                            .object(asset.getStorePath())
                            .expiry(30, TimeUnit.MINUTES)
                            .build());
        } catch (Exception e) {
            throw new BizException("生成下载链接失败: " + e.getMessage());
        }
    }

    public void delete(String id) {
        FileAsset asset = getById(id);
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(minioProperties.getBucket())
                    .object(asset.getStorePath())
                    .build());
        } catch (Exception e) {
            // 忽略 MinIO 删除失败，继续删数据库
        }
        fileAssetMapper.deleteById(id);
    }

    public PageResult<FileAsset> list(String spaceId, int page, int size, String keyword) {
        LambdaQueryWrapper<FileAsset> qw = new LambdaQueryWrapper<>();
        if (spaceId != null && !spaceId.isBlank()) {
            qw.eq(FileAsset::getSpaceId, spaceId);
        }
        if (keyword != null && !keyword.isBlank()) {
            qw.like(FileAsset::getOriginalName, keyword);
        }
        qw.orderByDesc(FileAsset::getCreatedAt);
        Page<FileAsset> p = fileAssetMapper.selectPage(new Page<>(page, size), qw);
        return new PageResult<>(p.getRecords(), p.getTotal(), page, size);
    }

    public void downloadToStream(String id, HttpServletResponse response) {
        // 下载接口免鉴权，需要绕过租户过滤直接查
        FileAsset asset = fileAssetMapper.selectByIdWithoutTenant(id);
        if (asset == null) {
            throw new BizException(404, "文件不存在");
        }
        try (InputStream stream = minioClient.getObject(GetObjectArgs.builder()
                .bucket(minioProperties.getBucket())
                .object(asset.getStorePath())
                .build())) {
            response.setContentType(asset.getMimeType() != null ? asset.getMimeType() : "application/octet-stream");
            response.setHeader("Content-Disposition",
                    "attachment; filename*=UTF-8''" + URLEncoder.encode(asset.getOriginalName(), StandardCharsets.UTF_8));
            OutputStream out = response.getOutputStream();
            stream.transferTo(out);
            out.flush();
        } catch (Exception e) {
            throw new BizException("文件下载失败: " + e.getMessage());
        }
    }

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    private static final Set<String> TEXT_MIME_TYPES = Set.of(
            "text/plain", "text/csv", "application/json",
            "text/markdown", "text/xml", "text/html",
            "text/css", "text/javascript", "application/javascript",
            "application/xml", "text/yaml"
    );

    private static final Set<String> TEXT_EXTENSIONS = Set.of(
            "txt", "csv", "json", "md", "xml", "yml", "yaml", "html", "htm",
            "css", "js", "ts", "jsx", "tsx", "java", "py", "sh", "bat",
            "sql", "properties", "ini", "cfg", "conf", "log", "env", "gitignore"
    );

    public String getContent(String id) {
        FileAsset asset = fileAssetMapper.selectById(id);
        if (asset == null) {
            throw new BizException(404, "文件不存在");
        }
        if (!isTextFile(asset)) {
            throw new BizException(400, "该文件类型不支持在线编辑");
        }
        try (InputStream stream = minioClient.getObject(GetObjectArgs.builder()
                .bucket(minioProperties.getBucket())
                .object(asset.getStorePath())
                .build())) {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            throw new BizException("读取文件内容失败: " + e.getMessage());
        }
    }

    public void saveContent(String id, String content) {
        FileAsset asset = fileAssetMapper.selectById(id);
        if (asset == null) {
            throw new BizException(404, "文件不存在");
        }
        if (!isTextFile(asset)) {
            throw new BizException(400, "该文件类型不支持在线编辑");
        }
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        if (bytes.length > MAX_FILE_SIZE) {
            throw new BizException(400, "文件大小超过限制 (最大 50MB)");
        }
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(minioProperties.getBucket())
                    .object(asset.getStorePath())
                    .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                    .contentType(asset.getMimeType())
                    .build());
            asset.setFileSize((long) bytes.length);
            fileAssetMapper.updateById(asset);
        } catch (Exception e) {
            throw new BizException("保存文件失败: " + e.getMessage());
        }
    }

    private boolean isTextFile(FileAsset asset) {
        String mimeType = asset.getMimeType();
        if (mimeType != null && TEXT_MIME_TYPES.contains(mimeType)) {
            return true;
        }
        String name = asset.getOriginalName();
        if (name != null) {
            int dot = name.lastIndexOf('.');
            if (dot >= 0) {
                String ext = name.substring(dot + 1).toLowerCase();
                return TEXT_EXTENSIONS.contains(ext);
            }
        }
        return false;
    }

    public void deleteBySpaceId(String spaceId) {
        List<FileAsset> assets = fileAssetMapper.selectList(
                new LambdaQueryWrapper<FileAsset>().eq(FileAsset::getSpaceId, spaceId));
        for (FileAsset asset : assets) {
            delete(asset.getId());
        }
    }
}
