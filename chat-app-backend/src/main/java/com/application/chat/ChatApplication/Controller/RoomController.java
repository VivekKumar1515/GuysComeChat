package com.application.chat.ChatApplication.Controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.application.chat.ChatApplication.DTO.JoinRoomDTO;
import com.application.chat.ChatApplication.Repository.ParticipantsRepository;
import com.application.chat.ChatApplication.Repository.RoomRepository;
import com.application.chat.ChatApplication.model.Message;
import com.application.chat.ChatApplication.model.Participant;
import com.application.chat.ChatApplication.model.Room;

import lombok.RequiredArgsConstructor;

@RestController()
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepository;
    private final ParticipantsRepository participantsRepository;

    // create room
    @PostMapping()
    public ResponseEntity<?> createRoom(@RequestBody(required = true) JoinRoomDTO request) {
        if (roomRepository.findByRoomId(request.getRoomId()) != null) {
            // Room already exists
            return ResponseEntity.badRequest().body("Room already exists!");
        }

        // create new room
        Room room = new Room();
        room.setRoomId(request.getRoomId());
        Room savedRoom = roomRepository.save(room);
        // add participant to the room
        Participant doesExist = participantsRepository.findByRoomIdAndName(request.getRoomId(), request.getUserName());
        if(doesExist == null) {
            // then add one
            Participant participant = new Participant();
            participant.setOnline(true);
            participant.setName(request.getUserName());
            participant.setRoomId(request.getRoomId());
            participantsRepository.save(participant);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(savedRoom);
    }

    // get room: join
    @PostMapping("/{roomId}")
    public ResponseEntity<?> getRoom(@RequestBody(required = true) JoinRoomDTO request) {
        Room room = roomRepository.findByRoomId(request.getRoomId());
        if (room != null && !room.getId().isBlank()) {
            // room exists, we can join. but before that check if the participant is already associated with the room.
            Participant doesExist = participantsRepository.findByRoomIdAndName(request.getRoomId(), request.getUserName());
            if(doesExist == null) {
            // then add one
            Participant participant = new Participant();
            participant.setOnline(true);
            participant.setName(request.getUserName());
            participant.setRoomId(request.getRoomId());
            participantsRepository.save(participant);
        } else {
            doesExist.setOnline(true);
            participantsRepository.save(doesExist);
        }
            return ResponseEntity.ok().body(room);
        }

        // room doesn't exists
        return ResponseEntity.notFound().build();
    }

    // get messages of room
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable String roomId,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "20", required = false) int size) {
        Room room = roomRepository.findByRoomId(roomId);
        if (room != null && !room.getId().isBlank()) {
            List<Message> messages = room.getMessages();
            int start = Math.max(0, messages.size() - (page + 1) * size);
            int end = Math.min(messages.size(), start + size);

            // Returning the paginated messages
            return ResponseEntity.ok().body(messages.subList(start, end));
        }

        // room doesn't exist
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{roomId}/participants")
    public ResponseEntity<?> getParticipants(@PathVariable String roomId) {
        return ResponseEntity.ok(participantsRepository.findByRoomId(roomId));
    }
}
