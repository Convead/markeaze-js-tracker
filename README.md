# Markeaze JS-tracker

With this tracker you can collect user event data (page views, e-commerce transactions etc) from the client-side tier of your websites and web apps.

## Basic usage example

```
<!-- Markeaze -->
<script>
(function(w,d,c){w[c]=w[c]||function(){(w[c].q=w[c].q||[]).push(arguments)};var t = document.cookie.match(new RegExp('(^| )mkz_version=([^;]+)'));var h = 'https://cdn.jsdelivr.net/gh/markeaze/markeaze-js-tracker@'+(t&&t[2]||'latest')+'/dist/mkz.js';var s = d.createElement('script');s.type = 'text/javascript';s.async = true;s.charset = 'utf-8';s.src = h;var x = d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s, x);})(window,document,'mkz');

mkz('watch', 'url.change', function() {
  mkz('trackPageView')
});

mkz('appKey', '0900737d3dad0d5e@dev');
</script>
<!-- /Markeaze -->
```
