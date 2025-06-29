package com.application.chat.ChatApplication.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.application.chat.ChatApplication.model.Room;

@Repository
public interface RoomRepository extends MongoRepository<Room, String> {
    //get rrom using room id
    Room findByRoomId(String roomId);
}
