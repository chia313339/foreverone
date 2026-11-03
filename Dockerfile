# Use an official nginx image
FROM nginx:alpine

# Copy static website files to the nginx html directory（排除清單見 .dockerignore）
COPY . /usr/share/nginx/html

# nginx 預設監聽 80 埠
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]
