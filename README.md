# preload-njs-filter

Nginx njs module to support HTTP Preload / Resource Hints.

## Install

This njs module is tested to work with njs 0.7.5, nginx 1.22.0, 1.23.0.

### Build an unsafe edition of ngx_http_js_module

To support `eval` and/or `Function` constrcutor, you need to take the following steps to prepare an unsafe edition of ngx_http_js_module, in order to support conditional expressions in Preload Manifest.

1. Download / git clone [njs](https://github.com/nginx/njs)

2. add `options.unsafe = 1;` to njs/nginx/ngx_http_js_module.c at line 4257

3. If you have already installed nginx and want to use existing nginx installation, then

   1. Run `nginx -v` to show Nginx version, and download source code of that version

   2. Run `nginx -V` to show Nginx configure args, and configure with the following args

      ```sh
      # assuming nginx-1.22.0, njs-0.7.5 are the source folders
      cd /PATH/TO/nginx-1.22.0
      # you may need to change debug-prefix-map of --with-cc-opt="... -fdebug-prefix-map=XXX ..."
      ./auto/configure <PREVIOUS-CONFIGURE-ARGS> --add-dynamic-module=/PATH/TO/njs-0.7.5/nginx
      make modules
      install -T objs/ngx_http_js_module.so /PATH/TO/nginx/modules/ngx_http_unsafe_js_module.so
      ```

4. Else if you build nginx manually, then

   1. Add `--add-dynamic-module=/PATH/TO/njs-0.7.5/nginx` to nginx configure args


See also articles like [How to build nginx from source](https://www.alibabacloud.com/blog/how-to-build-nginx-from-source-on-ubuntu-20-04-lts_597793).

### Install the preload-njs-filter module

If you have Node.js installed, then

```sh
# install preload-njs-filter in some other npm package (download-only)
npm install --no-save preload-njs-filter

# copy folder preload-njs-filter to some location
mkdir -p /etc/nginx/njs_modules/preload-njs-filter
cp -R ./node_modules/preload-njs-filter-0.1.0/* /etc/nginx/njs_modules/preload-njs-filter
```

Else

Visit https://www.npmjs.com/package/preload-njs-filter to get available versions

```sh
# Use the URL template below to download a package, note the X.Y.Z placeholder
# https://registry.npmjs.org/preload-njs-filter/-/preload-njs-filter-X.Y.Z.tgz
# Extact the package
tar -xzf preload-njs-filter-X.Y.Z.tgz

# copy folder preload-njs-filter to some location
mkdir -p /etc/nginx/njs_modules/preload-njs-filter
cp -R ./preload-njs-filter-0.1.0/* /etc/nginx/njs_modules/preload-njs-filter
```



## Configure

### Prepare a preload manifest file

```json
{
  "$schema": "https://raw.githubusercontent.com/http-preload/manifest/master/preload-v1.schema.json",
  "manifestVersion": 1,
  "conditions": {
    "supportsModulepreload": "function(userAgentData,headers){return userAgentData.brands.some(function(e){return e.brand==='Chromium'&&parseInt(e.version)>=66})}"
  },
  "resources": {
    "/index.html": [
      {"rel": "preload", "href": "/assets/index.css", "as": "style"}
    ],
    "/index.html supportsModulepreload": [
      {"rel": "modulepreload", "href": "/src/foobar.js"},
      {"rel": "modulepreload", "href": "/lib/foo.js"},
      {"rel": "modulepreload", "href": "/lib/bar.js"},
      {"rel": "modulepreload", "href": "/src/qux.js"}
    ]
  }
}
```



See [manifest README](../manifest/README.md) for more info.

### Configure nginx

Edit nginx .conf

```nginx
# ...
load_module modules/ngx_http_unsafe_js_module.so;

http {
  # ...
  js_path "/etc/nginx/njs_modules/preload-njs-filter";
  js_import preload from "preload.bundle.js";

  server {
    # listen 443 ssl http2;
    # server_name example.com;
    # ...
    location / {
      # root /var/www/example.com;
      # index index.html;
      set $preload_options '{"manifestFile": "/var/www/example.com/WEB-INF/preload.json", "index": "index.html"}';
      location ~* \.html$ {
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



## Known Limitations

This njs modole supports Preload Manifest v1 with the following limitations:

+ Each value of conditions must be a function expression instead of arrow function, since njs lacks support of arrow function currently.



## License

[BSD](./LICENSE)
