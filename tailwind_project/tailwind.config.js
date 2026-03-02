/** Thêm File này tại thư mục Project bất kì để sử dụng Extension [Tailwind CSS IntelliSense]: gợi ý [CLASS] Tailwind
 * Link: https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss 
 * Lưu ý: - Tắt [VS CODE] và khởi động lại sau khi tạo File này nếu không thấy hiển thị gợi ý class tại File "index.html"
 *        - File này KHÔNG ẢNH HƯỞNG đến [Tailwind Config] tại File "index.html", chỉ ảnh hưởng đến Extension trên, để hiển thị gợi ý [CLASS] cấu hình thêm mới
 *        - Config [extend] tương tự tại File "index.html"
 * */
/** @type {import('tailwindcss').Config} */
export const theme = {
  extend: {
    screens: {
      "xs": "376px",
      "sm": "576px",
      "3xl": "1600px",
    },
    colors: {
      primary: "#ff5636",
      secondary: "#002023",
      tertiary: "#004147",
    },
  },
};
export const plugins = [];