FROM python:3.12-slim
WORKDIR /site
COPY . .
EXPOSE 3200
CMD ["python", "-m", "http.server", "3200", "--bind", "0.0.0.0"]
