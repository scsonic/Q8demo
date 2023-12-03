

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
	console.log("run move:", ch);

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

var loopSpeaking = function(){
      var ch = getRandomCharacter();
      move(ch);
      if (speaking){
        setTimeout(loopSpeaking , 100, ch);  
      }
      else {
        move("_") ;
      }
  }

  var speak = function(line){
      var msg = new SpeechSynthesisUtterance(line);
      console.log(msg);
      msg.onend = function(){
        console.log("on speak end");
        speaking = false;
      }
      msg.onstart = function(){
        console.log("on start end");
        speaking = true;
        loopSpeaking() ;
      }
      window.speechSynthesis.speak(msg);
  }
      