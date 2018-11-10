'use strict';
const express = require('express');
var request = require("request");
var cheerio = require('cheerio');
var iconv  = require('iconv-lite');
var fs = require('fs');


function getDataFromWelstory(){
  return new Promise((resolve, reject) => {
    var requestOptions  = { method: "GET"
			,uri: "http://welstory.com/menu/seoulrnd/menu.jsp"
			,headers: { "User-Agent": "Mozilla/5.0" }
			,encoding: null
	            	};
   let aMenu = [];
   
request(requestOptions, function(error, response, body) {
   
    //10. 대상 화면 파싱.
    var strContents = new Buffer(body);
    //20. 파싱한 한글이 깨지므로 인코딩
    var utf8Text = iconv.decode(strContents, "euc-kr");

    var $ = cheerio.load(utf8Text);//실제 시스템
    // var $ = cheerio.load(fs.readFileSync('./menu.html'));//테스트 데이터.
    //30. 파싱 결과
    let sDate = $('.date','#layer1').text();
    //cafeaA는 D/E동  
    let aCafeALunchCorner = $('.cafeA_tit span','#layer2');
    let aCafeALunchMenu = $('.cafeA_tit','#layer2');
    let aCafeALunchDetail = $('.cafeA_txt','#layer2');   

    //A식당 아침
    let aCafeAMorningCorner = $('.cafeA_tit span','#layer1');
    let aCafeAMorningMenu = $('.cafeA_tit','#layer1');
    let aCafeAMorningDetail = $('.cafeA_txt','#layer1');
    //A식당 저녁 
    let aCafeADinnerCorner = $('.cafeA_tit span','#layer3');
    let aCafeADinnerMenu = $('.cafeA_tit','#layer3');
    let aCafeADinnerDetail = $('.cafeA_txt','#layer3');
     //B식당 점심
     let aCafeBLunchCorner = $('.cafeB_tit span','#layer2');
     let aCafeBLunchMenu = $('.cafeB_tit','#layer2');
     let aCafeBLunchDetail = $('.cafeB_txt','#layer2');
   
  
               //ex){cafe:"A",type:"Morning",corner:"봄이온소반",menu:"김치찌개",detail:"XXXX"};
   
    //A식당 아침
    for(var i=0;i<aCafeAMorningCorner.length;i++){
      let oMenu = {};
      oMenu.cafe="A";
      oMenu.type="Breakfast";
      oMenu.corner = $(aCafeAMorningCorner[i]).text().replace("\n","").replace(/\s+/g, ' ');//\n제거, 공백 여러개를 하나로 변경
      oMenu.menu   = $(aCafeAMorningMenu[i]).text().replace("\n","").replace(/\s+/g, ' ').replace(oMenu.corner,'');//menu에 코너명이 같이 있으므로 삭제
      oMenu.detail = $(aCafeAMorningDetail[i]).text().replace("\n","").replace(/\s+/g, ' ');
      aMenu.push(oMenu);     
    }
    
     //A식당 점심
     for(var i=0;i<aCafeALunchCorner.length;i++){
      let oMenu = {};
      oMenu.cafe="A";
      oMenu.type="Lunch";
      oMenu.corner = $(aCafeALunchCorner[i]).text().replace("\n","").replace(/\s+/g, ' ');//\n제거, 공백 여러개를 하나로 변경
      oMenu.menu   = $(aCafeALunchMenu[i]).text().replace("\n","").replace(/\s+/g, ' ').replace(oMenu.corner,'');//menu에 코너명이 같이 있으므로 삭제
      oMenu.detail = $(aCafeALunchDetail[i]).text().replace("\n","").replace(/\s+/g, ' ');
      aMenu.push(oMenu);     
    }
    
     //A식당 저녁
     for(var i=0;i<aCafeADinnerCorner.length;i++){
      let oMenu = {};
      oMenu.cafe="A";
      oMenu.type="Dinner";
      oMenu.corner = $(aCafeADinnerCorner[i]).text().replace("\n","").replace(/\s+/g, ' ');//\n제거, 공백 여러개를 하나로 변경
      oMenu.menu   = $(aCafeADinnerMenu[i]).text().replace("\n","").replace(/\s+/g, ' ').replace(oMenu.corner,'');//menu에 코너명이 같이 있으므로 삭제
      oMenu.detail = $(aCafeADinnerDetail[i]).text().replace("\n","").replace(/\s+/g, ' ');
      aMenu.push(oMenu);     
    }
    
    //B식당 점심
    for(var i=0;i<aCafeBLunchCorner.length;i++){
      let oMenu = {};
      oMenu.cafe="B";
      oMenu.type="Lunch";
      oMenu.corner = $(aCafeBLunchCorner[i]).text().replace("\n","").replace(/\s+/g, ' ');//\n제거, 공백 여러개를 하나로 변경
      oMenu.menu   = $(aCafeBLunchMenu[i]).text().replace("\n","").replace(/\s+/g, ' ').replace(oMenu.corner,'');//menu에 코너명이 같이 있으므로 삭제
      oMenu.detail = $(aCafeBLunchDetail[i]).text().replace("\n","").replace(/\s+/g, ' ');
      aMenu.push(oMenu);     
    }
    sDate = sDate.replace(/\s+/g, '').substr(0,4)+sDate.replace(/\s+/g, '').substr(5,2)+sDate.replace(/\s+/g, '').substr(8,2);
    resolve(aMenu);
  });
  })
}


var router = express.Router();
//post
router.post('/:Cafe?',function(request, response) {
  //body에서 파라미터 추출
  const sCafe = request.params.Cafe;
  const sType = request.body.Type;  
  getDataFromWelstory().then(function(result){
    let aMenu = result;
    let aReturnMenu = [];
    if(sType){
      aReturnMenu = aMenu.filter(responseMenu => responseMenu.type === sType);
    }  
    //식당 필터
    if(sCafe){
      if(aReturnMenu.length>0){
        aReturnMenu = aReturnMenu.filter(responseMenu => responseMenu.cafe === sCafe);
      } else {
        aReturnMenu = aMenu.filter(responseMenu => responseMenu.cafe === sCafe);
      }
      
    }
    //조회한 결과가 없을 경우 에러
    if (aReturnMenu.length <1) {
      return response.status(404).json({error: 'Data not found!'});
    }
    //결과 리턴
    return response.json(aReturnMenu);
  });
  
})

module.exports = router;
