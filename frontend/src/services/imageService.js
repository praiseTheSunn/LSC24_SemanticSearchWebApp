import http from "./http-common";

const getImage = (url) => {
    // console.log(url);
    return http.get(`/image/${url}`, { responseType: 'arraybuffer' });
}

const getImages = (text) => {
    // console.log(url);
    return http.get(`/query/${text}`);
}

const imageService = {
    getImage,
    getImages
};

export default imageService;