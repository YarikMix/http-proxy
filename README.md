# HTTP-Прокси сервер

## Как запустить
```dockerfile
docker-compose up --build
```

## Пример использования
```html
curl -x http://127.0.0.1:8080 http://mail.ru

<html> 
    <head>
        <title>301 Moved Permanently</title>
    </head> 
    <body bgcolor="white"> 
        <center>
            <h1>301 Moved Permanently</h1>
        </center> 
        <hr><center>nginx/1.14.1</center> 
    </body> 
</html>
```

## Методы API
```
- /requests - запросы
- /request/:id - запрос по id
- /repeat/:id - повторить запрос
```