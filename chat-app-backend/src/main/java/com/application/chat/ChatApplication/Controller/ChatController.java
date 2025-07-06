package com.application.chat.ChatApplication.Controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;

import com.application.chat.ChatApplication.DTO.OnlineStatusDTO;
import com.application.chat.ChatApplication.Repository.ParticipantsRepository;
import com.application.chat.ChatApplication.Repository.RoomRepository;
import com.application.chat.ChatApplication.model.Message;
import com.application.chat.ChatApplication.model.Participant;
import com.application.chat.ChatApplication.model.Room;
import com.application.chat.ChatApplication.model.TypingStatus;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ParticipantsRepository participantsRepository;
   private final RoomRepository roomRepository; 


   // For sending and receiving message
   @MessageMapping("/sendMessage/{roomId}")
   @SendTo("/topic/room/{roomId}")
   public Message sendMessage(@RequestBody Message message, @DestinationVariable String roomId) {
    Room room = roomRepository.findByRoomId(message.getRoomId());
    
    if(room != null) {
        room.getMessages().add(message);
        roomRepository.save(room);
    } else {
        throw new RuntimeException("Room not found");
    }

    System.out.println(message);
    return message;
   }

   @MessageMapping("/typing/{roomId}")
   @SendTo("/topic/typing/{roomId}")
   public TypingStatus startTyping(@RequestBody TypingStatus typingBody) {
    return new TypingStatus(typingBody.getUserName(), typingBody.getRoomId(), true);
   }

   @MessageMapping("/stopTyping/{roomId}")
   @SendTo("/topic/typing/{roomId}")
   public TypingStatus stopTyping(@RequestBody TypingStatus typingBody) {
    return new TypingStatus(typingBody.getUserName(), typingBody.getRoomId(), false);
   }

   @MessageMapping("/participant/join/{roomId}")
   @SendTo("/topic/participants/{roomId}")
   public Participant getParticipants(OnlineStatusDTO status) {
        Participant participant = participantsRepository.findByRoomIdAndName(status.getRoomId(), status.getName());
        participant.setOnline(true);
        return participantsRepository.save(participant);
   }

   @MessageMapping("/participant/left/{roomId}")
   @SendTo("/topic/participants/{roomId}")
   public Participant participantLeft(OnlineStatusDTO status) {
    Participant participant = participantsRepository.findByRoomIdAndName(status.getRoomId(), status.getName());
    participant.setOnline(false);

    return participantsRepository.save(participant);
   }
}
