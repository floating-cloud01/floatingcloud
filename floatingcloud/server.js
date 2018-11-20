/*eslint no-console: 0*/
'use strict';


//const functions = require('firebase-functions');

const express = require('express');
const kakao = require('./kakao/plusfriend');
// const restServiceSales = require('./rest/restServiceSales');
const welstory = require('./webhook/welstory');
const bodyParser = require('body-parser');
const cors = require('cors');

var port = process.env.PORT || 5000;
var app = express();

app.use(cors());
app.use(bodyParser.json());
//10.Webhook용 서비스 생성
// app.use('/webhook', webhook);
//카카오 플러스 친구
app.use('/kakao', kakao);
app.use('/webhook', welstory);
// app.use('/welstory',restServiceSales);
//20.index.html호출용 서비스 생성
app.use(express.static('static'))
var server = app.listen(port, function () {
    console.log('Welstory' + port)
})
