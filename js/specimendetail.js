(function(definition){
  define('basicmodel', ['vendor'], definition);
})(function(){
  'use strict';

  function _copy(object){
    return JSON.parse(JSON.stringify(object));
  }

  var BasicModel = Backbone.Model.extend({
    initialize:function(attributes, options){

    },
    getJSON:function(isCopy){
      if(isCopy){
        return _copy(this.attributes);
      }else{
        return this.attributes;
      }
    }
  });

  return BasicModel;
});

(function(definition){
  define('apimodel', ['vendor', 'basicmodel'], definition);
})(function(vendor, BasicModel){

  if(window.XDomainRequest){
    $.ajaxTransport('json', function(s){
      if(s.crossDomain && s.async){
        if(s.timeout){
          s.xdrTimeout = s.timeout;
          delete s.timeout;
        }
        var xdr;
        return {
          send:function(_, complete){
            function callback(status, statusText, responses, responseHeaders){
              xdr.onload = xdr.onerror = xdr.ontimeout = xdr.onprogress = $.noop;
              xdr = undefined;
              complete(status, statusText, responses, responseHeaders);
            }

            xdr = new XDomainRequest();
            xdr.open(s.type, s.url);
            xdr.onload = function(){
              callback(200, "OK", {text:xdr.responseText}, "Content-Type: " + xdr.contentType);
            };
            xdr.onerror = function(){
              callback(404, "Not Found");
            };
            xdr.onprogress = function(){
            };
            if(s.xdrTimeout){
              xdr.ontimeout = function(){
                callback(0, "timeout");
              };
              xdr.timeout = s.xdrTimeout;
            }
            xdr.send(( s.hasContent && s.data ) || null);
          },
          abort:function(){
            if(xdr){
              xdr.onerror = $.noop();
              xdr.abort();
            }
          }
        };
      }
    });
  }

  var APIModel = BasicModel.extend({
    event:{
      'REQUEST_COMPLETE':'APIModel_REQUEST_COMPLETE',
      'REQUEST_START':'APIModel_REQUEST_START'
    },
    initialize:function(attributes, options){

    },
    _setOptions:function(options){
      this.options = $.extend(true, {
        coreUrlRoot:'//api.morisawa.co.jp/v1/',
        region_code:'jp',
        funcOption:'',
        client_id:'',
        func:''//役割で変える
      }, options || {});

      this.onRequest = _.bind(this._onRequest, this);
      this._setApiCondition();
    },
    forceRequestAPI:function(param){
      clearTimeout(this.apiid);
      this._requestApi(param);
    },
    requestAPI:function(param){
      clearTimeout(this.apiid);
      this.apiid = setTimeout(_.bind(function(){
        this._requestApi(param);
      }, this), 2000);
    },
    _requestApi:function(param){
      this._setApiCondition();
      param = this._createParam(param);
      this.off('change', this.onRequest);
      this.on('change', this.onRequest);
      this.trigger(this.event.REQUEST_START);
      $.loading.open();

      $.ajax({
        type:"GET",
        url:this.url(),
        data:param,
        crossDomain:true,
        async:true,
        dataType:"json",
        success:_.bind(function(json){
          this.set(json);
        }, this),
        error:_.bind(function(XMLHttpRequest, textStatus, errorThrown){

        }, this)
      });

    },
    _onRequest:function(model){
      this.off('change', this.onRequest);
      $.loading.close();
      this.trigger(this.event.REQUEST_COMPLETE, model);
    },
    _setApiCondition:function(){
      //urlRootとidでURLが生成される
      this.urlRoot = location.protocol + this.options.coreUrlRoot + this.options.region_code;
      this.set('id', this.options.func + this.options.funcOption, {silent:true});
    },
    //
    _createParam:function(param){
      param = $.extend(true, {
        client_id:this.options.client_id
      }, param || {});
      return this._paramFilter(param);
    },
    //
    _paramFilter:function(param){
      var para = {};
      for(var name in param){
        if(param[name] === '' || param[name] === null || param[name] === undefined){
        }
        else{
          para[name] = param[name];
        }
      }
      return para;
    }
  });

  return APIModel;
});

(function(definition){
  define('cookiemodel', ['vendor', 'basicmodel'], definition);
})(function(vendor, BasicModel){
  'use strict';

  var CookieConnector = (function(){
    function CookieConnector(){
      this.init.apply(this, arguments);
    }

    CookieConnector.prototype.init = function(){
      this.setValue = _setValue;
      this.getValue = _getValue;
      this.remove = _remove;
      this.getLimitDateString = _getLimitDateString;
    };

    function _setValue(key, value, limit, option){
      //value
      var str = key + '=' + encodeURIComponent(value) + ';';
      //limit
      if (limit instanceof Date){
        str += 'expires=' + limit.toGMTString() + ';';
      }
      else if(typeof limit === 'number') {
        str += 'expires=' + _getLimitDateString(limit) + ';';
      }

      //option
      if(option){
        //domain
        if(option.domain){
          str += 'domain=' + option.domain + ';';
        }
        //path
        if(option.path){
          str += 'path=' + option.path + ';';
        }
        //secure
        if(option.secure){
          str += 'secure;';
        }
      }
      document.cookie = str;
    }

    function _getValue(key){
      var arr = document.cookie.split('; ');
      var i = arr.length;
      var arrs;
      while(i--){
        arrs = arr[i].split('=');
        if(arrs[0] === key) {
          return decodeURIComponent(arrs[1]);
        }
      }
    }

    function _remove(key){
      document.cookie = key + '=' + 'xx;expires=Tue, 1-Jan-1980 00:00:00;';
    }

    function _getLimitDateString(limit){
      var sec = 1000 * 60 * 60 * 24 * limit;
      limit = new Date(new Date().getTime() + sec).toGMTString();
      return limit;
    }

    return CookieConnector;
  })();

  var CookieModel = BasicModel.extend({
    initialize:function(attributes, options){

    },
    _setOptions:function(options){
      this.options = $.extend(true, {
        key:'',
        term:'',//保存期間
        option:''
      }, options || {});
      this._cc = new CookieConnector();
    },
    setCookie:function(value){
      var json = JSON.stringify(value);
      this._cc.setValue(
        this.options.key,
        json,
        this.options.term,
        this.options.option
      );
    },
    margeCookie:function(){
      this.setCookie(this.getJSON(true));
    },
    fetchCookie:function(){
      var string = this._cc.getValue(this.options.key);
      if(string){
        var json = JSON.parse(string);
        this.set(json, {silent:true});
      }
    }
  });

  return CookieModel;
});

(function(definition){
  define('fontsearchapimodel', ['vendor', 'apimodel'], definition);
})(function(vendor, APIModel){
  /**
   * FontSearchApiModel
   */
  var FontSearchApiModel = APIModel.extend({
    enum:{
      result_type:{
        FAMILY:'family',
        FONT:'font'
      },
      sort_by:{
        CLASSIFICATION:'classification',
        JAPANESE_SYLLABARY:'japanese_syllabary'
      },
      simple_weight:{
        THIN:'thin',
        MEDIUM:'medium',
        HEAVY:'heavy',
        ULTRA_HEAVY:'ultra_heavy'
      }
    },
    initialize:function(attributes, options){
      this.options = $.extend(true, {
        func:'search',
        isSortwrap:true
      }, options || {});

      this._setOptions(this.options);
    },
    _onRequest:function(model){
      this.off('change', this.onRequest);
      $.loading.close();

      //ラッピング
      if(this.options.isSortwrap){
        this._sortWrap();
      }
      this._setTotalPage();

      this.trigger(this.event.REQUEST_COMPLETE, this);
    },
    _setTotalPage:function(){
      var totalCount = 0;
      var json = this.getJSON(true);
      if(json.meta.result_type === 'family'){
        totalCount = json.meta.family_total_count;
      }else if(json.meta.result_type === 'font'){
        totalCount = json.meta.font_total_count;
      }
      json.meta.total_count = totalCount;
      this.clear({silent:true});
      this.set(json, {silent:true});
    },
    _sortWrap:function(){
      var json = this.getJSON(true);
      var type = json.meta.sort_by;
      json = this._wrap(json, type);
      this.clear({silent:true});
      this.set(json, {silent:true});
    },
    _wrap:function(json, unitname){
      var data = {};
      data.meta = json.meta;
      data.units = [];

      var nowunit = '';
      var beforeunit = '';
      var unit = {};

      _.each(json.families, _.bind(function(family){
        nowunit = family[unitname];
        if(nowunit !== beforeunit){
          unit = {unit_name:nowunit, families:[]};
          unit.families.push(family);
          data.units.push(unit);
        }else{
          unit = data.units[data.units.length-1];
          unit.families.push(family);
        }
        beforeunit = nowunit;
      }, this));

      return data;
    }
  });
  return FontSearchApiModel;
});

(function(definition){
  define('searchselectionentriesmodel', ['vendor', 'apimodel'], definition);
})(function(vendor, APIModel){
  /**
   * SearchSelectionEntriesModel
   */
  var SearchSelectionEntriesModel = APIModel.extend({
    initialize:function(attributes, options){
      this.options = $.extend(true, {
        func:'search-selection-entries'
      }, options || {});
      this._setOptions(this.options);
    }
  });
  return SearchSelectionEntriesModel;
});
(function(definition){
  define('fontsearchapibyidmodel', ['vendor', 'apimodel'], definition);
})(function(vendor, APIModel){
  /**
   * FontSearchApiByIdModel
   */
  var FontSearchApiByIdModel = APIModel.extend({
    initialize:function(attributes, options){
      this.options = $.extend(true, {
        func:'fonts'
      }, options || {});

      this._setOptions(this.options);
    },
    //override
    _createParam:function(param){
      var _param = $.extend(true, {
        client_id:this.options.client_id,
        font_ids:param
      }, {});
      return this._paramFilter(_param);
    }
  });
  return FontSearchApiByIdModel;
});

(function(definition){
  define('fontsearchcriteriamodel', ['vendor', 'cookiemodel'], definition);
})(function(vendor, CookieModel){
  function _copy(object){
    return JSON.parse(JSON.stringify(object));
  }

  /**
   * FontSearchCriteriaModel
   * 検索条件管理モデル
   */
  var FontSearchCriteriaModel = CookieModel.extend({

    initialize:function(attributes, options){
      this.options = $.extend(true, {
        key:'ftcri',
        per_page:20//検索結果表示件数
      }, options || {});

      this._setOptions(this.options);
      this.fetchCookie();
      var json = this.getJSON();

      //検索結果表示件数
      this.setPerPage(this.options.per_page, true);
      //OR検索指定
      this.set('product_or', true, {silent:true});

      this.on('change', function(model){
        this.margeCookie();
      });
    },
    addCriteriaLabel:function(state, label){

    },
    setFamilyId:function(value, isSilent){
      isSilent = isSilent || false;
      this.set('family_ids', value, {silent:isSilent});
    },
    /*
    setWord:function(value, isSilent){
      isSilent = isSilent || false;
      this.set('word', value, {silent:isSilent});
    },
    setClassifications:function(values, isSilent){
      this._setValuesState('classifications', values, isSilent);
    },
    setSimpleWeight:function(values, isSilent){
      this._setValuesState('simple_weights', values, isSilent);
    },
    setLangs:function(values, isSilent){
      this._setValuesState('langs', values, isSilent);
    },
    setProducts:function(values, isSilent){
      this._setValuesState('products', values, isSilent);
    },
    setMakers:function(values, isSilent){
      this._setValuesState('makers', values, isSilent);
    },
    setImageWords:function(values, isSilent){
      this._setValuesState('image_words', values, isSilent);
    },
    setUsages:function(values, isSilent){
      this._setValuesState('usages', values, isSilent);
    },*/

    /**
     * 複数値の登録
     * @param state
     * @param values
     * @param isSilent
     */
    setValuesState:function(state, values, isSilent){
      this._setValuesState(state, values, isSilent);
    },

    /**
     * 組込みフォント
     * @param is
     * @param isSilent
     */
    setEmbedded:function(is, isSilent){
      isSilent = isSilent || false;
      if(is){
        this.set('embedded', is, {silent:isSilent});
      }else{
        this.clearState('embedded', isSilent);
      }
    },

    /**
     * サーバー用フォント
     * @param is
     * @param isSilent
     */
    setForServer:function(is, isSilent){
      isSilent = isSilent || false;
      if(is){
        this.set('for_server', is, {silent:isSilent});
      }else{
        this.clearState('for_server', isSilent);
      }
    },

    /**
     * Typesquare
     * @param is
     * @param isSilent
     */
    setTypeSquare:function(is, isSilent){
      isSilent = isSilent || false;
      if(is){
        this.set('type_square', is, {silent:isSilent});
      }else{
        this.clearState('type_square', isSilent);
      }
    },

    setPage:function(value, isSilent){
      isSilent = isSilent || false;
      if(!value){
        this.clearState('page', isSilent);
      }else{
        this.set('page', value, {silent:isSilent});
      }
    },
    setPerPage:function(value, isSilent){
      isSilent = isSilent || false;
      this.set('per_page', value, {silent:isSilent});
    },
    setSortby:function(value, isSilent){
      isSilent = isSilent || false;
      this.set('sort_by', value, {silent:isSilent});
    },
    _setValuesState:function(state, values, isSilent){
      isSilent = isSilent || false;

      //配列か、単数か
      if(_.isArray(values)){
        if(values.length){
          //配列
          this.set(state, $.modelFunc.concatValues(values), {silent:isSilent});
        }else{
          //空
          this.clearState(state);
        }
      }
      else{
        if(values){
          this.set(state, values, {silent:isSilent});
        }else{
          //空
          this.clearState(state);
        }
      }
    },
    /**
     * 指定項目の指定値の削除
     * @param state
     * @param value
     * @param isSilent
     */
    removeValueState:function(state, value, isSilent){
      var data = this._getValueState(state);
      var values = _.without($.modelFunc.spliceValue(data), value+'');//文字列で
      this._setValuesState(state, values, isSilent);
    },
    clearState:function(state, isSilent){
      this.unset(state, {silent:isSilent});
    },
    tagClearCriteria:function(isSilent){
      //複数一気に変えるのでsilent:trueで最後にchangeのトリガー
      this.clearState('classifications', true);
      this.clearState('simple_weights', true);
      this.clearState('langs', true);
      this.clearState('products', true);
      this.clearState('makers', true);
      this.clearState('image_words', true);
      this.clearState('usages', true);
      this.clearState('word', true);
      //this.clearState('family_ids', true);
      this.clearState('embedded', true);
      this.clearState('for_server', true);
      this.clearState('type_square', true);
      //ページ指定も
      this.clearState('page', true);
      if(!isSilent){
        this.trigger('change', this);
      }
    },
    allClearCriteria:function(){
      this.clear();
    },
    getValueState:function(state){
      return this._getValueState(state);
    },
    _getValueState:function(state){
      return this.get(state);
    }
  });
  return FontSearchCriteriaModel;
});

(function(definition){
  define('webfontmodel', ['vendor', 'basicmodel'], definition);
})(function(vendor, BasicModel){
  'use strict';

  var WebfontModel = BasicModel.extend({
    requests:{},
    loadedKey:'font-loaded',
    initialize:function(attributes, options){

    },
    /******
     *
     * Ts.reloadに集約するためロジック未使用
     *
     * ******/
    /**
     * JSONを登録する
     * Webフォントのロード、表示するためのオブジェクトを生成する
     * @param json
     */
    setJSON:function(json){
      this.set(json, {silent:false});
      this.requests = this.createFontLoadRequest();
    },
    /**
     * モデルからweb_font_paramの値を探しだして配列化して
     * その値をベースにWebフォントをロード、表示するためのオブジェクトを生成する
     * @returns {*}
     */
    createFontLoadRequest:function(){
      return this._createFontLoadRequest();
    },
    _createFontLoadRequest:function(){
      var types = this._pickWebFontParam(this.getJSON());
      var requests = [];
      _.each(types, _.bind(function(type, i){
        requests.push({
          //うち文字と例文
          selector:'.font-input-word, #font-example-string',
          font:type,
          name:this.loadedKey+i
        });
      }, this));
      return requests;
    },
    forceFontLoad:function(callback){
      clearTimeout(this.flid);
      this._fontLoad(callback);
    },
    fontLoad:function(callback){
      clearTimeout(this.flid);
      this.flid = _.delay(_.bind(function(){
        this._fontLoad(callback);
      }, this), 500);
    },
    _fontLoad:function(callback){
      $.fontController.fontRequests(this.requests, _.bind(function(results){
        this._onFontLoadComplete(results, callback);
      }, this), this.loadedKey);
    },
    _onFontLoadComplete:function(results, callback){
      var classJson = JSON.parse($('#'+this.loadedKey+'-json').html());
      if(callback){
        callback(results, classJson);
      }
      this.trigger('fontloadcomplete', this, results, classJson);
    },
    /**
     * ロードしたクラス名をデータに付属する
     * @param json
     * @param classJson
     * @returns {*}
     * @private
     */
    _margeClass:function(json, classJson){
      //web_font_paramと同階層に付属する

      return json;
    },
    /**
     * ロードした書体名よりクラス名の抽出
     * @param webFontParam
     * @param classJson
     * @returns {*}
     * @private
     */
    _margeClassName:function(webFontParam, classJson){
      var findobj = _.find(classJson, function(obj){
        return (obj.font === webFontParam);
      });

      if(findobj && findobj.font){
        return findobj.name;
      }
      else{
        return '';
      }
    },
    //* TODO: ちゃんと再帰関数にする
    /**
     * web_font_paramの抽出：4階層まで
     * @param json
     * @returns {Array}
     * @private
     */
    _pickWebFontParam:function(json){
      var types = [];

      if(json && json.web_font_param){
        types.push(json.web_font_param);
      }

      _.each(json, function(layer1){
        if(layer1 && layer1.web_font_param){
          types.push(layer1.web_font_param);
        }
        if(_.isArray(layer1) || _.isObject(layer1)){

          _.each(layer1, function(layer2){
            if(layer2 && layer2.web_font_param){
              types.push(layer2.web_font_param);
            }
            if(_.isArray(layer2) || _.isObject(layer2)){

              _.each(layer2, function(layer3){
                if(layer3 && layer3.web_font_param){
                  types.push(layer3.web_font_param);
                }
                if(_.isArray(layer3) || _.isObject(layer3)){

                  _.each(layer3, function(layer4){
                    if(layer4 && layer4.web_font_param){
                      types.push(layer4.web_font_param);
                    }
                  });
                }
              });
            }
          });
        }

      });

      types = _.uniq(types);
      return types;
    }
  });

  return WebfontModel;
});

(function(definition){
  define('resultmodel', ['vendor', 'webfontmodel'], definition);
})(function(vendor, WebfontModel){
  'use strict';

  var ResultModel = WebfontModel.extend({
    loadedKey:'font-load',
    initialize:function(attributes, options){

    },
    _onFontLoadComplete:function(results, callback){
      $.loading.close();
      var classJson = JSON.parse($('#'+this.loadedKey+'-json').html());
      var json = $.fsmc.searchApiModel.getJSON(true);
      json = this._margeClass(json, classJson);
      this.set(json);

      if(callback){
        callback(results, classJson);
      }
    },
    /**
     * ロードしたクラス名をデータに付属する
     * @param json
     * @param classJson
     * @returns {*}
     * @private
     */
    _margeClass:function(json, classJson){
      _.each(json.units, _.bind(function(unit){
        _.each(unit.families, _.bind(function(family){
          family.main_font.class_name = this._margeClassName(family.main_font.web_font_param, classJson);
          _.each(family.fonts, _.bind(function(font){
            font.class_name = this._margeClassName(font.web_font_param, classJson);
          },this));
        },this));
      }, this));

      return json;
    },
    /**
     * web_font_paramの抽出
     * @param json
     * @returns {Array}
     * @private
     */
    _pickWebFontParam:function(json){
      var types = [];
      _.each(json.units, _.bind(function(unit){
        _.each(unit.families, _.bind(function(family){
          if(family.main_font.web_font_param){
            types.push(family.main_font.web_font_param);
          }
          _.each(family.fonts, _.bind(function(font){
            if(font.web_font_param){
              types.push(font.web_font_param);
            }
          },this));
        },this));
      }, this));
      types = _.uniq(types);
      return types;
    }
  });

  return ResultModel;
});

(function(definition){
  define('favoritemodel', ['vendor', 'cookiemodel'], definition);
})(function(vendor, CookieModel){
  /**
   * FavoriteModel
   */
  var FavoriteModel = CookieModel.extend({
    initialize:function(attributes, options){
      this.options = $.extend(true, {
        key:'ftfav',
        limit:20,//登録件数上限
        term:new Date(new Date().getTime() + 1*365*24*60*60*1000)//1年後
      }, options || {});

      this.maxAlertMessage = 'お気に入りに'+this.options.limit+'件以上は登録できません';
      this._setOptions(this.options);
      this.fetchCookie();

      var json = this.getJSON();
      if(!json.list){
        this.set({
          list:[]
        });
        this.margeCookie();
      }
    },
    getLimit:function(){
      return this.options.limit;
    },
    getTotal:function(){
      var json = this.getJSON();
      return json.list.length;
    },
    addFontId:function(value){
      var json = this.getJSON();
      var list = json.list;
      if(list.length >= this.options.limit){
        this.trigger('change', this);
        alert(this.maxAlertMessage);
        return;
      }
      list.push(value);
      list = _.uniq(list);

      this.set('list', list, {silent:true});
      this.margeCookie();
      this.trigger('change', this);
    },
    removeFontId:function(value){
      var json = this.getJSON();
      var list = json.list;
      list = _.difference(list, [value]);

      this.set('list', list, {silent:true});
      this.margeCookie();
      this.trigger('change', this);
    },
    clearFontId:function(){
      this.clear();
      this.margeCookie();
    },
    findFontId:function(value){
      var json = this.getJSON();
      var lists = json.list;
      var find = _.find(lists, function(favid){
        return (favid*1 === value*1);
      });
      return !!find;
    }
  });
  return FavoriteModel;
});

(function(definition){
  define('fontresultcriteriamodel', ['vendor', 'cookiemodel'], definition);
})(function(vendor, CookieModel){
  /**
   * ResultCriteriaModel
   */
  var ResultCriteriaModel = CookieModel.extend({
    initialize:function(attributes, options){
      this.options = $.extend(true, {
        key:'frcri'
      }, options || {});
      this._setOptions(this.options);
      this.fetchCookie();

      this.set({
        exampleWordList:{
          kanji_kana:['デジタル文字は美しく進化する'],//漢字+ひらがな
          kana:['かなのドラマがある'],//ひらかな
          roman:['Original Typeface'],//欧文
          hangul:['문자 표현력이 펼쳐진다 풍부한 문자세계로 가는 패스포트'],//ハングル
          hantai:['擴展美麗文字的表現力'],//中国語(繁体)
          kantai:['扩展美丽文字的表现力'],//中国語(簡体)
          thai:['การเขียนและภาษาในโลก'],// タイ語
          hitsujun:[''],//筆順
          jimon:[''],//地紋
          kei:[''],//罫
          phonetic:[''],//発音記号
          g_number:['1234567890xy'],//学参数字
          number:['0123456789,.¥'],//数学
          multi_roman:['Tokyo Station'],//多言語(欧文)
          multi_arabic:['محطة طوكيو'],//多言語(アラビア)
          multi_armenian:['Տոկիո կայարան'],//多言語(アルメニア)
          multi_devanagari:['टोकियो स्टेशन'],//多言語(デーヴァナーガリー)
          multi_gujarati:[''],//多言語(グジャラーティ)
          multi_latin_cyrillic_greek:['']//多言語(ラテン・キリル・ギリシャ)
        },
        slideValue:'',
        exampleWord:'',
        exampleInputWord:'',
        isBlack:''
      });

      this._outputExampleText();
    },
    _outputExampleText:function(){
      //例文をDOMに出力しておく
      var dom = '';
      var obj = this.get('exampleWordList');
      _.each(obj, function(list){
        _.each(list, function(str){
          dom += str;
        });
      });
      $('body').append('<span id="font-example-string" style="display: none;">'+dom+'</span>');
    },
    addExampleWordList:function(word, type){
      var obj = this.get('exampleWordList');
      if(obj[type]){
        obj[type].push(word);
      }else{
        obj[type] = [word];
      }
      this.set('exampleWordList', obj, {silent:true});
    },
    setSlideValue:function(value, isSilent){
      this.set('slideValue', value, {silent:isSilent});
    },
    setIsBlack:function(is, isSilent){
      this.set('isBlack', is, {silent:isSilent});
    },
    setExampleWord:function(value, isSilent){
      this.set('exampleWord', value, {silent:isSilent});
    },
    setExampleInputWord:function(value, isSilent){
      this.set('exampleInputWord', value, {silent:isSilent});
    }

  });
  return ResultCriteriaModel;
});

(function(definition){
  define('fontsearchmodelcontroller',
    [
      'vendor',
      'fontsearchapimodel',
      'searchselectionentriesmodel',
      'fontsearchapibyidmodel',
      'fontsearchcriteriamodel',
      'fontresultcriteriamodel',
      'favoritemodel'
    ], definition);
})(function(
  vendor,
  FontSearchApiModel,
  SearchSelectionEntriesModel,
  FontSearchApiByIdModel,
  FontSearchCriteriaModel,
  FontResultCriteriaModel,
  FavoriteModel
){
  'use strict';

  /**
   * ファミリー名セレクトボックスのラベルデータ：valueからlabelを参照する
   */
  var SelectModel = Backbone.Model.extend({
    initialize:function(attributes, options){
      this.options = $.extend(true, {
        selectOptions:'#font-word-select option'
      }, options || {});
      this.$selectOptions = $(this.options.selectOptions);

      var data = {};
      this.$selectOptions.each(_.bind(function(i, option){
        data[$(option).val()] = $(option).text();
      }, this));

      this.set(data);
    },
    convertIdToValue:function(id){
      return this.get(id);
    }
  });

  $.modelFunc = {
    /**
     * valuesの値の結合：カンマ区切りで結合した文字列を生成する
     * @param values
     * @returns {string}
     */
    concatValues:function(values){
      var str = '';
      if(!_.isArray(values)){
        values = [values];
      }
      _.each(values, function(value){
        if(str.length){
          str += ',' + value;
        }else{
          str += value + '';
        }
      });
      return str;
    },
    /**
     * カンマ区切りをばらす
     * @param value
     * @returns {Array}
     */
    spliceValue:function(value){
      return value.split(',');
    }
  };

  var FontSearchModelController = Backbone.View.extend({
    initialize:function(options){
      this.options = $.extend(true, {
        api:{
          coreUrlRoot:'//api.morisawa.co.jp/v1/',
          client_id:'CL8qjJ53kDyJ7Lem66vncpek',
          region_code:'jp',
          funcOption:''
        },
        criteria:{
          key:'ftcri',
          per_page:20//検索表示件数
        },
        resultCriteria:{
        },
        favorite:{
          key:'ftfav',
          limit:20
        }
      }, options || {});

      //書体選択項目の定義API 選択項目一覧
      this.searchSelectionEntriesModel = new SearchSelectionEntriesModel(null, this.options.api);
      //書体検索API
      this.searchApiModel = new FontSearchApiModel(null, this.options.api);
      //書体検索API：ID検索
      this.searchApiModelById = new FontSearchApiByIdModel(null, this.options.api);
      //書体検索条件
      this.criteriaModel = new FontSearchCriteriaModel(null, this.options.criteria);
      //検索結果表示設定
      this.resultCriteriaModel = new FontResultCriteriaModel(null, this.options.resultCriteria);
      //お気に入り
      this.favoriteModel = new FavoriteModel(null, this.options.favorite);
      //ファミリーのセレクトボックス
      this.selectModel = new SelectModel();

      this._bindObject();
    },
    destroy:function(){

    },
    _bindObject:function(){

    }
  });

  return FontSearchModelController;
});

(function(definition){
  define('tryword', ['vendor'], definition);
})(function(){
  'use strict';

  var TryWord = Backbone.UIView.extend({
    ui:{
      select:'select',
      options:'select option'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.bindUIElements();
      this._bindObject();

      //optionsにある項目分Modelに投入
      var value;
      var type;
      /*
      _.each(this.ui.options, _.bind(function(element){
        value = $(element).val();
        type = $(element).attr('class');
        if(value && type){
          $.fsmc.resultCriteriaModel.addExampleWordList(value, type);
        }
      }, this));
      */
    },
    destroy:function(){

    },
    _bindObject:function(){
      this.onChangeSelect = _.bind(this._onChangeSelect, this);
      this.ui.select.on('change', this.onChangeSelect);
    },
    _onChangeSelect:function(){
      var value = this.ui.select.val();
      $.fsmc.resultCriteriaModel.setExampleWord(value);
    }
  });

  return TryWord;
});

(function(definition){
  define('sizeslider', ['vendor', 'rangeslider'], definition);
})(function(){
  'use strict';

  var SizeSlider = Backbone.UIView.extend({
    ui:{
      slider:'input[type="range"]'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.bindUIElements();
      var initValue = 50;

      $.fsmc.resultCriteriaModel.setSlideValue(initValue, true);
      this.ui.slider.val(initValue).rangeslider({
        polyfill:false,
        // Callback function
        onInit: function() {},

        // Callback function
        onSlide:_.bind(function(position, value) {
          this._onSlideChange(value);
        }, this),

        // Callback function
        onSlideEnd:_.bind(function(position, value) {
          this._onSlideChange(value);
        }, this)
      });

    },
    destroy:function(){

    },
    _bindObject:function(){

    },
    _onSlideChange:function(value){
      $.fsmc.resultCriteriaModel.setSlideValue(value);
    }
  });

  return SizeSlider;
});

(function(definition){
  define('colortoggle', ['vendor'], definition);
})(function(){
  'use strict';

  var ColorToggle = Backbone.UIView.extend({
    ui:{
      button:'.btn-toggle'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.bindUIElements();
      this._bindObject();
    },
    destroy:function(){

    },
    _bindObject:function(){
      this.onClick = _.bind(this._onClick, this);
      this.ui.button.on('click', this.onClick);
    },
    _onClick:function(){
      var isBlack = this.ui.button.hasClass('black');
      if(isBlack){
        this.ui.button.removeClass('black');
      }else{
        this.ui.button.addClass('black');
      }
      isBlack = !isBlack;

      $.fsmc.resultCriteriaModel.setIsBlack(isBlack);

      return false;
    }
  });

  return ColorToggle;
});

(function(definition){
  define('tryinputword', ['vendor'], definition);
})(function(){
  'use strict';

  var TryInputWord = Backbone.UIView.extend({
    ui:{
      input:'.font-try-input',
      word:'.input-word'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.bindUIElements();
      this._bindObject();
    },
    destroy:function(){

    },
    _bindObject:function(){
      this.oldValue = '';
      this.ui.input.val(this.oldValue);
      this.onChange = _.bind(this._onChange, this);
      this.ui.input.on('keyup', this.onChange);
    },
    _onChange:function(e){
      var value = this.ui.input.val();
      /*
      if(value !== this.oldValue){
        this.ui.word.text(value);
        $.fsmc.resultCriteriaModel.setExampleInputWord(value);
        $.fontController.forceReload();
      }
      this.oldValue = value;
      */
      if(e.keyCode === 13 || value.length === 0){
        $.fsmc.resultCriteriaModel.setExampleInputWord(value);
        $.fontController.forceReload();
      }else{

      }
    }
  });

  return TryInputWord;
});

(function(definition){
  define('resultcriteria', [
    'vendor',
    'tryword',
    'sizeslider',
    'colortoggle',
    'tryinputword'
  ], definition);
})(function(vendor,
            TryWord,
            SizeSlider,
            ColorToggle,
            TryInputWord){
  'use strict';

  var ResultCriteria = Backbone.UIView.extend({
    ui:{
      tryWord:'.font-try-word-list',
      sizeSlider:'.font-size-slider',
      colorToggle:'.font-color-toggle',
      tryInputWord:'.font-input-word'
    },
    enum:{
      state:{
        TRY_WORD:'tryword',
        SIZE_SLIDER:'sizeslider',
        COLOR_TOGGLE:'colortoggle',
        TRY_INPUT_WORD:'tryinputword'
      }
    },
    event:{
      CHANGE_COLOR:'ResultCriteria_CHANGE_COLOR',
      CHANGE_SLIDER:'ResultCriteria_CHANGE_SLIDER',
      CHANGE_WORD:'ResultCriteria_CHANGE_WORD'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.bindUIElements();

      this.tryWord = new TryWord({el:this.ui.tryWord.get(0), state:this.enum.state.TRY_WORD});
      this.tryInputWord = new TryInputWord({el:this.ui.tryInputWord.get(0), state:this.enum.state.TRY_INPUT_WORD});
      this.sizeSlider = new SizeSlider({el:this.ui.sizeSlider.get(0), state:this.enum.state.SIZE_SLIDER});
      this.colorToggle = new ColorToggle({el:this.ui.colorToggle.get(0), state:this.enum.state.COLOR_TOGGLE});

      this._bindObject();
    },
    destroy:function(){

    },
    _bindObject:function(){
      this.onResultCriteriaChangeModel = _.bind(this._onChangeModel, this);
      $.fsmc.resultCriteriaModel.on('change', this.onResultCriteriaChangeModel);
    },
    _onChangeModel:function(model){

    }
  });

  return ResultCriteria;
});

(function(definition){
  define('favoritemenu', ['vendor'], definition);
})(function(){
  'use strict';
  var Favorite = Backbone.UIView.extend({
    ui:{
      inner:'.font-favor-menu-inner',
      toggleButton:'.font-favor-menu-inner .toggle',
      toggleHeart:'.font-favor-menu-inner .toggle .heart',
      over:'.font-favor-over',
      favorButton:'.btn-favor-add',
      nowCountText:'.btn-favor-add .now-count',
      limitText:'.btn-favor-add .limit-count'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.render();
    },
    destroy:function(){

    },
    _bindObject:function(){
      this.onToggleButton = _.bind(this._onToggleButton, this);
      this.ui.toggleButton.on('click', this.onToggleButton);

      this.onFavoriteButtonClick = _.bind(this._onFavoriteButtonClick, this);
      this.ui.favorButton.on('click', this.onFavoriteButtonClick);

      this.onFavoriteModelChange = _.bind(this._onFavoriteModelChange, this);
      $.fsmc.favoriteModel.on('change', this.onFavoriteModelChange);

      this.onOtherAreaClick = _.bind(this._onOtherAreaClick, this);
      //$('body').on('click', this.onOtherAreaClick);
    },
    render:function(){
      this.bindUIElements();
      this._bindObject();
      this._favoriteVisible();
    },
    _favoriteVisible:function(){
      var id = this.ui.favorButton.data('fontId') *1;
      var json = $.fsmc.favoriteModel.getJSON();
      var is = $.fsmc.favoriteModel.findFontId(id);

      if(is){
        this.ui.toggleHeart.addClass('active');
        this.$el.addClass('added');
      }else{
        this.ui.toggleHeart.removeClass('active');
        this.$el.removeClass('added');
      }
      var limit = $.fsmc.favoriteModel.getLimit();
      this.ui.limitText.text(limit);
      this.ui.nowCountText.text(json.list.length);

      if(json.list.length >= limit){
        this.ui.favorButton.addClass('disabled');
      }else{
        this.ui.favorButton.removeClass('disabled');
      }
    },
    _onOtherAreaClick:function(){
      this.ui.over.removeClass('active');
    },
    _onToggleButton:function(){
      var is = this.ui.over.hasClass('active');
      if(is){
        this.ui.over.removeClass('active');
      }else{
        this.ui.over.addClass('active');
      }
      return false;
    },
    _onFavoriteButtonClick:function(){
      var id = this.ui.favorButton.data('fontId');
      var is = this.$el.hasClass('added');
      if(is){
        $.fsmc.favoriteModel.removeFontId(id);
      }else{
        $.fsmc.favoriteModel.addFontId(id);
      }

      this._onToggleButton();

      return false;
    },
    _onFavoriteModelChange:function(){
      this._favoriteVisible();
    }
  });
  return Favorite;
});

(function(definition){
  define('fontcharatable', ['vendor'], definition);
})(function(){
  'use strict';

  var FontCharaTable = Backbone.UIView.extend({
    ui:{
      productsButton:'.btn-tab.products',
      charaButton:'.btn-tab.charaset',
      tables:'.font-information-table',
      tableProducts:'.font-information-table.products',
      tableCharaset:'.font-information-table.charaset',
      resultCriteria:'.font-result-criteria',
      tabDescription:'.tab-header .description'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.render();
    },
    destroy:function(){

    },
    _bindObject:function(){
      this.onProductsButtonClick = _.bind(this._onProductsButtonClick, this);
      this.onCharaButtonClick = _.bind(this._onCharaButtonClick, this);
      this.ui.productsButton.on('click', this.onProductsButtonClick);
      this.ui.charaButton.on('click', this.onCharaButtonClick);
    },
    render:function(){
      this.bindUIElements();
      this._bindObject();
      this._charasetButtonVisible();
    },
    _charasetButtonVisible:function(){
      var $trs = this.ui.tableCharaset.find('tbody tr');
      var finded = _.find($trs, _.bind(function(tr){
        var $tds = $(tr).find('td');
        var is = _.find($tds, _.bind(function(td, i){
          if(i === 0){
            return false;
          }
          var $span = $(td).find('span');
          if($span.length){
            //noneを持っていないか
            var is = !$span.hasClass('none');
            return is;
          }else{
            return false;
          }
        }, this));
        return is;
      }, this));

      if(!finded){
        this.ui.charaButton.hide();
      }
    },
    _onProductsButtonClick:function(){
      this._resetButtonStatus();
      this._resetTableStatus();
      this.ui.productsButton.addClass('active');
      this.ui.tableProducts.addClass('active');
      this._fade(this.ui.tableProducts);
      return false;
    },
    _onCharaButtonClick:function(){
      this._resetButtonStatus();
      this._resetTableStatus();
      this.ui.charaButton.addClass('active');
      this.ui.tableCharaset.addClass('active');
      this._fade(this.ui.tableCharaset);
      return false;
    },
    _resetButtonStatus:function(){
      this.ui.productsButton.removeClass('active');
      this.ui.charaButton.removeClass('active');
    },
    _resetTableStatus:function(){
      this.ui.tableProducts.removeClass('active');
      this.ui.tableCharaset.removeClass('active');
    },
    _fade:function($tgt){
      $tgt.velocity('stop').velocity({opacity:[1,0]}, {duration:300, easing:'linear'});
    }
  });
  return FontCharaTable;
});

(function(definition){
  define('fontpromotion', ['vendor', 'iscroll', 'rangeslider'], definition);
})(function(vendor){
  'use strict';

  var FontPromotion = Backbone.UIView.extend({
    ui:{
      wrapper:'#wrapper',
      scroller:'.scroller',
      promoimg:'.promo-img',
      slider:'input[type="range"]',
      rangeSlider:'.rangeslider',
      rangeSliderButton:'.rangeslider .rangeslider__handle',
      size:'.size',
      range:'input[type="range"]'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.render();
    },
    destroy:function(){

    },
    _bindObject:function(){
      this.ui.slider.val(1).rangeslider({
        polyfill:false,
        // Callback function
        onInit: _.bind(function(){
          this.bindUIElements();
          this.ui.rangeSliderButton.hover(_.bind(function(){
              this.ui.size.addClass('active');
            }, this),
            _.bind(function(){
              this.ui.size.removeClass('active');
            }, this));
        }, this),

        // Callback function
        onSlide: _.bind(function(position, value) {
          this._onSlideChange(value);
        }, this),

        // Callback function
        onSlideEnd:_.bind(function(position, value) {
          this._onSlideChange(value);
        }, this)
      });
    },
    render:function(){
      this.bindUIElements();

      $.svgLoad(this.ui.promoimg, _.bind(function(){
        this._setRatio();
        this.setZoom(1);

        this.myScroll = new IScroll('#wrapper', {
          scrollY: true,
          scrollX: true,
          freeScroll:true,
          useTransform:false
        });

        this._bindObject();
      }, this));
    },
    _setRatio:function(){
      if($('html').hasClass('no-svg')){
        this.ratio = this.ui.promoimg.outerHeight() / this.ui.promoimg.outerWidth();
      }else{
        var $svg = this.ui.promoimg.find('svg');
        if($svg.length){
          this.ratio = $svg.attr('height') / $svg.attr('width');
        }
      }
    },
    setZoom:function(zoom){
      this.zoom = zoom;
      //var wh = this.ui.wrapper.height();//基準
      var ww = this.ui.wrapper.width();//基準
      var _x = this.ui.scroller.css('left').replace(/px/,'')*1;
      var _y = this.ui.scroller.css('top').replace(/px/,'')*1;

      var rat_w = (- _x + this.ui.wrapper.width()*0.5) / this.ui.scroller.width();
      var rat_h = (- _y + this.ui.wrapper.height()*0.5) / this.ui.scroller.height();

      var fix_h = this.ratio * ww * this.zoom;
      var fix_w = ww * this.zoom;

      if(this.myScroll){
        var delta_w = fix_w - this.ui.scroller.width();
        var delta_h = fix_h - this.ui.scroller.height();
        this.ui.scroller.width(fix_w);
        this.ui.scroller.height(fix_h);
        this.myScroll.scrollTo(_x - delta_w*rat_w, _y - delta_h*rat_h, 0);
      }
      var wrapperH = this.ui.scroller.height()/this.zoom;
      this.ui.wrapper.height(wrapperH);
    },
    _onSlideChange:function(value){
      this.setZoom(value);
      if(this.myScroll){
        this.myScroll.refresh();
      }
    }
  });
  return FontPromotion;
});

(function(definition){
  define('resultitem', ['vendor'], definition);
})(function(){
  'use strict';

  var ResultItem = Backbone.UIView.extend({
    ui:{
      example:'.font-example',
      exampleText:'.font-example-text',
      exampleSvg:'.font-example-svg'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.render();
    },
    _bindObject:function(){
      this.onResultCriteriaModelChange = _.bind(this._onResultCriteriaModelChange, this);
      $.fsmc.resultCriteriaModel.on('change', this.onResultCriteriaModelChange);

      this.onWebFontComplete = _.bind(this._onWebFontComplete, this);
      $.fontController.on($.fontController.event.LOAD_COMPLETE, this.onWebFontComplete);
    },
    render:function(){
      this.bindUIElements();
      this._bindObject();
      this.ui.example.css({opacity:0});

      var json = $.fsmc.resultCriteriaModel.getJSON();
      var word = json.exampleInputWord || json.exampleWord || '';
      this.setExampleText(word);
      this.setExampleSize(json.slideValue);

      if(this.ui.exampleSvg.length){
        $.svgLoad(this.ui.exampleSvg, _.bind(function(){
          this.setExampleSize(json.slideValue);
          this.app();
        }, this));
      }
    },
    _onWebFontComplete:function(res){
      var param = this.$el.data('webFontParam');
      if(param){
        var find = _.find(res.fonts, _.bind(function(resfont){
          return (resfont.name === param);
        }, this));
        if(find){
          this.app();
        }
      }
    },
    _onResultCriteriaModelChange:function(model){
      var changed = model.changed;
      if(!_.isUndefined(changed.slideValue)){
        this.setExampleSize(changed.slideValue);
      }

      if(!_.isUndefined(changed.exampleWord) || !_.isUndefined(changed.exampleInputWord)){
        var word = changed.exampleInputWord || changed.exampleWord || '';
        this.setExampleText(word);
      }
    },
    setExampleSize:function(value){
      if(value){
        this.ui.exampleText.css({'font-size':value+'px'});
      }else{
        this.ui.exampleText.css({'font-size':''});
      }
      this.ui.exampleSvg.height('').width('');
      var w = this.ui.exampleSvg.find('svg').attr('width');
      this.ui.exampleSvg.height(value * 1.7).width(w * value/50 *1.7);
    },
    setExampleText:function(value){
      if(!this.ui.exampleText.length){
        return;
      }
      this.ui.exampleText.text(value);
      if(!value){
        var jsondata = this.model.toJSON();
        var texts = $.fsmc.resultCriteriaModel.getJSON().exampleWordList[jsondata.sample_text];
        this.ui.exampleText.text(texts[0]);
      }
      this.ui.example.css({opacity:0});
    },
    app:function(){
      $.requestAnimationFrame(_.bind(function(){
        this.ui.example.velocity({opacity:1}, {duration:300});
      }, this));
    }
  });

  return ResultItem;
});

(function(definition){
  define('fonttryout', ['vendor', 'accordion', 'resultcriteria', 'resultitem'], definition);
})(function(
  vendor,
  Accordion,
  ResultCriteria,
  ResultItem
){
  'use strict';
  var FontTryout = Backbone.UIView.extend({
    ui:{
      accordion:'.accordion',
      current:'.current-font',
      items:'.items',
      accordionButton:'.accordion-button',
      resultCriteria:'.font-result-criteria'
    },
    initialize:function(options){
      this.options = $.extend(true, {}, options || {});
      this.render();
    },
    destroy:function(){

    },
    _bindObject:function(){
      this.onResultCriteriaModelChange = _.bind(this._onResultCriteriaModelChange, this);
      $.fsmc.resultCriteriaModel.on('change', this.onResultCriteriaModelChange);
    },
    render:function(){
      this.bindUIElements();
      this.ui.$otherLink = $('header .font-weight-menu a:not([class="active"])');

      this._createCurrentItem();
      this._createOtherItem();

      new Accordion({el:this.ui.accordion.get(0)});
      new ResultCriteria({el:this.ui.resultCriteria.get(0)});

      this._bindObject();

      $.requestAnimationFrame(_.bind(function(){
        $.fontController.forceReload();
      }, this));
    },
    _createOtherItem:function(){
      this.items = [];
      var itemsJSON = JSON.parse($('#tryout-fonts').html()).fonts;
      if(!itemsJSON.length){
        this.ui.accordionButton.hide();
        return;
      }
      var itemTemp = _.template($('#font-result-item-template').html());
      var links = [];
      var url;

      this.ui.$otherLink.each(_.bind(function(i, element){
        url = $(element).attr('href');
        links.push(url.replace(/\/fonts\/specimen\//, ''));
      }, this));

      _.each(itemsJSON, _.bind(function(font, i){
        font.link_id = links[i] || 'notfound';
        var currentDom = itemTemp(font);
        var $dom = $(currentDom).appendTo(this.ui.items);
        this.items.push(new ResultItem({el:$dom.get(0), model:new Backbone.Model(font)}));
      }, this));
    },
    _createCurrentItem:function(){
      var currentJSON = JSON.parse($('#tryout-current-font').html()).fonts[0];
      var currentTemp = _.template($('#font-current-template').html());
      var currentDom = currentTemp(currentJSON);
      var $dom = $(currentDom).appendTo(this.ui.current);
      new ResultItem({el:$dom.get(0), model:new Backbone.Model(currentJSON)});
    },
    _onResultCriteriaModelChange:function(model){
      var changed = model.changed;
      if(!_.isUndefined(changed.isBlack)){
        if(changed.isBlack){
          this.$el.addClass('result-type-black');
        }else{
          this.$el.removeClass('result-type-black');
        }
      }else if(!_.isUndefined(changed.exampleInputWord)){
        $.fontController.forceReload();
      }
    }
  });
  return FontTryout;
});


(function(definition){
  define('setheight', ['vendor'], definition);
})(function(){
  'use strict';

  var SetHeight = {
    setAlign:function(target){
      $(target).each(function(){
        var $this = $(this);
        var length = $this.find('.col').length;
        if($('html').hasClass('lg') && length < 4){
          $this.addClass('text-center');
        }
        else if($('html').hasClass('md') && length < 3){
          $this.addClass('text-center');
        }
        else if($('html').hasClass('sm') && length < 2){
          $this.addClass('text-center');
        }
      });
    },
    setHeight:function(target, child, execute_in_sm){
      var isExecuteInSm = execute_in_sm || false; // true -> sm表示でも実行 デフォルトはfalse
      $(target).each(function(){
        var maxHeight = 0;
        var $item = $(this).find(child);
        $item.css('height', '');

        if(isExecuteInSm || !$('html').hasClass('sm')){
          $item.each(function(){
            var myHeight = $(this).outerHeight();
            if(myHeight > maxHeight){
              maxHeight = myHeight;
            }
          });
          $item.css('height', maxHeight);
        }
      });
    }
  };
  return SetHeight;
});

require([
  'common',
  'fontsearchmodelcontroller',
  'fontpromotion',
  'favoritemenu',
  'fonttryout',
  'fontcharatable',
  'setheight'
], function(
  common,
  FontSearchModelController,
  FontPromotion,
  FavoriteMenu,
  FontTryout,
  FontCharaTable,
  HeightController
){
  'use strict';

  $(function(){
    $.fsmc = new FontSearchModelController({
      api:{
        region_code:'jp'
      }
    });
    new FontPromotion({el:'#font-promotion'});
    new FavoriteMenu({el:'.font-favor-menu'});
    new FontTryout({el:'.font-try'});
    new FontCharaTable({el:'.font-chara-table'});

    var $packageFigures = $('.packages figure');
    $.responsive.on($.responsive.event.RESIZE, onResize);
    onResize();

    function onResize(){
      if($.responsive.model.getScreen() === $.responsive.model.screenType.SMALL){
        $packageFigures.height('');
      }else{
        HeightController.setHeight('.packages', 'figure');
      }
    }
  });
});
