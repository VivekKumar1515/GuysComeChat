package com.application.chat.ChatApplication.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.application.chat.ChatApplication.model.Participant;

@Repository
public interface ParticipantsRepository extends MongoRepository<Participant, String> {
   Participant findByRoomIdAndName(String roomId, String name);
   List<Participant> findByRoomId(String roomId); 
}
