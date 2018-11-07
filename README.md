# CxMap js-tracker

With this tracker you can collect user event data (page views, e-commerce transactions etc) from the client-side tier of your websites and web apps.

## Setup

```
# install dependencies
npm install

# run web-server with auto-reload to apply changes
npm start

# compile assets in to /dist/mkz.js
npm run build
```

## Example html code for the site

```
<!-- Markeaze -->
<script>
(function(w,d,c,h){w[c]=w[c]||function(){(w[c].q=w[c].q||[]).push(arguments)};var s = d.createElement('script');s.type = 'text/javascript';s.async = true;s.charset = 'utf-8';s.src = h;var x = d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s, x);})(window,document,'mkz','mkz.js');

  mkz('debug', true);

  mkz(function() {
    this.eventSubscribe('track.before', function(data) {
      var el = document.getElementById('log');
      var html = (new Date()) + '<br />' + '<pre class="fade">' + JSON.stringify(data).replace(/([^\\]",|\{|\})/ig, '$1\n')+'</pre>';
      el.insertAdjacentHTML('afterbegin', html);
    });
  });

  mkz('endpoint', 'tracker.markeaze.com');
  mkz('appKey', '0900737d3dad0d5e');
</script>
<!-- /Markeaze -->
```
