# preload-njs-filter

Nginx njs module to support HTTP Preload / Resource Hints.

## Install

This njs module is tested to work with njs 0.7.5 or newer.

## Configure

### Prepare a preload manifest file

```json
{
  "manifestVersion": 1,
  "resources": {
    "/index.html": {
      "Link": [
        "<./assets/index.css>;rel=preload;as=style",
        "<./src/foobar.js>;rel=modulepreload",
        "</lib/foo.js>;rel=modulepreload",
        "</lib/bar.js>;rel=modulepreload",
        "<./src/qux.js>;rel=modulepreload;fetchpriority=low",
        "<http://example.com/index.html>;rel=canonical"
      ]
    },
    "/alternate.xhtml": {
      "Link": "<./src/foobar.js>;rel=modulepreload, </lib/foo.js>;rel=modulepreload, </lib/bar.js>;rel=modulepreload, <./src/qux.js>;rel=modulepreload;fetchpriority=low"
    }
  }
}
```



### Configure nginx

Edit nginx .conf

```nginx
# ...
load_module modules/ngx_http_xslt_filter_module.so;
load_module modules/ngx_http_js_module.so;

http {
  # ...
  js_path "/etc/nginx/njs";
  js_import preload from "preload.js";

  server {
    # listen 443 ssl http2;
    # server_name example.com;
    # ...
    location / {
      # root /var/www/example.com;
      # index index.html;
      set $preload_manifest "/var/www/example.com/WEB-INF/preload.json";
      location ~ \.x?html$ {
        js_header_filter preload.setHeaders;
      }
      # TODO Set max-age of Cache-Control to be at least 3 seconds for resources to be preloaded, or don't set Cache-Control.
      location /WEB-INF/ {
        internal;
      }
    }
  }
}
```



## Examples

Checkout [preload-njs-filter](https://github.com/http-preload/preload-njs-filter) for example code.



## License

[BSD](./LICENSE)
