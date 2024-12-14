require(['common','slick'], function(){
  'use strict';

  $(function(){
    $('.js-slick').slick({
      dots: true,
      infinite: false,
      centerMode: true,
      slidesToShow: 1,
      variableWidth: true,
      responsive: [
        {
          breakpoint: 768,
          settings: {
            centerMode: true,
            variableWidth: true,
            slidesToShow: 1
          }
        },
        {
          breakpoint: 480,
          settings: {
            centerMode: true,
            variableWidth: true,
            slidesToShow: 1
          }
        }
      ]
    });
  });

});