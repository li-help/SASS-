package com.sass.kb.course.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.course.dto.CoursePeriodAddDTO;
import com.sass.kb.course.dto.CoursePeriodUpdateDTO;
import com.sass.kb.course.entity.CoursePeriod;
import com.sass.kb.course.mapper.CoursePeriodMapper;
import com.sass.kb.course.vo.CoursePeriodVO;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CoursePeriodService {

    private final CoursePeriodMapper periodMapper;

    public List<CoursePeriodVO> listByChapterId(String chapterId) {
        String tenantId = TenantContext.getCurrentTenantId();
        List<CoursePeriod> periods = periodMapper.selectList(
                new LambdaQueryWrapper<CoursePeriod>()
                        .eq(CoursePeriod::getTenantId, tenantId)
                        .eq(CoursePeriod::getChapterId, chapterId)
                        .orderByAsc(CoursePeriod::getSort));
        return periods.stream().map(this::toVO).toList();
    }

    @Transactional
    public CoursePeriodVO create(CoursePeriodAddDTO dto) {
        CoursePeriod p = new CoursePeriod();
        p.setId(IdUtil.fastSimpleUUID());
        p.setCourseId(dto.getCourseId());
        p.setChapterId(dto.getChapterId());
        p.setPeriodName(dto.getPeriodName());
        p.setPeriodDesc(dto.getPeriodDesc());
        p.setPeriodType(dto.getPeriodType() != null ? dto.getPeriodType() : 1);
        p.setDuration(dto.getDuration() != null ? dto.getDuration() : 0);
        p.setResourceUrl(dto.getResourceUrl());
        p.setIsFree(dto.getIsFree() != null ? dto.getIsFree() : 0);
        p.setSort(dto.getSort() != null ? dto.getSort() : 0);
        p.setTenantId(TenantContext.getCurrentTenantId());
        p.setCreatedAt(LocalDateTime.now());
        p.setUpdatedAt(LocalDateTime.now());
        periodMapper.insert(p);
        return toVO(p);
    }

    @Transactional
    public CoursePeriodVO update(CoursePeriodUpdateDTO dto) {
        CoursePeriod existing = periodMapper.selectById(dto.getId());
        if (existing == null) throw new BizException(404, "课时不存在");
        existing.setPeriodName(dto.getPeriodName());
        if (dto.getPeriodDesc() != null) existing.setPeriodDesc(dto.getPeriodDesc());
        if (dto.getPeriodType() != null) existing.setPeriodType(dto.getPeriodType());
        if (dto.getDuration() != null) existing.setDuration(dto.getDuration());
        if (dto.getResourceUrl() != null) existing.setResourceUrl(dto.getResourceUrl());
        if (dto.getIsFree() != null) existing.setIsFree(dto.getIsFree());
        if (dto.getSort() != null) existing.setSort(dto.getSort());
        existing.setUpdatedAt(LocalDateTime.now());
        periodMapper.updateById(existing);
        return toVO(periodMapper.selectById(dto.getId()));
    }

    @Transactional
    public void delete(String id) {
        CoursePeriod existing = periodMapper.selectById(id);
        if (existing == null) throw new BizException(404, "课时不存在");
        periodMapper.deleteById(id);
    }

    private CoursePeriodVO toVO(CoursePeriod p) {
        return CoursePeriodVO.builder()
                .id(p.getId())
                .chapterId(p.getChapterId())
                .courseId(p.getCourseId())
                .periodName(p.getPeriodName())
                .periodDesc(p.getPeriodDesc())
                .periodType(p.getPeriodType())
                .duration(p.getDuration())
                .resourceUrl(p.getResourceUrl())
                .isFree(p.getIsFree())
                .sort(p.getSort())
                .build();
    }
}
