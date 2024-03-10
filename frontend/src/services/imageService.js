import http from "./http-common";

const getImage = (url) => {
    // console.log(url);
    return http.get(`/image/${url}`, { responseType: 'arraybuffer' });
}

const getImages = () => {
    return http.get("/images");
}

const imageService = {
    getImage,
    getImages,
};

export default imageService;