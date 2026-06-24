package com.sass.kb.collaboration.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.github.difflib.DiffUtils;
import com.github.difflib.UnifiedDiffUtils;
import com.github.difflib.patch.Patch;
import com.sass.kb.collaboration.dto.DiffResult;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.doc.entity.DocumentVersion;
import com.sass.kb.doc.mapper.DocumentVersionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiffService {

    private final DocumentVersionMapper documentVersionMapper;

    public DiffResult diff(String docId, int v1, int v2) {
        DocumentVersion ver1 = getVersion(docId, v1);
        DocumentVersion ver2 = getVersion(docId, v2);

        String html1 = ver1.getContentHtml() != null ? ver1.getContentHtml() : "";
        String html2 = ver2.getContentHtml() != null ? ver2.getContentHtml() : "";

        List<String> lines1 = Arrays.asList(html1.split("\n", -1));
        List<String> lines2 = Arrays.asList(html2.split("\n", -1));

        Patch<String> patch = DiffUtils.diff(lines1, lines2);
        List<String> unifiedDiff = UnifiedDiffUtils.generateUnifiedDiff(
                "v" + v1, "v" + v2, lines1, patch, 3);

        return DiffResult.builder()
                .v1Version(v1)
                .v2Version(v2)
                .v1Content(html1)
                .v2Content(html2)
                .patch(String.join("\n", unifiedDiff))
                .build();
    }

    private DocumentVersion getVersion(String docId, int versionNumber) {
        DocumentVersion ver = documentVersionMapper.selectOne(
                new LambdaQueryWrapper<DocumentVersion>()
                        .eq(DocumentVersion::getDocumentId, docId)
                        .eq(DocumentVersion::getVersionNumber, versionNumber));
        if (ver == null) {
            throw new BizException(404, "版本不存在: v" + versionNumber);
        }
        return ver;
    }
}
