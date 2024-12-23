var require = {
  waitSeconds:0,
  //パス設定
  baseUrl:'/js/',
  paths:{
    //lib-vendor
    'vendor':'lib/vendor',
    //module-common
    'common':'module/common',
    //lib
    'marionette':'lib/backbone.marionette.min',
    'iscroll':'lib/iscroll',
    'flipsnap':'lib/flipsnap.min',
    'moment':'lib/moment.min',
    'clndr':'lib/clndr.min',
    'jquery.csv':'lib/jquery.csv-0.71.min',
    'nested':'lib/jquery.nested',
    'select2':'lib/select2.min',
    'rangeslider':'lib/rangeslider.min',
    'jquery-ui':'lib/jquery-ui.min',
    'jsonloader':'lib/jsonloader',
    'jquery.mousewheel':'lib/jquery.mousewheel.min',
    'sticky-state':'lib/sticky-state.min',
    'slick':'lib/slick.min',
    //module
    'modal':'module/modal',
    'accordion':'module/accordion',
    'carousel':'module/carousel',
    'carouselload':'module/carouselload',
    'calendar':'module/calendar',
    'fonttile':'module/fonttile',
    'tableoutput':'module/tableoutput',
    'fontsearchmodelcontroller':'module/fontsearchmodelcontroller',
    'promisemodel':'module/fontpromisemodel',
    'promisepublicmodel':'module/fontpromisepublicmodel',
    'promiseeducationmodel':'module/fontpromiseeducationmodel',
    'fontpricesimulate':'module/fontpricesimulate',
    'recordedfont':'module/recordedfont',
    'movielooper':'module/movielooper',
    'promomedia':'module/promomedia',
    //region
    'regionselector':'module/regionselector',
    //setting
    'tablesetting':'module/tablesetting',
    'accordionsetting':'module/accordionsetting',
    'storepurchasesetting':'module/storepurchasesetting',
    'carouselsetting':'module/carouselsetting',
    'carouselloadsetting':'module/carouselloadsetting',
    'pricesimulatesetting':'module/pricesimulatesetting',
    'modalsetting':'module/modalsetting',
    'recordedfontsetting':'module/recordedfontsetting'
  },
  //依存関係の設定
  shim:{
    'common':{
      deps:['vendor']
    },
    //lib
    'marionette':{
      deps:['vendor']
    },
    'clndr':{
      deps:['vendor']
    },
    'flipsnap':{
      deps:['vendor']
    },
    'jquery.csv':{
      deps:['vendor']
    },
    'nested':{
      deps:['vendor']
    },
    'select2':{
      deps:['vendor']
    },
    'rangeslider':{
      deps:['vendor']
    },
    'csv2table':{
      deps:['vendor']
    },
    'fontpricesimulate':{
      deps:['vendor', 'promisemodel']
    },
    'jquery-ui':{
      deps:['vendor']
    },
    'jquery.mousewheel':{
      deps:['vendor']
    },
    //
    'tablesetting':{
      deps:['vendor']
    },
    'carouselsetting':{
      deps:['vendor', 'common']
    },
    'carouselloadsetting':{
      deps:['vendor', 'common']
    },
    'modalsetting':{
      deps:['vendor', 'common', 'modal']
    },
    'pricesimulatesetting':{
      deps:['vendor', 'promisemodel', 'fontpricesimulate']
    },
    'slick':{
      deps:['vendor']
    },
  }
};
