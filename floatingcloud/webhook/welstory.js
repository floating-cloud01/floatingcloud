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
	const agent = new WebhookClient({
		request,
		response
	});
	//Session id저장
	let aSession = agent.session.split('/');//request.body.session.split('/');
	let sKakaoSessionID = aSession[aSession.length - 1] || 'dummy';

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
			let oDateUTC = "";
			//추천,랜덤, 저칼로리, 고칼로리 식단 추천.추천/랜덤=1개, 저칼로리/고칼로리=상위3개
			let sMenuAction = agent.parameters.MenuAction;//RECOMMEND,RANDOM,LOWCALORIES,HIGHCALORIES
			//날짜가 없으면 오늘 날짜로
			if (!agent.parameters.Date) {
				// oDate = new Date().toISOString().slice(0,10).replace(/-/g,"");
				//서버가 시드니라고 가정하고
				oDateUTC = new Date().getTime() + 9 * 60 * 1000 * 60; //UTC시간 + 9시간
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
			};
			//sMealType이 없으면 현재 시간을 기준으로 계산
			if(!sMealType){
			  sMealType = getMealTypeByTime();
			}

			sDate = oDate.split('T')[0].split('-')[0] + oDate.split('T')[0].split('-')[1] + oDate.split('T')[0].split('-')[2];
			sDateText = oDate.split('T')[0].split('-')[0] + '년 ' + oDate.split('T')[0].split('-')[1] + '월 ' + oDate.split('T')[0].split('-')[2] +
				'일';
			//식당이 입력 값으로 들어오지 않을 경우 즐겨찾기가 있나 확인 
			if (!sCafe) {
				getCafe(sKakaoSessionID).then(function (result) {
					sCafe = result;
					let sResponse = sDateText + '의 ' + getMealTypeName(sMealType) + '메뉴 정보(' + getCafeName(sCafe) + ')\n';
					excuteGetMenu(sCafe, sDate, sMealType, sResponse, sDateText, sMenuAction,agent).then(function (result) {
						resolve(result);
					});
				});
			} else {
				let sResponse = sDateText + '의 ' + getMealTypeName(sMealType) + '메뉴 정보(' + getCafeName(sCafe) + ')\n';
				excuteGetMenu(sCafe, sDate, sMealType, sResponse, sDateText, sMenuAction, agent).then(function (result) {
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
		// console.log(agent.conv.user);
		let sCafe = agent.parameters.Cafe;
		let sAction = agent.parameters.DataAction; //Create,Delete,Display
		let sUserKey = sKakaoSessionID; //agent.sessionId; //request.body.user_key;//'dummy';//agent.body.user_key;
        
		switch (sAction) {
		case 'Create':
			if(!sCafe){
				agent.add("식당 이름을 말씀해주세요(잠실,우면1식당,우면2식당,서초)");
				return;
			}
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
				uri: "https://charles-erp-dev-mycorpdining-srv.cfapps.ap10.hana.ondemand.com/odata/v2/CatalogService/BookmarkedRestaurant('" +
					sUserKey + "')",
				json: true
			};
			break;
		case 'Display':
		default:
			var options = {
				method: "GET",
				uri: "https://charles-erp-dev-mycorpdining-srv.cfapps.ap10.hana.ondemand.com/odata/v2/CatalogService/BookmarkedRestaurant('" +
					sUserKey + "')",
				json: true
			};
			break;
		
		}
	
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
			agent.add(new Suggestion('오늘 점심 메뉴'));
			agent.add(new Suggestion('추천 메뉴'));
		}).catch(function (err) {
			switch (sAction) {
			  case 'Create':
			  	   agent.add("즐겨찾기 등록에 실패하였습니다.");
			  		break;
			case 'Delete':
				agent.add("즐겨찾기 삭제에 실패하였습니다.");
					break;
			case 'Display':
				    agent.add("등록된 즐겨찾기가 없습니다");
					break;
			default:
			}
			agent.add(new Suggestion('오늘 점심 메뉴'));
			agent.add(new Suggestion('추천 메뉴'));
			
		});

	}
	//40.자세히 알려줘
	function QueryMenuDrillDown(agent){
		//앞에서 저장한 메뉴읽어
		let sResponse = "상세메뉴 반영중";
		// let aPrevMenu = agent.getContext('menu').parameters;
		// console.log("==QueryMenuDrillDown");
		// console.log(agent.contexts);
		// for (var i = 0; i < aPrevMenu.length; i++) {
		// 			sResponse += i+1 + "." + aPrevMenu[i].Corner + "→" + aPrevMenu[i].MainTitle +"("+aPrevMenu[i].Calories+")\n"  + aPrevMenu[i].SideDish + "\n";
		// }
		agent.add(sResponse);
	}

	// Run the proper handler based on the matched Dialogflow intent
	let intentMap = new Map();
	intentMap.set('QueryMenu', QueryMenu);
	intentMap.set('QueryMenu - ChangeDate', QueryMenu);
	intentMap.set('QueryMenu - ChangeMealType', QueryMenu);
	intentMap.set('Default Welcome Intent', DefaultWelcomeIntent); //    QueryMenu - ChangeCafe
	intentMap.set('QueryMenu - ChangeCafe', QueryMenu); //카페 변경
	intentMap.set('Manage Favorite Cafe', ManageFavoriteCafe); //(카카오톡 전용) 즐겨찾기 관리(입력/삭제/조회)
	intentMap.set('QueryMenu - DrillDown', QueryMenuDrillDown); 

	agent.handleRequest(intentMap);
});

function getMenu(date, hallNo) {
	let menuList = new Array();
	let convMenuList = new Array();
	return new Promise((resolve, reject) => {
		var options = {
			method: "GET",
			uri: "http://welstory.com/menu/getMenuList.do?dt=" + date + "&hall_no=" + hallNo
		};
		requestClient(options, function (error, response, body) {
			if (error) {
				console.log("error!");
				return;
			}
			// console.log(body);
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
					case ('E5KL'):
						data.Area_ID = "S01";
						break;
					default:
					}
					data.Shop_ID = element.hall_no;
					data.Corner = element.course_txt;
					data.Date = element.menu_dt;
					data.Recipe_cd = element.recipe_cd;
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
function excuteGetMenu(sCafe, sDate, sMealType, sResponse, sDateText, sMenuAction,agent) {
	return new Promise((resolve, reject) => {
		var sUrl = "https://charles-erp-dev-mycorpdining-srv.cfapps.ap10.hana.ondemand.com/odata/v2/CatalogService/Menu?$filter=ShopID_ShopID eq '" +
		     	   sCafe + "' and MealType_MealType eq '" + sMealType + "' and Date eq datetimeoffset'" + parseYyyymmddToString(sDate).toISOString() + "'";
		var options = {
			method: "GET",
			uri: sUrl,
			json: true
		};
		requestClient(options, function (error, response, body) {
			if (error) {
				console.log("error!");
				return;
			}
			if (body.d.results) {
				var returnValue = body.d.results;
				let aFilteredRetunValue = [];
				//상세 메뉴 조회를 위해 현재 조회한 데이터를 저장(lifespan 1)
				// agent.setContext({
			 //     name: 'menu',
			 //     lifespan: 1,
			 //     parameters:returnValue
			 //   });
				switch (sMenuAction) {
			    	case 'RECOMMEND':
			    	case 'RANDOM':
    				   let iIndex =  Math.floor(Math.random() * (returnValue.length - 0));
					   aFilteredRetunValue.push(returnValue[iIndex]);
					   sResponse += '<복불복 메뉴>\n';
					   break;
			    	case 'LOWCALORIES':
			    		aFilteredRetunValue = TopNArrays(returnValue,false,'Calories',3);
			    		sResponse += '<저칼로리 3개>\n';
			    		break;
			    	case 'HIGHCALORIES':
			    		aFilteredRetunValue = TopNArrays(returnValue,true,'Calories',3);
			    		sResponse += '<고칼로리 3개>\n';
			    		break;
			    	case 'SPECIAL':
			    		aFilteredRetunValue = returnValue.filter(function(value){
			    			return value.MainTitle.includes("선택식");
			    		})
			    		break;
			        default:
			            aFilteredRetunValue = returnValue;
			    }
			    //결과값 리턴
				let iCal = 0;
				for (var i = 0; i < aFilteredRetunValue.length; i++) {
					iCal = aFilteredRetunValue[i].Calories?aFilteredRetunValue[i].Calories:"미제공"
					sResponse += i+1 + "." + aFilteredRetunValue[i].Corner + "→" + 
											aFilteredRetunValue[i].MainTitle + "(" + 
											 iCal +"Kcal)" + 
											"\n" ;//+ aFilteredRetunValue[i].SideDish + "\n";
				}
				if (aFilteredRetunValue.length > 0) {
					agent.add(sResponse);
					agent.add(new Suggestion('내일은?'));
					if (sMealType === 'L') {
						agent.add(new Suggestion('저녁은?'));
					}
					
				} else {
					agent.add(sDateText + "에는 메뉴가 없습니다.");
				}
				resolve(agent);
			}
		});
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
	case 'S01':
		return '서초생명';
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
//현재 시간을 기준으로 MealType계산
function getMealTypeByTime() {
	let oCurrentDateTime = new Date().getTime() + 9 * 60 * 1000 * 60; //UTC시간 + 9시간
	let iHour = new Date(oCurrentDateTime).getHours()*1;
	// console.log("====식사타입용 시간");
	// console.log(iHour);
	// console.log(iHour===11);
	switch (true) {
	case (iHour<9): //아침
		console.log("M");
		return 'M';
		break;
	case (iHour>=9 && iHour<13): //점심
		console.log("L");
		return 'L';
		break;
	default: //저녁
		console.log("D");
		return 'D';
		break;
	}
}

//정렬
///common Functions
function TopNArrays(aData,bDesc,sSortProp,iTop){
  //aData에서 bDesc를 이용해(오름차순/내림차순)sSortProp 기준으로 정렬하여 상위 iTop개를 리턴
  //10.정렬
  if(bDesc){//내림차순일 경우
    aData.sort(function(a,b){
    	if(a[sSortProp] === 'undefined' || b[sSortProp] === 'undefined') return 1;
    	return parseInt(a[sSortProp])>parseInt(b[sSortProp]) ? -1 : parseInt(a[sSortProp])<parseInt(b[sSortProp])?1:0;
    });
  } else {
    aData.sort(function(a,b){
    	if(a[sSortProp] === 'undefined' || b[sSortProp] === 'undefined') return 1;
    	return parseInt(a[sSortProp])<parseInt(b[sSortProp]) ? -1 : parseInt(a[sSortProp])>parseInt(b[sSortProp])?1:0;
    });
  }
  //20. 상위 iTop개 리턴
  return aData.slice(0,iTop);
};
//scheduler.js의 parseYyyymmddToString
// 서버 저장을 위해 YYYYMMDD를 Date 객체로 변환
const parseYyyymmddToString = (str) => {
    const y = str.substr(0, 4),
        m = str.substr(4, 2) - 1,
        d = str.substr(6, 2);
    // 무슨 이유에서인지 서버 저장시 Local Timezone이 적용되지 않아 TimezoneOffset을 한번 더 적용해줌
    return new Date(new Date(y, m, d).getTime() - new Date(y, m, d).getTimezoneOffset() * 60000);
};

module.exports = {
	webhook,
	getMenu
};