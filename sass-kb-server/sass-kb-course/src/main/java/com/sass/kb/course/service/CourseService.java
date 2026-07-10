package com.sass.kb.course.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.course.dto.CourseAddDTO;
import com.sass.kb.course.dto.CoursePageQuery;
import com.sass.kb.course.dto.CourseUpdateDTO;
import com.sass.kb.course.entity.Course;
import com.sass.kb.course.entity.CourseCategory;
import com.sass.kb.course.entity.Teacher;
import com.sass.kb.course.mapper.CourseCategoryMapper;
import com.sass.kb.course.mapper.CourseMapper;
import com.sass.kb.course.mapper.TeacherMapper;
import com.sass.kb.course.vo.CourseDetailVO;
import com.sass.kb.course.vo.CourseVO;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseMapper courseMapper;
    private final CourseCategoryMapper categoryMapper;
    private final TeacherMapper teacherMapper;
    private final CourseChapterService chapterService;

    public PageResult<CourseVO> pageQuery(CoursePageQuery query) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<Course> qw = new LambdaQueryWrapper<>();
        qw.eq(Course::getTenantId, tenantId);
        if (StringUtils.hasText(query.getCourseName())) {
            qw.like(Course::getCourseName, query.getCourseName());
        }
        if (query.getCategoryId() != null) {
            qw.eq(Course::getCategoryId, query.getCategoryId());
        }
        if (query.getTeacherId() != null) {
            qw.eq(Course::getTeacherId, query.getTeacherId());
        }
        if (query.getDifficulty() != null) {
            qw.eq(Course::getDifficulty, query.getDifficulty());
        }
        if (query.getStatus() != null) {
            qw.eq(Course::getStatus, query.getStatus());
        }
        qw.orderByAsc(Course::getSort).orderByDesc(Course::getCreatedAt);
        Page<Course> p = courseMapper.selectPage(new Page<>(query.getPage(), query.getSize()), qw);
        return new PageResult<>(
                p.getRecords().stream().map(this::toVO).toList(),
                p.getTotal(), query.getPage(), query.getSize());
    }

    public CourseDetailVO getDetail(String id) {
        Course c = courseMapper.selectById(id);
        if (c == null) throw new BizException(404, "课程不存在");
        CourseDetailVO vo = new CourseDetailVO();
        BeanUtils.copyProperties(c, vo);
        vo.setOriginalPrice(c.getOriginalPrice() != null
                ? BigDecimal.valueOf(c.getOriginalPrice() / 100.0) : BigDecimal.ZERO);
        vo.setCurrentPrice(c.getCurrentPrice() != null
                ? BigDecimal.valueOf(c.getCurrentPrice() / 100.0) : BigDecimal.ZERO);
        if (c.getCategoryId() != null) {
            CourseCategory cat = categoryMapper.selectById(c.getCategoryId());
            if (cat != null) vo.setCategoryName(cat.getCatName());
        }
        if (c.getTeacherId() != null) {
            Teacher t = teacherMapper.selectById(c.getTeacherId());
            if (t != null) {
                vo.setTeacherName(t.getTeacherName());
                vo.setTeacherTitle(t.getTitle());
            }
        }
        vo.setChapters(chapterService.listByCourseId(id));
        return vo;
    }

    @Transactional
    public CourseVO create(CourseAddDTO dto) {
        Course c = new Course();
        BeanUtils.copyProperties(dto, c);
        c.setId(IdUtil.fastSimpleUUID());
        c.setStudentCount(0);
        c.setTenantId(TenantContext.getCurrentTenantId());
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());
        courseMapper.insert(c);
        return toVO(c);
    }

    @Transactional
    public CourseVO update(CourseUpdateDTO dto) {
        Course existing = courseMapper.selectById(dto.getId());
        if (existing == null) throw new BizException(404, "课程不存在");
        BeanUtils.copyProperties(dto, existing);
        existing.setUpdatedAt(LocalDateTime.now());
        courseMapper.updateById(existing);
        return toVO(courseMapper.selectById(dto.getId()));
    }

    @Transactional
    public void delete(String id) {
        Course existing = courseMapper.selectById(id);
        if (existing == null) throw new BizException(404, "课程不存在");
        // cascade delete chapters (which cascade deletes periods)
        var chapters = chapterService.listByCourseId(id);
        for (var ch : chapters) {
            chapterService.delete(ch.getId());
        }
        courseMapper.deleteById(id);
    }

    private CourseVO toVO(Course c) {
        CourseVO vo = new CourseVO();
        BeanUtils.copyProperties(c, vo);
        vo.setOriginalPrice(c.getOriginalPrice() != null
                ? BigDecimal.valueOf(c.getOriginalPrice() / 100.0) : BigDecimal.ZERO);
        vo.setCurrentPrice(c.getCurrentPrice() != null
                ? BigDecimal.valueOf(c.getCurrentPrice() / 100.0) : BigDecimal.ZERO);
        if (c.getCategoryId() != null) {
            CourseCategory cat = categoryMapper.selectById(c.getCategoryId());
            if (cat != null) vo.setCategoryName(cat.getCatName());
        }
        if (c.getTeacherId() != null) {
            Teacher t = teacherMapper.selectById(c.getTeacherId());
            if (t != null) vo.setTeacherName(t.getTeacherName());
        }
        return vo;
    }
}
