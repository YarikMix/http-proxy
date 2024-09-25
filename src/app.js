import { createServer, request } from "node:http";

const PORT = 8080;

const server = createServer(function (req, res) {

    let url = new URL(req.url);

    const headers = req.headers;

    // Удаляем заголовок Proxy-Connection
    delete headers["proxy-connection"];

    const options = {
        method: req.method,
        host: url.host,
        port: url.port,
        path: url.pathname + url.search, // Замененям путь на относительный
        headers
    };

    // Отправляем запрос на считанный хост и порт
    const proxyReq = request(options, (proxyRes) => {
        res.statusCode = proxyRes.statusCode;
        res.statusMessage = proxyRes.statusMessage;

        // Подменяет заголовки
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        proxyRes.on("data", (chunk) => {
            res.write(chunk);
        });

        proxyRes.on("end", async () => {
            res.end();
        });
    });

    req.on("data", (chunk) => {
        proxyReq.write(chunk);
    });

    req.on("end", () => {
        proxyReq.end();
    });
});

server.listen(PORT, () => {
    console.log(`Прокси-сервер запущен на ${PORT} порту`);
});