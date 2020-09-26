var questionHeader;
var txtInput;
var instructional;
var smStageScores = [];
var stagePrompts = ["How are you today?", "Tell me something about yourself","What's important to you?", "Describe yourself in one word"];
var sm = new Sentimood(); 
var programState;
var elements = []; // visual assets go here

var propagationLength = 0; // pronounciation of rotating shapes [line,circle,triangle] 
var propagationLength_copy = 0;
var pattern_index_noise = 0;
var pattern_index_main = 0;
var color_pallet_shape; // DEFAULT WHITE
var color_pallet_noise; // DEFAULT WHITE
var rot_speed_main = 0; //lower = faster, higher = slllooowwweeerr
var rot_speed_noise = 0;

// For background changes
var r;
var g;
var b;

//background music 
let ambient;
let melodic;
let organ;
var global_Volume = 0.5;

function preload() {
  // load any assets (images, sounds etc.) here
  //https://freesound.org/people/Erokia/sounds/419081/
  //https://freesound.org/people/PatrickLieberkind/sounds/341541/
  //https://freesound.org/people/PatrickLieberkind/sounds/214334/
  ambient = loadSound("assets/ambient.mp3"); 
  melodic = loadSound("assets/melodic.mp3");
  organ = loadSound("assets/calm_organ.mp3");
}

function setupAssets() {
  w = 500;
  h = 150;

  //program state set/reset
  programState = 0;
  propagationLength = 0; // pronounciation of rotating shapes [line,circle,triangle] DEFUALT 0
  propagationLength_copy = 0;
  pattern_index_noise = 0;
  pattern_index_main = 0;
  rot_speed_main = 0; //lower = faster, higher = slllooowwweeerr
  rot_speed_noise = 0;
  color_pallet_shape = [color("#f6f7f8"),color("#f6f7f8")]; // DEFAULT WHITE
  color_pallet_noise = [color("#f6f7f8"),color("#f6f7f8")]; // DEFAULT WHITE
  r = 0;
  g = 0;
  b = 0;

  questionHeader = createElement ("h2", "<h2 id=\"prompt\">"+stagePrompts[programState]+"</h2>");
  questionHeader.position(windowWidth/2-150, windowHeight/2-250);
  questionHeader.style ('font-size', '25px');
  questionHeader.style("font-family", "Sans-Serif");
  questionHeader.style("color", "#a3a3a3");
  questionHeader.style ("-webkit-text-stroke:", "2px red");

  instructional = createElement ("p", "Try and be as expressive as you can for the best results!");
  instructional.position(windowWidth/2-170, windowHeight/2-120);
  instructional.style ('font-size', '14px');
  instructional.style ("font-family", "Sans-Serif");
  instructional.style ("color", "#a3a3a3");

  txtInput = createElement ("textarea", "");
  txtInput.position(windowWidth/2-(w/2), windowHeight/2-(h/2));
  txtInput.size (w,h);
  txtInput.style ("resize", "none");
  txtInput.style('font-size', '22px');
  txtInput.style("font-family", "Arial");
  txtInput.style ("border", "dotted");
  txtInput.style ("border-width", "2px");
  txtInput.style ("border-color", "orange");
  txtInput.style("color", "#333333");
  txtInput.elt.focus();

  button.elt.innerHTML = ">";
  button.position ((windowWidth/2) -(w/2)+520, (windowHeight/2)-(h/2));
  button.size (30,155);
  button.style ("border", "none");
  button.style ("font-size", "16px");
  button.style ("background-color", "#e7e7e7");
  button.mousePressed(buttonHandler);

  background_btn.elt.innerHTML = "Change background";
  background_btn.position (windowWidth - 110, 10);
  background_btn.size (100,100);
  background_btn.style ("border", "none");
  background_btn.style ("font-size", "16px");
  background_btn.style ("background-color", "#e7e7e7");
  background_btn.mousePressed(backgroundHandler)
  background_btn.hide();
}

function pickMusic (score) {
  if (score <= -3) { 
    organ.loop();
    organ.setVolume(global_Volume);
    ambient.stop();
    melodic.stop();
  } else if (score >= 3) {
    melodic.loop();
    melodic.setVolume(global_Volume);
    ambient.stop();
    organ.stop();
  } else {
    ambient.loop();
    ambient.setVolume(global_Volume);
    organ.stop();
    melodic.stop();
  }
}

function backgroundHandler() {
  r = random(0,255);
  g = random(0,255);
  b = random(0,255);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fontSize = 14;
  button = createButton();
  background_btn = createButton();
  // put setup code here
  setupAssets(); 

  color_pallet_shape = [color("#f6f7f8"),color("#f6f7f8")]; // DEFAULT WHITE
  color_pallet_noise = [color("#f6f7f8"),color("#f6f7f8")]; 

  for(let i=0; i<50; i++)
      elements.push({
          pos:createVector(random(-15,15),random(-15,15)),
          dir:createVector(random(-2,2),random(-2,2))
      });
  background(50,50,50,8);
  ambient.loop();
  ambient.setVolume(global_Volume);
  amp = new p5.Amplitude();
}

function buttonHandler() { 
  programState++;
  //console.log("Program state: " + programState);
  smScore = sm.analyze(txtInput.value()).score;
  if (programState < 4) {
    //console.log(sm.analyze(txtInput.value()));
    smStageScores[programState-1]=(smScore);
    console.log(smStageScores);
    //console.log("Index: " + (programState-1));
    questionHeader.elt.innerHTML = "<h2 id=\"prompt\">"+stagePrompts[programState]+"</h2>"; //Change HTML header text
    textWidth = questionHeader.elt.clientWidth;
    questionHeader.position(windowWidth/2-(textWidth/2), windowHeight/2-250);
    txtInput.elt.value = "";
  } else if (programState == 4) {
    smStageScores[programState-1]=(smScore);
    //console.log(smStageScores);
    questionHeader.hide();
    txtInput.hide();
    instructional.hide();
    button.position (10,10);
    button.size (100,100);
    button.elt.innerHTML = "Reset";
    background_btn.show();
    button.mousePressed(setupAssets);
  }
  decider (programState, smScore);
}

function decider (state,score) {
  if (state == 1) {
    initPattern (score);
  } else if (state == 2) {
    setMovementSpeed (score);
  } else if (state == 3) {
    setMovementType (score);
  } else if (state >= 4) {
    setColorPallete (score);
  }
}

function initPattern(score) { // Called by sentimentAnalysis
  propagationLength = 60; // main pattern trigger
  propagationLength_copy = 60;
  if (score <= -3) { // Highly negative connotation 
    pattern_index_main = 3;
    console.log("Set pattern to index 3");
  } else if (score >= 3) { // Highly positive connotation
    pattern_index_main = 2;
    console.log("Set pattern to index 3");
  } else { // Neutral connotation 
    //propagationLength = 100;
    pattern_index_main = 1;
    console.log("Set pattern to index 3");
  }
}

function setMovementSpeed(score) { // Purely numeric setting for movement speed
  pickMusic (score);
  if (score <= -3) { // Highly negative connotation 
    rot_speed_noise = 1500;
    pattern_index_noise = 3;
    console.log("Set noise rotation speed to 1500");
  } else if (score >= 3) { // Highly positive connotation
    rot_speed_noise = 600;
    pattern_index_noise = 2;
    console.log("Set noise rotation speed to 150");
  } else { // Neutral connotation 
    rot_speed_noise = 5000;
    pattern_index_noise = 1;
    console.log("Set noise rotation speed to 0");
  }
}

function setMovementType(score) { // Specify types of rotation and orientation
  if (score <= -3) { // Highly negative connotation 
    rot_speed_main = 1500;
    console.log("Set main rotation speed to 1500");
  } else if (score >= 3) { // Highly positive connotation
    rot_speed_main = 600; 
    console.log("Set main rotation speed to 150");
  } else { // Neutral connotation 
    rot_speed_main = 5000;
    console.log("Set main rotation speed to 0");
  }
}

function setColorPallete(score) { 
  if (score <= -3) { // Highly negative connotation 
    color_pallet_shape[0] = color("#20a4f3");
    color_pallet_shape[1] = color("#00c0f6");
    //background to purple
    r = 107;
    g = 2;
    b = 145;

    if (random (-1,1) >= 0) {
      color_pallet_noise[0] = color("#ff3366");
      color_pallet_noise[1] = color("#d53d8e");
      rot_speed_noise = 0;
    } else {
      color_pallet_noise[0] = color("#1be9b6");
      color_pallet_noise[1] = color("#a0f58a");
    }
    console.log("Set shape color pallet to blue");
  } else if (score >= 3) { // Highly positive connotation
    color_pallet_shape[0] = color("#ff3366");
    color_pallet_shape[1] = color("#d53d8e");
    //background to gold
    r = 224;
    g = 191;
    b = 3;
    if (random (-1,1) >= 0) {
      color_pallet_noise[0] = color("#20a4f3");
      color_pallet_noise[1] = color("#00c0f6");
      rot_speed_noise = 0;
    } else {
      color_pallet_noise[0] = color("#1be9b6");
      color_pallet_noise[1] = color("#a0f58a");
    }
    console.log("Set shape color pallet to pink");
  } else { // Neutral connotation 
    color_pallet_shape[0] = color("#1be9b6");
    color_pallet_shape[1] = color("#a0f58a");
    //background to pastel pink
    r = 245;
    g = 169;
    b = 175
    if (random (-1,1) >= 0) {
      color_pallet_noise[0] = color("#a9f5ea");
      color_pallet_noise[1] = color("#d53d8e");
    } else {
      color_pallet_noise[0] = color("#1be9b6");
      color_pallet_noise[1] = color("#a0f58a");
      rot_speed_noise = 0;
    }
    console.log("Set shape color pallet to green");
  }
}

function draw() {
  background(r,g,b,8);
  translate(width/2,height/2);
  
  if (keyIsPressed && programState == 0) {
    propagationLength = 100;
    pattern_index_main = 1;
  } else if (programState == 0) {
    propagationLength = propagationLength_copy;
    pattern_index_main = 0;
  } 

  if (keyIsPressed && programState < 4) {
    color_pallet_shape[0] = color(random(0,255),random(0,255),random(0,255)); // Random color
    color_pallet_shape[1] = color(random(0,255),random(0,255),random(0,255));
  } else if (programState < 4) {
    color_pallet_shape[0] = color("#f6f7f8") // Defualt white
    color_pallet_shape[1] = color("#f6f7f8")
  }

  //adjust visuals based on sound amplitude 
  vol = amp.getLevel();
  
  if (ambient.isPlaying()) {
    if (vol > 0.088) {
      propagationLength += vol + 0.1;
    } else if (propagationLength > propagationLength_copy) { //compare to original value
      propagationLength -= 2.5;
    } 
  } else if (organ.isPlaying()) {
    if (vol > 0.080) {
      propagationLength += vol + 1.2;
    } else if (propagationLength > propagationLength_copy) { 
      propagationLength -= 1.5;
    } 
  } else if (melodic.isPlaying) {
    if (vol > 0.02) {
      propagationLength += vol + 3.5;
    } else if (propagationLength > propagationLength_copy) { 
      propagationLength = propagationLength_copy;
    } 
  }

  for(let i=0; i<elements.length; i++) {
      elements[i].pos.add (elements[i].dir);
      elements[i].dir.add (createVector (random (-1,1)*0.001, random (-1,1)*0.001));

      if(createVector(0,0).dist(elements[i].pos)>windowWidth/2) //reset particle after boundary is reached 
          elements[i].pos = createVector(0,0);
      rotate(frameCount/rot_speed_main);
      for(let j=0; j<elements.length; j++) {

          if(elements[i].pos.dist(elements[j].pos)<propagationLength) {
              stroke(
                  lerpColor( //to blend colors
                      color_pallet_shape[0],
                      color_pallet_shape[1],
                      elements[i].pos.dist(elements[j].pos)/40.));
              
              strokeWeight(3);
              if (pattern_index_main == 1) {
                rect(elements[i].pos.x,elements[i].pos.y, random(-15,15), random(-15,15));
                  if (mouseIsPressed && programState == 4) {
                    line(elements[i].pos.x,elements[i].pos.y,
                      mouseX-windowWidth/2,mouseY-windowHeight/2);
                  } else {
                    line(elements[i].pos.x,elements[i].pos.y,
                      elements[j].pos.x,elements[j].pos.y);
                  }
              } else if (pattern_index_main == 2) {
                  ellipse(elements[i].pos.x,elements[i].pos.y, random(-15,15), random(-15,15));
                  if (mouseIsPressed && programState == 4) {
                    line(elements[i].pos.x,elements[i].pos.y,
                      mouseX-windowWidth/2,mouseY-windowHeight/2);
                  } else {
                    line(elements[i].pos.x,elements[i].pos.y,
                      elements[j].pos.x,elements[j].pos.y);
                  }
              } else if (pattern_index_main == 3) {
                triangle(elements[i].pos.x,elements[i].pos.y, 
                  elements[i].pos.x+random(-10,10),elements[i].pos.y+random(-10,10), 
                  elements[i].pos.x+random(-10,10),elements[i].pos.y+random(-10,10));
                  if (mouseIsPressed && programState == 4) {
                    line(elements[i].pos.x,elements[i].pos.y,
                      mouseX-windowWidth/2,mouseY-windowHeight/2);
                  } else {
                    line(elements[i].pos.x,elements[i].pos.y,
                      elements[j].pos.x,elements[j].pos.y);
                  }
              }
          }
      }
  }

  for(let i=0; i<elements.length; i++) {
      elements[i].pos.add(elements[i].dir);
      elements[i].dir.add(createVector(random(-1,1)*0.01,random(-1,1)*0.01));
      if(createVector(0,0).dist(elements[i].pos)>windowWidth/2)
          elements[i].pos = createVector(0,0);
      
      rotate(-frameCount/rot_speed_noise); //COULD TRY AND MAKE THIS A SEPERATE ROTSPEED
      for(let j=0; j<elements.length; j++) {
          if(elements[i].pos.dist(elements[j].pos)<propagationLength) {
              stroke(
                  lerpColor( //to blend colors
                      color_pallet_noise[0],
                      color_pallet_noise[1],
                      elements[i].pos.dist(elements[j].pos)/40.));
              
              strokeWeight(2);
              if (pattern_index_noise == 1) {                                                       //ADD RANCOMISED SHAPES IN ADDITION TO MAIN SHAPE
                rect(elements[i].pos.x,elements[i].pos.y, random(-15,15), random(-15,15));
                line(elements[i].pos.x,elements[i].pos.y,
                  elements[j].pos.x + sin(frameCount),elements[j].pos.y + sin(frameCount));
              } else if (pattern_index_noise == 2) {
                ellipse(elements[i].pos.x,elements[i].pos.y, random(-15,15), random(-15,15));
              } else if (pattern_index_noise == 3) {
                triangle(elements[i].pos.x,elements[i].pos.y, 
                  elements[i].pos.x+random(-15,15),elements[i].pos.y+random(-15,15), 
                  elements[i].pos.x+random(-15,15),elements[i].pos.y+random(-15,15));
              }
          }
      }

  }
}
