package com.application.chat.ChatApplication.model;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Document(value = "rooms")
public class Room {
    @Id
    private String id;
    private String roomId;
    List<Message> messages = new ArrayList<>();
}
