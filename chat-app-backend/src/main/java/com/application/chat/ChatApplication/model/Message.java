package com.application.chat.ChatApplication.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Transient;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Message {
    private String id;
    private String userId;
    private String userName;
    private String content;
    private String roomId;
    private LocalDateTime timestamp;
    @Transient
    private boolean isCurrentUser;
    private Attachment attachments;


    public static class Attachment {
        private String id;
        private String name;
        private String size;
        private String type;
        private String url;
        private String preview;
    }
}
