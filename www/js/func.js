

const corresponding = {
	A: "viseme_PP",
	B: "viseme_kk",
	C: "viseme_I",
	D: "viseme_AA",
	E: "viseme_O",
	F: "viseme_U",
	G: "viseme_FF",
	H: "viseme_TH",
	X: "viseme_PP",
};
let lipChars= "ABCDEFGHX_"


function getRandomCharacter() {
	var minCharCode = 'A'.charCodeAt(0);
	var maxCharCode = 'H'.charCodeAt(0);
	var randomCharCode = Math.floor(Math.random() * (maxCharCode - minCharCode + 1)) + minCharCode;
	var randomCharacter = String.fromCharCode(randomCharCode);

	return randomCharacter;
}


var move = function(ch){
	// console.log("run move:", ch);

	var model = $("#my_model")[0] ;
	gModel = model ;

	// 1: normal
	// 0.5: 動作小一點 不會大嘴巴，比較好看

	var morphTargetSmoothing = 0.5;
	Object.values(corresponding).forEach((value) => {
	    gModel.Wolf3D_Head.morphTargetInfluences[
	    gModel.Wolf3D_Head.morphTargetDictionary[value]
	    ] = THREE.MathUtils.lerp(
	      gModel.Wolf3D_Head.morphTargetInfluences[
	        gModel.Wolf3D_Head.morphTargetDictionary[value]
	      ],
	      0,
	      morphTargetSmoothing
	    );

	    gModel.Wolf3D_Teeth.morphTargetInfluences[
	      gModel.Wolf3D_Teeth.morphTargetDictionary[value]
	    ] = THREE.MathUtils.lerp(
	      gModel.Wolf3D_Teeth.morphTargetInfluences[
	        gModel.Wolf3D_Teeth.morphTargetDictionary[value]
	      ],
	      0,
	      morphTargetSmoothing
	    );
	});

	//var aeiou = getRandomCharacter()
	if (corresponding[ch] != undefined){
	  gModel.Wolf3D_Head.morphTargetInfluences[
	    gModel.Wolf3D_Head.morphTargetDictionary[
	      corresponding[ch]
	    ]
	  ] = THREE.MathUtils.lerp(
	    gModel.Wolf3D_Head.morphTargetInfluences[
	      gModel.Wolf3D_Head.morphTargetDictionary[
	        corresponding[ch]
	      ]
	    ],
	    1,
	    morphTargetSmoothing
	  );
	  gModel.Wolf3D_Teeth.morphTargetInfluences[
	    gModel.Wolf3D_Teeth.morphTargetDictionary[
	      corresponding[ch]
	    ]
	  ] = THREE.MathUtils.lerp(
	    gModel.Wolf3D_Teeth.morphTargetInfluences[
	      gModel.Wolf3D_Teeth.morphTargetDictionary[
	        corresponding[ch]
	      ]
	    ],
	    1,
	    morphTargetSmoothing
	  );
	}
}


var timeout_id = undefined ;
var loopSpeaking = function(){
      var ch = getRandomCharacter();
      move(ch);
      if (speaking){
        if (timeout_id != undefined){
            clearTimeout(timeout_id);
        }
        timeout_id = setTimeout(loopSpeaking , 100, ch);// can only have one here
      }
      else {
        move("_") ;
      }
  }

  var speak = function(line){
      var msg = new SpeechSynthesisUtterance(line);
      console.log("speak:" + line);
      msg.onend = function(){
        //console.log("on speak end");
        speaking = false;
      }
      msg.onstart = function(){
        //console.log("on start end");
        speaking = true;
        loopSpeaking() ;
      }
      window.speechSynthesis.speak(msg);
  }


var talk = function(message, isSpeak, isAppend){
    if (isSpeak){
        speak(message);
    }
    if (isAppend){
        $("#talk").html( $("#talk").html() + message);
    }
    else{
        $("#talk").html(message);
    }

}

var post_chat_old = function(new_message){

    var dic = {}
    var message = [] ;
    var prompt = {"role": "user", "content": "Your name is Mr.Helper"};
    message.push(prompt);
    var user = {"role": "user", "content": new_message};
    message.push(user);
    dic.messages = message ;

    console.log("post sended") ;

    $.ajax({
        contentType: 'application/json',
        data: JSON.stringify(dic),
        dataType: 'json',
        success: function(data){
            var msg = ""
            for (var i = 0 ; i < data.choices.length ; i++){
                msg += data.choices[i].message.content;
            }
            talk(msg, true) ;
            // console.log(data) ;
            $("#loading").addClass("hidden") ;
        },
        error: function(){
            console.log("data")
            console.log("Device control failed");
            $("#loading").addClass("hidden") ;
        },
        processData: false,
        type: 'POST',
        url: 'http://127.0.0.1:8080/v1/chat/completions'
    });
}



var chat_response_stream = "" ;

var post_chat_stream = async function(new_message){
    console.log("using post chat v2, stream");

    var dic = {}
    var message = [] ;
    var prompt = {"role": "user", "content": ""};
    message.push(prompt);
    var user = {"role": "user", "content": new_message};
    message.push(user);
    dic.messages = message ;

    dic["stream"] = true;

    console.log(JSON.stringify(dic));
    const response = await fetch('http://127.0.0.1:8080/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dic),
    });

    $("#talk").html("");
    chat_response_stream = "" ;

    const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
    if (!reader) return;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { value, done } = await reader.read();
      if (done) break;
      let dataDone = false;
      const arr = value.split('\n');
      arr.forEach((data) => {
        if (data.length === 0) return; // ignore empty message
        if (data.startsWith(':')) return; // ignore sse comment message
        if (data === 'data: [DONE]') {
          dataDone = true;
          return;
        }
        const json = JSON.parse(data.substring(6));
        console.log(json);
        var msg = json.choices[0].delta.content;

        if (msg != undefined){
            console.log("chuck:" + msg);
            chat_response_stream += msg ;
            var containsCommaOrDot = /[,.]/.test(chat_response_stream);
            if (containsCommaOrDot){
                var temp = chat_response_stream ;
                chat_response_stream = "" ;
                speak(temp);
            }
            talk(msg, false, true);
        }

      });
      if (dataDone) {
        break;
      }
    }
    console.log("while exit! flush the rest:" + chat_response_stream);
    speak(chat_response_stream);
}

