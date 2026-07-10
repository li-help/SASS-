package com.sass.kb.course.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.course.dto.CourseChapterAddDTO;
import com.sass.kb.course.dto.CourseChapterUpdateDTO;
import com.sass.kb.course.entity.CourseChapter;
import com.sass.kb.course.entity.CoursePeriod;
import com.sass.kb.course.mapper.CourseChapterMapper;
import com.sass.kb.course.mapper.CoursePeriodMapper;
import com.sass.kb.course.vo.CourseChapterVO;
import com.sass.kb.course.vo.CoursePeriodVO;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseChapterService {

    private final CourseChapterMapper chapterMapper;
    private final CoursePeriodMapper periodMapper;

    public List<CourseChapterVO> listByCourseId(String courseId) {
        String tenantId = TenantContext.getCurrentTenantId();
        List<CourseChapter> chapters = chapterMapper.selectList(
                new LambdaQueryWrapper<CourseChapter>()
                        .eq(CourseChapter::getTenantId, tenantId)
                        .eq(CourseChapter::getCourseId, courseId)
                        .orderByAsc(CourseChapter::getSort));
        return chapters.stream().map(this::toVO).toList();
    }

    @Transactional
    public CourseChapterVO create(CourseChapterAddDTO dto) {
        CourseChapter ch = new CourseChapter();
        ch.setId(IdUtil.fastSimpleUUID());
        ch.setCourseId(dto.getCourseId());
        ch.setChapterName(dto.getChapterName());
        ch.setChapterDesc(dto.getChapterDesc());
        ch.setSort(dto.getSort() != null ? dto.getSort() : 0);
        ch.setPeriodCount(0);
        ch.setTenantId(TenantContext.getCurrentTenantId());
        ch.setCreatedAt(LocalDateTime.now());
        ch.setUpdatedAt(LocalDateTime.now());
        chapterMapper.insert(ch);
        return toVO(ch);
    }

    @Transactional
    public CourseChapterVO update(CourseChapterUpdateDTO dto) {
        CourseChapter existing = chapterMapper.selectById(dto.getId());
        if (existing == null) throw new BizException(404, "章节不存在");
        existing.setChapterName(dto.getChapterName());
        if (dto.getChapterDesc() != null) existing.setChapterDesc(dto.getChapterDesc());
        if (dto.getSort() != null) existing.setSort(dto.getSort());
        existing.setUpdatedAt(LocalDateTime.now());
        chapterMapper.updateById(existing);
        return toVO(chapterMapper.selectById(dto.getId()));
    }

    @Transactional
    public void delete(String id) {
        CourseChapter existing = chapterMapper.selectById(id);
        if (existing == null) throw new BizException(404, "章节不存在");
        // delete periods under this chapter
        periodMapper.delete(new LambdaQueryWrapper<CoursePeriod>().eq(CoursePeriod::getChapterId, id));
        chapterMapper.deleteById(id);
    }

    private CourseChapterVO toVO(CourseChapter ch) {
        List<CoursePeriod> periods = periodMapper.selectList(
                new LambdaQueryWrapper<CoursePeriod>()
                        .eq(CoursePeriod::getChapterId, ch.getId())
                        .orderByAsc(CoursePeriod::getSort));
        List<CoursePeriodVO> periodVOs = periods.stream().map(p -> CoursePeriodVO.builder()
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
                .build()).toList();
        return CourseChapterVO.builder()
                .id(ch.getId())
                .courseId(ch.getCourseId())
                .chapterName(ch.getChapterName())
                .chapterDesc(ch.getChapterDesc())
                .periodCount(ch.getPeriodCount())
                .sort(ch.getSort())
                .periods(periodVOs)
                .build();
    }
}
