package com.sass.kb.doc.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DocSaveRequest {

    @NotBlank
    private String title;
    private String contentJson;
    private String contentHtml;

    @NotNull(message = "版本号不能为空")
    private Integer version;

    private String changeSummary;
    private String updatedBy;
}
