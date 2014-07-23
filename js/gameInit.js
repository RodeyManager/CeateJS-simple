var CJS = createjs,
	cw, ch,				//屏幕尺寸
	stage,				//舞台
	bgBlur,				//遮罩层
	bg,					//背景层
	image,				
	startShape, 		//开始按钮
	radiusStep = 10,	//按钮圆角大小
	speed = 1.5, 			//速度
	shipNum = 6,		//默认战斗机数据
	ships = [],			//战斗机数组
	temp = [],
	isOverrider = false,

	startBtnCon,		//开始容器
	startGameTXT,		//开始文本
	loadingField,		//加载进度文本
	loadingBar, 		//加载进度条
	loadingSquer, 		//加载圆

	ship, 				//战斗机
	shipCon,			//找都记容器

	scoeTotal = 0,		//总分
	scoeStep = 100,		//摧毁一个的的份
	scoeTxt,			//得分文本

	startTime,			//开始计时
	endTime,			//介绍记时
	timeSprite,			//计时块
	timeSpriteHeight = 5, //计时块高度

	musicPath = 'music/',
	imagePath = 'images/',
	queue;

window.onload = function(){

	cw = window.innerWidth;
	ch = window.innerHeight;

	//获取画图板
	var canvas = document.getElementById('canvas');
	canvas.width = cw;
	canvas.height = ch;
	//console.log(cw, ch)

	//创建舞台
	stage = new CJS.Stage('canvas');
	CJS.Touch.enable(stage);
	stage.enableMouseOver(10); 
	stage.mouseMoveOutside = true;

	/*//添加背景
	bg = new Image();
	bg.onload = setBackground;
	bg.src = 'images/bg.jpg';

	//加载战斗机
	ship = new Image();
	ship.onload = function(){};
	ship.src = 'images/ship.png';*/

	//--------------------------

	createLoading();
	loadQueues();

	CJS.Ticker.addEventListener('tick', loadTicker);
	CJS.Ticker.setFPS(60);
	CJS.Ticker.timingMode = CJS.Ticker.RAF;

};

function loadTicker(evt){
	if(loadingSquer){
		loadingSquer.scaleX += 0.0001;
		loadingSquer.scaleY += 0.0001;
		loadingSquer.rotation += 10;
		if(loadingSquer.rotation >= 360){
			loadingSquer.rotation = 0;
		}
		loadingSquer.x = queue.progress * cw;
	}
	stage.update();
}

/**
 * 资源加载完成
 * @param  {[type]} evt [description]
 * @return {[type]}     [description]
 */
function loadComplete(evt) {
	console.log("Complete :)");

	CJS.Ticker.removeEventListener('tick', loadTicker);

	loadingBar.scaleX = 1;
	loadingSquer.x = cw + 100;
	var loadMc = stage.getChildByName('_loadMc');
	stage.removeChild(loadMc);
	//设置背景
	bg = queue.getResult('bgImage');
	ship = queue.getResult('shipImage');
	if(bg){
		setTimeout('setBackground()', 300);
	}
}

function fileComplete(evt){}
function handleFileError(evt){}
function handleProgress(evt){
	loadingField.text = 'Loading: ' + (queue.progress * 100 | 0) + '%';
	loadingBar.scaleX = queue.progress;
	loadingSquer.x = queue.progress * cw;
	stage.update();
}

function playSound(name){
    return CJS.Sound.play(name);
}

function stopSound(name){
	return CJS.Sound.stop(name);
}


/**
 * 设置背景
 * @param {[type]} evt [description]
 */
function setBackground(evt){
	var bitmap = new CJS.Bitmap(bg);
	bitmap.width = cw;
	bitmap.height = ch;
	bitmap.x = 0;
	bitmap.y = 0;

	//创建遮罩
	bgBlur = createBlur();

	//创建文本
	startBtnCon = new CJS.Container();
	startGameTXT = createTxt();
	startGameTXT.filters = [new CJS.BlurFilter(20, 20, 10)];
	startBtnCon.addChild(startGameTXT);
	//创建按钮
	startShape = createStartBtn();
	startBtnCon.addChild(startShape);

	stage.addChild(bitmap, bgBlur, startBtnCon);	

	//侦听开始事件
	startShape.addEventListener('click', startGame);
	stage.update();
}

function loadQueues(){
	//加载音乐
	//var item = {src: musicPath + "18-machinae_supremacy-lord_krutors_dominion.ogg", id: "music"};
	var manifest = [
		{id: 'bgMusic', src: musicPath + "18-machinae_supremacy-lord_krutors_dominion.ogg"},
		{id: 'breakMusic', src: musicPath + "Game-Break.ogg"},
		{id: 'startMusic', src: musicPath + "Game-Start.ogg"},
		{id: 'bgImage', src: imagePath + "bg.jpg"},
		{id: 'shipImage', src: imagePath + "ship.png"}
	];
	// Instantiate a queue.
    queue = new CJS.LoadQueue();
	CJS.Sound.alternateExtensions = ["mp3"];
	queue.installPlugin(CJS.Sound);
    queue.addEventListener("complete", loadComplete);
    queue.addEventListener("fileload", fileComplete);
    queue.addEventListener("error",handleFileError);
    queue.addEventListener("progress",handleProgress);
    //queue.loadFile(item, true);
    queue.loadManifest(manifest);
}


//开始游戏
function startGame(evt){
	var target = evt.currentTarget;
	var startShape = target.getChildByName('_startShape');
	var startShapeTxt = target.getChildByName('_startShapeTxt');
	// console.log(startShape);
	
	isOverrider = false;
	scoeTotal = 0;
	speed = 1;
	ships = [];
	temp = [];
	scoeTxt = null;
	
	stage.removeChild(startBtnCon);
	stage.removeChild(bgBlur);
	stage.update();

	//创建分数文本
	scoeTxt = createTxt('总分： ' + scoeTotal, 'bold 1.0em Arial', '#FFFFFF', 0, 30, 'right');
	/*scoeTxt.lineWidth = cw;
	scoeTxt.x = (cw - scoeTxt.lineWidth) * .5;*/
	stage.addChild(scoeTxt);

	createShips(shipNum); 

	startTime = Date.now || new Date().getTime();
	timeSprite = createTimeSprite();
	stage.addChild(timeSprite);

	//播放音效
	var startMusic = playSound('startMusic');
	var bgMusic = playSound('bgMusic');
	bgMusic.setVolume(0.1);
	//console.log(bgMusic.getVolume())
	
	CJS.Ticker.addEventListener("tick", tick);
	CJS.Ticker.setFPS(60);
	CJS.Ticker.timingMode = CJS.Ticker.RAF;

	/*setTimeout(function(){
		CJS.Ticker.removeEventListener('tick', tick);
	}, 8000);*/

	stage.update();
}




/**
 * 开始动画
 * @param  {[type]} evt [description]
 * @return {[type]}     [description]
 */
function tick(evt){
	//加速
	if(scoeTotal > 1000){
		speed += 0.0005;
	}
	if(speed > 2.5) speed = 2.5;

	//控制战斗机移动
	var len = ships.length;
	if(len > 0){
		var i = 0;
		for(; i < len; ++i){

			if(ships[i]){
				if(ships[i].y < -120){
					ships[i].y = ch + Math.random() * 500;
				}
				ships[i].y -= Math.random() + speed;
			}
			stage.update();
		}
		//console.log(ships)
	}
	//时间控制
	var shapeTime = timeSprite.getChildByName('_shapeTime');
	
	if(shapeTime.scaleX <= 0){
		stop();
	}else{
		if(shapeTime.scaleX < 0.3)
			shapeTime.scaleX -= 0.0002;
		else
			shapeTime.scaleX -= 0.0005;
	}

}

/**
 * 停止动画
 * @param  {[type]} evt [description]
 * @return {[type]}     [description]
 */
function stop(evt){
	//移出侦听事件
	CJS.Ticker.removeEventListener('tick', tick);
	startShape.removeEventListener('click', startGame);
	stage.removeChild(shipCon);
	stage.removeChild(scoeTxt);
	stage.removeChild(timeSprite);
	stage.update();

	//移出音效
	stopSound('bgMusic');

	//再来一次
	gameAgain();
	
}

/**
 * 重玩
 * @return {[type]} [description]
 */
function gameAgain(){
	//出现再来一次
	bgBlur = createBlur();
	stage.addChild(bgBlur);

	isOverrider = true;

	//创建文本
	startBtnCon = new CJS.Container();
	startGameTXT = createTxt('您的得分是：' + scoeTotal, 'bold 26px Arial', '#FFFFFF');
	startBtnCon.addChild(startGameTXT);
	//创建按钮
	startShape = createStartBtn();
	startBtnCon.addChild(startShape);

	stage.addChild(bgBlur, startBtnCon);
	//侦听开始事件
	startShape.addEventListener('click', startGame);

	stage.update();
}

/**
 * 摧毁战斗机
 * @param  {[type]} evt [description]
 * @return {[type]}     [description]
 */
function shipPong(evt){
	//console.log(evt.currentTarget)
	var target = evt.currentTarget;
	var index = target.name.match(/\d/)[0];
	shipCon.removeChild(evt.currentTarget);
	var ship = createShip(index);
	resetBitShip(ship);
	ships[index] = ship;
	shipCon.addChild(ship);
	scoeTotal += scoeStep;
	scoeTxt.text = '总分： ' + scoeTotal;
	if(scoeTotal >= 2000){
		scoeTxt.color = '#D76433';
	}else if(scoeTxt >= 5000){
		scoeTxt.color = '#E81741';
	}
	//stage.update();
	var breakMusic = playSound('breakMusic');
}


/**
 * 创建遮罩
 * @return {[type]} [description]
 */
function createBlur(){
	var bgBlur = new CJS.Bitmap(bg);
	bgBlur.filters = [new CJS.BlurFilter(20, 20, 10)];
	bgBlur.cache(0, 0, cw, ch);
	bgBlur.alpha = 0.9;
	bgBlur.width = cw;
	bgBlur.height = ch;
	bgBlur.x = 0;
	bgBlur.y = 0;
	bgBlur.name = '_bgBlur';
	return bgBlur;
}

/**
 * 创建单个战斗机
 * @param  {[type]} index [description]
 * @return {[type]}       [description]
 */
function createShip(index){
	var bitship = new CJS.Bitmap(ship);
	bitship.name = '_bitship_' + index;
	/*bitship.regX = ship.width * .5;
	bitship.regY = ship.height * .5;*/
	//bitship.x = ship.width * .5 + Math.random() * (cw - ship.width * .5);
	resetBitShip(bitship);
	shipCon.addChild(bitship);
	ships.push(bitship);
	bitship.addEventListener('click', shipPong);
	return bitship;
}

/**
 * 创建战斗机组
 * @return {[type]} [description]
 */
function createShips(){
	shipCon = new CJS.Container();
	stage.addChild(shipCon);
	ships = [];
	var i = 0;
	var len = shipNum;

	for(; i < len; ++i){
		createShip(i);
		//bitship.addEventListener('tick', shipMove);
	}
	stage.update();
}

/**
 * 重置战斗机位置
 * @param  {[type]} ship [description]
 * @return {[type]}      [description]
 */
function resetBitShip(ship){
	var w = ship.image.width;
	var h = ship.image.height;
	var x = w * .5 + Math.random() * (cw - w);
	var y = ch + Math.random() * 500;
	//if(x > cw) x = Math.random() * cw / 2 + 20;
	ship.x = x;
	ship.y = y;
	ship.regX = ship.image.width * .5;
	ship.regY = ship.image.height * .5;
	ship.mouseEnabled = true;
}

/**
 * 创建文本
 * @param  {[type]} txt   [文本内容]
 * @param  {[type]} style [样式]
 * @param  {[type]} color [颜色]
 * @param  {[type]} x     [初始水平位置]
 * @param  {[type]} y     [初始垂直位置]
 * @return {[type]}       [description]
 */
function createTxt(txt, style, color, x, y, align){
	var txt = new CJS.Text(txt || "开始游戏", style || "bold 30px Arial", color || "#FFFFFF"); 
	txt.textBaseline = "alphabetic";
	txt.textAlign = align || 'center';
	/*txt.lineWidth = width || 0;
	txt.lineHeight = height || 0;*/
	txt.x = x || ((cw - txt.lineWidth) * .5);
	txt.y = y || (ch - txt.lineHeight) * .5;
	return txt;
}

function createLoading(){
	var loadMc = new CJS.Container();
	loadMc.name = '_loadMc';
	loadingField = new CJS.Text("Loading", "bold 24px Arial", "#FFFFFF");
	loadingField.name = '_loadingField';
	loadingField.maxWidth = cw;
	loadingField.textAlign = "center";
	loadingField.x = cw * .5;
	loadingField.y = ch * .5;

	loadingBar = new CJS.Shape(new CJS.Graphics().beginFill('rgba(255, 255, 255, .8)').drawRect(0, loadingField.y - 20 , cw, 3));
	loadingBar.name = '_loadingBar';
	loadingBar.scaleX = 0;

	loadingSquer = new CJS.Shape(new CJS.Graphics().beginFill('rgba(255, 255, 255, .9)').drawRect(0, 0, 10, 10));
	loadingSquer.name = '_loadingSquer';
	loadingSquer.regX = 5;
	loadingSquer.regY = 5;
	loadingSquer.x = -10;
	loadingSquer.y = ch * .5 - 18;
	loadingSquer.filters = [new CJS.BlurFilter(20, 20, 10)];
	loadMc.addChild(loadingField, loadingBar);
	stage.addChild(loadMc, loadingSquer);
	stage.update();
}

/**
 * 创建开始按钮
 * @return {[type]} [description]
 */
function createStartBtn(){
	var mc = new CJS.Container();
	mc.name = '_mc';
	var startShape = new CJS.Shape();
	var sw = isOverrider ? 150 : 100;
	var sh = 40;
	startShape.graphics.setStrokeStyle(2)
				.beginStroke('rgba(255,255,255,.9)')
				.beginFill("rgba(255,255,255,.6)")
				.drawRoundRectComplex(0, 0, sw, sh, radiusStep, radiusStep, radiusStep, radiusStep)
				.endFill()
				.endStroke();
	startShape.x = (cw - sw) * .5;
	startShape.y = (ch - sh) * .5 + sh;
	startShape.mouseEnabled = true;
	startShape.name = '_startShape';
	//按钮文字
	var txt = isOverrider ? 'Go Again' : 'Go';
	var tw = isOverrider
	var startShapeTxt = new CJS.Text(txt, 'bold 28px Arial', '#333');
	startShapeTxt.lineWidth = sw;
	startShapeTxt.lineHeight = sh;
	startShapeTxt.textAlign = 'center';
	startShapeTxt.textBaseline = 'middle';
	startShapeTxt.x = startShape.x + startShapeTxt.lineWidth / 2; //cw * .5 - (sw / 4);
	startShapeTxt.y = startShape.y + startShapeTxt.lineHeight / 2; //ch * .5 + 25;
	startShapeTxt.name = '_startShapeTxt';
	mc.addChild(startShape, startShapeTxt);
	//console.log(startShapeTxt)
	return mc;
}

/**
 * 创建计时块
 * @return {[type]} [description]
 */
function createTimeSprite(){
	var mc = new CJS.Container();
	mc.x = 0;
	mc.y = 0;
	var shapeBG = new CJS.Shape(new CJS.Graphics().beginFill('rgba(255, 255, 255, .6)').drawRect(0, 0, cw, timeSpriteHeight));
	var shapeTime = new CJS.Shape(new CJS.Graphics().beginFill('rgba(255, 4, 84, .8)').drawRect(0, 0, cw, timeSpriteHeight));
	shapeTime.name = '_shapeTime';
	mc.addChild(shapeBG, shapeTime);
	return mc;
}
