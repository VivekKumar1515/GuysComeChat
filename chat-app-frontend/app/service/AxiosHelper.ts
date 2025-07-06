import axios from "axios"

export const baseURL = "http://15.206.186.127:8080";
export const httpClient = axios.create({
    baseURL: baseURL,

});