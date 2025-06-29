import { httpClient } from "./AxiosHelper"

export const RoomService = {
    createRoom: async (roomId: string, name: string) => {
        const reqeustBody = {
            roomId: roomId,
            userName: name
        }
        const response = await httpClient.post("/api/v1/rooms", reqeustBody);

        return response;
    },


    joinRoom: async (roomId: string, name: string) => {
        const requestBody = {
            roomId: roomId,
            userName: name
        }
        const response = await httpClient.post(`/api/v1/rooms/${roomId}`, requestBody);
        return response;
    },

    loadMessages: async (roomId: string, page: number, size: number) => {
        const response = await httpClient.get(`/api/v1/rooms/${roomId}/messages`, {
            params: {
                page: page,
                size: size
            }
        });

        return response;
    },

    loadParticipants: async (roomId: string) => {
        const response = await httpClient.get(`/api/v1/rooms/${roomId}/participants`);
        return response;
    }
}