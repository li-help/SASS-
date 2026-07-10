package com.zhentao.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityEvent {

    /** CREATED | UPDATED | DELETED | STATUS_CHANGED */
    private String type;

    /** USER | TENANT | SPACE | DOC | FILE | ROLE */
    private String entityType;

    private String entityId;

    private String tenantId;

    private long timestamp;

    public static EntityEvent of(String type, String entityType, String entityId, String tenantId) {
        return EntityEvent.builder()
                .type(type)
                .entityType(entityType)
                .entityId(entityId)
                .tenantId(tenantId)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
