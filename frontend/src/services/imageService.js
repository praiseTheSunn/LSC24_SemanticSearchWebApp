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

const getNeighbors = (url) => {
    console.log('neighbors', url);
    return http.get(`/neighbors/${url}`);
}

const imageService = {
    getImage,
    getImages,
    getSimilarImages,
    getNeighbors
};

export default imageService;