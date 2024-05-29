import http from "./http-common";

const getImage = (url) => {
    // console.log(url);
    return http.get(`/image/${url}`, { responseType: 'arraybuffer' });
}

const getImages = (text, model, mode) => {
   
    return http.post(`/search/search_with_text_query`, {  mode: mode,
    model: model, text_query: text });
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

const getSimilarImages2Image = (url) => {
    console.log('similarImages2Image_api: ', url);
    return http.post(`/explore/explore_similar_images`, {
        "image_urls": url,  
        "model": "stfm"
    });
}

const imageService = {
    getImage,
    getImages,
    getSimilarImages,
    getNeighbors,
    getSimilarImages2Image
};

export default imageService;