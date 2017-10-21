# 声网Web客户端Demo

官网给的SDK写的很淳朴，导致调试了半天都不对劲，所以自己写了一个Demo，供测试使用。

## 声网 Web API 

点击这里去官网 [Web API - WebRTC ](https://docs.agora.io/cn/user_guide/API/webrtc_interop_api.html) 

## 服务器架设指南

本地搭建简易的 Https Nginx 静态服务器

### 一，生成证书
```
# 1、首先，进入你想创建证书和私钥的目录，例如：
cd /etc/nginx/

# 2、创建服务器私钥，命令会让你输入一个口令：
openssl genrsa -des3 -out server.key 1024

# 3、创建签名请求的证书（CSR）：
openssl req -new -key server.key -out server.csr

# 4、在加载SSL支持的Nginx并使用上述私钥时除去必须的口令：
cp server.key server.key.org
openssl rsa -in server.key.org -out server.key


# 5、最后标记证书使用上述私钥和CSR：
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

### 二，配置nginx

```
cd /etc/nginx
vim nginx.conf
#
# HTTPS server configuration
#
server {
    listen       443;
    server_name  本机的IP地址;

    ssl                  on;
    ssl_certificate      /etc/nginx/server.crt;
    ssl_certificate_key  /etc/nginx/server.key;

    ssl_session_timeout  5m;

#    ssl_protocols  SSLv2 SSLv3 TLSv1;
#    ssl_ciphers  ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP;
#    ssl_prefer_server_ciphers   on;

    location / {
        root   html;
        index  testssl.html index.html index.htm;
    }
}

```

## 初始化

1. 需要在 `app.js`里面填写默认的获取ChannelKey的 url地址, 如果没有使用 Dynamic Key，或者使用了 signalingKey ,注释掉或者相关获取key代码即可
1. 需要在 `index.html`里面填写默认的AppId
1. 为了测试方便，可在 `index.html` 里面把 Channel Id 和 User Id 都写上默认值

## 注意点

1. 确认Channel Key的生成方式，静态或者动态，参照官网 [密钥用户指南](https://docs.agora.io/cn/user_guide/Component_and_Others/Dynamic_Key_User_Guide.html)
2. `AgoraRTC`的 `init` 需要 appId ,  `join` 需要channelKey
3. `stream`的`play`方法传入HTML Element Id，SDK会自动创建DOM
4. user id 需要是纯数字， channel id 需要是字符串

## 常见错误
| Name        | Code           | Comment  | Explain |
| -- |--| -- | -- |
| ERR_INVALID_ARGUMENT | 2 | API调用了无效的参数。例如指定的频道名含有非法字符。 | 一般是参数错误 |
|WARN_LOOKUP_CHANNEL_REJECTED |105| 查找频道请求被服务器拒绝。服务器可能没有办法处理这个请求或请求是非法的。|一般是channelKey的问题 |
|‘SERVICE_NOT_AVAILABLE’| - | 服务不可用 | 一般是appId的问题 |

官网错误说明 [错误代码和警告代码](https://docs.agora.io/cn/user_guide/troubleshooting/error.html)


