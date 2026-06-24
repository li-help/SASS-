package com.sass.kb.doc.permission;

import com.sass.kb.common.permission.ResourceParentResolver;
import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.entity.Folder;
import com.sass.kb.doc.mapper.DocumentMapper;
import com.sass.kb.doc.mapper.FolderMapper;
import com.sass.kb.file.entity.FileAsset;
import com.sass.kb.file.mapper.FileAssetMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DocResourceParentResolver implements ResourceParentResolver {

    private final DocumentMapper documentMapper;
    private final FolderMapper folderMapper;
    private final FileAssetMapper fileAssetMapper;

    @Override
    public List<ResourceRef> resolveParents(String resourceType, String resourceId) {
        List<ResourceRef> chain = new ArrayList<>();

        switch (resourceType) {
            case "doc":
                Document doc = documentMapper.selectById(resourceId);
                if (doc != null) {
                    if (doc.getFolderId() != null && !doc.getFolderId().isBlank()) {
                        chain.add(new ResourceRef("folder", doc.getFolderId()));
                        // 递归解析 folder → space
                        chain.addAll(resolveParents("folder", doc.getFolderId()));
                    }
                    if (doc.getSpaceId() != null && !doc.getSpaceId().isBlank()) {
                        chain.add(new ResourceRef("space", doc.getSpaceId()));
                    }
                }
                break;
            case "folder":
                Folder folder = folderMapper.selectById(resourceId);
                if (folder != null && folder.getSpaceId() != null && !folder.getSpaceId().isBlank()) {
                    chain.add(new ResourceRef("space", folder.getSpaceId()));
                }
                break;
            case "file":
                FileAsset file = fileAssetMapper.selectById(resourceId);
                if (file != null && file.getSpaceId() != null && !file.getSpaceId().isBlank()) {
                    chain.add(new ResourceRef("space", file.getSpaceId()));
                }
                break;
            case "space":
                // space has no parent
                break;
        }

        return chain;
    }
}
