/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

//const functions = require('firebase-functions');
const express = require('express');
const request = require('request');


// const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const { Carousel } = require('actions-on-google');
const WebSocket = require('ws');
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
//init Express Router
var webhook = express.Router();

webhook.post('/',function(request, response) {
  const agent = new WebhookClient({ request, response });

/**
* INTENT별 기능 정의
*/
//10.Viewpoint별 매출(국가, 부문, 제품) Q: 국가별 8월 기준 매출 현황 보여줘
function QueryMenu(agent){
    return new Promise((resolve, reject) => {
        const request = require('request');
        //10.10 파라미터
        let sCafe = agent.parameters.Cafe = ""
        let oDate = "";
        if(!sCafe){
            sCafe = 'A';
        }
        let sMealType = agent.parameters.MealType;
        //날짜를 따로 받았을 경우 형태
        if(agent.parameters.Date.date_time){
            oDate  = agent.parameters.Date.date_time;
        } else {
            oDate  = agent.parameters.Date.startDateTime;
        }
        
        let sDate = oDate.split('T')[0].split('-')[0]+oDate.split('T')[0].split('-')[1]+oDate.split('T')[0].split('-')[2];
        let sDateText = oDate.split('T')[0].split('-')[0]+'년 '+oDate.split('T')[0].split('-')[1]+'월 '+oDate.split('T')[0].split('-')[2]+'일';
        
        let sResponse = sDateText+'의 '+ sMealType+'메뉴 정보('+sCafe+'식당)\n';
                request.post({
                    "headers": { "content-type": "application/json" },
                    "url": "https://charles-erp-dev-welstorymenu.cfapps.ap10.hana.ondemand.com/welstory/"+sCafe,
                    "body": JSON.stringify({
                        "Type": sMealType
                    })
                }, (error, response, body) => {
                    if(error) {
                        return console.dir(error);
                    }        
                    let aItems = [];    
                    let aResult = JSON.parse(body);                           
                    for(var i=0;i<aResult.length;i++){
                        let oItemTemp = { title : aResult[i].menu,
                                    description:aResult[i].detail
                                                    };
                        let oItem = {};
                        oItem[aResult[i].corner]    = oItemTemp;         
                        aItems.push(oItem);
                        //그냥 리스트 던져
                        
                        sResponse += '●'+aResult[i].menu+"→"+aResult[i].corner+"\n";
                    }
                    if(aResult.length>0){
                        agent.add(sResponse);
                        agent.add(new Suggestion('내일은?'));
                        if(sMealType==='Lunch'){
                            agent.add(new Suggestion('저녁은?'));
                        }
                        agent.add(new Suggestion('알겠어'));
                    } else {
                        agent.add(sDateText+"에는 메뉴가 없습니다.");
                    }
                    
                    resolve(aResult);            
                });
            }); 
}

//20.Welcome, 환영 후 바로 메뉴 조회
function DefaultWelcomeIntent(agent){
    //현재 시간 확인해서 9시 이전이면 아침 메뉴, 9~12시면 점심, 그 이후 저녁 메뉴를 기본으로
    var now = new Date();
    var tz = now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000);
    now.setTime(tz);
    let iCurrentTime = now.getHours();
   let sMealType = '';
   if(iCurrentTime <=9){
    sMealType = '아침'
   } else {
       if(iCurrentTime>9 && iCurrentTime<=12) {
           sMealType = '점심';
       } else {
           sMealType = '저녁';
       }
   } 
//    console.log(sMealType);
sDateGlobal = now;
// sMealTypeGlobal = sMealType
//    agent.setContext({
//     name: 'QueryMenu',
//     lifespan: 2,
//     parameters:{MealType: sMealType, Date: now}
//   });
  QueryMenu(agent);

//    agent.parameters.MealType = sMealType;
//    agent.parameters.Date = {};
//    agent.parameters.Date.startDateTime = now;
//    QueryMenu(agent);
//    if(sCurrentTime.substr(0,2)==='오후'){
//     sMealType = '저녁';
//    } else {
//        if 
//    }

}

  // Run the proper handler based on the matched Dialogflow intent
  let intentMap = new Map();  
  intentMap.set('QueryMenu', QueryMenu);
  intentMap.set('QueryMenu - ChangeDate', QueryMenu);
  intentMap.set('QueryMenu - ChangeMealType', QueryMenu);
  intentMap.set('Default Welcome Intent',DefaultWelcomeIntent);//    
  
  agent.handleRequest(intentMap);
});

module.exports = webhook;
