import http from "./http-common";

const getImage = (url) => {
    // console.log(url);
    return http.get(`/image/${url}`, { responseType: 'arraybuffer' });
}

const imageService = {
    getImage,
};

export default imageService;