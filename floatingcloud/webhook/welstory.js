'use strict';

const express = require('express');
const requestClient = require('request');

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
	//Session id저장
	let aSession = request.body.session.split('/');
	let sKakaoSessionID = aSession[aSession.length - 1] || 'dummy';
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
			let sDate = "";
			let sDateText = "";
			let sMealType = agent.parameters.MealType;
			//날짜가 없으면 오늘 날짜로
			if (!agent.parameters.Date) {
				// oDate = new Date().toISOString().slice(0,10).replace(/-/g,"");
				let oDateUTC = new Date().getTime() + 9 * 60 * 1000 * 60; //UTC시간 + 9시간
				oDate = new Date(oDateUTC).toISOString();
				console.log("===========서버 계산 시간");
				console.log(oDate);
			} else {
				//날짜를 따로 받았을 경우 형태
				if (agent.parameters.Date.date_time) {
					oDate = agent.parameters.Date.date_time;
					console.log("===========서버 계산 시간date_time");
					console.log(oDate);
				} else {
					oDate = agent.parameters.Date.startDateTime;
					console.log("===========서버 계산 시간startDateTime");
					console.log(oDate);
				}
			}
			sDate = oDate.split('T')[0].split('-')[0] + oDate.split('T')[0].split('-')[1] + oDate.split('T')[0].split('-')[2];
			sDateText = oDate.split('T')[0].split('-')[0] + '년 ' + oDate.split('T')[0].split('-')[1] + '월 ' + oDate.split('T')[0].split('-')[2] +
				'일';
			//식당이 입력 값으로 들어오지 않을 경우 즐겨찾기가 있나 확인 
			if(!sCafe){
				getCafe(sKakaoSessionID).then(function (result) {
					sCafe = result;
					let sResponse = sDateText + '의 ' + getMealTypeName(sMealType) + '메뉴 정보(' + getCafeName(sCafe) + ')\n';
					var promise = getfnArrayByCode(sDate, sCafe);
					excuteGetMenu(promise, sMealType, sResponse, sDateText, agent).then(function (result){
						resolve(result);
					});
				});
			} else {
				let sResponse = sDateText + '의 ' + getMealTypeName(sMealType) + '메뉴 정보(' + getCafeName(sCafe) + ')\n';
				var promise = getfnArrayByCode(sDate, sCafe);
				excuteGetMenu(promise, sMealType, sResponse, sDateText, agent).then(function (result){
					resolve(result);
				});
			}
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
	//30.즐겨찾기 관리
	function ManageFavoriteCafe(agent) {
		let sCafe = agent.parameters.Cafe;
		let sAction = agent.parameters.DataAction; //Create,Delete,Display
		let sUserKey = sKakaoSessionID; //agent.sessionId; //request.body.user_key;//'dummy';//agent.body.user_key;

		switch (sAction) {
		case 'Create':
			var options = {
				method: "POST",
				uri: "https://charles-erp-dev-mycorpdining-srv.cfapps.ap10.hana.ondemand.com/odata/v2/CatalogService/BookmarkedRestaurant",
				json: true,
				body: {
					"UserKey": sUserKey,
					"ShopID_ShopID": sCafe
				}
			};
			break;
		case 'Delete':
			var options = {
				method: "DELETE",
				uri: "https://charles-erp-dev-mycorpdining-srv.cfapps.ap10.hana.ondemand.com/odata/v2/CatalogService/BookmarkedRestaurant",
				json: true,
				body: {
					"UserKey": sUserKey
				}
			};
			break;
		case 'Display':
			var options = {
				method: "GET",
				uri: "https://charles-erp-dev-mycorpdining-srv.cfapps.ap10.hana.ondemand.com/odata/v2/CatalogService/BookmarkedRestaurant('" +
					sUserKey + "')",
				json: true
			};
			break;
		default:
		}
		console.log(options);
		return new Promise((resolve, reject) => {
			requestClient(options, function (error, response, body) {
				if (error) {
					throw {
						error
					};
				}
				resolve(body);
			});

		}).then(function (result) {
			let sReturnMessage = "";
			switch (sAction) {
			case 'Create':
				sReturnMessage = getCafeName(sCafe) + "가 즐겨찾기에 등록되었습니다.";
				break;
			case 'Delete':
				sReturnMessage = '즐겨찾기가 삭제되었습니다.';
				break;
			case 'Display':
				sReturnMessage = '등록되어 있는 식당은 ' + getCafeName(result.d.ShopID_ShopID) + ' 입니다.';
				break;
			default:
			}
			agent.add(sReturnMessage);
		}).catch(function (err) {
			console.log("==========error");
			console.log(err); // { error: "Ooops!" }
			agent.add("즐겨찾기 등록에 실패하였습니다.");
		});

	}

	// Run the proper handler based on the matched Dialogflow intent
	let intentMap = new Map();
	intentMap.set('QueryMenu', QueryMenu);
	intentMap.set('QueryMenu - ChangeDate', QueryMenu);
	intentMap.set('QueryMenu - ChangeMealType', QueryMenu);
	intentMap.set('Default Welcome Intent', DefaultWelcomeIntent); //    QueryMenu - ChangeCafe
	intentMap.set('QueryMenu - ChangeCafe', QueryMenu); //카페 변경
	intentMap.set('Manage Favorite Cafe', ManageFavoriteCafe); //(카카오톡 전용) 즐겨찾기 관리(입력/삭제/조회)

	agent.handleRequest(intentMap);
});



function getMenu(date, hallNo) {
	let menuList = new Array();
	let convMenuList = new Array();
	return new Promise((resolve, reject) => {
		var options = {
			method: "GET",
			uri: "http://welstory.com/menu/getMenuList.do?meal_type=2&course=AA&dt=" + date + "&dtFlag=1&hall_no=" + hallNo + "&restaurant_code="
		};
		requestClient(options, function (error, response, body) {
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
					switch (element.hall_no) {
					case ('E5IV'):
					case ('E5IW'):
					case ('E5IX'):
					case ('E5IZ'):
						data.Area_ID = "W01";
						break;
					case ('E5J2'):
					case ('E5J3'):
					case ('E5J4'):
						data.Area_ID = "W02";
						break;
					case ('E59C'):
					case ('E59D'):
					case ('E59E'):
					case ('E59F'):
					case ('E59G'):
					case ('E5E6'):
					case ('E5E7'):
					case ('E5E8'):
					case ('E5E9'):
					case ('E5EA'):
					case ('E5EB'):
					case ('E5EC'):
					case ('E5ED'):
						data.Area_ID = "J01";
						break;
					default:
					}
					data.Shop_ID = element.hall_no;
					data.Corner = element.course_txt;
					data.Date = element.menu_dt;
					switch (element.menu_meal_type) {
					case ('1'):
						data.MealType = "M";
						break;
					case ('2'):
						data.MealType = "L";
						break;
					case ('3'):
						data.MealType = "D";
						break;
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
//Menu가져와서 Response에 추가
function excuteGetMenu(promise, mealType, sResponse, sDateText, agent){
	return new Promise((resolve, reject) => {
		Promise.all(promise)
			.then(function (result) {
				//convMenuList에 필터(아/점/저)
				var returnValue = [];
				result.forEach(element => {
					element.forEach(subElement => {
						if (subElement.MealType === mealType) {
						returnValue.push(subElement);
					}
					});
				});
				//결과값 리턴
				for (var i = 0; i < returnValue.length; i++) {
					sResponse += '●' + returnValue[i].Corner + "→" + returnValue[i].MainTitle + "\n" + returnValue[i].SideDish + "\n";
				}
				if (returnValue.length > 0) {
					agent.add(sResponse);
					agent.add(new Suggestion('내일은?'));
					if (mealType === 'L') {
						agent.add(new Suggestion('저녁은?'));
					}
					agent.add(new Suggestion('알겠어'));
				} else {
					agent.add(sDateText + "에는 메뉴가 없습니다.");
				}
				resolve(agent);
			})
	});
}
//즐겨찾기한 식당이 있는지 조회
function getCafe(sKakaoSessionID) {
	return new Promise(function (resolve, reject) {
		var options = {
			method: "GET",
			uri: "https://charles-erp-dev-mycorpdining-srv.cfapps.ap10.hana.ondemand.com/odata/v2/CatalogService/BookmarkedRestaurant('" +
				sKakaoSessionID + "')",
			json: true
		};
		requestClient(options, function (error, response, body) {
			if (error) {
				console.log("error!");
				return;
			}
			if (body.d) {
				var myCafe = body.d.ShopID_ShopID;
			} else {
				var myCafe = "W02";
			}
			resolve(myCafe);
		});
	});
}
//식당코드->명
function getCafeName(sCafeId) {
	switch (sCafeId) {
	case 'J01':
		return '잠실SDS';
	case 'W01':
		return '우면1식당';
	case 'W02':
		return '우면2식당';
	default:
	}
}
//MealType->명
function getMealTypeName(mealType) {
	switch (mealType) {
	case 'M':
		return '아침';
	case 'L':
		return '점심';
	case 'D':
		return '저녁';
	default:
	}
}
//MealType->명
function getfnArrayByCode(sDate, sCafeId) {
	var promise = new Array();
	switch (sCafeId) {
		case ('W01'):
			promise = [getMenu(sDate, "E5IV"), getMenu(sDate, "E5IW"), getMenu(sDate, "E5IX"), getMenu(sDate, "E5IZ")];
			break;
		case ('W02'):
			promise = [getMenu(sDate, "E5J2"), getMenu(sDate, "E5J3"), getMenu(sDate, "E5J4")];
			break;
		case ('J01'):
			promise = [getMenu(sDate, "E59C"), getMenu(sDate, "E59D"), getMenu(sDate, "E59E"), getMenu(sDate, "E59F"), getMenu(sDate, "E59G"), getMenu(sDate, "E5E6"), 
						getMenu(sDate, "E5E7"), getMenu(sDate, "E5E8"), getMenu(sDate, "E5E9"), getMenu(sDate, "E5EA"), getMenu(sDate, "E5EB"), getMenu(sDate, "E5EC"),
						getMenu(sDate, "E5ED")];
			break;
		default:
	}
	return promise;
}
module.exports = webhook;