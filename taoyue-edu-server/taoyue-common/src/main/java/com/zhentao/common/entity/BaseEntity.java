package com.zhentao.common.entity;

import java.util.Date;

import com.baomidou.mybatisplus.annotation.TableLogic;
import lombok.Data;

@Data
public class BaseEntity {

    private Long id;
    private Date createTime;
    private Date updateTime;
    private Long createBy;
    private Long updateBy;
    @TableLogic
    private Integer deleted;
    private String remark;
}
