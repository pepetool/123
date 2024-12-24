import React, { useEffect, useState } from 'react';

// 创建一个对象来存储图片缓存
const imageCache: { [url: string]: string } = {};

// 加载图片并缓存
async function loadImageAndCache(url: string): Promise<string> {
  // 检查缓存中是否已经存在图片
  if (imageCache[url]) {
    // 如果已经缓存了图片，直接返回缓存的 URL
    return imageCache[url];
  }

  try {
    // 使用 fetch 方法从 URL 获取图片数据
    const response = await fetch(url);
    const blob = await response.blob();

    // 将图片数据转换成 URL，并存储到缓存中
    const imageUrl = URL.createObjectURL(blob);
    imageCache[url] = imageUrl;

    // 返回获取的图片 URL
    return imageUrl;
  } catch (error) {
    console.error('Error loading image:', error);
    throw error;
  }
}

interface ImageProps {
  src: string;
  alt: string;
}

const LogoImage: React.FC<ImageProps> = ({ src, alt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // 加载并缓存图片
    loadImageAndCache(src)
      .then((imageUrl) => {
        setImageUrl(imageUrl);
      })
      .catch((error) => {
        console.error('Failed to load image:', error);
      });

    // 在组件卸载时清理缓存
    return () => {
      if (imageUrl && imageCache[src]) {
        URL.revokeObjectURL(imageUrl);
        delete imageCache[src];
      }
    };
  }, [src]);

  if (!imageUrl) {
    return <div> Loading... </div>;
  }

  return <img src={imageUrl} alt={alt} className='w-full h-full object-cover'/>;
};

export default LogoImage;
