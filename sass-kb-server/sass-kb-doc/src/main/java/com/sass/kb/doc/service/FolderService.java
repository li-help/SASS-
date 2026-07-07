package com.sass.kb.doc.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.doc.entity.Folder;
import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.mapper.FolderMapper;
import com.sass.kb.doc.mapper.DocumentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderMapper folderMapper;
    private final DocService docService;
    private final DocumentMapper documentMapper;

    public Folder create(Folder folder) {
        folder.setId(IdUtil.fastSimpleUUID());
        folder.setSortOrder(folder.getSortOrder() != null ? folder.getSortOrder() : 0);
        folderMapper.insert(folder);
        return folder;
    }

    public Folder update(String id, Folder folder) {
        Folder existing = folderMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "文件夹不存在");
        }
        folder.setId(id);
        folderMapper.updateById(folder);
        return folderMapper.selectById(id);
    }

    @Transactional
    public void delete(String id) {
        Folder existing = folderMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "文件夹不存在");
        }
        // 递归删除子节点
        deleteRecursive(id);
    }

    private void deleteRecursive(String parentId) {
        // 1. 先删除该文件夹下的所有文档，触发文档的关联删除与 ES 同步
        List<Document> docs = documentMapper.selectList(
                new LambdaQueryWrapper<Document>().eq(Document::getFolderId, parentId));
        for (Document doc : docs) {
            docService.delete(doc.getId());
        }

        // 2. 递归删除子文件夹
        List<Folder> children = folderMapper.selectList(
                new LambdaQueryWrapper<Folder>().eq(Folder::getParentId, parentId));
        for (Folder child : children) {
            deleteRecursive(child.getId());
        }
        folderMapper.deleteById(parentId);
    }

    public void move(String id, String targetParentId) {
        Folder folder = folderMapper.selectById(id);
        if (folder == null) {
            throw new BizException(404, "文件夹不存在");
        }
        folder.setParentId(targetParentId);
        folderMapper.updateById(folder);
    }

    public void sort(List<SortItem> items) {
        for (SortItem item : items) {
            Folder f = new Folder();
            f.setId(item.id());
            f.setSortOrder(item.sortOrder());
            folderMapper.updateById(f);
        }
    }

    public record SortItem(String id, Integer sortOrder) {}
}
