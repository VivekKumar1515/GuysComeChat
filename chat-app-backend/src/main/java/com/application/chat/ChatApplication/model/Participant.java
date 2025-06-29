package com.application.chat.ChatApplication.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("participants")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Participant {
    @Id
    private String id;
    private String name;
    @JsonProperty("isOnline")
    private boolean isOnline;
    private String roomId;
}
