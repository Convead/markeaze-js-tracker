# Markeaze js-tracker

With this tracker you can collect user event data (page views, e-commerce transactions etc) from the client-side tier of your websites and web apps.

## Setup

```
# install dependencies
npm install -g webpack-dev-server
npm install

# run web-server with auto-reload to apply changes
npm start

# compile assets in to /dist/mkz.js
npm run build
```

## Wiki

https://github.com/Convead/markeaze-wiki/wiki/Events

## Example html code for the site

```
<!-- Markeaze -->
<script>
(function(w,d,c,h){w[c]=w[c]||function(){(w[c].q=w[c].q||[]).push(arguments)};var s = d.createElement('script');s.type = 'text/javascript';s.async = true;s.charset = 'utf-8';s.src = h;var x = d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s, x);})(window,document,'mkz','mkz.js');

  mkz('endpoint', 'tracker.markeaze.com');
  mkz('appKey', '0900737d3dad0d5e');
</script>
<!-- /Markeaze -->
```
