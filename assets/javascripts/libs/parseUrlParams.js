module.exports = function(urlParams) {
  var temp = {};
  urlParams.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function() {
    var decode = function(s) {
      return decodeURIComponent(s.split("+").join(" "));
    };
    temp[decode(arguments[1])] = decode(arguments[2]);
  });
  return temp;
};
