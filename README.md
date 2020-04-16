# Markeaze JS-tracker

With this tracker you can collect user event data (page views, e-commerce transactions etc) from the client-side tier of your websites and web apps.

## Basic usage example

```
<!-- Markeaze -->
<script>
(function(w,d,c,h){w[c]=w[c]||function(){(w[c].q=w[c].q||[]).push(arguments)};var s = d.createElement('script');s.type = 'text/javascript';s.async = true;s.charset = 'utf-8';s.src = h;var x = d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s, x);})(window,document,'mkz','https://cdn.jsdelivr.net/gh/markeaze/markeaze-js-tracker@latest/dist/mkz.js');

mkz('watch', 'url.change', function() {
  mkz('trackPageView')
});

mkz('appKey', '0900737d3dad0d5e@dev');
</script>
<!-- /Markeaze -->
```
