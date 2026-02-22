FROM nginx:alpine
# Copy static files from repo root (no /dist - files are at root)
COPY . /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
