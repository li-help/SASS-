package com.sass.kb.doc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpaceTree {

    private String id;
    private String name;
    private String type; // space | folder | doc
    private String status;
    private LocalDateTime updatedAt;
    private List<SpaceTree> children;
}
