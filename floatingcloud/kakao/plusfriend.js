'use strict';
var apiai = require("apiai");
const express = require('express');
var router = express.Router();

//10. dialogflow의 프로젝트에 있는 client용 키
var chatapp = apiai("fe6c8e349e6f4c6b9164ebb0395d0600", {
    language: 'ko-KR'
});
var oResponse = {
  "message":{
    "text":""
  }
}
var options = {
    sessionId: 'kakaotalkSession'
};
router.get('/keyboard',function(request,response){
  const menu = {
     type: "text"
 };
 response.json(menu);
});
//request.body.content

router.post('/message',function(request,response){
  let sUser_key = decodeURIComponent(request.body.user_key); // user's key
  let sType = decodeURIComponent(request.body.type); // message type
  let sContent = decodeURIComponent(request.body.content); // user's message
  // console.log("==========REQUEST");
  // console.log(request.body.content);
  //user key 전달
   options.user_key = sUser_key;

  var request = chatapp.textRequest(sContent, options);
    
    request.on('response', function(res) {
    let aMessage = res.result.fulfillment.messages;
    console.log(JSON.stringify(aMessage))
    //Payload가 있나 보고
    let aPayload = aMessage.filter(oMenu => oMenu.type === 4);
     //quickreply가 있을 경우 카카오용 키보드 설정
    //  let aQuckReplies = aMessage.filter(oMenu => oMenu.type === 2);
    //  if(aQuckReplies.length>0){
    //   oResponse.keyboard = {type:"buttons",buttons:aQuckReplies[0].replies};
    //  }
     

    if(aPayload.length>0){
        oResponse = aPayload[0].payload;
    } else if(res.result.fulfillment.speech){
      oResponse.message.text=res.result.fulfillment.speech;
     } else {
      oResponse.message.text = res.result.fulfillment.messages[0].speech;
     }
     console.log(oResponse);
     response.json(oResponse);   
});

request.on('error', function(error) {
    console.log(error);
});

request.end();
});

module.exports = router;
