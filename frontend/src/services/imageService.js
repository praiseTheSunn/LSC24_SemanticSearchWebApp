import http from "./http-common";

const getImage = (url) => {
    // console.log(url);
    return http.get(`/image/${url}`, { responseType: 'arraybuffer' });
}

const getImages = (text) => {
   
    return http.post(`/search/search_with_text_query`, {  mode: "smt-3m-dtin",
    model: "clip", text_query: text });
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