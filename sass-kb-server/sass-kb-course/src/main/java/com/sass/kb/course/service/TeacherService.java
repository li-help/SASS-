package com.sass.kb.course.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.course.dto.TeacherAddDTO;
import com.sass.kb.course.dto.TeacherUpdateDTO;
import com.sass.kb.course.entity.Teacher;
import com.sass.kb.course.mapper.TeacherMapper;
import com.sass.kb.course.vo.TeacherVO;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherMapper teacherMapper;

    public PageResult<TeacherVO> pageQuery(String keyword, int pageNum, int size) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<Teacher> qw = new LambdaQueryWrapper<>();
        qw.eq(Teacher::getTenantId, tenantId);
        if (keyword != null && !keyword.isBlank()) {
            qw.like(Teacher::getTeacherName, keyword);
        }
        qw.orderByAsc(Teacher::getSort).orderByDesc(Teacher::getCreatedAt);
        Page<Teacher> p = teacherMapper.selectPage(new Page<>(pageNum, size), qw);
        return new PageResult<>(
                p.getRecords().stream().map(this::toVO).toList(),
                p.getTotal(), pageNum, size);
    }

    public TeacherVO getById(String id) {
        Teacher t = teacherMapper.selectById(id);
        if (t == null) throw new BizException(404, "讲师不存在");
        return toVO(t);
    }

    @Transactional
    public TeacherVO create(TeacherAddDTO dto) {
        Teacher t = new Teacher();
        BeanUtils.copyProperties(dto, t);
        t.setId(IdUtil.fastSimpleUUID());
        t.setTenantId(TenantContext.getCurrentTenantId());
        t.setCreatedAt(LocalDateTime.now());
        t.setUpdatedAt(LocalDateTime.now());
        teacherMapper.insert(t);
        return toVO(t);
    }

    @Transactional
    public TeacherVO update(TeacherUpdateDTO dto) {
        Teacher existing = teacherMapper.selectById(dto.getId());
        if (existing == null) throw new BizException(404, "讲师不存在");
        Teacher t = new Teacher();
        BeanUtils.copyProperties(dto, t);
        t.setUpdatedAt(LocalDateTime.now());
        teacherMapper.updateById(t);
        return toVO(teacherMapper.selectById(dto.getId()));
    }

    @Transactional
    public void delete(String id) {
        Teacher existing = teacherMapper.selectById(id);
        if (existing == null) throw new BizException(404, "讲师不存在");
        teacherMapper.deleteById(id);
    }

    private TeacherVO toVO(Teacher t) {
        TeacherVO vo = new TeacherVO();
        BeanUtils.copyProperties(t, vo);
        return vo;
    }
}
