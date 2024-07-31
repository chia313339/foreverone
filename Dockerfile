# Use an official nginx image
FROM nginx:alpine

# Copy static website files to the nginx html directory
COPY . /usr/share/nginx/html

# Expose port 8902
EXPOSE 8902

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]
