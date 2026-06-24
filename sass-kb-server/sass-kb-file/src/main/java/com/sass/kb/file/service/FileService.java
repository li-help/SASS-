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
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
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

    public void deleteBySpaceId(String spaceId) {
        List<FileAsset> assets = fileAssetMapper.selectList(
                new LambdaQueryWrapper<FileAsset>().eq(FileAsset::getSpaceId, spaceId));
        for (FileAsset asset : assets) {
            delete(asset.getId());
        }
    }
}
