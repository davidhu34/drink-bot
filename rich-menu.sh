curl -v -X POST https://api.line.me/v2/bot/richmenu \
  -H 'Authorization: Bearer rrdR9dCgk0QJ0anNNkvwT8f292XBg6uqw1JdpKr0qfSONfWLeYUkCtD9flGx6JvfKD6u9In40mH5W+sZRmtKJr/MC8BItjJuxA9XvpTy6grMUzGKPZmwfHbdT//ARIUcvUxpCy3wZCG2jg9qqpEiYQdB04t89/1O/w1cDnyilFU=
' \
  -H 'Content-Type:application/json' \
  -d \
  '{
    "size":{
        "width":2500,
        "height":1686
    },
    "selected":false,
    "name":"Controller",
    "chatBarText":"Controller",
    "areas":[
        {
          "bounds":{
              "x":551,
              "y":325,
              "width":321,
              "height":321
          },
          "action":{
              "type":"message",
              "text":"up"
          }
        },
        {
          "bounds":{
              "x":876,
              "y":651,
              "width":321,
              "height":321
          },
          "action":{
              "type":"message",
              "text":"right"
          }
        },
        {
          "bounds":{
              "x":551,
              "y":972,
              "width":321,
              "height":321
          },
          "action":{
              "type":"message",
              "text":"down"
          }
        },
        {
          "bounds":{
              "x":225,
              "y":651,
              "width":321,
              "height":321
          },
          "action":{
              "type":"message",
              "text":"left"
          }
        },
        {
          "bounds":{
              "x":1433,
              "y":657,
              "width":367,
              "height":367
          },
          "action":{
              "type":"message",
              "text":"btn b"
          }
        },
        {
          "bounds":{
              "x":1907,
              "y":657,
              "width":367,
              "height":367
          },
          "action":{
              "type":"message",
              "text":"btn a"
          }
        }
    ]
  }'