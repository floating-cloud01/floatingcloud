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
const {
	WebhookClient
} = require('dialogflow-fulfillment');
const {
	Card,
	Suggestion
} = require('dialogflow-fulfillment');
const {
	Carousel
} = require('actions-on-google');
const WebSocket = require('ws');
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
//init Express Router
var webhook = express.Router();

webhook.post('/', function (request, response) {
	const agent = new WebhookClient({
		request,
		response
	});

	/**
	 * INTENT별 기능 정의
	 */
	//10.Viewpoint별 매출(국가, 부문, 제품) Q: 국가별 8월 기준 매출 현황 보여줘
	function QueryMenu(agent) {
		return new Promise((resolve, reject) => {
			//10.10 파라미터
			let sCafe = agent.parameters.Cafe;
			let oDate = "";
			if (!sCafe) {
				sCafe = 'W02';
			}
			let sMealType = agent.parameters.MealType;
			//날짜를 따로 받았을 경우 형태
			if (agent.parameters.Date.date_time) {
				oDate = agent.parameters.Date.date_time;
			} else {
				oDate = agent.parameters.Date.startDateTime;
			}

			let sDate = oDate.split('T')[0].split('-')[0] + oDate.split('T')[0].split('-')[1] + oDate.split('T')[0].split('-')[2];
			let sDateText = oDate.split('T')[0].split('-')[0] + '년 ' + oDate.split('T')[0].split('-')[1] + '월 ' + oDate.split('T')[0].split('-')[2] + '일';
			var mealTypeTxt;
			switch(sMealType){
				case('M'): mealTypeTxt = "아침"; break;
				case('L'): mealTypeTxt = "점심"; break;
				case('D'): mealTypeTxt = "저녁"; break;
			}
			var cafeTxt;
			var promise = new Array();
			switch(sCafe){
				case('W01'): 
					cafeTxt = "우면1"; 
					promise = [getMenu(sDate,"E5IV"), getMenu(sDate,"E5IW"), getMenu(sDate,"E5IX"), getMenu(sDate,"E5IZ")]; 
					break;
				case('W02'): 
					cafeTxt = "우면2"; 
					promise = [getMenu(sDate,"E5J2"), getMenu(sDate,"E5J3"), getMenu(sDate,"E5J4")]; 
					break;
				case('J01'): 
					cafeTxt = "잠실"; 
					promise = [getMenu(sDate,"E59C"), getMenu(sDate,"E59D"), getMenu(sDate,"E59E"), getMenu(sDate,"E59F"), getMenu(sDate,"E59G")
							,getMenu(sDate,"E5E6"), getMenu(sDate,"E5E7"), getMenu(sDate,"E5E8"), getMenu(sDate,"E5E9")
							, getMenu(sDate,"E5EA"), getMenu(sDate,"E5EB"), getMenu(sDate,"E5EC"), getMenu(sDate,"E5ED")];
					break;
			}
			let sResponse = sDateText + '의 ' + mealTypeTxt + '메뉴 정보(' + cafeTxt + '식당)\n';
			Promise.all(promise)
			.then(function (result) {
		        //convMenuList에 필터(식당, 아/점/저)
		        var returnValue = [];
		        convMenuList.forEach(element => {
		        	if(element.Area_ID === sCafe && element.MealType === sMealType){
		        		returnValue.push(element);
		        	}
		        });
		        //결과값 리턴
		        for (var i = 0; i < returnValue.length; i++) {
					sResponse += '●' + returnValue[i].Corner + "→" + returnValue[i].MainTitle + "\n" + returnValue[i].SideDish + "\n";
				}
				if (returnValue.length > 0) {
					agent.add(sResponse);
					agent.add(new Suggestion('내일은?'));
					if (sMealType === 'L') {
						agent.add(new Suggestion('저녁은?'));
					}
					agent.add(new Suggestion('알겠어'));
				} else {
					agent.add(sDateText + "에는 메뉴가 없습니다.");
				}
				resolve(returnValue);
				convMenuList.length = 0;
			})
		});
	}

	//20.Welcome, 환영 후 바로 메뉴 조회
	function DefaultWelcomeIntent(agent) {
		//현재 시간 확인해서 9시 이전이면 아침 메뉴, 9~12시면 점심, 그 이후 저녁 메뉴를 기본으로
		var now = new Date();
		var tz = now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000);
		now.setTime(tz);
		let iCurrentTime = now.getHours();
		let sMealType = '';
		if (iCurrentTime <= 9) {
			sMealType = '아침'
		} else {
			if (iCurrentTime > 9 && iCurrentTime <= 12) {
				sMealType = '점심';
			} else {
				sMealType = '저녁';
			}
		}
		sDateGlobal = now;
		QueryMenu(agent);

	}

	// Run the proper handler based on the matched Dialogflow intent
	let intentMap = new Map();
	intentMap.set('QueryMenu', QueryMenu);
	intentMap.set('QueryMenu - ChangeDate', QueryMenu);
	intentMap.set('QueryMenu - ChangeMealType', QueryMenu);
	intentMap.set('QueryMenu - ChangeCafe', QueryMenu);
	intentMap.set('Default Welcome Intent', DefaultWelcomeIntent); //    

	agent.handleRequest(intentMap);
});

let menuList = new Array();
let convMenuList = new Array();

function getMenu(date, hallNo) {
	return new Promise((resolve, reject) => {
		var options = {
			method: "GET",
			uri: "http://welstory.com/menu/getMenuList.do?meal_type=2&course=AA&dt=" + date + "&dtFlag=1&hall_no=" + hallNo + "&restaurant_code="
		};
		request(options, function (error, response, body) {
			if (error) {
				console.log("error!");
				return;
			}
			var menuArray = JSON.parse(body);
			menuArray.forEach(element => {
				var id = element.menu_meal_type + element.menu_course_type + element.hall_no;
				var existList = convMenuList.find(function (n) {
					return n.ID === id;
				});
				if (existList) {
					if (element.typical_menu === "Y") {
						existList.MainTitle = element.menu_name;
					} else {
						if (existList.SideDish) {
							existList.SideDish += "," + element.menu_name;
						} else {
							existList.SideDish = element.menu_name;
						}
					}
					if (element.typical_menu === "Y" && element.tot_kcal != "0") {
						existList.Calories = element.tot_kcal;
					}
				} else {
					var data = new Object();
                    data.ID = id;
                    switch(element.hall_no) {
                        case('E5IV'):case('E5IW'):case('E5IX'):case('E5IZ'): data.Area_ID = "W01"; break;
                        case('E5J2'):case('E5J3'):case('E5J4'): data.Area_ID = "W02"; break;
                        case('E59C'):case('E59D'):case('E59E'):case('E59F'):case('E59G'):
                        case('E5E6'):case('E5E7'):case('E5E8'):case('E5E9'):
                        case('E5EA'):case('E5EB'):case('E5EC'):case('E5ED'): data.Area_ID = "J01"; break;
                        default:
                    }
                    data.Shop_ID = element.hall_no;
                    data.Corner = element.course_txt;
                    data.Date = element.menu_dt;
                    switch(element.menu_meal_type) {
                        case('1'): data.MealType = "M"; break;
                        case('2'): data.MealType = "L"; break;
                        case('3'): data.MealType = "D"; break;
                        default:
                    }
					data.SideDish = "";
					if (element.typical_menu === "Y") {
						data.MainTitle = element.menu_name;
					} else {
						data.MainTitle = "";
						data.SideDish += element.menu_name;
					}
					if (element.typical_menu === "Y" && element.tot_kcal != "0") {
						data.Calories = element.tot_kcal;
					}
					convMenuList.push(data);
				}
            });
            resolve(convMenuList);
		});
	});
}


module.exports = webhook;