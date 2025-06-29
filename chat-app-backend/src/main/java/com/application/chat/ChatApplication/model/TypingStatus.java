package com.application.chat.ChatApplication.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TypingStatus {
    private String userName;
    private String roomId;
    @JsonProperty("isTyping")
    private boolean isTyping;
}
