package com.sass.kb.collaboration.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DiffResult {
    private int v1Version;
    private int v2Version;
    private String v1Content;
    private String v2Content;
    private String patch;
}
