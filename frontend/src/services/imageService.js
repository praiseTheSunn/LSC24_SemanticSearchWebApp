import http from "./http-common";

const getImage = (url) => {
    return http.get(`/image/${url}`);
}

const imageService = {
    getImage,
};

export default imageService;