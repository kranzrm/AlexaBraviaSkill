#!/usr/bin/python
import paho.mqtt.client as mqtt
import ssl
import requests
import json
import os.path

#TODO Change hardcoded variables
url = "http://192.168.1.124/sony/IRCC"

ca_certs = "./root-CA.pem"
certfile = "./rkfd1.cert.pem"
keyfile = "./rkfd1.private.key"
aws_endpoint = "YOUR ENDPOINT"
aws_port = 8883


# Get cookie from file
if os.path.isfile('auth_cookie'):
	with open('auth_cookie') as f:
		content = f.readline()
else:
    print "'auth_cookie' file not present"
    print "Run 'auth.sh' to generate cookie"
    exit(1)

cookie = content.split('=')[1]

# Get list of commands
command_list = {}
with open('./ircc_commands.json') as json_data:
    d = json.load(json_data)
    l = d['result'][1]
    for item in l:
        name = item['name']
        command_list[name] = item['value']


def ircc_cmd(url,cookie,command):
    if not command_list.has_key(command):
        return 1
    headers = {
        'content-type': 'text/xml',
        'charset':'UTF-8',
        'SOAPACTION': 'urn:schemas-sony-com:service:IRCC:1#X_SendIRCC',
        'Cookie':cookie
    }
    body = """<?xml version="1.0"?>
        <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
            <s:Body>
                <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
                    <IRCCCode>""" + command_list[command] + """</IRCCCode>
                </u:X_SendIRCC>
            </s:Body>
        </s:Envelope>"""
    response = requests.post(url,data=body,headers=headers)
    #print response.content
    return 0


# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("bravia/command")

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))
    print("Command: " + msg.payload)
    err = ircc_cmd(url,cookie,msg.payload)
    if err: print("Command not found")




client = mqtt.Client()
client.tls_set(ca_certs, certfile=certfile, keyfile=keyfile, cert_reqs=ssl.CERT_REQUIRED,
    tls_version=ssl.PROTOCOL_SSLv23, ciphers=None)

client.on_connect = on_connect
client.on_message = on_message

client.connect(aws_endpoint, aws_port, 60)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()
