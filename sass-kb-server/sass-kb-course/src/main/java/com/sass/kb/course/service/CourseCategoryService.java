package com.sass.kb.course.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.course.dto.CourseCategoryAddDTO;
import com.sass.kb.course.dto.CourseCategoryUpdateDTO;
import com.sass.kb.course.entity.CourseCategory;
import com.sass.kb.course.mapper.CourseCategoryMapper;
import com.sass.kb.course.vo.CourseCategoryVO;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseCategoryService {

    private final CourseCategoryMapper categoryMapper;

    public List<CourseCategoryVO> getTree() {
        String tenantId = TenantContext.getCurrentTenantId();
        List<CourseCategory> all = categoryMapper.selectList(
                new LambdaQueryWrapper<CourseCategory>()
                        .eq(CourseCategory::getTenantId, tenantId)
                        .orderByAsc(CourseCategory::getSort));
        Map<String, List<CourseCategory>> parentMap = all.stream()
                .collect(Collectors.groupingBy(c -> c.getParentId() != null ? c.getParentId() : "root"));
        return buildTree("root", parentMap);
    }

    public List<CourseCategoryVO> list() {
        return getTree(); // alias for consistency
    }

    public CourseCategoryVO getById(String id) {
        CourseCategory c = categoryMapper.selectById(id);
        if (c == null) throw new BizException(404, "分类不存在");
        return toVO(c);
    }

    @Transactional
    public CourseCategoryVO create(CourseCategoryAddDTO dto) {
        CourseCategory c = new CourseCategory();
        c.setId(IdUtil.fastSimpleUUID());
        c.setCatName(dto.getCatName());
        c.setParentId(dto.getParentId());
        c.setSort(dto.getSort() != null ? dto.getSort() : 0);
        c.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);
        c.setTenantId(TenantContext.getCurrentTenantId());
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());
        categoryMapper.insert(c);
        return toVO(c);
    }

    @Transactional
    public CourseCategoryVO update(CourseCategoryUpdateDTO dto) {
        CourseCategory existing = categoryMapper.selectById(dto.getId());
        if (existing == null) throw new BizException(404, "分类不存在");
        existing.setCatName(dto.getCatName());
        if (dto.getParentId() != null) existing.setParentId(dto.getParentId());
        if (dto.getSort() != null) existing.setSort(dto.getSort());
        if (dto.getStatus() != null) existing.setStatus(dto.getStatus());
        existing.setUpdatedAt(LocalDateTime.now());
        categoryMapper.updateById(existing);
        return toVO(categoryMapper.selectById(dto.getId()));
    }

    @Transactional
    public void delete(String id) {
        CourseCategory existing = categoryMapper.selectById(id);
        if (existing == null) throw new BizException(404, "分类不存在");
        // cascade delete children
        List<CourseCategory> children = categoryMapper.selectList(
                new LambdaQueryWrapper<CourseCategory>().eq(CourseCategory::getParentId, id));
        for (CourseCategory child : children) {
            delete(child.getId());
        }
        categoryMapper.deleteById(id);
    }

    private List<CourseCategoryVO> buildTree(String parentId, Map<String, List<CourseCategory>> parentMap) {
        List<CourseCategoryVO> nodes = new ArrayList<>();
        List<CourseCategory> children = parentMap.getOrDefault(parentId, List.of());
        for (CourseCategory cat : children) {
            CourseCategoryVO vo = toVO(cat);
            vo.setChildren(buildTree(cat.getId(), parentMap));
            nodes.add(vo);
        }
        return nodes;
    }

    private CourseCategoryVO toVO(CourseCategory c) {
        return CourseCategoryVO.builder()
                .id(c.getId())
                .catName(c.getCatName())
                .parentId(c.getParentId())
                .sort(c.getSort())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .children(new ArrayList<>())
                .build();
    }
}
