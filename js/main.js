let photosReady = false;
let photosLoaded = 0;
let animationPending = false;

function updatePhotoLoading() {
    const bar = document.getElementById('photo-progress-bar');
    const count = document.getElementById('photo-loading-count');
    const percent = Math.round((photosLoaded / totalUploadedPhotos) * 100);
    if (bar) bar.style.width = `${percent}%`;
    if (count) count.textContent = `照片准备中 ${photosLoaded} / ${totalUploadedPhotos}`;
}

function preloadAllPhotos() {
    const CONCURRENCY = 12;
    const finished = new Array(totalUploadedPhotos + 1).fill(false);
    let done = 0;
    let cursor = 1;
    const finish = (index) => {
        if (index >= 1 && index <= totalUploadedPhotos && !finished[index]) {
            finished[index] = true;
            done++;
            photosLoaded = done;
            updatePhotoLoading();
        }
        if (done >= totalUploadedPhotos) {
            photosReady = true;
            const status = document.getElementById('photo-loading-status');
            if (status) status.textContent = '照片准备完成';
            const screen = document.getElementById('photo-loading-screen');
            if (screen) screen.classList.add('hidden');
            onPhotosReady();
        }
    };
    const loadNext = () => {
        if (cursor > totalUploadedPhotos) return;
        const index = cursor++;
        const image = new Image();
        image.onload = () => {
            if (image.decode) {
                image.decode().catch(() => {}).finally(() => { finish(index); loadNext(); });
            } else {
                finish(index); loadNext();
            }
        };
        image.onerror = () => { finish(index); loadNext(); };
        image.src = `assets/images/${index}.webp`;
    };
    for (let i = 0; i < CONCURRENCY; i++) loadNext();
}

function onPhotosReady() {
    scheduleMessageTimer();
    if (isFirstTime) return; // 首次访问：等用户点进入，再弹信
    startExperience();
}

function startExperience() {
    document.getElementById('main-ui').style.opacity = '1';
    document.getElementById('main-ui').style.pointerEvents = 'none';
    startQuotesCycle();
    if (isFirstTime && !window.forcedLetterShown) {
        window.forcedLetterShown = true;
        animationPending = true;
        showModal('letter-modal'); // 关信后自动播放爱心动画
    } else {
        enterAnimation();
    }
    // 进入后稍候弹出操作提示
    setTimeout(() => {
        if (!messagePlaying && Object.assign(defaultSettings(), loadSettings()).tipsOn) showModal('tips-modal');
    }, 2600);
    // 首次进入：右下角显示双击提示
    setTimeout(() => {
        if (!localStorage.getItem('doubleTapHintShown')) {
            const hint = document.getElementById('double-tap-hint');
            if (hint) hint.style.display = 'block';
        }
    }, 3200);
}

const btnEnter = document.getElementById('btn-enter');
const weatherText = document.getElementById('weather-text');
const welcomeScreen = document.getElementById('welcome-screen');
const mainUI = document.getElementById('main-ui');
let audio = document.getElementById('bgm');
// 进入网站立即开始播放音乐；受浏览器自动播放策略限制，先以静音模式启动，
// 用户第一次触摸屏幕时解除静音，声音无缝接上。
// 移动端浏览器（百度/夸克/Safari 等）几乎都禁止无手势的自动播放，
// 因此改为：用户第一次与页面交互（点击/触摸）时立即开始播放，兼容性最好。
let musicStarted = false;
let messageTimerSet = false;
function scheduleMessageTimer() {
    // 88 秒文字动画必须等「照片就绪 + 音乐已播放」两者都满足才启动，
    // 避免照片还在准备时动画提前播放。
    if (messageTimerSet || !photosReady || !musicStarted) return;
    if (!Object.assign(defaultSettings(), loadSettings()).letterOn) return;
    messageTimerSet = true;
    setTimeout(playMessage, 88000);
}
function startMusic() {
    if (!audio || musicStarted) return;
    if (!photosReady) return; // 照片没加载完，先不播放音乐
    if (!Object.assign(defaultSettings(), loadSettings()).musicOn) return;
    musicStarted = true;
    audio.muted = false;
    const p = audio.play();
    if (p && p.then) {
        p.then(() => { scheduleMessageTimer(); }).catch(() => { musicStarted = false; });
    } else {
        scheduleMessageTimer();
    }
}
audio.preload = 'auto';
['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, startMusic, { passive: true });
});

btnEnter.addEventListener('click', () => {
    welcomeScreen.style.opacity = '0';
    localStorage.setItem('universeVisited_v14', 'true');
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        startMusic();
        if (photosReady) startExperience();
        else {
            const wait = setInterval(() => {
                if (photosReady) { clearInterval(wait); startExperience(); }
            }, 120);
        }
    }, 1000);
});

const startDate = new Date('2026-08-07T00:00:00').getTime();
setInterval(() => {
    const diff = new Date().getTime() - startDate;
    document.getElementById('t-days').innerText = Math.floor(diff / (1000 * 60 * 60 * 24));
    document.getElementById('t-hours').innerText = Math.floor((diff / (1000 * 60 * 60)) % 24);
    document.getElementById('t-mins').innerText = Math.floor((diff / 1000 / 60) % 60);
    document.getElementById('t-secs').innerText = Math.floor((diff / 1000) % 60);
}, 1000);

const hotQuotes = [
    "茉莉雪季的尾调是你浅淡的瞳色",
    "我当然不会怪你的敏感，你怎么样都可爱，是我做得不够好",
    "我想你一直这么天真",
    "我在一万顆星星中找到了你",
    "为你，甘之如饴，不管东南西北",
    "有你的话，我期待每一个明天",
    "谢谢你，被你喜欢和喜欢你都好幸福",
    "如果我的存在能让你开心，那我便一直在",
    "因为你，我第一次想成为更好的人",
    "世界送我的第二个太阳",
    "她说她一直都很坏，可是我爱她，她真的好可爱",
    "直到有一天，我的实况出现你的声音",
    "今年冬天格外冷，庆幸你比冬天先来",
    "许你一生無憂，願你一生平安"
];

let quoteIndex = 0;
const quotesBox = document.getElementById('quotes-box');

function startQuotesCycle() {
    quotesBox.innerText = hotQuotes[quoteIndex];
    setInterval(() => {
        quotesBox.classList.add('quotes-fade-out');
        quotesBox.classList.remove('quotes-fade-in');
        setTimeout(() => {
            quoteIndex = (quoteIndex + 1) % hotQuotes.length;
            quotesBox.innerText = hotQuotes[quoteIndex];
            quotesBox.classList.remove('quotes-fade-out');
            quotesBox.classList.add('quotes-fade-in');
        }, 800); 
    }, 6000); 
}

function showModal(id) { 
    const modal = document.getElementById(id);
    modal.style.display = 'block'; 
    modal.classList.remove('fade-out');
    void modal.offsetWidth;
    modal.classList.add('fade-in');
    if(id === 'letter-modal') startTypewriter();
}

function hideModal(id) { 
    const modal = document.getElementById(id);
    modal.classList.remove('fade-in');
    modal.classList.add('fade-out');
    setTimeout(() => {
        if(modal.classList.contains('fade-out')) {
            modal.style.display = 'none';
        }
        if (id === 'letter-modal' && animationPending) {
            animationPending = false;
            requestAnimationFrame(enterAnimation);
        }
    }, 300); 
}

const letterText = "谢谢你来爱一个这么糟糕的我。\n\n我的情绪像天气总是飘忽不定，往往最伤人的话都对着你说。其实我也知道自己这么子做会让你我渐行渐远，但我还是会有点小任性。有时候我的一些小脾气，只是想让你在意我，更喜欢我。\n\n我知道自己很糟糕，脾气很奇怪也没有那么好看，你总说拥有我很幸福，其实是我有你好幸运。\n\n好幸运遇到了一个这么好的你。你总是很厉害，可以注意到我的坏情绪，老是想尽办法逗我开心。有的时候明明很不开心，你和我说话的时候，我就把烦恼抛之脑后了。谢谢你给了我足够的安全感，有你真的好幸福……\n\n生活是乱糟糟的，有你一切都都很安稳。我喜欢安稳的生活，爱吃的东西我会吃一辈子，喜欢听的歌我也会执着的听上千万遍。\n\n你也一样，我一旦依赖上一个人就再也不会放手啦。我要和你一辈子。";

let typeIndex = 0;
let typewriterTimer = null;
function startTypewriter() {
    const box = document.getElementById('typewriter-content');
    if (!box) return;
    clearInterval(typewriterTimer);
    typeIndex = 0;
    box.classList.remove('done');
    box.textContent = '';
    const letterBody = document.querySelector('#letter-modal .letter-bg');
    typewriterTimer = setInterval(() => {
        typeIndex += 1;
        box.textContent = letterText.slice(0, typeIndex);
        if (letterBody) letterBody.scrollTop = letterBody.scrollHeight;
        if (typeIndex >= letterText.length) {
            clearInterval(typewriterTimer);
            typewriterTimer = null;
            box.classList.add('done');
        }
    }, 45);
}

let camera, sceneWebGL, sceneCSS, rendererWebGL, rendererCSS;
let controls;
const objects = [];
const targets = { heart: [], tree: [], ferris: [], galaxy: [], rose: [], firework: [], infinity: [], vortex: [], message: [] };

let appConfig = null;
appConfig = Object.assign(defaultSettings(), loadSettings());

// 关键修改点：设定为 120 张
const photoCount = (appConfig && appConfig.photoCountCfg) ? appConfig.photoCountCfg : 120; 
const totalUploadedPhotos = 120; 

let particles;
let trunkBasePos, trunkTargetPos, trunkPoints, trunkTargetCol;
let ferrisBasePos, ferrisTargetPos, ferrisPoints, ferrisTargetCol;
const isFirstTime = !localStorage.getItem('universeVisited_v14');
const SHAPE_NAMES = [ 'heart', 'tree', 'ferris', 'galaxy', 'rose', 'firework', 'infinity', 'vortex' ];
let messagePlaying = false;
let tapCount = 0;
let tapTimer = null;
let tourPlaying = false;
let tourTimer = null;
let moveTimer = null;
let letterTextEl = null;
let letterInnerEl = null;
let letterObj = null;
let letterOverlay = null;
let namePoints = null;
let nameTimer = null;
let nameVisible = false;
const MESSAGE_TEXT = [
  '其实我不太会表达自己，也是一个特别怕麻烦的人。可是你的出现让我觉得我也是生动的人。谢谢你给了我一个很好的温度，让我感受到了爱和温暖。想起你，我就觉得有了依靠，做事情都多了一份底气。难怪大家都说，被爱好似有靠山。',
  '其实，我真的远比你想象中更需要你，更在意你。谢谢你总能照顾到我的情绪，在意我说过的话。相处这么久也让我很开心，因为有你在。谢谢你靠近我、温暖我、了解我、陪伴我。',
  '可是你要信我好不好？没有遇到你之前，我的人际交往就是固定的，我也习惯了那种半温半度。所以当你出现在我身边时，我特别不自然。我很怕你介意我的过去，很怕我会影响你。不过我希望我们能好好聊聊。我知道你特别介意我的过去，介意我和别人还有染指，但不要这么想，我的世界现在只有你了(⋟﹏⋞)。',
  '我们把问题好好说，是问题解决我们，好嘛？敏感没有关系的，我也这样。你不要自己不说，行不行？这个样子我们情感是有扣分的，我不希望这个样子。我希望我们好好的，一直天天开心，不是吗？'
];
let currentShapeIndex = 0;
let shapeBusy = false;

init();
preloadAllPhotos();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 2800; 
    
    sceneWebGL = new THREE.Scene();
    const particleCount = 2800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount*3; i++) {
        positions[i] = (Math.random() - 0.5) * 5000;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 182, 193, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const pMaterial = new THREE.PointsMaterial({
        size: 45, 
        map: texture,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    particles = new THREE.Points(geometry, pMaterial);
    sceneWebGL.add(particles);

    // 树干与树顶星粒子（切换圣诞树时汇聚成形，心形时散回星空）
    const trunkCount = 2100;
    trunkBasePos = new Float32Array(trunkCount * 3);
    trunkTargetPos = new Float32Array(trunkCount * 3);
    trunkTargetCol = new Float32Array(trunkCount * 3);
    let ti = 0;
    const putTrunkParticle = (x, y, z, r, g, b) => {
        trunkBasePos[ti*3] = (Math.random() - .5) * 5000;
        trunkBasePos[ti*3+1] = (Math.random() - .5) * 5000;
        trunkBasePos[ti*3+2] = (Math.random() - .5) * 5000;
        trunkTargetPos[ti*3] = x;
        trunkTargetPos[ti*3+1] = y;
        trunkTargetPos[ti*3+2] = z;
        trunkTargetCol[ti*3] = r; trunkTargetCol[ti*3+1] = g; trunkTargetCol[ti*3+2] = b;
        ti++;
    };
    // 树干：明显的高亮棕色柱体
    for (let k = 0; k < 800; k++) {
        const a = Math.random() * Math.PI * 2;
        const r = 55 + Math.random() * 95;
        putTrunkParticle(Math.cos(a)*r, -1600 + Math.random()*1250, Math.sin(a)*r, .92, .68, .45);
    }
    // 树枝：从树干伸向每张照片（照片挂在枝头）
    for (let i = 0; i < 120; i++) {
        const t = i / 120;
        const angle = i * 2.39996;
        const r = 880 * (1 - t) + 130;
        const y = -380 + t * 1150;
        for (let s = 0; s < 10; s++) {
            const f = s / 9;
            const bx = Math.cos(angle) * (110 + (r - 110) * f);
            const by = (y - 40) + 40 * f;
            const bz = Math.sin(angle) * (110 + (r - 110) * f);
            putTrunkParticle(bx + (Math.random()-.5)*12, by + (Math.random()-.5)*12, bz + (Math.random()-.5)*12, .85, .6, .42);
        }
    }
    // 树顶星：金色光晕
    for (let k = 0; k < 100; k++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 140;
        putTrunkParticle(Math.cos(a)*r, 900 + Math.random()*150, Math.sin(a)*r, 1, .85, .4);
    }
    const trunkGeo = new THREE.BufferGeometry();
    const trunkInit = new Float32Array(trunkBasePos);
    trunkGeo.setAttribute('position', new THREE.BufferAttribute(trunkInit, 3));
    const trunkColInit = new Float32Array(trunkCount * 3);
    for (let i = 0; i < trunkCount * 3; i++) trunkColInit[i] = 1;
    trunkGeo.setAttribute('color', new THREE.BufferAttribute(trunkColInit, 3));
    trunkPoints = new THREE.Points(trunkGeo, new THREE.PointsMaterial({
        size: 55, map: texture, vertexColors: true, transparent: true, opacity: .95,
        blending: THREE.AdditiveBlending, depthWrite: false }));
    sceneWebGL.add(trunkPoints);

    // 摩天轮骨架粒子：轮毂 + 轮辐 + 外圈圆环（XY 平面，绕 Z 轴滚动）
    const ferrisCount = 720;
    ferrisBasePos = new Float32Array(ferrisCount * 3);
    ferrisTargetPos = new Float32Array(ferrisCount * 3);
    ferrisTargetCol = new Float32Array(ferrisCount * 3);
    let fi = 0;
    const putFerris = (x, y, z, r, g, b) => {
        ferrisBasePos[fi*3] = (Math.random() - .5) * 5000;
        ferrisBasePos[fi*3+1] = (Math.random() - .5) * 5000;
        ferrisBasePos[fi*3+2] = (Math.random() - .5) * 5000;
        ferrisTargetPos[fi*3] = x;
        ferrisTargetPos[fi*3+1] = y;
        ferrisTargetPos[fi*3+2] = z;
        ferrisTargetCol[fi*3] = r; ferrisTargetCol[fi*3+1] = g; ferrisTargetCol[fi*3+2] = b;
        fi++;
    };
    // 轮毂（更亮更密）
    for (let k = 0; k < 80; k++) {
        const a = Math.random() * Math.PI * 2;
        const rr = Math.random() * 130;
        putFerris(Math.cos(a)*rr, Math.sin(a)*rr, (Math.random()-.5)*20, 1, .97, .75);
    }
    // 轮辐：12 条从轮毂伸向外圈（更密）
    for (let spoke = 0; spoke < 12; spoke++) {
        const a = spoke * (Math.PI * 2 / 12);
        for (let s = 0; s < 20; s++) {
            const rr = 130 + s * 41;
            putFerris(Math.cos(a)*rr, Math.sin(a)*rr, (Math.random()-.5)*16, 1, .92, .68);
        }
    }
    // 外圈圆环（更亮更密）
    for (let k = 0; k < 400; k++) {
        const a = Math.random() * Math.PI * 2;
        putFerris(Math.cos(a)*950, Math.sin(a)*950, (Math.random()-.5)*22, 1, 1, .88);
    }
    const ferrisGeo = new THREE.BufferGeometry();
    const ferrisInit = new Float32Array(ferrisBasePos);
    ferrisGeo.setAttribute('position', new THREE.BufferAttribute(ferrisInit, 3));
    const ferrisColInit = new Float32Array(ferrisCount * 3);
    for (let i = 0; i < ferrisCount * 3; i++) ferrisColInit[i] = 1;
    ferrisGeo.setAttribute('color', new THREE.BufferAttribute(ferrisColInit, 3));
    ferrisPoints = new THREE.Points(ferrisGeo, new THREE.PointsMaterial({
        size: 62, map: texture, vertexColors: true, transparent: true, opacity: 1,
        blending: THREE.AdditiveBlending, depthWrite: false }));
    sceneWebGL.add(ferrisPoints);

    // 名字粒子（andy ♥ 陶陶 特写）
    const nameCount = 8000;
    const nameGeo = new THREE.BufferGeometry();
    const namePos = new Float32Array(nameCount * 3);
    for (let i = 0; i < nameCount; i++) {
        namePos[i*3] = (Math.random() - .5) * 6000;
        namePos[i*3+1] = (Math.random() - .5) * 5000;
        namePos[i*3+2] = (Math.random() - .5) * 4000;
    }
    nameGeo.setAttribute('position', new THREE.BufferAttribute(namePos, 3));
    namePoints = new THREE.Points(nameGeo, new THREE.PointsMaterial({
        size: 2, map: texture, transparent: true, opacity: 1,
        blending: THREE.AdditiveBlending, depthWrite: false }));
    const nameGroup = new THREE.Group();
    nameGroup.position.set(0, 920, 0);
    nameGroup.scale.set(1.5, 1.5, 1.5);
    nameGroup.add(namePoints);
    sceneWebGL.add(nameGroup);

    rendererWebGL = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    rendererWebGL.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererWebGL.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('webgl-container').appendChild( rendererWebGL.domElement );

    sceneCSS = new THREE.Scene();

    // 文字（CSS3D，直接显示在空白区）
    letterTextEl = document.createElement('div');
    letterTextEl.style.cssText = 'width:680px;height:920px;display:flex;align-items:center;justify-content:center;';
    letterInnerEl = document.createElement('div');
    letterInnerEl.style.cssText = 'width:100%;height:auto;color:#fff;font:19px/2.2 "ZCOOL KuaiLe","PingFang SC",sans-serif;text-align:left;letter-spacing:1px;white-space:pre-wrap;overflow-wrap:break-word;text-shadow:0 0 8px rgba(255,255,255,.5);transition:opacity .5s ease,transform .5s ease;';
    letterTextEl.appendChild(letterInnerEl);
    letterObj = new THREE.CSS3DObject(letterTextEl);
    letterObj.position.set(0, 0, -7800);
    letterObj.rotation.y = Math.PI;
    letterObj.visible = false;
    sceneCSS.add(letterObj);


    for ( let i = 0; i < photoCount; i ++ ) {
        const element = document.createElement( 'div' );
        element.className = 'element';
        
        let imgIndex = (i % totalUploadedPhotos) + 1;
        element.style.backgroundImage = `url('assets/images/${imgIndex}.webp')`;
        
        let pointerDownPos = { x: 0, y: 0 };
        element.addEventListener('pointerdown', (e) => {
            pointerDownPos = { x: e.clientX, y: e.clientY };
        });
        element.addEventListener('pointerup', (e) => {
            const dx = Math.abs(e.clientX - pointerDownPos.x);
            const dy = Math.abs(e.clientY - pointerDownPos.y);
            if (dx < 5 && dy < 5) {
                if (suppressPhotoClick) return;
                if (!Object.assign(defaultSettings(), loadSettings()).photoZoomOn) return;
                document.getElementById('enlarged-photo').src = `assets/images/${imgIndex}.webp`;
                showModal('photo-modal');
            }
        });

        const objectCSS = new THREE.CSS3DObject( element );
        objectCSS.position.x = 6000;
        objectCSS.position.y = 0;
        objectCSS.position.z = 0;
        sceneCSS.add( objectCSS );
        objects.push( objectCSS );
    }

    const scale = 45 * ((appConfig && appConfig.heartScale) ? appConfig.heartScale : 1); 
    for ( let i = 0; i < objects.length; i ++ ) {
        let t = (i / objects.length) * Math.PI * 2;
        let x = 16 * Math.pow(Math.sin(t), 3) * scale;
        let y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * scale;
        
        const object = new THREE.Object3D();
        object.position.x = x;
        object.position.y = y + 150;
        object.position.z = (Math.random() - 0.5) * 400; 
        targets.heart.push( object );
    }

    // 圣诞树：照片沿螺旋线一张一张挂在枝头，面向外侧
    for ( let i = 0; i < objects.length; i ++ ) {
        const t = i / objects.length;
        const angle = i * 2.39996;
        const r = 880 * (1 - t) + 130;
        const y = -380 + t * 1150;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( angle ) * r, y, Math.sin( angle ) * r );
        object.lookAt( 0, y, 0 );
        targets.tree.push( object );
    }

    // 摩天轮：照片车仓沿垂直大圆环，面向圆心
    for ( let i = 0; i < objects.length; i ++ ) {
        const a = ( i / objects.length ) * Math.PI * 2;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( a ) * 950, Math.sin( a ) * 950, 0 );
        object.lookAt( 0, 0, 0 );
        targets.ferris.push( object );
    }

    // 小作文：照片围一圈、打散，并正对 88 秒后的镜头（z = -9600）
    for ( let i = 0; i < objects.length; i ++ ) {
        const a = ( i / objects.length ) * Math.PI * 2;
        const r = 1000 + ( Math.random() - .5 ) * 400;
        const object = new THREE.Object3D();
        object.position.set(
            Math.cos( a ) * r,
            Math.sin( a ) * r + ( Math.random() - .5 ) * 280,
            ( Math.random() - .5 ) * 320
        );
        object.lookAt( Math.cos( a ) * 3000, Math.sin( a ) * 3000, 0 );
        targets.message.push( object );
    }

    // 玫瑰：五叶玫瑰曲线，照片沿花瓣
    for ( let i = 0; i < objects.length; i ++ ) {
        const theta = ( i / objects.length ) * Math.PI * 2;
        const rr = 820 * Math.abs( Math.cos( 5 * theta ) ) + 40;
        const object = new THREE.Object3D();
        object.position.set( rr * Math.cos( theta ), rr * Math.sin( theta ), ( Math.random() - .5 ) * 130 );
        object.lookAt( 0, 0, 0 );
        targets.rose.push( object );
    }

    // 烟花：十五条射线向外放射
    for ( let i = 0; i < objects.length; i ++ ) {
        const ray = i % 15;
        const idx = Math.floor( i / 15 );
        const a = ray * ( Math.PI * 2 / 15 );
        const r = 160 + idx * 95;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( a ) * r, Math.sin( a ) * r, ( Math.random() - .5 ) * 170 );
        object.lookAt( 0, 0, 0 );
        targets.firework.push( object );
    }

    // 银河：两条旋臂向外旋转展开
    for ( let i = 0; i < objects.length; i ++ ) {
        const arm = i % 2;
        const idx = Math.floor( i / 2 );
        const r = 200 + idx * 20;
        const a = idx * 0.22 + arm * Math.PI;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( a ) * r, ( Math.random() - .5 ) * 130, Math.sin( a ) * r );
        object.lookAt( 0, 0, 0 );
        targets.galaxy.push( object );
    }

    // 无限符号：伯努利双纽线
    for ( let i = 0; i < objects.length; i ++ ) {
        const t = ( i / objects.length ) * Math.PI * 2 - Math.PI;
        const denom = 1 + Math.sin( t ) * Math.sin( t );
        const object = new THREE.Object3D();
        object.position.set( 820 * Math.cos( t ) / denom, 820 * Math.sin( t ) * Math.cos( t ) / denom, ( Math.random() - .5 ) * 150 );
        targets.infinity.push( object );
    }

    // 漩涡：漏斗状螺旋向下收拢
    for ( let i = 0; i < objects.length; i ++ ) {
        const t = i / objects.length;
        const angle = i * 0.5;
        const r = 1000 * (1 - t) + 80;
        const y = 780 * (1 - t) - 360;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( angle ) * r, y, Math.sin( angle ) * r );
        object.lookAt( 0, y, 0 );
        targets.vortex.push( object );
    }

    rendererCSS = new THREE.CSS3DRenderer();
    rendererCSS.setSize( window.innerWidth, window.innerHeight );
    rendererCSS.domElement.style.position = 'absolute';
    rendererCSS.domElement.style.top = 0;
    document.getElementById( 'css-container' ).appendChild( rendererCSS.domElement );

    controls = new THREE.OrbitControls( camera, rendererCSS.domElement );
    controls.minDistance = 500;
    controls.maxDistance = 8000;
    controls.enablePan = true; 
    controls.enableZoom = true; 
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    window.addEventListener( 'resize', onWindowResize );

}

function enterAnimation() {
    TWEEN.removeAll();
    const flyDuration = 1000;
    
    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const targetHeart = targets.heart[i];
        
        obj.position.set(4000 + Math.random() * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
        obj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        const randomX = (Math.random() - 0.5) * 1500;
        const randomY = (Math.random() - 0.5) * 1500;
        const randomZ = (Math.random() - 0.5) * 1500;

        const delay1 = i * 20; 

        const tweenPos1 = new TWEEN.Tween(obj.position)
            .to({ x: randomX, y: randomY, z: randomZ }, flyDuration)
            .easing(TWEEN.Easing.Cubic.Out)
            .delay(delay1);

        const tweenRot1 = new TWEEN.Tween(obj.rotation)
            .to({ x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: 0 }, flyDuration)
            .delay(delay1);

        const delay2 = 3200 + Math.random() * 800; 

        const tweenPos2 = new TWEEN.Tween(obj.position)
            .to({ x: targetHeart.position.x, y: targetHeart.position.y, z: targetHeart.position.z }, 2000)
            .easing(TWEEN.Easing.Exponential.InOut)
            .delay(delay2);

        const tweenRot2 = new TWEEN.Tween(obj.rotation)
            .to({ x: targetHeart.rotation.x, y: targetHeart.rotation.y, z: targetHeart.rotation.z }, 2000)
            .easing(TWEEN.Easing.Exponential.InOut)
            .delay(delay2);

        tweenPos1.start();
        tweenRot1.start();
        tweenPos2.start();
        tweenRot2.start();
    }
    new TWEEN.Tween(this).to({}, 6000).onUpdate(render).start();
}

let trunkState = 0;
let ferrisState = 0;
function animateTrunk(toTree) {
    const target = toTree ? 1 : 0;
    if (trunkState === target) return;   // 状态未变化，不重复动画
    trunkState = target;
    const geo = trunkPoints.geometry;
    const posAttr = geo.attributes.position;
    const colAttr = geo.attributes.color;
    const state = { p: target === 1 ? 0 : 1 };
    new TWEEN.Tween(state)
        .to({ p: target }, 1700)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
            const p = state.p;
            for (let i = 0; i < trunkBasePos.length; i++) {
                posAttr.array[i] = trunkBasePos[i] * (1 - p) + trunkTargetPos[i] * p;
            }
            posAttr.needsUpdate = true;
            for (let i = 0; i < trunkTargetCol.length; i++) {
                // 目标色（树干暖白 / 树顶金）与白色之间过渡
                colAttr.array[i] = 1 - (1 - trunkTargetCol[i]) * p;
            }
            colAttr.needsUpdate = true;
        })
        .start();
}
function animateFerris(toFerris) {
    const target = toFerris ? 1 : 0;
    if (ferrisState === target) return;
    ferrisState = target;
    const geo = ferrisPoints.geometry;
    const posAttr = geo.attributes.position;
    const colAttr = geo.attributes.color;
    const state = { p: target === 1 ? 0 : 1 };
    new TWEEN.Tween(state)
        .to({ p: target }, 1600)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
            const p = state.p;
            for (let i = 0; i < ferrisBasePos.length; i++) {
                posAttr.array[i] = ferrisBasePos[i] * (1 - p) + ferrisTargetPos[i] * p;
            }
            posAttr.needsUpdate = true;
            for (let i = 0; i < ferrisTargetCol.length; i++) {
                colAttr.array[i] = 1 - (1 - ferrisTargetCol[i]) * p;
            }
            colAttr.needsUpdate = true;
        })
        .start();
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function moveCameraToText() {
    return new Promise(res => {
        const sx = camera.position.x, sy = camera.position.y, sz = camera.position.z;
        const tx = controls.target.x, ty = controls.target.y, tz = controls.target.z;
        const t0 = performance.now();
        const dur = 1800;
        const timer = setInterval(() => {
            const p = Math.min(1, (performance.now() - t0) / dur);
            const e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;
            camera.position.set(sx + (0 - sx) * e, sy + (0 - sy) * e, sz + (-9600 - sz) * e);
            controls.target.set(tx + (0 - tx) * e, ty + (0 - ty) * e, tz + (0 - tz) * e);
            camera.lookAt(controls.target);
            if (p >= 1) { clearInterval(timer); camera.lookAt(controls.target); res(); }
        }, 16);
    });
}
function sampleNameText(text, offsetX) {
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 400, 200);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 90px "Caveat","Kaiti SC","KaiTi","楷体","STKaiti",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 200, 100);
    const data = ctx.getImageData(0, 0, 400, 200).data;
    const pts = [];
    for (let y = 0; y < 200; y += 3) for (let x = 0; x < 400; x += 3) {
        const i = (y * 400 + x) * 4;
        if (data[i] > 150 && data[i+1] > 150 && data[i+2] > 150) {
            pts.push((x / 400 - .5) * 560 + offsetX + (Math.random() - .5) * 12,
                     (.5 - y / 200) * 380 + (Math.random() - .5) * 12,
                     (Math.random() - .5) * 8);
        }
    }
    return pts;
}
function buildNameParticles() {
    const pts = [];
    // 只有两个名字：左侧 "andy" + 右侧 "陶陶"
    pts.push(...sampleNameText('andy', -340));
    pts.push(...sampleNameText('陶陶', 340));
    return pts;
}
function nameScatter() {
    const arr = [];
    for (let i = 0; i < 8000; i++) {
        const a = Math.random() * Math.PI * 2;
        const b = Math.acos(2 * Math.random() - 1);
        const r = 2600 + Math.random() * 3400;
        arr.push(r*Math.sin(b)*Math.cos(a), r*Math.sin(b)*Math.sin(a), r*Math.cos(b));
    }
    return arr;
}
function showName() {
    nameVisible = true;
    const targets = buildNameParticles();
    const n3 = targets.length;
    const posAttr = namePoints.geometry.attributes.position;
    const scatter = nameScatter();
    const t0 = performance.now();
    const dur = 1500;
    if (nameTimer) clearInterval(nameTimer);
    nameTimer = setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / dur);
        const e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;
        for (let i = 0; i < 8000; i++) {
            const k = i*3;
            if (k < n3) {
                posAttr.array[k] = scatter[k]*(1-e) + targets[k]*e;
                posAttr.array[k+1] = scatter[k+1]*(1-e) + targets[k+1]*e;
                posAttr.array[k+2] = scatter[k+2]*(1-e) + targets[k+2]*e;
            } else {
                posAttr.array[k] *= .96;
                posAttr.array[k+1] *= .96;
                posAttr.array[k+2] *= .96;
            }
        }
        posAttr.needsUpdate = true;
        if (p >= 1) { clearInterval(nameTimer); nameTimer = null; }
    }, 16);
}
function showNamePermanently() {
    // 名字粒子汇聚后常显，不再散开
    showName();
}
function scatterName() {
    nameVisible = false;
    if (nameTimer) clearInterval(nameTimer);
    const posAttr = namePoints.geometry.attributes.position;
    const scatter = nameScatter();
    const from = posAttr.array.slice();
    const t0 = performance.now();
    const dur = 800;
    nameTimer = setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / dur);
        const e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;
        for (let i = 0; i < 8000; i++) {
            const k = i*3;
            posAttr.array[k] = from[k]*(1-e) + scatter[k]*e;
            posAttr.array[k+1] = from[k+1]*(1-e) + scatter[k+1]*e;
            posAttr.array[k+2] = from[k+2]*(1-e) + scatter[k+2]*e;
        }
        posAttr.needsUpdate = true;
        if (p >= 1) { clearInterval(nameTimer); nameTimer = null; }
    }, 16);
}
async function typeMessage(text) {
    if (!letterOverlay) letterOverlay = document.getElementById('letter-overlay');
    letterOverlay.textContent = '';
    for (let i = 0; i < text.length; i++) {
        letterOverlay.textContent = text.slice(0, i + 1);
        await wait(42);
    }
}
function fadeMessageUp() {
    return new Promise(res => {
        if (!letterOverlay) letterOverlay = document.getElementById('letter-overlay');
        letterOverlay.style.opacity = '0';
        setTimeout(res, 500);
    });
}
async function playMessage() {
    // 优先级最高：终止一切进行中的操作
    if (tourPlaying) {
        if (tourTimer) clearInterval(tourTimer);
        if (moveTimer) clearInterval(moveTimer);
        tourTimer = null;
        moveTimer = null;
        tourPlaying = false;
        controls.enabled = true;
        controls.autoRotate = true;
    }
    shapeBusy = false;
    TWEEN.removeAll();
    hideModal('photo-modal');
    hideModal('letter-modal');
    hideModal('tips-modal');
    messagePlaying = true;
    const prevAutoRotate = controls.autoRotate;
    const prevEnabled = controls.enabled;
    const prevShape = currentShapeIndex;
    controls.autoRotate = false;
    controls.enabled = false;
    if (!letterOverlay) letterOverlay = document.getElementById('letter-overlay');
    letterOverlay.style.display = 'block';
    letterOverlay.style.opacity = '1';
    transform(targets.message, 1800);
    animateTrunk(false); animateFerris(false);
    await wait(1900);
    // 文字期间：电影级运镜——远景推近 → 围绕照片圈正面转一整圈 → 侧景 → 拉远俯瞰
    const msgTourT0 = performance.now();
    const msgTour = setInterval(() => {
        const p = ((performance.now() - msgTourT0) / 24000) % 1;
        let x, y, z;
        if (p < 0.12) {
            // 远景正面，缓缓推近
            const q = p / 0.12;
            z = 4200 - q * 1000;
            x = 0; y = 0;
        } else if (p < 0.52) {
            // 围绕照片圈正面转一整圈（绕 Y 轴），准心锁定圆心
            const q = (p - 0.12) / 0.4;
            const ang = q * Math.PI * 2;
            const r = 3200;
            x = Math.sin(ang) * r;
            y = Math.sin(q * Math.PI * 2) * 250;
            z = Math.cos(ang) * r;
        } else if (p < 0.72) {
            // 侧景：拉近侧面，展示照片排列的纵深
            const q = (p - 0.52) / 0.2;
            const r = 3200 - q * 900;
            x = r;
            y = Math.sin(q * Math.PI) * 220;
            z = Math.cos(q * Math.PI) * 320;
        } else if (p < 0.9) {
            // 拉远 + 斜上方俯瞰（远景收尾）
            const q = (p - 0.72) / 0.18;
            const r = 2300 + q * 1500;
            const ang = q * Math.PI * 0.5;
            x = Math.sin(ang) * r;
            y = 500 + q * 900;
            z = Math.cos(ang) * r;
        } else {
            // 回归正面，轻微呼吸
            const q = (p - 0.9) / 0.1;
            const r = 3800 + Math.sin(q * Math.PI) * 150;
            x = Math.sin(q * Math.PI) * 250;
            y = Math.sin(q * Math.PI * 2) * 200;
            z = r;
        }
        camera.position.set(x, y, z);
        controls.target.set(0, 0, 0);
        camera.lookAt(controls.target);
    }, 16);
    for (let i = 0; i < MESSAGE_TEXT.length; i++) {
        letterOverlay.textContent = '';
        letterOverlay.style.opacity = '1';   // 淡入（CSS transition）
        await typeMessage(MESSAGE_TEXT[i]);
        await wait(5200);
        if (i < MESSAGE_TEXT.length - 1) {
            await fadeMessageUp();            // 淡出
            letterOverlay.textContent = '';   // 淡出后清空，避免闪现旧字
            await wait(300);
        }
    }
    clearInterval(msgTour);
    if (nameTimer) clearInterval(nameTimer);
    scatterName();
    const blackout = document.getElementById('blackout');
    if (blackout) blackout.classList.add('show');
    await wait(650);
    if (!letterOverlay) letterOverlay = document.getElementById('letter-overlay');
    letterOverlay.style.display = 'none';
    await wait(400);
    const restoreName = SHAPE_NAMES[prevShape];
    transform(targets[restoreName], 1600);
    // 强制重设树干/摩天轮粒子，避免残留
    trunkState = restoreName === 'tree' ? 0 : 1;
    animateTrunk(restoreName === 'tree');
    ferrisState = restoreName === 'ferris' ? 0 : 1;
    animateFerris(restoreName === 'ferris');
    if (blackout) blackout.classList.remove('show');
    controls.autoRotate = prevAutoRotate;
    controls.enabled = prevEnabled;
    camera.position.set(0, 0, 2800);
    controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
    letterObj.rotation.y = 0;
    controls.update();
    messagePlaying = false;
}
function moveCameraSmooth(targetPos, targetTgt, duration) {
    return new Promise(res => {
        const sx = camera.position.x, sy = camera.position.y, sz = camera.position.z;
        const tx = controls.target.x, ty = controls.target.y, tz = controls.target.z;
        const t0 = performance.now();
        const timer = setInterval(() => {
            const p = Math.min(1, (performance.now() - t0) / duration);
            const c1 = 1.70158, c2 = c1 * 1.525;
            const e = p < 0.5
                ? (Math.pow(2*p, 2) * ((c2+1)*2*p - c2)) / 2
                : (Math.pow(2*p-2, 2) * ((c2+1)*(p*2-2) + c2) + 2) / 2;
            camera.position.set(sx + (targetPos.x - sx)*e, sy + (targetPos.y - sy)*e, sz + (targetPos.z - sz)*e);
            controls.target.set(tx + (targetTgt.x - tx)*e, ty + (targetTgt.y - ty)*e, tz + (targetTgt.z - tz)*e);
            camera.lookAt(controls.target);
            if (p >= 1) { clearInterval(timer); moveTimer = null; res(); }
        }, 16);
        moveTimer = timer;
    });
}
function cameraTour() {
    if (tourPlaying || messagePlaying) return;
    tourPlaying = true;
    const prevAutoRotate = controls.autoRotate;
    const prevEnabled = controls.enabled;
    const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const startTgt = { x: controls.target.x, y: controls.target.y, z: controls.target.z };
    controls.autoRotate = false;
    controls.enabled = false;
    const name = SHAPE_NAMES[currentShapeIndex];
    const t0 = performance.now();
    const duration = ((appConfig && appConfig.tourDuration) ? appConfig.tourDuration : 10) * 1000;
    const timer = setInterval(() => {
        // 88 秒文字动画优先：一旦触发立即停止运镜
        if (messagePlaying) {
            clearInterval(timer);
            tourTimer = null;
            tourPlaying = false;
            controls.autoRotate = prevAutoRotate;
            controls.enabled = prevEnabled;
            return;
        }
        const raw = Math.min(1, (performance.now() - t0) / duration);
        const p = raw < 0.5 ? 4*raw*raw*raw : 1 - Math.pow(-2*raw+2, 3)/2;
        const t = p * Math.PI * 2;
        if (name === 'tree') {
            // 圣诞树：从树顶螺旋下降到树底
            const y = 950 - p * 1900;
            const ang = p * Math.PI * 2.5;
            camera.position.set(Math.cos(ang)*1650, y, Math.sin(ang)*1650);
            controls.target.set(0, y * 0.6, 0);
        } else if (name === 'heart') {
            // 爱心：镜头沿轮廓临摹，准心逐个指向爱心上的照片
            const x = 16 * Math.pow(Math.sin(t), 3) * 58;
            const y = (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) * 58;
            const x45 = 16 * Math.pow(Math.sin(t), 3) * 45;
            const y45 = (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) * 45;
            camera.position.set(x, y + 150, 620);
            controls.target.set(x45, y45 + 150, 0);
        } else {
            // 其他形状：电影级环绕 + 俯仰呼吸，准心跟随形状
            const distMul = (appConfig && appConfig.tourDistance) ? appConfig.tourDistance : 1;
            camera.position.set(Math.cos(t)*2050*distMul, 180 + Math.sin(t*2.5)*340*distMul, Math.sin(t)*2050*distMul);
            controls.target.set(Math.cos(t)*700, Math.sin(t)*700, 0);
        }
        camera.lookAt(controls.target);
        if (p >= 1) {
            clearInterval(timer);
            tourTimer = null;
            // 平滑回到原位
            moveCameraSmooth(startPos, startTgt, 1800).then(() => {
                controls.autoRotate = prevAutoRotate;
                controls.enabled = prevEnabled;
                tourPlaying = false;
            });
        }
    }, 16);
    tourTimer = timer;
}
function switchShape() {
    if (shapeBusy) return;
    const hint = document.getElementById('double-tap-hint');
    if (hint) hint.style.display = 'none';
    localStorage.setItem('doubleTapHintShown', 'true');
    shapeBusy = true;
    setTimeout(() => { shapeBusy = false; }, 2300);
    currentShapeIndex = ( currentShapeIndex + 1 ) % SHAPE_NAMES.length;
    const name = SHAPE_NAMES[ currentShapeIndex ];
    transform( targets[ name ], 1800 );
    if ( name === 'tree' ) { animateTrunk( true ); animateFerris( false ); }
    else if ( name === 'ferris' ) { animateTrunk( false ); animateFerris( true ); }
    else { animateTrunk( false ); animateFerris( false ); }
}
let lastTapTime = 0, lastTapX = 0, lastTapY = 0;
let suppressPhotoClick = false;
window.addEventListener('pointerdown', (e) => {
    if (!photosReady) return; // 照片没加载完，点击不记录任何操作
    if (messagePlaying || tourPlaying) return;
    if (e.target.closest && e.target.closest('.element')) return;
    const now = performance.now();
    const dx = Math.abs(e.clientX - lastTapX);
    const dy = Math.abs(e.clientY - lastTapY);
    if (now - lastTapTime < 400 && dx < 70 && dy < 70) {
        tapCount++;
    } else {
        tapCount = 1;
    }
    lastTapTime = now;
    lastTapX = e.clientX;
    lastTapY = e.clientY;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
        const cfg = Object.assign(defaultSettings(), loadSettings());
        if (tapCount >= 5) {
            if (cfg.nameTapOn && !messagePlaying) showNamePermanently();
        } else if (tapCount === 4) {
            // 已取消：四连击召唤名字
        } else if (tapCount >= 3) {
            if (cfg.tripleTapOn) cameraTour();
        } else if (tapCount === 2) {
            if (cfg.doubleTapOn) switchShape();
        }
        tapCount = 0;
    }, 380);
});

function transform( targets, duration ) {
    TWEEN.removeAll();
    for ( let i = 0; i < objects.length; i ++ ) {
        const object = objects[ i ];
        const target = targets[ i ];

        new TWEEN.Tween( object.position )
            .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

        new TWEEN.Tween( object.rotation )
            .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
    }
    new TWEEN.Tween( this ).to( {}, duration * 2 ).onUpdate( render ).start();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    rendererWebGL.setSize( window.innerWidth, window.innerHeight );
    rendererCSS.setSize( window.innerWidth, window.innerHeight );
    render();
}

function animate() {
    requestAnimationFrame( animate );
    TWEEN.update();
    
    if (particles) {
        particles.rotation.y += 0.0008;
        particles.rotation.x += 0.0004;
    }
    
    controls.update();
    if (nameVisible && namePoints) {
        namePoints.material.size = 48 + Math.sin(performance.now() * 0.004) * 8;
    }
    if (SHAPE_NAMES[ currentShapeIndex ] === 'ferris' && !shapeBusy) {
        const d = 0.005;
        const c = Math.cos(d), s = Math.sin(d);
        for (let i = 0; i < objects.length; i++) {
            const o = objects[i];
            const x = o.position.x, y = o.position.y;
            o.position.x = x * c - y * s;
            o.position.y = x * s + y * c;
            o.rotation.z += d;
        }
        ferrisPoints.rotation.z += d;
    }
    render();
}

let webglFrameSkip = 0;
function render() {
    if (tourPlaying || messagePlaying) {
        webglFrameSkip++;
        if (webglFrameSkip % 2 === 0) rendererWebGL.render( sceneWebGL, camera );
        rendererCSS.render( sceneCSS, camera );
    } else {
        rendererWebGL.render( sceneWebGL, camera );
        rendererCSS.render( sceneCSS, camera );
    }
}

if (!isFirstTime) {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('main-ui').style.pointerEvents = 'none';
    // 老用户：图片加载完成后直接进入，不强制显示信件。
}

/* 核心配置读取（默认值，供动画参数与手势开关使用） */
function loadSettings() {
    try { return JSON.parse(localStorage.getItem('consoleSettings')) || {}; } catch (e) { return {}; }
}
function saveSettings(s) {
    localStorage.setItem('consoleSettings', JSON.stringify(s));
}
function defaultSettings() {
    return { announcementOn: false, announcementText: '', testBtnOn: true, calendarOn: false, calendarEvents: [], maintenanceOn: false, musicOn: true, doubleTapOn: true, tripleTapOn: true, letterOn: true, tipsOn: true, photoZoomOn: true, nameTapOn: true, fiveTapOn: true, tourDuration: 10, tourDistance: 1, heartScale: 1, photoCountCfg: 120, title: '', desc: '' };
}
