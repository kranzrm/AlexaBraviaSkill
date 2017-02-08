/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 *
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, ask Minecraft Helper how to make paper."
 *  Alexa: "(reads back recipe for paper)"
 */

'use strict';
var AlexaSkill = require('./AlexaSkill'),
    recipes = require('./commands');
var AWS = require('aws-sdk');
var APP_ID = 'YOUR SKILL ENDPOINT'; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';


var TVControl = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
TVControl.prototype = Object.create(AlexaSkill.prototype);
TVControl.prototype.constructor = TVControl;

TVControl.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    var speechText = "Welcome to the Television Controller. You can issue commands like start netflix or mute? ... Now, what can I help you with.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For instructions on what you can say, please say help me.";
    response.ask(speechText, repromptText);
};

TVControl.prototype.intentHandlers = {
    "CommandIntent": function (intent, session, response) {
        var itemSlot = intent.slots.Action,
            itemName;
        if (itemSlot && itemSlot.value){
            itemName = itemSlot.value.toLowerCase();
        }

        var cardTitle = "command for " + itemName,
            recipe = recipes[itemName],
            speechOutput,
            repromptOutput;
            
        if (recipe) {

            speechOutput = {
                speech: recipe,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            var iotdata = new AWS.IotData({endpoint: 'a2xds33znvl0md.iot.us-east-1.amazonaws.com'});
            var iotpayload = {
                topic: 'bravia/command',
                payload: recipe,
                qos: 0
            };
                
            console.log("Sent Data:", JSON.stringify(iotpayload,null,2));
            iotdata.publish(iotpayload, function(err, data){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("success?");
                }
                response.tellWithCard(speechOutput, cardTitle, recipe);
            });

            

        } else {
            var speech;
            if (itemName) {
                speech = "I'm sorry, there is no command to " + itemName + ". What else can I help with?";
            } else {
                speech = "I'm sorry, I currently do not know that command. What else can I help with?";
            }
            speechOutput = {
                speech: speech,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            repromptOutput = {
                speech: "What else can I help with?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.ask(speechOutput, repromptOutput);
        }
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "You can issue commands to your t. v., such as tell my t. v. to shut off, or, you can say exit... Now, what can I help you with?";
        var repromptText = "You can say things like, what's the recipe for a chest, or you can say exit... Now, what can I help you with?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
};





exports.handler = function (event, context) {


    var tvControl = new TVControl();
    tvControl.execute(event, context);
};
