import http from "./http-common";

const getImage = (url) => {
    // console.log(url);
    return http.get(`/image/${url}`, { responseType: 'arraybuffer' });
}

const getImages = (text) => {
    // console.log(url);
    return http.get(`/query/${text}`);
}

const getSimilarImages = (url) => {
    console.log('similar', url);
    return http.get(`/similars/${url}`);
}

const imageService = {
    getImage,
    getImages,
    getSimilarImages
};

export default imageService;