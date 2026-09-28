/**
 * Compress an image file using offscreen canvas to avoid localStorage quota limits
 * Resizes max width/height to 1600px and compresses to JPEG with specified quality
 */
export const compressImageFile = (
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tệp không phải là hình ảnh hợp lệ'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        } catch (err) {
          console.error('Error compressing image:', err);
          resolve(e.target?.result as string);
        }
      };

      img.onerror = () => reject(new Error('Không thể tải dữ liệu hình ảnh'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Lỗi đọc tệp từ máy tính'));
    reader.readAsDataURL(file);
  });
};
