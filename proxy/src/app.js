import { createServer, request } from "node:http";
import { MongoClient } from "mongodb";

const PORT = 8080;

const mongoClient = new MongoClient("mongodb://mongoadmin:mongoadmin@mongo:27017/");

const db = mongoClient.db("proxy");

const requestCollection = db.collection("requests");

const server = createServer(function (req, res) {

    let url = new URL(req.url);

    let body = ""
    let postParams

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

        // Подменяем заголовки
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        proxyRes.on("data", async (chunk) => {
            res.write(chunk);
        });

        proxyRes.on("end", async () => {
            res.end();
            await save()
        });
    });

    req.on("data", (chunk) => {
        proxyReq.write(chunk);
        body += chunk.toString();
    });

    req.on("end", () => {
        // В случае application/x-www-form-urlencoded отдельно распасим POST параметры
        if (headers["content-type"] === "application/x-www-form-urlencoded") {
            postParams = parsePostParams(body);
        }

        proxyReq.end();
    });

    async function save() {
        const request_record = {
            method: req.method,
            protocol: url.protocol,
            host: url.host,
            port: url.port,
            path: url.pathname,
            getParams: Object.fromEntries(url.searchParams.entries()),
            cookies: parseCookie(req.headers.cookie), // Отдельно парсим Cookie
            headers,
            postParams,
            body
        }

        // Сохраняем данные запроса в MongoDB
        await requestCollection.insertOne(request_record);
    }
});

server.listen(PORT, () => {
    console.log(`Прокси-сервер запущен на ${PORT} порту`);
});

function parseCookie(string) {
    if (string) {
        const cookies = string.split(";").map(cookie => cookie.trim()).filter(cookie => cookie !== "");
        return Object.fromEntries(cookies.map(cookie => cookie.split("=")));
    }
}

function parsePostParams(params) {
    if (params) {
        return Object.fromEntries(params.split("&").map(postParam => postParam.split("=")));
    }
}