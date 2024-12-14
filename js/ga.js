<!-- Google Tag Manager -->
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MDDQQ6M');
<!-- End Google Tag Manager -->

require(['vendor'], function(){
  $.ga = _.bind(function(){
    var args = Array.prototype.slice.call(arguments);
    args.push({
      hitCallback:function(){
        //console.log('ga.js done sending event');
      },
      useBeacon :true
    });
    ga.apply(this, args);
  }, this);

  $.gaProductFontInq = _.bind(function(label){
    $.ga('send', 'event', 'product_font', 'inquiry', label);
  }, this);

  $.gaProductFontSim = _.bind(function(){
    $.ga('send', 'event', 'product_font', 'simulation');
  }, this);

  $.gaProductFontEstimate = _.bind(function(label){
    $.ga('send', 'event', 'product_font', 'estimate', label);
  }, this);

  $.gaProductFontAddCart = _.bind(function(label){
    $.ga('send', 'event', 'product_font', 'add_cart', label);
  }, this);

  $.gaFormInq = _.bind(function(label){
    $.ga('send', 'event', 'form', 'inquiry', label);
  }, this);

  $.gaEvent = _.bind(function(action, label){
    $.ga('send', 'event', 'event', action, label);
  }, this);

  $.gaSpecimenApiRequest = _.bind(function(){
    $.ga('send', 'event', 'specimen', 'api_request');
  }, this);

  $.gaSpecimenDisplayDetail = _.bind(function(){
    $.ga('send', 'event', 'specimen', 'display_detail');
  }, this);
});
