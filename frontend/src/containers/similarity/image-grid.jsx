// ImageGrid.jsx

import './image-grid.css';
import React, { useEffect, useState } from 'react';
import Scrollbarsim from './scroll-bar-sim';
import view_icon from '../../assets/view_icon.png'

const ImageGrid = () => {
    const imageUrls = [
        'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_103749_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_103821_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_103853_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_103925_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_103957_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104029_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104101_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104133_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104205_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104237_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104309_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104341_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104413_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104445_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104517_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104549_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104621_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104653_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104725_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104757_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104829_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104901_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_104933_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105005_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105037_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105109_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105141_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105213_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105245_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105317_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105349_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105421_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105453_000.webp',
        'http://34.124.236.208/img_lsc/201901/01/20190101_105525_000.webp'
        // Thêm các URL hình ảnh khác ở đây
    ];

    const getInfoFromUrl = (url) => {
        const regex = /(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/; // Sử dụng biểu thức chính quy để phân tích URL

        const match = url.match(regex); // Sử dụng match để lấy thông tin từ URL
        if (!match) {
            return null; // Trả về null nếu không tìm thấy thông tin
        }

        console.log(match); // In ra các phần của match để kiểm tra


        // Chuyển đổi các giá trị thành chuỗi và thêm số 0 vào trước nếu cần
        // Trích xuất thông tin từ match
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const date = match[3].padStart(2, '0');
        const hour = match[4];
        const minute = match[5];
        const second = match[6];

        // Trả về đối tượng chứa thông tin
        return {
            // year: parseInt(year, 10),
            // month: parseInt(month, 10),
            // date: parseInt(date, 10),
            // hour: parseInt(hour, 10),
            // minute: parseInt(minute, 10),
            // second: parseInt(second, 10)
            year, month, date, hour, minute, second
        };
    }

    // Sử dụng hàm getInfoFromUrl với URL cụ thể
    // const url = 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp';
    // const info = getInfoFromUrl(url);
    // console.log(info); // In ra đối tượng chứa thông tin từ URL

    return (
        <div className='image-grid'>
            <Scrollbarsim>
                {/* create a grid of image */}
                <div className='grid-container'>
                    {imageUrls.map((url, index) => {
                        const info = getInfoFromUrl(url);
                        if (!info) return null;

                        const { year, month, date, hour, minute, second } = info;
                        const formattedTime = `${year}-${month}-${date} ${hour}:${minute}:${second}`;

                        return (
                            <div key={index} className='image-wrapper'>
                                <div className='overlay'>{formattedTime}</div>
                                <img
                                    src={url}
                                    alt={`Image ${index}`}
                                    className='image-item'
                                />
                                <img
                                    src={view_icon}
                                    alt={`View ${index}`}
                                    className='view-item'
                                />
                            </div>
                        );
                    })}
                </div>
            </Scrollbarsim>
        </div>
    );
}

export default ImageGrid;