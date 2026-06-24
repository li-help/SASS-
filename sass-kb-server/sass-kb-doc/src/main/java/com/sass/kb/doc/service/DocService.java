package com.sass.kb.doc.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.util.HtmlSanitizer;
import com.sass.kb.doc.dto.DocSaveRequest;
import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.entity.DocumentVersion;
import com.sass.kb.doc.mapper.DocumentMapper;
import com.sass.kb.doc.mapper.DocumentVersionMapper;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocService {

    private final DocumentMapper documentMapper;
    private final DocumentVersionMapper documentVersionMapper;
    private final RabbitTemplate rabbitTemplate;

    public Document create(Document doc, String createdBy) {
        String tenantId = TenantContext.getCurrentTenantId();
        doc.setId(IdUtil.fastSimpleUUID());
        doc.setTenantId(tenantId);
        doc.setStatus(doc.getStatus() != null ? doc.getStatus() : "draft");
        doc.setVersion(1);
        doc.setCreatedBy(createdBy);
        doc.setUpdatedBy(createdBy);
        documentMapper.insert(doc);
        return doc;
    }

    public Document getById(String id) {
        Document doc = documentMapper.selectById(id);
        if (doc == null) {
            throw new BizException(404, "文档不存在");
        }
        return doc;
    }

    public Document save(String docId, DocSaveRequest req) {
        Document current = documentMapper.selectById(docId);
        if (current == null) {
            throw new BizException(404, "文档不存在");
        }

        // 乐观锁检查
        if (req.getVersion() == null) {
            throw new BizException(400, "版本号不能为空");
        }
        if (!req.getVersion().equals(current.getVersion())) {
            throw new BizException(409, "版本冲突：文档已被他人修改，请刷新后重试");
        }

        // 保存旧版本
        DocumentVersion dv = new DocumentVersion();
        dv.setId(IdUtil.fastSimpleUUID());
        dv.setDocumentId(docId);
        dv.setVersionNumber(current.getVersion());
        dv.setContentJson(current.getContentJson());
        dv.setContentHtml(current.getContentHtml());
        dv.setChangeSummary(req.getChangeSummary());
        dv.setCreatedBy(req.getUpdatedBy());
        documentVersionMapper.insert(dv);

        // 更新当前版本
        current.setTitle(req.getTitle());
        current.setContentJson(req.getContentJson());
        current.setContentHtml(HtmlSanitizer.sanitize(req.getContentHtml()));
        current.setVersion(current.getVersion() + 1);
        if (req.getUpdatedBy() != null) {
            current.setUpdatedBy(req.getUpdatedBy());
        }
        documentMapper.updateById(current);

        // 异步更新 ES
        rabbitTemplate.convertAndSend("doc.change", "doc.updated", docId);

        return documentMapper.selectById(docId);
    }

    public void delete(String id) {
        Document doc = documentMapper.selectById(id);
        if (doc == null) {
            throw new BizException(404, "文档不存在");
        }
        documentMapper.deleteById(id);
        // 异步更新 ES (删除索引)
        rabbitTemplate.convertAndSend("doc.change", "doc.deleted", id);
    }

    public Document updateStatus(String id, String status) {
        Document doc = documentMapper.selectById(id);
        if (doc == null) {
            throw new BizException(404, "文档不存在");
        }
        // 只更新 status 字段，不触碰 version，避免与其他并发保存冲突
        Document update = new Document();
        update.setId(id);
        update.setStatus(status);
        documentMapper.updateById(update);
        doc.setStatus(status);
        // 状态变更也同步 ES
        rabbitTemplate.convertAndSend("doc.change", "doc.updated", id);
        return doc;
    }

    public List<DocumentVersion> getVersions(String docId) {
        Document doc = documentMapper.selectById(docId);
        if (doc == null) {
            throw new BizException(404, "文档不存在");
        }
        return documentVersionMapper.selectList(
                new LambdaQueryWrapper<DocumentVersion>()
                        .eq(DocumentVersion::getDocumentId, docId)
                        .orderByDesc(DocumentVersion::getVersionNumber));
    }

    public DocumentVersion getVersion(String docId, Integer versionNumber) {
        DocumentVersion dv = documentVersionMapper.selectOne(
                new LambdaQueryWrapper<DocumentVersion>()
                        .eq(DocumentVersion::getDocumentId, docId)
                        .eq(DocumentVersion::getVersionNumber, versionNumber));
        if (dv == null) {
            throw new BizException(404, "版本不存在");
        }
        return dv;
    }

    public Map<String, String> diff(String docId, int v1, int v2) {
        DocumentVersion ver1 = getVersion(docId, v1);
        DocumentVersion ver2 = getVersion(docId, v2);
        return Map.of(
                "v1", ver1.getContentHtml() != null ? ver1.getContentHtml() : "",
                "v2", ver2.getContentHtml() != null ? ver2.getContentHtml() : "",
                "v1Version", String.valueOf(v1),
                "v2Version", String.valueOf(v2)
        );
    }

    public PageResult<Document> listBySpace(String spaceId, String folderId, int page, int size,
                                             String keyword, String status) {
        LambdaQueryWrapper<Document> qw = new LambdaQueryWrapper<>();
        qw.eq(Document::getSpaceId, spaceId);
        if (folderId != null) {
            qw.eq(Document::getFolderId, folderId);
        }
        if (keyword != null && !keyword.isBlank()) {
            qw.like(Document::getTitle, keyword);
        }
        if (status != null && !status.isBlank()) {
            qw.eq(Document::getStatus, status);
        }
        qw.orderByDesc(Document::getUpdatedAt);
        Page<Document> p = documentMapper.selectPage(new Page<>(page, size), qw);
        return new PageResult<>(p.getRecords(), p.getTotal(), page, size);
    }

    public List<Document> getRecent(int limit) {
        int safeLimit = Math.min(limit, 50);
        Page<Document> page = new Page<>(1, safeLimit);
        LambdaQueryWrapper<Document> qw = new LambdaQueryWrapper<>();
        qw.orderByDesc(Document::getUpdatedAt);
        return documentMapper.selectPage(page, qw).getRecords();
    }

    public Document restoreVersion(String docId, Integer versionNumber, String userId) {
        Document current = documentMapper.selectById(docId);
        if (current == null) {
            throw new BizException(404, "文档不存在");
        }

        DocumentVersion target = documentVersionMapper.selectOne(
                new LambdaQueryWrapper<DocumentVersion>()
                        .eq(DocumentVersion::getDocumentId, docId)
                        .eq(DocumentVersion::getVersionNumber, versionNumber));
        if (target == null) {
            throw new BizException(404, "要恢复的历史版本不存在");
        }

        // 1. 将当前文档状态备份为新版本记录
        DocumentVersion dv = new DocumentVersion();
        dv.setId(IdUtil.fastSimpleUUID());
        dv.setDocumentId(docId);
        dv.setVersionNumber(current.getVersion());
        dv.setContentJson(current.getContentJson());
        dv.setContentHtml(current.getContentHtml());
        dv.setChangeSummary("回滚至版本 V" + versionNumber);
        dv.setCreatedBy(userId);
        documentVersionMapper.insert(dv);

        // 2. 恢复至目标版本内容，版本号递增
        current.setContentJson(target.getContentJson());
        current.setContentHtml(target.getContentHtml());
        current.setVersion(current.getVersion() + 1);
        current.setUpdatedBy(userId);
        documentMapper.updateById(current);

        // 3. 异步更新 ES 索引
        rabbitTemplate.convertAndSend("doc.change", "doc.updated", docId);

        return documentMapper.selectById(docId);
    }
}
