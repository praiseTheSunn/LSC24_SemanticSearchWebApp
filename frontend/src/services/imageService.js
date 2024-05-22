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
    console.log('neighbors_api: ', url);
    return http.post(`/explore/explore_neighbor_images`, {
        "image_url": url,  
        "span": 30
    });
}

const imageService = {
    getImage,
    getImages,
    getSimilarImages,
    getNeighbors
};

export default imageService;